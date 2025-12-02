import { Router } from "express";
import { db } from "../db";
import { requireAuth, requireRole, AuthRequest } from "../auth";

const router = Router();

// List all customers (ADMIN, STAFF)
router.get(
  "/",
  requireAuth,
  requireRole(["ADMIN", "STAFF"]),
  (_req, res) => {
    db.all("SELECT * FROM customers ORDER BY created_at DESC", [], (err, rows) => {
      if (err) {
        res.status(500).json({ message: "Failed to fetch customers" });
        return;
      }
      res.json(rows);
    });
  }
);

// Create customer (ADMIN, STAFF)
router.post(
  "/",
  requireAuth,
  requireRole(["ADMIN", "STAFF"]),
  (req: AuthRequest, res) => {
    const { name, phone, email, address } = req.body as {
      name: string;
      phone?: string;
      email?: string;
      address?: string;
    };

    if (!name) {
      res.status(400).json({ message: "Name is required" });
      return;
    }

    const stmt = db.prepare(
      "INSERT INTO customers (name, phone, email, address) VALUES (?, ?, ?, ?)"
    );
    stmt.run([name, phone, email, address], function (err) {
      if (err) {
        res.status(500).json({ message: "Failed to create customer" });
        return;
      }
      db.get(
        "SELECT * FROM customers WHERE id = ?",
        [this.lastID],
        (err2, row) => {
          if (err2 || !row) {
            res.status(201).json({ id: this.lastID, name, phone, email, address });
            return;
          }
          res.status(201).json(row);
        }
      );
    });
  }
);

// Get single customer (ADMIN, STAFF)
router.get(
  "/:id",
  requireAuth,
  requireRole(["ADMIN", "STAFF"]),
  (req, res) => {
    const id = Number(req.params.id);
    db.get("SELECT * FROM customers WHERE id = ?", [id], (err, row) => {
      if (err) {
        res.status(500).json({ message: "Failed to fetch customer" });
        return;
      }
      if (!row) {
        res.status(404).json({ message: "Customer not found" });
        return;
      }
      res.json(row);
    });
  }
);

// Update customer (ADMIN, STAFF)
router.put(
  "/:id",
  requireAuth,
  requireRole(["ADMIN", "STAFF"]),
  (req, res) => {
    const id = Number(req.params.id);
    const { name, phone, email, address } = req.body as {
      name?: string;
      phone?: string;
      email?: string;
      address?: string;
    };

    db.run(
      `
      UPDATE customers
      SET name = COALESCE(?, name),
          phone = COALESCE(?, phone),
          email = COALESCE(?, email),
          address = COALESCE(?, address)
      WHERE id = ?
    `,
      [name, phone, email, address, id],
      function (err) {
        if (err) {
          res.status(500).json({ message: "Failed to update customer" });
          return;
        }
        if (this.changes === 0) {
          res.status(404).json({ message: "Customer not found" });
          return;
        }
        db.get("SELECT * FROM customers WHERE id = ?", [id], (err2, row) => {
          if (err2 || !row) {
            res.json({ id, name, phone, email, address });
            return;
          }
          res.json(row);
        });
      }
    );
  }
);

// Delete customer (ADMIN only)
router.delete(
  "/:id",
  requireAuth,
  requireRole(["ADMIN"]),
  (req, res) => {
    const id = Number(req.params.id);
    db.run("DELETE FROM customers WHERE id = ?", [id], function (err) {
      if (err) {
        res.status(500).json({ message: "Failed to delete customer" });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ message: "Customer not found" });
        return;
      }
      res.status(204).send();
    });
  }
);

export default router;


