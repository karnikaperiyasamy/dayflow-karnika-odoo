import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "insecure-dev-secret-change-me";

export interface JwtPayload {
  userId: number;
  role: "ADMIN" | "HR" | "EMPLOYEE";
  employeeId: string;
}

export function signToken(payload: JwtPayload) {
  return jwt.sign(payload, SECRET, { expiresIn: "8h" });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, SECRET) as JwtPayload;
}
