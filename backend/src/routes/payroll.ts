import { Router } from "express";
import { pool } from "../db/pool";
import { AuthRequest, requireAuth, requireAdminOrHR } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

function withNet(row: any) {
  const net = Number(row.basic_salary) + Number(row.allowances) - Number(row.deductions);
  return { ...row, net_salary: net };
}

// GET /api/payroll/me
router.get("/me", async (req: AuthRequest, res) => {
  const result = await pool.query(
    `SELECT p.* FROM payroll p JOIN employees e ON e.id = p.employee_id WHERE e.user_id = $1`,
    [req.user!.userId]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: "Payroll record not found." });
  res.json(withNet(result.rows[0]));
});

// GET /api/payroll - Admin/HR: all
router.get("/", requireAdminOrHR, async (req, res) => {
  const result = await pool.query(`
    SELECT p.*, u.name, u.employee_id FROM payroll p
    JOIN employees e ON e.id = p.employee_id
    JOIN users u ON u.id = e.user_id
    ORDER BY p.id`);
  res.json(result.rows.map(withNet));
});

// GET /api/payroll/:employeeId - Admin/HR: single employee
router.get("/:employeeId", requireAdminOrHR, async (req, res) => {
  const result = await pool.query("SELECT * FROM payroll WHERE employee_id = $1", [req.params.employeeId]);
  if (result.rows.length === 0) return res.status(404).json({ error: "Payroll record not found." });
  res.json(withNet(result.rows[0]));
});

// PUT /api/payroll/:employeeId - Admin/HR: update salary structure
router.put("/:employeeId", requireAdminOrHR, async (req, res) => {
  const { basicSalary, allowances, deductions } = req.body;
  const result = await pool.query(
    `UPDATE payroll SET basic_salary = COALESCE($1, basic_salary),
       allowances = COALESCE($2, allowances), deductions = COALESCE($3, deductions), updated_at = NOW()
     WHERE employee_id = $4 RETURNING *`,
    [basicSalary, allowances, deductions, req.params.employeeId]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: "Payroll record not found." });
  res.json(withNet(result.rows[0]));
});

export default router;
