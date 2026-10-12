import sqlite3
import json
import os
from typing import List, Optional, Dict, Any

DB_FILE = os.getenv("SQLITE_DB_PATH", "incidents.db")

def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS incidents (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            severity TEXT NOT NULL,
            status TEXT NOT NULL,
            affected_service TEXT NOT NULL,
            created_at TEXT NOT NULL,
            error_count INTEGER DEFAULT 0,
            spike_ratio REAL DEFAULT 1.0,
            data_json TEXT NOT NULL
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS audit_logs (
            id TEXT PRIMARY KEY,
            timestamp TEXT NOT NULL,
            incident_id TEXT NOT NULL,
            action TEXT NOT NULL,
            actor TEXT NOT NULL,
            details_json TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()

class IncidentRepository:
    def __init__(self, db_path=DB_FILE):
        self.db_path = db_path
        init_db()

    def get_all(self) -> List[Dict[str, Any]]:
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute("SELECT data_json FROM incidents ORDER BY created_at DESC")
        rows = c.fetchall()
        conn.close()
        return [json.loads(r[0]) for r in rows]

    def get_by_id(self, incident_id: str) -> Optional[Dict[str, Any]]:
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute("SELECT data_json FROM incidents WHERE id = ?", (incident_id,))
        row = c.fetchone()
        conn.close()
        return json.loads(row[0]) if row else None

    def save(self, incident: Dict[str, Any]):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute("""
            INSERT OR REPLACE INTO incidents (id, title, severity, status, affected_service, created_at, error_count, spike_ratio, data_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            incident["id"],
            incident["title"],
            incident["severity"],
            incident["status"],
            incident["affected_service"],
            incident["created_at"],
            incident.get("error_count", 0),
            incident.get("spike_ratio", 1.0),
            json.dumps(incident)
        ))
        conn.commit()
        conn.close()
