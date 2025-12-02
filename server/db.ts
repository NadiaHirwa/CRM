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

    db.run(`
        CREATE TABLE IF NOT EXISTS customers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          phone TEXT,
          email TEXT,
          address TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

    db.run(`
        CREATE TABLE IF NOT EXISTS retailers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          contact_name TEXT,
          phone TEXT,
          email TEXT,
          address TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

    db.run(`
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          sku TEXT UNIQUE,
          unit_price REAL NOT NULL,
          stock_quantity INTEGER NOT NULL DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

    db.run(`
        CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          retailer_id INTEGER NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'SHIPPED', 'DELIVERED', 'CANCELLED')),
          total_amount REAL NOT NULL DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (retailer_id) REFERENCES retailers(id)
        )
      `);

    db.run(`
        CREATE TABLE IF NOT EXISTS order_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          quantity INTEGER NOT NULL,
          unit_price REAL NOT NULL,
          line_total REAL NOT NULL,
          FOREIGN KEY (order_id) REFERENCES orders(id),
          FOREIGN KEY (product_id) REFERENCES products(id)
        )
      `);

    db.run(`
        CREATE TABLE IF NOT EXISTS transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id INTEGER,
          retailer_id INTEGER,
          customer_id INTEGER,
          amount REAL NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('SALE', 'REFUND')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE (order_id, type),
          FOREIGN KEY (order_id) REFERENCES orders(id),
          FOREIGN KEY (retailer_id) REFERENCES retailers(id),
          FOREIGN KEY (customer_id) REFERENCES customers(id)
        )
      `);

    db.run(`
        CREATE TABLE IF NOT EXISTS complaints (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          retailer_id INTEGER,
          customer_id INTEGER,
          submitted_by_user_id INTEGER,
          subject TEXT NOT NULL,
          description TEXT NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')) DEFAULT 'OPEN',
          assigned_to_user_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          resolved_at DATETIME,
          FOREIGN KEY (retailer_id) REFERENCES retailers(id),
          FOREIGN KEY (customer_id) REFERENCES customers(id),
          FOREIGN KEY (submitted_by_user_id) REFERENCES users(id),
          FOREIGN KEY (assigned_to_user_id) REFERENCES users(id)
        )
    `);
  });
}


