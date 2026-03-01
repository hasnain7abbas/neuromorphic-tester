use rusqlite::{Connection, params};
use serde::Serialize;

pub struct SessionManager {
    db: Connection,
}

#[derive(Debug, Clone, Serialize)]
pub struct SessionInfo {
    pub id: String,
    pub name: String,
    pub timestamp: String,
    pub test_type: String,
    pub script: String,
    pub parameters: String,
    pub notes: String,
    pub data_file_path: String,
}

impl SessionManager {
    pub fn new(db_path: &str) -> Result<Self, String> {
        let db = Connection::open(db_path).map_err(|e| e.to_string())?;
        db.execute_batch(
            "CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                test_type TEXT NOT NULL,
                script TEXT NOT NULL,
                parameters TEXT DEFAULT '',
                notes TEXT DEFAULT '',
                data_file_path TEXT NOT NULL
            );"
        ).map_err(|e| e.to_string())?;
        Ok(Self { db })
    }

    pub fn create_session(
        &self,
        name: &str,
        test_type: &str,
        script: &str,
        parameters: &str,
        data_file_path: &str,
    ) -> Result<String, String> {
        let id = uuid::Uuid::new_v4().to_string();
        let timestamp = chrono::Utc::now().to_rfc3339();
        self.db
            .execute(
                "INSERT INTO sessions (id, name, timestamp, test_type, script, parameters, notes, data_file_path)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
                params![id, name, timestamp, test_type, script, parameters, "", data_file_path],
            )
            .map_err(|e| e.to_string())?;
        Ok(id)
    }

    pub fn list_sessions(&self) -> Result<Vec<SessionInfo>, String> {
        let mut stmt = self
            .db
            .prepare("SELECT id, name, timestamp, test_type, script, parameters, notes, data_file_path FROM sessions ORDER BY timestamp DESC")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |row| {
                Ok(SessionInfo {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    timestamp: row.get(2)?,
                    test_type: row.get(3)?,
                    script: row.get(4)?,
                    parameters: row.get(5)?,
                    notes: row.get(6)?,
                    data_file_path: row.get(7)?,
                })
            })
            .map_err(|e| e.to_string())?;
        let mut sessions = Vec::new();
        for row in rows {
            sessions.push(row.map_err(|e| e.to_string())?);
        }
        Ok(sessions)
    }

    pub fn get_session(&self, id: &str) -> Result<SessionInfo, String> {
        self.db
            .query_row(
                "SELECT id, name, timestamp, test_type, script, parameters, notes, data_file_path FROM sessions WHERE id = ?1",
                params![id],
                |row| {
                    Ok(SessionInfo {
                        id: row.get(0)?,
                        name: row.get(1)?,
                        timestamp: row.get(2)?,
                        test_type: row.get(3)?,
                        script: row.get(4)?,
                        parameters: row.get(5)?,
                        notes: row.get(6)?,
                        data_file_path: row.get(7)?,
                    })
                },
            )
            .map_err(|e| e.to_string())
    }

    pub fn update_notes(&self, id: &str, notes: &str) -> Result<(), String> {
        self.db
            .execute(
                "UPDATE sessions SET notes = ?1 WHERE id = ?2",
                params![notes, id],
            )
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn delete_session(&self, id: &str) -> Result<(), String> {
        self.db
            .execute("DELETE FROM sessions WHERE id = ?1", params![id])
            .map_err(|e| e.to_string())?;
        Ok(())
    }
}
