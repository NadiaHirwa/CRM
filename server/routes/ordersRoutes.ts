import { Router } from "express";
import { db } from "../db";
import { requireAuth, requireRole, AuthRequest } from "../auth";

const router = Router();

// Helper: recalc order total and update stock
function finalizeOrderTotalsAndStock(
  orderId: number,
  cb: (err: Error | null) => void
): void {
  db.get(
    "SELECT SUM(line_total) AS total FROM order_items WHERE order_id = ?",
    [orderId],
    (err, row: any) => {
      if (err) {
        cb(err);
        return;
      }
      const total = row?.total ?? 0;
      db.run(
        "UPDATE orders SET total_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [total, orderId],
        (err2) => {
          if (err2) {
            cb(err2);
            return;
          }
          cb(null);
        }
      );
    }
  );
}

// List orders (ADMIN, STAFF see all; RETAILER sees their own via retailer_id on user)
router.get("/", requireAuth, (req: AuthRequest, res) => {
  const userRole = req.user!.role;
  const params: any[] = [];
  let filterSql = "";

  if (userRole === "RETAILER") {
    db.get(
      "SELECT retailer_id FROM users WHERE id = ?",
      [req.user!.id],
      (err, row: any) => {
        if (err) {
          res.status(500).json({ message: "Failed to resolve retailer" });
          return;
        }
        if (!row || !row.retailer_id) {
          res
            .status(400)
            .json({ message: "No retailer linked to this user account" });
          return;
        }
        filterSql = "WHERE o.retailer_id = ?";
        params.push(row.retailer_id);
        db.all(
          `
          SELECT o.*, r.name as retailer_name
          FROM orders o
          JOIN retailers r ON o.retailer_id = r.id
          ${filterSql}
          ORDER BY o.created_at DESC
        `,
          params,
          (err2, rows) => {
            if (err2) {
              res.status(500).json({ message: "Failed to fetch orders" });
              return;
            }
            res.json(rows);
          }
        );
      }
    );
    return;
  }

  db.all(
    `
    SELECT o.*, r.name as retailer_name
    FROM orders o
    JOIN retailers r ON o.retailer_id = r.id
    ORDER BY o.created_at DESC
  `,
    [],
    (err, rows) => {
      if (err) {
        res.status(500).json({ message: "Failed to fetch orders" });
        return;
      }
      res.json(rows);
    }
  );
});

