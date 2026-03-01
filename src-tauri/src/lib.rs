mod smu;
mod recording;
mod state;
mod commands;

use state::AppState;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState::new())
        .invoke_handler(tauri::generate_handler![
            commands::connect_smu,
            commands::disconnect_smu,
            commands::send_command,
            commands::send_query,
            commands::abort_test,
            commands::clear_buffers,
            commands::run_script,
            commands::run_script_with_streaming,
            commands::check_errors,
            commands::init_session_manager,
            commands::create_session,
            commands::list_sessions,
            commands::get_session_data,
            commands::export_session_csv,
            commands::export_session_xlsx,
            commands::delete_session,
            commands::get_current_data,
        ])
        .setup(|app| {
            // Initialize session manager on startup
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let state = handle.state::<AppState>();
                let app_dir = handle.path().app_data_dir().expect("failed to get app data dir");
                std::fs::create_dir_all(&app_dir).ok();
                let data_dir = app_dir.join("data");
                std::fs::create_dir_all(&data_dir).ok();
                let db_path = app_dir.join("sessions.db");
                if let Ok(manager) = crate::recording::session::SessionManager::new(
                    db_path.to_str().unwrap_or("sessions.db"),
                ) {
                    *state.session_manager.lock().await = Some(manager);
                }
                *state.data_dir.lock().await = data_dir.to_str().unwrap_or("").to_string();
            });
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                let handle = window.app_handle().clone();
                tauri::async_runtime::spawn(async move {
                    let state = handle.state::<AppState>();
                    let conn_guard = state.connection.lock().await;
                    if let Some(conn) = conn_guard.as_ref() {
                        let _ = conn.send_command("smua.source.output = smua.OUTPUT_OFF").await;
                    }
                });
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
