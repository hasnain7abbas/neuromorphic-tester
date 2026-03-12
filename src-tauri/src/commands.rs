use tauri::{State, Emitter, Manager};
use crate::state::{AppState, TestData};
use crate::smu::connection::SMUConnection;
use crate::smu::parser;
use crate::recording::csv_export;
use crate::recording::xlsx_export;
use crate::recording::session::SessionInfo;
use std::path::PathBuf;

#[tauri::command]
pub async fn connect_smu(resource: String, state: State<'_, AppState>) -> Result<String, String> {
    let conn = SMUConnection::connect(&resource).await?;
    let idn = conn.send_query("*IDN?").await?;
    *state.connection.lock().await = Some(conn);
    Ok(idn)
}

#[tauri::command]
pub async fn disconnect_smu(state: State<'_, AppState>) -> Result<(), String> {
    let mut conn_guard = state.connection.lock().await;
    if let Some(conn) = conn_guard.as_ref() {
        let _ = conn.send_command("smua.source.output = smua.OUTPUT_OFF").await;
    }
    *conn_guard = None;
    Ok(())
}

#[tauri::command]
pub async fn send_command(command: String, state: State<'_, AppState>) -> Result<(), String> {
    let conn_guard = state.connection.lock().await;
    let conn = conn_guard.as_ref().ok_or("Not connected")?;
    conn.send_command(&command).await
}

#[tauri::command]
pub async fn send_query(command: String, state: State<'_, AppState>) -> Result<String, String> {
    let conn_guard = state.connection.lock().await;
    let conn = conn_guard.as_ref().ok_or("Not connected")?;
    conn.send_query(&command).await
}

#[tauri::command]
pub async fn abort_test(state: State<'_, AppState>) -> Result<(), String> {
    let conn_guard = state.connection.lock().await;
    if let Some(conn) = conn_guard.as_ref() {
        let _ = conn.send_command("abort").await;
        let _ = conn.send_command("smua.source.output = smua.OUTPUT_OFF").await;
    }
    Ok(())
}

#[tauri::command]
pub async fn clear_buffers(state: State<'_, AppState>) -> Result<(), String> {
    let conn_guard = state.connection.lock().await;
    if let Some(conn) = conn_guard.as_ref() {
        conn.send_command("smua.nvbuffer1.clear()").await?;
        conn.send_command("smua.nvbuffer2.clear()").await?;
        conn.send_command("errorqueue.clear()").await?;
    }
    Ok(())
}

#[tauri::command]
pub async fn run_script(script: String, state: State<'_, AppState>) -> Result<String, String> {
    let conn_guard = state.connection.lock().await;
    let conn = conn_guard.as_ref().ok_or("Not connected")?;

    // Send entire script as a single VISA write wrapped in loadscript/endscript
    conn.send_script(&script).await?;
    conn.send_command("script.anonymous.run()").await?;

    // Small delay to let the script execute
    drop(conn_guard);
    tokio::time::sleep(std::time::Duration::from_millis(500)).await;

    Ok("Script sent successfully".to_string())
}