// Create order with items (ADMIN, STAFF, RETAILER)
router.post("/", requireAuth, (req: AuthRequest, res) => {
  const { retailer_id, items } = req.body as {
    retailer_id?: number;
    items: { product_id: number; quantity: number }[];
  };

  if (!Array.isArray(items) || items.length === 0) {
    res
      .status(400)
      .json({ message: "At least one item is required for an order" });
    return;
  }

  const createForRetailer = (resolvedRetailerId: number) => {
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      db.run(
        "INSERT INTO orders (retailer_id, status, total_amount) VALUES (?, 'PENDING', 0)",
        [resolvedRetailerId],
        function (err) {
          if (err) {
            db.run("ROLLBACK");
            res.status(500).json({ message: "Failed to create order" });
            return;
          }
          const orderId = this.lastID as number;

          const itemStmt = db.prepare(
            `
          INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total)
          SELECT ?, p.id, ?, p.unit_price, p.unit_price * ?
          FROM products p
          WHERE p.id = ?
        `
          );

          for (const item of items) {
            if (!item.product_id || !item.quantity || item.quantity <= 0) {
              db.run("ROLLBACK");
              res.status(400).json({ message: "Invalid item in order" });
              return;
            }
            itemStmt.run(
              [orderId, item.quantity, item.quantity, item.product_id],
              (err2) => {
                if (err2) {
                  db.run("ROLLBACK");
                  res
                    .status(500)
                    .json({ message: "Failed to add order items" });
                }
              }
            );
          }

          itemStmt.finalize((finalizeErr) => {
            if (finalizeErr) {
              db.run("ROLLBACK");
              res.status(500).json({ message: "Failed to finalize items" });
              return;
            }
            finalizeOrderTotalsAndStock(orderId, (totErr) => {
              if (totErr) {
                db.run("ROLLBACK");
                res
                  .status(500)
                  .json({ message: "Failed to calculate order total" });
                return;
              }
              db.run("COMMIT");
              db.get(
                "SELECT * FROM orders WHERE id = ?",
                [orderId],
                (err3, row) => {
                  if (err3 || !row) {
                    res.status(201).json({ id: orderId, retailer_id: resolvedRetailerId });
                    return;
                  }
                  res.status(201).json(row);
                }
              );
            });
          });
        }
      );
    });
  };

  if (req.user!.role === "RETAILER") {
    db.get(
      "SELECT retailer_id FROM users WHERE id = ?",
      [req.user!.id],
      (err, row: any) => {
        if (err) {
          res.status(500).json({ message: "Failed to resolve retailer" });
          return;
        }
        if (!row || !row.retailer_id) {
          res
            .status(400)
            .json({ message: "No retailer linked to this user account" });
          return;
        }
        createForRetailer(row.retailer_id);
      }
    );
    return;
  }

  if (!retailer_id) {
    res.status(400).json({ message: "retailer_id is required" });
    return;
  }

  createForRetailer(retailer_id);

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    db.run(
      "INSERT INTO orders (retailer_id, status, total_amount) VALUES (?, 'PENDING', 0)",
      [retailer_id],
      function (err) {
        if (err) {
          db.run("ROLLBACK");
          res.status(500).json({ message: "Failed to create order" });
          return;
        }
        const orderId = this.lastID as number;

        const itemStmt = db.prepare(
          `
          INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total)
          SELECT ?, p.id, ?, p.unit_price, p.unit_price * ?
          FROM products p
          WHERE p.id = ?
        `
        );

        for (const item of items) {
          if (!item.product_id || !item.quantity || item.quantity <= 0) {
            db.run("ROLLBACK");
            res.status(400).json({ message: "Invalid item in order" });
            return;
          }
          itemStmt.run(
            [orderId, item.quantity, item.quantity, item.product_id],
            (err2) => {
              if (err2) {
                db.run("ROLLBACK");
                res.status(500).json({ message: "Failed to add order items" });
              }
            }
          );
        }

        itemStmt.finalize((finalizeErr) => {
          if (finalizeErr) {
            db.run("ROLLBACK");
            res.status(500).json({ message: "Failed to finalize items" });
            return;
          }
          finalizeOrderTotalsAndStock(orderId, (totErr) => {
            if (totErr) {
              db.run("ROLLBACK");
              res
                .status(500)
                .json({ message: "Failed to calculate order total" });
              return;
            }
            db.run("COMMIT");
            db.get(
              "SELECT * FROM orders WHERE id = ?",
              [orderId],
              (err3, row) => {
                if (err3 || !row) {
                  res.status(201).json({ id: orderId, retailer_id });
                  return;
                }
                res.status(201).json(row);
              }
            );
          });
        });
      }
    );
  });
});

// Update order status (ADMIN, STAFF)
router.patch(
  "/:id/status",
  requireAuth,
  requireRole(["ADMIN", "STAFF"]),
  (req, res) => {
    const id = Number(req.params.id);
    const { status } = req.body as { status: string };
    const allowed = ["PENDING", "APPROVED", "SHIPPED", "DELIVERED", "CANCELLED"];
    if (!allowed.includes(status)) {
      res.status(400).json({ message: "Invalid status" });
      return;
    }
    db.run(
      "UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [status, id],
      function (err) {
        if (err) {
          res.status(500).json({ message: "Failed to update order status" });
          return;
        }
        if (this.changes === 0) {
          res.status(404).json({ message: "Order not found" });
          return;
        }
        db.get("SELECT * FROM orders WHERE id = ?", [id], (err2, row) => {
          if (err2 || !row) {
            res.json({ id, status });
            return;
          }
          res.json(row);
        });
      }
    );
  }
);

export default router;


