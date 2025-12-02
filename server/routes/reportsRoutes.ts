import { Router } from "express";
import { db } from "../db";
import { requireAuth, requireRole } from "../auth";

const router = Router();

// Sales summary: totals per day within date range
router.get(
  "/sales",
  requireAuth,
  requireRole(["ADMIN", "STAFF"]),
  (req, res) => {
    const { from, to } = req.query as { from?: string; to?: string };

    const where: string[] = [];
    const params: any[] = [];

    if (from) {
      where.push("date(created_at) >= date(?)");
      params.push(from);
    }
    if (to) {
      where.push("date(created_at) <= date(?)");
      params.push(to);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    db.all(
      `
      SELECT
        date(created_at) as day,
        COUNT(*) as transactions_count,
        SUM(amount) as total_amount
      FROM transactions
      ${whereSql}
      GROUP BY date(created_at)
      ORDER BY day DESC
    `,
      params,
      (err, rows) => {
        if (err) {
          res.status(500).json({ message: "Failed to fetch sales summary" });
          return;
        }
        res.json(rows);
      }
    );
  }
);

// Stock levels: current stock per product
router.get(
  "/stock",
  requireAuth,
  requireRole(["ADMIN", "STAFF"]),
  (_req, res) => {
    db.all(
      `
      SELECT
        id,
        name,
        sku,
        unit_price,
        stock_quantity
      FROM products
      ORDER BY name
    `,
      [],
      (err, rows) => {
        if (err) {
          res.status(500).json({ message: "Failed to fetch stock levels" });
          return;
        }
        res.json(rows);
      }
    );
  }
);

// Pending orders: non-delivered orders
router.get(
  "/pending-orders",
  requireAuth,
  requireRole(["ADMIN", "STAFF"]),
  (_req, res) => {
    db.all(
      `
      SELECT
        o.*,
        r.name as retailer_name
      FROM orders o
      JOIN retailers r ON o.retailer_id = r.id
      WHERE o.status IN ('PENDING', 'APPROVED', 'SHIPPED')
      ORDER BY o.created_at DESC
    `,
      [],
      (err, rows) => {
        if (err) {
          res.status(500).json({ message: "Failed to fetch pending orders" });
          return;
        }
        res.json(rows);
      }
    );
  }
);

// Unresolved complaints: OPEN / IN_PROGRESS
router.get(
  "/complaints",
  requireAuth,
  requireRole(["ADMIN", "STAFF"]),
  (_req, res) => {
    db.all(
      `
      SELECT
        c.*,
        r.name as retailer_name,
        cu.name as customer_name
      FROM complaints c
      LEFT JOIN retailers r ON c.retailer_id = r.id
      LEFT JOIN customers cu ON c.customer_id = cu.id
      WHERE c.status IN ('OPEN', 'IN_PROGRESS')
      ORDER BY c.created_at DESC
    `,
      [],
      (err, rows) => {
        if (err) {
          res.status(500).json({ message: "Failed to fetch complaints report" });
          return;
        }
        res.json(rows);
      }
    );
  }
);

export default router;


