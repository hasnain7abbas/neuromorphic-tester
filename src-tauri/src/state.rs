use crate::smu::connection::SMUConnection;
use crate::recording::session::SessionManager;
use std::sync::Arc;
use tokio::sync::Mutex;

pub struct AppState {
    pub connection: Arc<Mutex<Option<SMUConnection>>>,
    pub session_manager: Arc<Mutex<Option<SessionManager>>>,
    pub data_dir: Arc<Mutex<String>>,
    pub current_data: Arc<Mutex<TestData>>,
}

#[derive(Default, Clone, serde::Serialize)]
pub struct TestData {
    pub voltages: Vec<f64>,
    pub currents: Vec<f64>,
    pub timestamps: Vec<String>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            connection: Arc::new(Mutex::new(None)),
            session_manager: Arc::new(Mutex::new(None)),
            data_dir: Arc::new(Mutex::new(String::new())),
            current_data: Arc::new(Mutex::new(TestData::default())),
        }
    }
}
