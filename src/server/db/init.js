const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const DB_FILE = process.env.SQLITE_FILE || path.join(__dirname, '..', 'data', 'fusion.db');
const dbDir = path.dirname(DB_FILE);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
const db = new sqlite3.Database(DB_FILE);

const schema = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'aluno',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS workouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  title TEXT,
  data TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

db.exec(schema, (err) => {
  if (err) { console.error('Failed to initialize DB', err); process.exit(1); }
  else { console.log('DB initialized at', DB_FILE); process.exit(0); }
});
