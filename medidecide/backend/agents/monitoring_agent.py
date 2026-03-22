import sqlite3
import os
from datetime import datetime

class MonitoringAgent:
    def __init__(self, db_path="database/patient_history.db"):
        self.db_path = db_path
        self.init_db()
    
    def init_db(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Check if the username column exists, if not, add it
        cursor.execute("PRAGMA table_info(history)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'username' not in columns:
            if 'id' in columns: # Table exists but without username
                cursor.execute("ALTER TABLE history ADD COLUMN username TEXT DEFAULT 'anonymous'")
            else:
                cursor.execute('''
                    CREATE TABLE history (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        username TEXT,
                        symptoms TEXT,
                        risk TEXT,
                        timestamp TEXT
                    )
                ''')
        else:
             cursor.execute('''
                CREATE TABLE IF NOT EXISTS history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT,
                    symptoms TEXT,
                    risk TEXT,
                    timestamp TEXT
                )
            ''')
            
        conn.commit()
        conn.close()
    
    def store_data(self, username, symptoms, risk):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        timestamp = datetime.now().isoformat()
        cursor.execute('INSERT INTO history (username, symptoms, risk, timestamp) VALUES (?, ?, ?, ?)', (username, symptoms, risk, timestamp))
        conn.commit()
        conn.close()
    
    def get_last_risk(self, username):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('SELECT risk FROM history WHERE username = ? ORDER BY id DESC LIMIT 1', (username,))
        result = cursor.fetchone()
        conn.close()
        return result[0] if result else None
        
    def get_user_history(self, username):
        """Retrieve all historical records for a specific user to populate a dashboard."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('SELECT timestamp, symptoms, risk FROM history WHERE username = ? ORDER BY id ASC', (username,))
        results = cursor.fetchall()
        conn.close()
        
        # Convert to a list of dicts for easier processing in Streamlit/Pandas
        history = []
        for row in results:
            history.append({
                "timestamp": row[0],
                "symptoms": row[1],
                "risk": row[2]
            })
        return history