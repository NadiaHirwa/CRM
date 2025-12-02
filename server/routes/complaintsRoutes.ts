import { Router } from "express";
import { db } from "../db";
import { requireAuth, requireRole, AuthRequest } from "../auth";

const router = Router();

// List complaints (ADMIN, STAFF see all; RETAILER sees own using retailer_id on user)
router.get("/", requireAuth, (req: AuthRequest, res) => {
  const role = req.user!.role;
  let sql = `
    SELECT c.*, r.name AS retailer_name, cu.name AS customer_name
    FROM complaints c
    LEFT JOIN retailers r ON c.retailer_id = r.id
    LEFT JOIN customers cu ON c.customer_id = cu.id
  `;
  const params: any[] = [];

  if (role === "RETAILER") {
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
        const localSql = sql + " WHERE c.retailer_id = ? ORDER BY c.created_at DESC";
        db.all(localSql, [row.retailer_id], (err2, rows) => {
          if (err2) {
            res.status(500).json({ message: "Failed to fetch complaints" });
            return;
          }
          res.json(rows);
        });
      }
    );
    return;
  }

  sql += " ORDER BY c.created_at DESC";

  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(500).json({ message: "Failed to fetch complaints" });
      return;
    }
    res.json(rows);
  });
});

// Create complaint (any authenticated user; retailer typically)
router.post("/", requireAuth, (req: AuthRequest, res) => {
  const { retailer_id, customer_id, subject, description } = req.body as {
    retailer_id?: number;
    customer_id?: number;
    subject: string;
    description: string;
  };

  if (!subject || !description) {
    res
      .status(400)
      .json({ message: "subject and description are required" });
    return;
  }

  const submittedBy = req.user!.id;

  const insertComplaint = (resolvedRetailerId: number | null) => {
    const stmt = db.prepare(
      `
      INSERT INTO complaints
        (retailer_id, customer_id, submitted_by_user_id, subject, description, status)
      VALUES (?, ?, ?, ?, ?, 'OPEN')
    `
    );
    stmt.run(
      [resolvedRetailerId, customer_id ?? null, submittedBy, subject, description],
      function (err) {
        if (err) {
          res.status(500).json({ message: "Failed to create complaint" });
          return;
        }
        db.get(
          "SELECT * FROM complaints WHERE id = ?",
          [this.lastID],
          (err2, row) => {
            if (err2 || !row) {
              res.status(201).json({
                id: this.lastID,
                retailer_id: resolvedRetailerId,
                customer_id,
                subject,
                description,
              });
              return;
            }
            res.status(201).json(row);
          }
        );
      }
    );
  };

  if (req.user!.role === "RETAILER" && !retailer_id) {
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
        insertComplaint(row.retailer_id);
      }
    );
    return;
  }

  insertComplaint(retailer_id ?? null);
});

// Update complaint status / assignment (ADMIN, STAFF)
router.patch(
  "/:id",
  requireAuth,
  requireRole(["ADMIN", "STAFF"]),
  (req, res) => {
    const id = Number(req.params.id);
    const { status, assigned_to_user_id } = req.body as {
      status?: string;
      assigned_to_user_id?: number | null;
    };

    const allowedStatus = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
    if (status && !allowedStatus.includes(status)) {
      res.status(400).json({ message: "Invalid status" });
      return;
    }

    db.run(
      `
      UPDATE complaints
      SET status = COALESCE(?, status),
          assigned_to_user_id = COALESCE(?, assigned_to_user_id),
          resolved_at = CASE
            WHEN ? IN ('RESOLVED', 'CLOSED') THEN CURRENT_TIMESTAMP
            ELSE resolved_at
          END
      WHERE id = ?
    `,
      [status, assigned_to_user_id, status, id],
      function (err) {
        if (err) {
          res.status(500).json({ message: "Failed to update complaint" });
          return;
        }
        if (this.changes === 0) {
          res.status(404).json({ message: "Complaint not found" });
          return;
        }
        db.get("SELECT * FROM complaints WHERE id = ?", [id], (err2, row) => {
          if (err2 || !row) {
            res.json({ id, status, assigned_to_user_id });
            return;
          }
          res.json(row);
        });
      }
    );
  }
);

export default router;


