import { Router } from "express";
import { db } from "../db";
import { requireAuth, requireRole } from "../auth";

const router = Router();

/**
 * Get notifications for low stock and long-pending complaints
 * Configurable thresholds via query params or environment variables
 */
router.get(
  "/",
  requireAuth,
  requireRole(["ADMIN", "STAFF"]),
  (req, res) => {
    const lowStockThreshold =
      Number(req.query.lowStockThreshold) ||
      Number(process.env.LOW_STOCK_THRESHOLD) ||
      10; // Default: 10 units

    const complaintWarningHours =
      Number(req.query.complaintWarningHours) ||
      Number(process.env.COMPLAINT_WARNING_HOURS) ||
      24; // Default: 24 hours

    // Check for low stock products
    db.all(
      `
      SELECT
        id,
        name,
        sku,
        stock_quantity,
        unit_price
      FROM products
      WHERE stock_quantity <= ?
      ORDER BY stock_quantity ASC
    `,
      [lowStockThreshold],
      (err, lowStockProducts) => {
        if (err) {
          res.status(500).json({ message: "Failed to check low stock" });
          return;
        }

        // Check for long-pending complaints
        const complaintWarningMs = complaintWarningHours * 60 * 60 * 1000;
        const warningTimestamp = new Date(
          Date.now() - complaintWarningMs
        ).toISOString();

        db.all(
          `
          SELECT
            c.id,
            c.subject,
            c.description,
            c.status,
            c.created_at,
            c.assigned_to_user_id,
            r.name as retailer_name,
            cu.name as customer_name,
            ROUND((julianday('now') - julianday(c.created_at)) * 24, 1) as hours_open
          FROM complaints c
          LEFT JOIN retailers r ON c.retailer_id = r.id
          LEFT JOIN customers cu ON c.customer_id = cu.id
          WHERE c.status IN ('OPEN', 'IN_PROGRESS')
            AND datetime(c.created_at) < datetime(?)
          ORDER BY c.created_at ASC
        `,
          [warningTimestamp],
          (err2, longPendingComplaints) => {
            if (err2) {
              res.status(500).json({
                message: "Failed to check long-pending complaints",
              });
              return;
            }

            const notifications = {
              lowStock: {
                count: lowStockProducts.length,
                threshold: lowStockThreshold,
                products: lowStockProducts.map((p: any) => ({
                  id: p.id,
                  name: p.name,
                  sku: p.sku,
                  stockQuantity: p.stock_quantity,
                  unitPrice: p.unit_price,
                  severity:
                    p.stock_quantity === 0
                      ? "critical"
                      : p.stock_quantity <= lowStockThreshold * 0.5
                      ? "high"
                      : "medium",
                })),
              },
              longPendingComplaints: {
                count: longPendingComplaints.length,
                warningHours: complaintWarningHours,
                complaints: longPendingComplaints.map((c: any) => ({
                  id: c.id,
                  subject: c.subject,
                  status: c.status,
                  createdAt: c.created_at,
                  hoursOpen: parseFloat(c.hours_open || 0),
                  assignedToUserId: c.assigned_to_user_id,
                  retailerName: c.retailer_name,
                  customerName: c.customer_name,
                  severity:
                    parseFloat(c.hours_open || 0) >= complaintWarningHours * 2
                      ? "critical"
                      : parseFloat(c.hours_open || 0) >= complaintWarningHours * 1.5
                      ? "high"
                      : "medium",
                })),
              },
              timestamp: new Date().toISOString(),
            };

            res.json(notifications);
          }
        );
      }
    );
  }
);

/**
 * Get only low stock notifications
 */
router.get(
  "/low-stock",
  requireAuth,
  requireRole(["ADMIN", "STAFF"]),
  (req, res) => {
    const threshold =
      Number(req.query.threshold) ||
      Number(process.env.LOW_STOCK_THRESHOLD) ||
      10;

    db.all(
      `
      SELECT
        id,
        name,
        sku,
        stock_quantity,
        unit_price
      FROM products
      WHERE stock_quantity <= ?
      ORDER BY stock_quantity ASC
    `,
      [threshold],
      (err, rows) => {
        if (err) {
          res.status(500).json({ message: "Failed to fetch low stock products" });
          return;
        }
        res.json(rows);
      }
    );
  }
);

/**
 * Get only long-pending complaints
 */
router.get(
  "/long-pending-complaints",
  requireAuth,
  requireRole(["ADMIN", "STAFF"]),
  (req, res) => {
    const warningHours =
      Number(req.query.hours) ||
      Number(process.env.COMPLAINT_WARNING_HOURS) ||
      24;
    const warningTimestamp = new Date(
      Date.now() - warningHours * 60 * 60 * 1000
    ).toISOString();

    db.all(
      `
      SELECT
        c.*,
        r.name as retailer_name,
        cu.name as customer_name,
        ROUND((julianday('now') - julianday(c.created_at)) * 24, 1) as hours_open
      FROM complaints c
      LEFT JOIN retailers r ON c.retailer_id = r.id
      LEFT JOIN customers cu ON c.customer_id = cu.id
      WHERE c.status IN ('OPEN', 'IN_PROGRESS')
        AND datetime(c.created_at) < datetime(?)
      ORDER BY c.created_at ASC
    `,
      [warningTimestamp],
      (err, rows) => {
        if (err) {
          res.status(500).json({
            message: "Failed to fetch long-pending complaints",
          });
          return;
        }
        res.json(rows);
      }
    );
  }
);

export default router;

