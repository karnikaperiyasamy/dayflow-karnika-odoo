import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { pool } from "../db/pool";
import { AuthRequest, requireAuth, requireAdminOrHR } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

const EMP_SELECT = `
  SELECT e.id AS employee_row_id, u.id AS user_id, u.employee_id, u.name, u.email, u.role, u.email_verified,
         e.phone, e.address, e.date_of_birth, e.gender, e.department, e.designation,
         e.joining_date, e.employment_type, e.profile_picture, e.status
  FROM employees e JOIN users u ON u.id = e.user_id
`;

// GET /api/employees - Admin/HR only, list all
router.get("/", requireAdminOrHR, async (req, res) => {
  const search = (req.query.search as string) || "";
  const result = await pool.query(
    `${EMP_SELECT} WHERE u.name ILIKE $1 OR u.email ILIKE $1 OR u.employee_id ILIKE $1 ORDER BY e.id`,
    [`%${search}%`]
  );
  res.json(result.rows);
});

// GET /api/employees/me - current user's own profile
router.get("/me", async (req: AuthRequest, res) => {
  const result = await pool.query(`${EMP_SELECT} WHERE u.id = $1`, [req.user!.userId]);
  if (result.rows.length === 0) return res.status(404).json({ error: "Profile not found." });
  res.json(result.rows[0]);
});

// PATCH /api/employees/me - employee can edit limited fields
router.patch("/me", async (req: AuthRequest, res) => {
  const { phone, address, profilePicture } = req.body;
  const result = await pool.query(
    `UPDATE employees SET phone = COALESCE($1, phone), address = COALESCE($2, address),
     profile_picture = COALESCE($3, profile_picture)
     WHERE user_id = $4 RETURNING *`,
    [phone, address, profilePicture, req.user!.userId]
  );
  res.json(result.rows[0]);
});

// GET /api/employees/:id - Admin/HR only
router.get("/:id", requireAdminOrHR, async (req, res) => {
  const result = await pool.query(`${EMP_SELECT} WHERE e.id = $1`, [req.params.id]);
  if (result.rows.length === 0) return res.status(404).json({ error: "Employee not found." });
  res.json(result.rows[0]);
});

// POST /api/employees - Admin/HR creates a new employee (also creates user account)
router.post("/", requireAdminOrHR, async (req, res) => {
  try {
    const { employeeId, name, email, password, role, department, designation, employmentType } = req.body;
    if (!employeeId || !name || !email || !password) {
      return res.status(400).json({ error: "employeeId, name, email, password are required." });
    }
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1 OR employee_id = $2",
      [email, employeeId]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Email or Employee ID already exists." });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(24).toString("hex");
    const userResult = await pool.query(
      `INSERT INTO users (employee_id, name, email, password_hash, role, email_verified, verification_token)
       VALUES ($1,$2,$3,$4,$5,true,NULL) RETURNING id`,
      [employeeId, name, email, passwordHash, role || "EMPLOYEE"]
    );
    const userId = userResult.rows[0].id;
    const empResult = await pool.query(
      `INSERT INTO employees (user_id, department, designation, employment_type)
       VALUES ($1,$2,$3,$4) RETURNING id`,
      [userId, department || "Unassigned", designation || "Unassigned", employmentType || "Full-Time"]
    );
    await pool.query(
      `INSERT INTO payroll (employee_id, basic_salary, allowances, deductions) VALUES ($1,0,0,0)`,
      [empResult.rows[0].id]
    );
    res.status(201).json({ message: "Employee created.", employeeRowId: empResult.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create employee." });
  }
});

// PUT /api/employees/:id - Admin/HR edits employee info
router.put("/:id", requireAdminOrHR, async (req, res) => {
  const { phone, address, department, designation, employmentType, dateOfBirth, gender } = req.body;
  const result = await pool.query(
    `UPDATE employees SET
       phone = COALESCE($1, phone), address = COALESCE($2, address),
       department = COALESCE($3, department), designation = COALESCE($4, designation),
       employment_type = COALESCE($5, employment_type), date_of_birth = COALESCE($6, date_of_birth),
       gender = COALESCE($7, gender)
     WHERE id = $8 RETURNING *`,
    [phone, address, department, designation, employmentType, dateOfBirth, gender, req.params.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: "Employee not found." });
  res.json(result.rows[0]);
});

// DELETE /api/employees/:id - deactivate
router.delete("/:id", requireAdminOrHR, async (req, res) => {
  const result = await pool.query(
    `UPDATE employees SET status = 'INACTIVE' WHERE id = $1 RETURNING *`,
    [req.params.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: "Employee not found." });
  res.json({ message: "Employee deactivated." });
});

export default router;
