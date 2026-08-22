import { Router } from "express";
import { pool } from "../db/pool";
import { AuthRequest, requireAuth, requireAdminOrHR } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

const PAID_LEAVE_TOTAL = 12;
const SICK_LEAVE_TOTAL = 8;

async function getEmployeeRowId(userId: number) {
  const r = await pool.query("SELECT id FROM employees WHERE user_id = $1", [userId]);
  return r.rows[0]?.id as number | undefined;
}

// POST /api/leave - apply for leave
router.post("/", async (req: AuthRequest, res) => {
  const empId = await getEmployeeRowId(req.user!.userId);
  if (!empId) return res.status(404).json({ error: "Employee record not found." });
  const { leaveType, startDate, endDate, remarks } = req.body;
  if (!leaveType || !startDate || !endDate) {
    return res.status(400).json({ error: "leaveType, startDate, endDate are required." });
  }
  if (!["PAID", "SICK", "UNPAID"].includes(leaveType)) {
    return res.status(400).json({ error: "Invalid leave type." });
  }
  if (new Date(endDate) < new Date(startDate)) {
    return res.status(400).json({ error: "End date cannot be before start date." });
  }
  const result = await pool.query(
    `INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, remarks, status)
     VALUES ($1,$2,$3,$4,$5,'PENDING') RETURNING *`,
    [empId, leaveType, startDate, endDate, remarks || null]
  );

  // notify all admins/HR
  const admins = await pool.query("SELECT id FROM users WHERE role IN ('ADMIN','HR')");
  for (const a of admins.rows) {
    await pool.query(
      "INSERT INTO notifications (user_id, message) VALUES ($1, $2)",
      [a.id, `New leave request from employee ${req.user!.employeeId}.`]
    );
  }
  res.status(201).json(result.rows[0]);
});

// GET /api/leave/me - own leave requests
router.get("/me", async (req: AuthRequest, res) => {
  const empId = await getEmployeeRowId(req.user!.userId);
  if (!empId) return res.status(404).json({ error: "Employee record not found." });
  const result = await pool.query(
    "SELECT * FROM leave_requests WHERE employee_id = $1 ORDER BY created_at DESC",
    [empId]
  );
  res.json(result.rows);
});

// GET /api/leave/balance - own leave balance
router.get("/balance", async (req: AuthRequest, res) => {
  const empId = await getEmployeeRowId(req.user!.userId);
  if (!empId) return res.status(404).json({ error: "Employee record not found." });

  async function usedDays(type: string) {
    const r = await pool.query(
      `SELECT COALESCE(SUM((end_date - start_date) + 1), 0) AS used
       FROM leave_requests WHERE employee_id = $1 AND leave_type = $2 AND status = 'APPROVED'`,
      [empId, type]
    );
    return Number(r.rows[0].used);
  }
  const paidUsed = await usedDays("PAID");
  const sickUsed = await usedDays("SICK");
  res.json({
    paid: { total: PAID_LEAVE_TOTAL, used: paidUsed, remaining: Math.max(PAID_LEAVE_TOTAL - paidUsed, 0) },
    sick: { total: SICK_LEAVE_TOTAL, used: sickUsed, remaining: Math.max(SICK_LEAVE_TOTAL - sickUsed, 0) },
    unpaid: { total: null, used: null, remaining: null },
  });
});

// GET /api/leave - Admin/HR: all requests
router.get("/", requireAdminOrHR, async (req, res) => {
  const result = await pool.query(`
    SELECT lr.*, u.name, u.employee_id FROM leave_requests lr
    JOIN employees e ON e.id = lr.employee_id
    JOIN users u ON u.id = e.user_id
    ORDER BY lr.created_at DESC`);
  res.json(result.rows);
});

// PATCH /api/leave/:id - Admin/HR approve/reject
router.patch("/:id", requireAdminOrHR, async (req, res) => {
  const { status, adminComment } = req.body;
  if (!["APPROVED", "REJECTED"].includes(status)) {
    return res.status(400).json({ error: "status must be APPROVED or REJECTED." });
  }
  const result = await pool.query(
    `UPDATE leave_requests SET status = $1, admin_comment = $2 WHERE id = $3 RETURNING *`,
    [status, adminComment || null, req.params.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: "Leave request not found." });
  const lr = result.rows[0];

  const userRes = await pool.query(
    "SELECT u.id FROM users u JOIN employees e ON e.user_id = u.id WHERE e.id = $1",
    [lr.employee_id]
  );
  if (userRes.rows.length > 0) {
    await pool.query(
      "INSERT INTO notifications (user_id, message) VALUES ($1, $2)",
      [userRes.rows[0].id, `Your ${lr.leave_type} leave request was ${status.toLowerCase()}.`]
    );
  }

  // If approved, mark attendance as LEAVE for those dates
  if (status === "APPROVED") {
    await pool.query(
      `INSERT INTO attendance (employee_id, date, status)
       SELECT $1, d::date, 'LEAVE'
       FROM generate_series($2::date, $3::date, '1 day') AS d
       ON CONFLICT (employee_id, date) DO UPDATE SET status = 'LEAVE'`,
      [lr.employee_id, lr.start_date, lr.end_date]
    );
  }

  res.json(lr);
});

export default router;
