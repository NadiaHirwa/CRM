import { Router } from "express";
import { db } from "../db";
import { requireAuth, requireRole, AuthRequest } from "../auth";

const router = Router();

// List retailers
router.get(
  "/",
  requireAuth,
  requireRole(["ADMIN", "STAFF"]),
  (_req, res) => {
    db.all("SELECT * FROM retailers ORDER BY created_at DESC", [], (err, rows) => {
      if (err) {
        res.status(500).json({ message: "Failed to fetch retailers" });
        return;
      }
      res.json(rows);
    });
  }
);

// Create retailer
router.post(
  "/",
  requireAuth,
  requireRole(["ADMIN", "STAFF"]),
  (req: AuthRequest, res) => {
    const { name, contact_name, phone, email, address } = req.body as {
      name: string;
      contact_name?: string;
      phone?: string;
      email?: string;
      address?: string;
    };

    if (!name) {
      res.status(400).json({ message: "Name is required" });
      return;
    }

    const stmt = db.prepare(
      "INSERT INTO retailers (name, contact_name, phone, email, address) VALUES (?, ?, ?, ?, ?)"
    );
    stmt.run([name, contact_name, phone, email, address], function (err) {
      if (err) {
        res.status(500).json({ message: "Failed to create retailer" });
        return;
      }
      db.get(
        "SELECT * FROM retailers WHERE id = ?",
        [this.lastID],
        (err2, row) => {
          if (err2 || !row) {
            res
              .status(201)
              .json({ id: this.lastID, name, contact_name, phone, email, address });
            return;
          }
          res.status(201).json(row);
        }
      );
    });
  }
);

// Get single retailer
router.get(
  "/:id",
  requireAuth,
  requireRole(["ADMIN", "STAFF"]),
  (req, res) => {
    const id = Number(req.params.id);
    db.get("SELECT * FROM retailers WHERE id = ?", [id], (err, row) => {
      if (err) {
        res.status(500).json({ message: "Failed to fetch retailer" });
        return;
      }
      if (!row) {
        res.status(404).json({ message: "Retailer not found" });
        return;
      }
      res.json(row);
    });
  }
);

// Update retailer
router.put(
  "/:id",
  requireAuth,
  requireRole(["ADMIN", "STAFF"]),
  (req, res) => {
    const id = Number(req.params.id);
    const { name, contact_name, phone, email, address } = req.body as {
      name?: string;
      contact_name?: string;
      phone?: string;
      email?: string;
      address?: string;
    };

    db.run(
      `
      UPDATE retailers
      SET name = COALESCE(?, name),
          contact_name = COALESCE(?, contact_name),
          phone = COALESCE(?, phone),
          email = COALESCE(?, email),
          address = COALESCE(?, address)
      WHERE id = ?
    `,
      [name, contact_name, phone, email, address, id],
      function (err) {
        if (err) {
          res.status(500).json({ message: "Failed to update retailer" });
          return;
        }
        if (this.changes === 0) {
          res.status(404).json({ message: "Retailer not found" });
          return;
        }
        db.get("SELECT * FROM retailers WHERE id = ?", [id], (err2, row) => {
          if (err2 || !row) {
            res.json({ id, name, contact_name, phone, email, address });
            return;
          }
          res.json(row);
        });
      }
    );
  }
);

// Delete retailer
router.delete(
  "/:id",
  requireAuth,
  requireRole(["ADMIN"]),
  (req, res) => {
    const id = Number(req.params.id);
    db.run("DELETE FROM retailers WHERE id = ?", [id], function (err) {
      if (err) {
        res.status(500).json({ message: "Failed to delete retailer" });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ message: "Retailer not found" });
        return;
      }
      res.status(204).send();
    });
  }
);

export default router;


