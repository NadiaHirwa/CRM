import { Router } from "express";
import { db } from "../db";
import { requireAuth, requireRole } from "../auth";

const router = Router();

// List products (all roles)
router.get("/", requireAuth, (_req, res) => {
  db.all("SELECT * FROM products ORDER BY created_at DESC", [], (err, rows) => {
    if (err) {
      res.status(500).json({ message: "Failed to fetch products" });
      return;
    }
    res.json(rows);
  });
});

// Create product (ADMIN, STAFF)
router.post(
  "/",
  requireAuth,
  requireRole(["ADMIN", "STAFF"]),
  (req, res) => {
    const { name, sku, unit_price, stock_quantity } = req.body as {
      name: string;
      sku?: string;
      unit_price: number;
      stock_quantity?: number;
    };

    if (!name || unit_price == null) {
      res.status(400).json({ message: "Name and unit_price are required" });
      return;
    }

    const stmt = db.prepare(
      "INSERT INTO products (name, sku, unit_price, stock_quantity) VALUES (?, ?, ?, ?)"
    );
    stmt.run(
      [name, sku, unit_price, stock_quantity ?? 0],
      function (err) {
        if (err) {
          if (err.message.includes("UNIQUE")) {
            res.status(409).json({ message: "SKU already exists" });
          } else {
            res.status(500).json({ message: "Failed to create product" });
          }
          return;
        }
        db.get(
          "SELECT * FROM products WHERE id = ?",
          [this.lastID],
          (err2, row) => {
            if (err2 || !row) {
              res.status(201).json({
                id: this.lastID,
                name,
                sku,
                unit_price,
                stock_quantity: stock_quantity ?? 0,
              });
              return;
            }
            res.status(201).json(row);
          }
        );
      }
    );
  }
);

// Update product (ADMIN, STAFF)
router.put(
  "/:id",
  requireAuth,
  requireRole(["ADMIN", "STAFF"]),
  (req, res) => {
    const id = Number(req.params.id);
    const { name, sku, unit_price, stock_quantity } = req.body as {
      name?: string;
      sku?: string;
      unit_price?: number;
      stock_quantity?: number;
    };

    db.run(
      `
      UPDATE products
      SET name = COALESCE(?, name),
          sku = COALESCE(?, sku),
          unit_price = COALESCE(?, unit_price),
          stock_quantity = COALESCE(?, stock_quantity)
      WHERE id = ?
    `,
      [name, sku, unit_price, stock_quantity, id],
      function (err) {
        if (err) {
          res.status(500).json({ message: "Failed to update product" });
          return;
        }
        if (this.changes === 0) {
          res.status(404).json({ message: "Product not found" });
          return;
        }
        db.get("SELECT * FROM products WHERE id = ?", [id], (err2, row) => {
          if (err2 || !row) {
            res.json({ id, name, sku, unit_price, stock_quantity });
            return;
          }
          res.json(row);
        });
      }
    );
  }
);

// Delete product (ADMIN only)
router.delete(
  "/:id",
  requireAuth,
  requireRole(["ADMIN"]),
  (req, res) => {
    const id = Number(req.params.id);
    db.run("DELETE FROM products WHERE id = ?", [id], function (err) {
      if (err) {
        res.status(500).json({ message: "Failed to delete product" });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ message: "Product not found" });
        return;
      }
      res.status(204).send();
    });
  }
);

export default router;


