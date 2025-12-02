import sqlite3 from "sqlite3";
import path from "path";

sqlite3.verbose();

const dbPath = path.join(__dirname, "..", "crm.db");

export const db = new sqlite3.Database(dbPath);

export function initDb(): void {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('ADMIN', 'STAFF', 'RETAILER')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  });
}


