import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "../db";
import { signToken, UserRole } from "../auth";

const router = Router();

router.post("/register", (req, res) => {
  const { name, email, password, role } = req.body as {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
  };

  if (!name || !email || !password) {
    res.status(400).json({ message: "Name, email and password are required" });
    return;
  }

  const userRole: UserRole = role || "STAFF";
  const passwordHash = bcrypt.hashSync(password, 10);

  const stmt = db.prepare(
    "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)"
  );
  stmt.run([name, email, passwordHash, userRole], function (err) {
    if (err) {
      if (err.message.includes("UNIQUE")) {
        res.status(409).json({ message: "Email already exists" });
      } else {
        res.status(500).json({ message: "Failed to create user" });
      }
      return;
    }
    const token = signToken({ id: this.lastID as number, role: userRole });
    res.status(201).json({ id: this.lastID, name, email, role: userRole, token });
  });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required" });
    return;
  }

  db.get(
    "SELECT id, name, email, password_hash, role FROM users WHERE email = ?",
    [email],
    (err, row: any) => {
      if (err) {
        res.status(500).json({ message: "Database error" });
        return;
      }
      if (!row) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
      }

      const valid = bcrypt.compareSync(password, row.password_hash);
      if (!valid) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
      }

      const token = signToken({ id: row.id, role: row.role as UserRole });
      res.json({
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        token,
      });
    }
  );
});

export default router;


