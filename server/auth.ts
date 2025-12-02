import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export type UserRole = "ADMIN" | "STAFF" | "RETAILER";

export interface JwtPayloadCustom {
  id: number;
  role: UserRole;
}

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export function signToken(payload: JwtPayloadCustom): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" });
}

export interface AuthRequest extends Request {
  user?: JwtPayloadCustom;
}

export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ message: "Missing authorization token" });
    return;
  }

  const token = header.substring("Bearer ".length);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayloadCustom;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function requireRole(roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
    next();
  };
}