#[tauri::command]
pub async fn run_script_with_streaming(
    script: String,
    app: tauri::AppHandle,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let conn_arc = state.connection.clone();
    let data_arc = state.current_data.clone();

    // Clear current data
    {
        let mut data = data_arc.lock().await;
        *data = TestData::default();
    }

    // Send the script via loadscript/endscript, then queue run + done marker.
    // The done marker executes after the script finishes (TSP processes commands in order).
    {
        let conn_guard = conn_arc.lock().await;
        let conn = conn_guard.as_ref().ok_or("Not connected")?;
        conn.send_script(&script).await?;
        conn.send_command("script.anonymous.run()").await?;
        conn.send_command("print(\"===DONE===\")").await?;
    }

    // Spawn a background task that reads output until ===DONE=== is found
    tokio::spawn(async move {
        let mut all_output = String::new();
        let max_attempts = 1800; // 1800 * ~2.2s = ~66 minutes max wait

        for _ in 0..max_attempts {
            // Short sleep to yield control between read attempts
            tokio::time::sleep(std::time::Duration::from_millis(200)).await;

            let conn_guard = conn_arc.lock().await;
            let conn = match conn_guard.as_ref() {
                Some(c) => c,
                None => {
                    // Connection closed (abort/disconnect)
                    let _ = app.emit("test-complete", ());
                    return;
                }
            };

            match conn.read_response_poll().await {
                Ok(chunk) if !chunk.is_empty() => {
                    all_output.push_str(&chunk);
                }
                Err(_) => {
                    // Read error — likely abort or disconnect
                    let _ = app.emit("test-complete", ());
                    return;
                }
                _ => {} // timeout, script still running
            }

            drop(conn_guard);

            // Check if script has finished
            if all_output.contains("===DONE===") {
                let clean = all_output.replace("===DONE===", "");
                let clean = clean.trim();

                if !clean.is_empty() {
                    // Try to parse as dual buffer (current + voltage separated by ---SEPARATOR---)
                    if let Ok((currents, voltages)) = parser::parse_dual_buffer_response(clean) {
                        let timestamp = chrono::Utc::now().to_rfc3339();
                        let timestamps: Vec<String> =
                            currents.iter().map(|_| timestamp.clone()).collect();

                        // Store in app state
                        {
                            let mut data = data_arc.lock().await;
                            data.currents = currents.clone();
                            data.voltages = voltages.clone();
                            data.timestamps = timestamps.clone();
                        }

                        let payload = serde_json::json!({
                            "currents": currents,
                            "voltages": voltages,
                            "timestamps": timestamps,
                        });
                        let _ = app.emit("data-update", &payload);
                    } else {
                        // Fallback: try as single buffer (just current values)
                        if let Ok(values) = parser::parse_buffer_response(clean) {
                            let timestamp = chrono::Utc::now().to_rfc3339();
                            let timestamps: Vec<String> =
                                values.iter().map(|_| timestamp.clone()).collect();

                            {
                                let mut data = data_arc.lock().await;
                                data.currents = values.clone();
                                data.timestamps = timestamps.clone();
                            }

                            let payload = serde_json::json!({
                                "currents": values,
                                "voltages": [],
                                "timestamps": timestamps,
                            });
                            let _ = app.emit("data-update", &payload);
                        }
                    }
                }

                let _ = app.emit("test-complete", ());
                return;
            }
        }

        // Timed out waiting for script
        let _ = app.emit("test-complete", ());
    });

    Ok(())
}

#[tauri::command]
pub async fn check_errors(state: State<'_, AppState>) -> Result<Vec<String>, String> {
    let conn_guard = state.connection.lock().await;
    let conn = conn_guard.as_ref().ok_or("Not connected")?;
    let mut errors = Vec::new();

    // Read up to 10 errors from the queue
    for _ in 0..10 {
        match conn.send_query("print(errorqueue.next())").await {
            Ok(response) => {
                let trimmed = response.trim().to_string();
                if trimmed.contains("Queue Is Empty") || trimmed == "0" || trimmed.is_empty() {
                    break;
                }
                errors.push(trimmed);
            }
            Err(_) => break,
        }
    }
    Ok(errors)
}

#[tauri::command]
pub async fn init_session_manager(app: tauri::AppHandle, state: State<'_, AppState>) -> Result<(), String> {
    let app_dir = app.path().app_data_dir().map_err(|e: tauri::Error| e.to_string())?;
    std::fs::create_dir_all(&app_dir).map_err(|e| e.to_string())?;

    let data_dir = app_dir.join("data");
    std::fs::create_dir_all(&data_dir).map_err(|e| e.to_string())?;

    let db_path = app_dir.join("sessions.db");
    let manager = crate::recording::session::SessionManager::new(
        db_path.to_str().ok_or("Invalid db path")?
    )?;

    *state.session_manager.lock().await = Some(manager);
    *state.data_dir.lock().await = data_dir.to_str().ok_or("Invalid data dir path")?.to_string();

    Ok(())
}

