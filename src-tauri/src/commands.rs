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

    // Send each line of the script
    for line in script.lines() {
        let trimmed = line.trim();
        if !trimmed.is_empty() {
            conn.send_command(trimmed).await?;
        }
    }

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

    // Send the script first
    {
        let conn_guard = conn_arc.lock().await;
        let conn = conn_guard.as_ref().ok_or("Not connected")?;
        for line in script.lines() {
            let trimmed = line.trim();
            if !trimmed.is_empty() {
                conn.send_command(trimmed).await?;
            }
        }
    }

    // Spawn a background polling task
    tokio::spawn(async move {
        let mut last_count: usize = 0;
        let mut consecutive_same = 0;

        loop {
            tokio::time::sleep(std::time::Duration::from_millis(300)).await;

            let conn_guard = conn_arc.lock().await;
            let conn = match conn_guard.as_ref() {
                Some(c) => c,
                None => break,
            };

            // Check buffer count
            let count = match conn.send_query("print(smua.nvbuffer1.n)").await {
                Ok(s) => s.trim().parse::<usize>().unwrap_or(0),
                Err(_) => {
                    consecutive_same += 1;
                    if consecutive_same > 20 {
                        break;
                    }
                    continue;
                }
            };

            if count > last_count {
                consecutive_same = 0;
                // Fetch new current data
                let i_data = conn
                    .send_query(&format!("printbuffer({}, {}, smua.nvbuffer1)", last_count + 1, count))
                    .await;
                // Fetch new voltage data
                let v_data = conn
                    .send_query(&format!("printbuffer({}, {}, smua.nvbuffer2)", last_count + 1, count))
                    .await;

                if let (Ok(i_str), Ok(v_str)) = (i_data, v_data) {
                    if let (Ok(currents), Ok(voltages)) = (
                        parser::parse_buffer_response(&i_str),
                        parser::parse_buffer_response(&v_str),
                    ) {
                        let timestamp = chrono::Utc::now().to_rfc3339();
                        let timestamps: Vec<String> = currents.iter().map(|_| timestamp.clone()).collect();

                        // Store in app state
                        {
                            let mut data = data_arc.lock().await;
                            data.currents.extend_from_slice(&currents);
                            data.voltages.extend_from_slice(&voltages);
                            data.timestamps.extend_from_slice(&timestamps);
                        }

                        let payload = serde_json::json!({
                            "currents": currents,
                            "voltages": voltages,
                            "timestamps": timestamps,
                        });
                        let _ = app.emit("data-update", &payload);
                    }
                }

                last_count = count;
            } else {
                consecutive_same += 1;
                // If no new data for ~6 seconds, script likely finished
                if consecutive_same > 20 {
                    break;
                }
            }

            drop(conn_guard);
        }

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
