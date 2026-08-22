import { Router } from "express";
import { pool } from "../db/pool";
import { requireAuth, requireAdminOrHR } from "../middleware/auth";

const router = Router();
router.use(requireAuth, requireAdminOrHR);

// GET /api/reports/summary
router.get("/summary", async (req, res) => {
  const totalEmployees = await pool.query("SELECT COUNT(*) FROM employees WHERE status = 'ACTIVE'");
  const today = new Date().toISOString().slice(0, 10);
  const presentToday = await pool.query(
    "SELECT COUNT(*) FROM attendance WHERE date = $1 AND status IN ('PRESENT','HALF_DAY')",
    [today]
  );
  const leaveStats = await pool.query(`
    SELECT leave_type, status, COUNT(*) FROM leave_requests GROUP BY leave_type, status`);
  const payrollSummary = await pool.query(
    "SELECT COALESCE(SUM(basic_salary),0) AS basic, COALESCE(SUM(allowances),0) AS allowances, COALESCE(SUM(deductions),0) AS deductions FROM payroll"
  );
  const totalEmp = Number(totalEmployees.rows[0].count);
  const present = Number(presentToday.rows[0].count);

  res.json({
    totalEmployees: totalEmp,
    presentToday: present,
    absentToday: Math.max(totalEmp - present, 0),
    leaveStats: leaveStats.rows,
    payrollSummary: payrollSummary.rows[0],
  });
});

// GET /api/reports/attendance.csv
router.get("/attendance.csv", async (req, res) => {
  const result = await pool.query(`
    SELECT u.employee_id, u.name, a.date, a.check_in, a.check_out, a.status, a.total_hours
    FROM attendance a JOIN employees e ON e.id = a.employee_id JOIN users u ON u.id = e.user_id
    ORDER BY a.date DESC`);
  const header = "employee_id,name,date,check_in,check_out,status,total_hours\n";
  const rows = result.rows
    .map((r) => [r.employee_id, r.name, r.date, r.check_in, r.check_out, r.status, r.total_hours].join(","))
    .join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=attendance_report.csv");
  res.send(header + rows);
});

// GET /api/reports/leave.csv
router.get("/leave.csv", async (req, res) => {
  const result = await pool.query(`
    SELECT u.employee_id, u.name, lr.leave_type, lr.start_date, lr.end_date, lr.status
    FROM leave_requests lr JOIN employees e ON e.id = lr.employee_id JOIN users u ON u.id = e.user_id
    ORDER BY lr.created_at DESC`);
  const header = "employee_id,name,leave_type,start_date,end_date,status\n";
  const rows = result.rows
    .map((r) => [r.employee_id, r.name, r.leave_type, r.start_date, r.end_date, r.status].join(","))
    .join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=leave_report.csv");
  res.send(header + rows);
});

// GET /api/reports/payroll.csv
router.get("/payroll.csv", async (req, res) => {
  const result = await pool.query(`
    SELECT u.employee_id, u.name, p.basic_salary, p.allowances, p.deductions,
           (p.basic_salary + p.allowances - p.deductions) AS net_salary
    FROM payroll p JOIN employees e ON e.id = p.employee_id JOIN users u ON u.id = e.user_id
    ORDER BY u.employee_id`);
  const header = "employee_id,name,basic_salary,allowances,deductions,net_salary\n";
  const rows = result.rows
    .map((r) => [r.employee_id, r.name, r.basic_salary, r.allowances, r.deductions, r.net_salary].join(","))
    .join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=payroll_report.csv");
  res.send(header + rows);
});

export default router;
