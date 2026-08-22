import { Router } from "express";
import { pool } from "../db/pool";
import { AuthRequest, requireAuth, requireAdminOrHR } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

// GET /api/dashboard/employee
router.get("/employee", async (req: AuthRequest, res) => {
  const empRes = await pool.query("SELECT id FROM employees WHERE user_id = $1", [req.user!.userId]);
  if (empRes.rows.length === 0) return res.status(404).json({ error: "Employee record not found." });
  const empId = empRes.rows[0].id;
  const today = new Date().toISOString().slice(0, 10);

  const todayAtt = await pool.query("SELECT * FROM attendance WHERE employee_id = $1 AND date = $2", [empId, today]);
  const pendingLeave = await pool.query(
    "SELECT COUNT(*) FROM leave_requests WHERE employee_id = $1 AND status = 'PENDING'",
    [empId]
  );
  const payroll = await pool.query("SELECT * FROM payroll WHERE employee_id = $1", [empId]);

  const paidUsedRes = await pool.query(
    `SELECT COALESCE(SUM((end_date - start_date) + 1),0) AS used FROM leave_requests
     WHERE employee_id = $1 AND leave_type = 'PAID' AND status = 'APPROVED'`,
    [empId]
  );
  const paidUsed = Number(paidUsedRes.rows[0].used);

  res.json({
    todayAttendance: todayAtt.rows[0] || null,
    leaveBalance: { paid: { total: 12, used: paidUsed, remaining: Math.max(12 - paidUsed, 0) } },
    pendingLeaveRequests: Number(pendingLeave.rows[0].count),
    payroll: payroll.rows[0]
      ? {
          ...payroll.rows[0],
          net_salary:
            Number(payroll.rows[0].basic_salary) +
            Number(payroll.rows[0].allowances) -
            Number(payroll.rows[0].deductions),
        }
      : null,
  });
});

// GET /api/dashboard/admin
router.get("/admin", requireAdminOrHR, async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const totalEmployees = await pool.query("SELECT COUNT(*) FROM employees WHERE status = 'ACTIVE'");
  const presentToday = await pool.query(
    "SELECT COUNT(*) FROM attendance WHERE date = $1 AND status IN ('PRESENT','HALF_DAY')",
    [today]
  );
  const pendingLeave = await pool.query("SELECT COUNT(*) FROM leave_requests WHERE status = 'PENDING'");
  const totalPayroll = await pool.query(
    "SELECT COALESCE(SUM(basic_salary + allowances - deductions),0) AS total FROM payroll"
  );
  const totalEmp = Number(totalEmployees.rows[0].count);
  const present = Number(presentToday.rows[0].count);

  const recentActivity = await pool.query(`
    SELECT 'leave' AS type, lr.status, u.name, lr.created_at AS at
    FROM leave_requests lr JOIN employees e ON e.id = lr.employee_id JOIN users u ON u.id = e.user_id
    ORDER BY lr.created_at DESC LIMIT 5`);

  res.json({
    totalEmployees: totalEmp,
    presentToday: present,
    absentToday: Math.max(totalEmp - present, 0),
    pendingLeaveRequests: Number(pendingLeave.rows[0].count),
    totalPayroll: Number(totalPayroll.rows[0].total),
    recentActivity: recentActivity.rows,
  });
});

export default router;
