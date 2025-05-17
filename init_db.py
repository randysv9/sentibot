import sqlite3

conn = sqlite3.connect("database.db")
cursor = conn.cursor()

# User table
cursor.execute("""
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL
)
""")

# Mood history table
cursor.execute("""
CREATE TABLE IF NOT EXISTS mood_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    timestamp TEXT,
    mood TEXT,
    message TEXT
)
""")

# Add a test admin user (optional)
cursor.execute("INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)",
               ("admin", "admin123", "admin"))

conn.commit()
conn.close()
