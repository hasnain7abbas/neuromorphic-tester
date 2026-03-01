use tokio::net::TcpStream;
use tokio::io::{AsyncWriteExt, AsyncBufReadExt, BufReader};
use std::sync::Arc;
use tokio::sync::Mutex;

pub struct SMUConnection {
    stream: Arc<Mutex<TcpStream>>,
    pub ip: String,
    pub port: u16,
}

impl SMUConnection {
    pub async fn connect(ip: &str, port: u16) -> Result<Self, String> {
        let addr = format!("{}:{}", ip, port);
        let stream = tokio::time::timeout(
            std::time::Duration::from_secs(5),
            TcpStream::connect(&addr),
        )
        .await
        .map_err(|_| format!("Connection to {} timed out", addr))?
        .map_err(|e| format!("Failed to connect to {}: {}", addr, e))?;

        Ok(Self {
            stream: Arc::new(Mutex::new(stream)),
            ip: ip.to_string(),
            port,
        })
    }

    pub async fn send_command(&self, cmd: &str) -> Result<(), String> {
        let mut stream = self.stream.lock().await;
        stream
            .write_all(format!("{}\n", cmd).as_bytes())
            .await
            .map_err(|e| format!("Failed to send command: {}", e))?;
        stream.flush().await.map_err(|e| format!("Failed to flush: {}", e))?;
        Ok(())
    }

    pub async fn send_query(&self, cmd: &str) -> Result<String, String> {
        let mut stream = self.stream.lock().await;
        stream
            .write_all(format!("{}\n", cmd).as_bytes())
            .await
            .map_err(|e| format!("Failed to send query: {}", e))?;
        stream.flush().await.map_err(|e| format!("Failed to flush: {}", e))?;

        let mut reader = BufReader::new(&mut *stream);
        let mut response = String::new();

        tokio::time::timeout(
            std::time::Duration::from_secs(30),
            reader.read_line(&mut response),
        )
        .await
        .map_err(|_| "Read timeout".to_string())?
        .map_err(|e| format!("Failed to read response: {}", e))?;

        Ok(response.trim().to_string())
    }

    pub fn get_stream(&self) -> Arc<Mutex<TcpStream>> {
        self.stream.clone()
    }
}