#[tauri::command]
pub async fn create_session(
    name: String,
    test_type: String,
    script: String,
    parameters: String,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let data_dir = state.data_dir.lock().await;
    let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S").to_string();
    let filename = format!("{}_{}.csv", timestamp, test_type);
    let file_path = PathBuf::from(data_dir.as_str()).join(&filename);

    // Export current data as CSV
    let data = state.current_data.lock().await;
    csv_export::export_csv(
        &file_path,
        &data.voltages,
        &data.currents,
        &data.timestamps,
    )?;

    // Create session record
    let mgr_guard = state.session_manager.lock().await;
    let mgr = mgr_guard.as_ref().ok_or("Session manager not initialized")?;
    let id = mgr.create_session(
        &name,
        &test_type,
        &script,
        &parameters,
        file_path.to_str().ok_or("Invalid file path")?,
    )?;

    Ok(id)
}

#[tauri::command]
pub async fn list_sessions(state: State<'_, AppState>) -> Result<Vec<SessionInfo>, String> {
    let mgr_guard = state.session_manager.lock().await;
    let mgr = mgr_guard.as_ref().ok_or("Session manager not initialized")?;
    mgr.list_sessions()
}

#[tauri::command]
pub async fn get_session_data(session_id: String, state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let mgr_guard = state.session_manager.lock().await;
    let mgr = mgr_guard.as_ref().ok_or("Session manager not initialized")?;
    let session = mgr.get_session(&session_id)?;

    // Read CSV file
    let mut reader = csv::Reader::from_path(&session.data_file_path).map_err(|e| e.to_string())?;
    let mut voltages = Vec::new();
    let mut currents = Vec::new();
    let mut resistance = Vec::new();

    for result in reader.records() {
        let record = result.map_err(|e| e.to_string())?;
        if let (Some(v), Some(c), Some(r)) = (record.get(1), record.get(2), record.get(3)) {
            voltages.push(v.parse::<f64>().unwrap_or(0.0));
            currents.push(c.parse::<f64>().unwrap_or(0.0));
            resistance.push(r.parse::<f64>().unwrap_or(0.0));
        }
    }

    Ok(serde_json::json!({
        "session": session,
        "voltages": voltages,
        "currents": currents,
        "resistance": resistance,
    }))
}

#[tauri::command]
pub async fn export_session_csv(session_id: String, save_path: String, state: State<'_, AppState>) -> Result<String, String> {
    let mgr_guard = state.session_manager.lock().await;
    let mgr = mgr_guard.as_ref().ok_or("Session manager not initialized")?;
    let session = mgr.get_session(&session_id)?;

    // Copy the auto-saved CSV to the user-selected path
    std::fs::copy(&session.data_file_path, &save_path).map_err(|e| e.to_string())?;
    Ok(save_path)
}

#[tauri::command]
pub async fn export_session_xlsx(save_path: String, state: State<'_, AppState>) -> Result<String, String> {
    let data = state.current_data.lock().await;
    xlsx_export::export_xlsx(&save_path, &data.voltages, &data.currents)?;
    Ok(save_path)
}

#[tauri::command]
pub async fn delete_session(session_id: String, state: State<'_, AppState>) -> Result<(), String> {
    let mgr_guard = state.session_manager.lock().await;
    let mgr = mgr_guard.as_ref().ok_or("Session manager not initialized")?;

    // Get session to find file path
    if let Ok(session) = mgr.get_session(&session_id) {
        let _ = std::fs::remove_file(&session.data_file_path);
    }

    mgr.delete_session(&session_id)
}

#[tauri::command]
pub async fn get_current_data(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let data = state.current_data.lock().await;
    Ok(serde_json::json!({
        "voltages": data.voltages,
        "currents": data.currents,
        "timestamps": data.timestamps,
    }))
}
