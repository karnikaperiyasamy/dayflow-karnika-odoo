import bcrypt from "bcryptjs";
import { pool } from "./pool";

async function upsertUser(employeeId: string, name: string, email: string, password: string, role: string) {
  const hash = await bcrypt.hash(password, 10);
  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
  let userId: number;
  if (existing.rows.length > 0) {
    userId = existing.rows[0].id;
    await pool.query(
      "UPDATE users SET password_hash = $1, role = $2, email_verified = true WHERE id = $3",
      [hash, role, userId]
    );
  } else {
    const r = await pool.query(
      `INSERT INTO users (employee_id, name, email, password_hash, role, email_verified)
       VALUES ($1,$2,$3,$4,$5,true) RETURNING id`,
      [employeeId, name, email, hash, role]
    );
    userId = r.rows[0].id;
  }
  return userId;
}

async function ensureEmployee(userId: number, department: string, designation: string, basic: number, allowances: number, deductions: number) {
  let empRow = await pool.query("SELECT id FROM employees WHERE user_id = $1", [userId]);
  let empId: number;
  if (empRow.rows.length === 0) {
    const r = await pool.query(
      `INSERT INTO employees (user_id, department, designation, phone, address)
       VALUES ($1,$2,$3,'555-0100','123 Demo Street') RETURNING id`,
      [userId, department, designation]
    );
    empId = r.rows[0].id;
  } else {
    empId = empRow.rows[0].id;
  }
  const payRow = await pool.query("SELECT id FROM payroll WHERE employee_id = $1", [empId]);
  if (payRow.rows.length === 0) {
    await pool.query(
      `INSERT INTO payroll (employee_id, basic_salary, allowances, deductions) VALUES ($1,$2,$3,$4)`,
      [empId, basic, allowances, deductions]
    );
  } else {
    await pool.query(
      `UPDATE payroll SET basic_salary=$1, allowances=$2, deductions=$3 WHERE employee_id=$4`,
      [basic, allowances, deductions, empId]
    );
  }
  return empId;
}

async function seed() {
  console.log("Seeding demo data...");

  const adminUserId = await upsertUser("EMP001", "Alice Admin", "admin@dayflow.demo", "Admin@1234", "ADMIN");
  await ensureEmployee(adminUserId, "Administration", "System Administrator", 80000, 10000, 5000);

  const hrUserId = await upsertUser("EMP002", "Hana HR", "hr@dayflow.demo", "Hr@12345", "HR");
  await ensureEmployee(hrUserId, "Human Resources", "HR Manager", 60000, 8000, 4000);

  const empUserId = await upsertUser("EMP003", "Ethan Employee", "employee@dayflow.demo", "Employee@1", "EMPLOYEE");
  const empId = await ensureEmployee(empUserId, "Engineering", "Software Engineer", 50000, 6000, 3000);

  // Sample attendance for the past few days
  for (let i = 1; i <= 4; i++) {
    await pool.query(
      `INSERT INTO attendance (employee_id, date, check_in, check_out, status, total_hours)
       VALUES ($1, CURRENT_DATE - $2::int, (CURRENT_DATE - $2::int) + TIME '09:00', (CURRENT_DATE - $2::int) + TIME '18:00', 'PRESENT', 9)
       ON CONFLICT (employee_id, date) DO NOTHING`,
      [empId, i]
    );
  }

  // Sample leave request
  const existingLeave = await pool.query(
    "SELECT id FROM leave_requests WHERE employee_id = $1 LIMIT 1",
    [empId]
  );
  if (existingLeave.rows.length === 0) {
    await pool.query(
      `INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, remarks, status)
       VALUES ($1, 'PAID', CURRENT_DATE + 5, CURRENT_DATE + 6, 'Family event', 'PENDING')`,
      [empId]
    );
  }

  console.log("Seed complete.");
  console.log("Demo accounts:");
  console.log("  Admin:    admin@dayflow.demo / Admin@1234");
  console.log("  HR:       hr@dayflow.demo / Hr@12345");
  console.log("  Employee: employee@dayflow.demo / Employee@1");

  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
