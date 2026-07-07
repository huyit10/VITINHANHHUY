const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const dbPath = process.env.DB_PATH || path.join(dataDir, 'app.db');

let db;

function persist() {
  if (!db) return;
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

function rowFromStmt(stmt) {
  if (!stmt.step()) {
    stmt.free();
    return null;
  }
  const o = stmt.getAsObject();
  stmt.free();
  return o;
}

async function init() {
  const SQL = await initSqlJs();
  if (fs.existsSync(dbPath)) {
    const buf = fs.readFileSync(dbPath);
    db = new SQL.Database(buf);
  } else {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      full_name TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  persist();
}

function getUserByEmail(email) {
  const stmt = db.prepare('SELECT id, email, password_hash, full_name, created_at FROM users WHERE email = ?');
  stmt.bind([email]);
  return rowFromStmt(stmt);
}

function getUserById(id) {
  const stmt = db.prepare('SELECT id, email, full_name, created_at FROM users WHERE id = ?');
  stmt.bind([id]);
  return rowFromStmt(stmt);
}

function emailExists(email) {
  const stmt = db.prepare('SELECT id FROM users WHERE email = ?');
  stmt.bind([email]);
  const row = rowFromStmt(stmt);
  return !!row;
}

function createUser(email, passwordHash, fullName) {
  db.run('INSERT INTO users (email, password_hash, full_name) VALUES (?, ?, ?)', [
    email,
    passwordHash,
    fullName,
  ]);
  const stmt = db.prepare('SELECT last_insert_rowid() AS id');
  stmt.step();
  const id = Number(stmt.getAsObject().id);
  stmt.free();
  persist();
  return id;
}

module.exports = {
  init,
  persist,
  getUserByEmail,
  getUserById,
  emailExists,
  createUser,
};
