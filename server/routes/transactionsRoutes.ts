import { Router } from "express";
import { db } from "../db";
import { requireAuth, requireRole, AuthRequest } from "../auth";

const router = Router();

// List transactions (ADMIN, STAFF)
router.get("/", requireAuth, requireRole(["ADMIN", "STAFF"]), (_req, res) => {
  db.all(
    `
    SELECT
      t.*,
      o.id as order_id_display,
      r.name as retailer_name,
      c.name as customer_name
    FROM transactions t
    LEFT JOIN orders o ON t.order_id = o.id
    LEFT JOIN retailers r ON t.retailer_id = r.id
    LEFT JOIN customers c ON t.customer_id = c.id
    ORDER BY t.created_at DESC
    LIMIT 100
  `,
    [],
    (err, rows) => {
      if (err) {
        res.status(500).json({ message: "Failed to fetch transactions" });
        return;
      }
      res.json(rows);
    }
  );
});

// Create transaction manually (ADMIN, STAFF)
router.post("/", requireAuth, requireRole(["ADMIN", "STAFF"]), (req: AuthRequest, res) => {
  const { order_id, retailer_id, customer_id, amount, type } = req.body as {
    order_id?: number;
    retailer_id?: number;
    customer_id?: number;
    amount: number;
    type: "SALE" | "REFUND";
  };

  if (!amount || amount <= 0 || !type) {
    res.status(400).json({ message: "amount and type are required" });
    return;
  }

  if (type !== "SALE" && type !== "REFUND") {
    res.status(400).json({ message: "type must be SALE or REFUND" });
    return;
  }

  const stmt = db.prepare(
    `
    INSERT INTO transactions (order_id, retailer_id, customer_id, amount, type)
    VALUES (?, ?, ?, ?, ?)
  `
  );

  stmt.run(
    [order_id ?? null, retailer_id ?? null, customer_id ?? null, amount, type],
    function (err) {
      if (err) {
        if (err.message.includes("UNIQUE")) {
          res.status(409).json({ message: "Transaction already exists for this order" });
        } else {
          res.status(500).json({ message: "Failed to create transaction" });
        }
        return;
      }
      db.get("SELECT * FROM transactions WHERE id = ?", [this.lastID], (err2, row) => {
        if (err2 || !row) {
          res.status(201).json({ id: this.lastID, amount, type });
          return;
        }
        res.status(201).json(row);
      });
    }
  );
});

export default router;

