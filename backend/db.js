// db.js — SQLite database setup for Dayflow Module 1 (Authentication)
const Database = require('better-sqlite3');
require('dotenv').config();

const dbFile = process.env.DB_FILE || './dayflow.db';
const db = new Database(dbFile);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employeeId TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('ADMIN', 'HR', 'EMPLOYEE')),
    emailVerified INTEGER NOT NULL DEFAULT 0,
    verificationToken TEXT,
    verificationTokenExpiry TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

module.exports = db;
