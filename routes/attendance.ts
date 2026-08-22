import { Router } from "express";
import { pool } from "../db/pool";
import { AuthRequest, requireAuth, requireAdminOrHR } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

async function getEmployeeRowId(userId: number) {
  const r = await pool.query("SELECT id FROM employees WHERE user_id = $1", [userId]);
  return r.rows[0]?.id as number | undefined;
}

// POST /api/attendance/checkin
router.post("/checkin", async (req: AuthRequest, res) => {
  const empId = await getEmployeeRowId(req.user!.userId);
  if (!empId) return res.status(404).json({ error: "Employee record not found." });
  const today = new Date().toISOString().slice(0, 10);

  const existing = await pool.query(
    "SELECT * FROM attendance WHERE employee_id = $1 AND date = $2",
    [empId, today]
  );
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: "You have already checked in today." });
  }
  const result = await pool.query(
    `INSERT INTO attendance (employee_id, date, check_in, status) VALUES ($1,$2,NOW(),'PRESENT') RETURNING *`,
    [empId, today]
  );
  res.status(201).json(result.rows[0]);
});

// POST /api/attendance/checkout
router.post("/checkout", async (req: AuthRequest, res) => {
  const empId = await getEmployeeRowId(req.user!.userId);
  if (!empId) return res.status(404).json({ error: "Employee record not found." });
  const today = new Date().toISOString().slice(0, 10);

  const existing = await pool.query(
    "SELECT * FROM attendance WHERE employee_id = $1 AND date = $2",
    [empId, today]
  );
  if (existing.rows.length === 0) {
    return res.status(400).json({ error: "You must check in before checking out." });
  }
  const row = existing.rows[0];
  if (row.check_out) {
    return res.status(409).json({ error: "You have already checked out today." });
  }
  const result = await pool.query(
    `UPDATE attendance SET check_out = NOW(),
       total_hours = ROUND(EXTRACT(EPOCH FROM (NOW() - check_in)) / 3600.0, 2),
       status = CASE WHEN EXTRACT(EPOCH FROM (NOW() - check_in)) / 3600.0 < 4 THEN 'HALF_DAY' ELSE 'PRESENT' END
     WHERE id = $1 RETURNING *`,
    [row.id]
  );
  res.json(result.rows[0]);
});

// GET /api/attendance/me - own attendance (optionally ?range=week)
router.get("/me", async (req: AuthRequest, res) => {
  const empId = await getEmployeeRowId(req.user!.userId);
  if (!empId) return res.status(404).json({ error: "Employee record not found." });
  const range = req.query.range;
  let query = "SELECT * FROM attendance WHERE employee_id = $1";
  if (range === "week") {
    query += " AND date >= (CURRENT_DATE - INTERVAL '7 days')";
  }
  query += " ORDER BY date DESC";
  const result = await pool.query(query, [empId]);
  res.json(result.rows);
});

// GET /api/attendance - Admin/HR: view all (optional ?date=YYYY-MM-DD)
router.get("/", requireAdminOrHR, async (req, res) => {
  const date = req.query.date as string | undefined;
  let query = `
    SELECT a.*, u.name, u.employee_id FROM attendance a
    JOIN employees e ON e.id = a.employee_id
    JOIN users u ON u.id = e.user_id`;
  const params: any[] = [];
  if (date) {
    query += " WHERE a.date = $1";
    params.push(date);
  }
  query += " ORDER BY a.date DESC";
  const result = await pool.query(query, params);
  res.json(result.rows);
});

export default router;
