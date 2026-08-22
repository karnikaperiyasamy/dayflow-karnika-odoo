import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { pool } from "../db/pool";
import { signToken } from "../utils/jwt";

const router = Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { employeeId, name, email, password, role } = req.body;

    if (!employeeId || !name || !email || !password) {
      return res.status(400).json({ error: "All fields are required." });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters." });
    }
    const finalRole = ["ADMIN", "HR", "EMPLOYEE"].includes(role) ? role : "EMPLOYEE";

    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1 OR employee_id = $2",
      [email, employeeId]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Email or Employee ID already registered." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(24).toString("hex");

    const userResult = await pool.query(
      `INSERT INTO users (employee_id, name, email, password_hash, role, email_verified, verification_token)
       VALUES ($1,$2,$3,$4,$5,false,$6) RETURNING id, employee_id, name, email, role, email_verified`,
      [employeeId, name, email, passwordHash, finalRole, verificationToken]
    );
    const user = userResult.rows[0];

    await pool.query(
      `INSERT INTO employees (user_id, department, designation) VALUES ($1, 'Unassigned', 'Unassigned')`,
      [user.id]
    );
    await pool.query(
      `INSERT INTO payroll (employee_id, basic_salary, allowances, deductions)
       VALUES ((SELECT id FROM employees WHERE user_id = $1), 0, 0, 0)`,
      [user.id]
    );

    // Dev-mode "email": since no real email service is configured, expose the
    // verification link directly instead of pretending an email was sent.
    const devVerifyLink = `/api/auth/verify?token=${verificationToken}`;

    res.status(201).json({
      message: "Registration successful. Please verify your email to activate your account.",
      user,
      devVerificationLink: devVerifyLink,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed." });
  }
});

// GET /api/auth/verify?token=...
router.get("/verify", async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: "Verification token required." });

  const result = await pool.query(
    "UPDATE users SET email_verified = true, verification_token = NULL WHERE verification_token = $1 RETURNING id, email",
    [token]
  );
  if (result.rows.length === 0) {
    return res.status(400).json({ error: "Invalid or already-used verification token." });
  }
  res.json({ message: "Email verified successfully. You can now log in." });
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    if (!user.email_verified) {
      return res.status(403).json({ error: "Email not verified. Please verify your account first." });
    }

    const token = signToken({ userId: user.id, role: user.role, employeeId: user.employee_id });
    res.json({
      token,
      user: {
        id: user.id,
        employeeId: user.employee_id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed." });
  }
});

export default router;
