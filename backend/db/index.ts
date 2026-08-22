import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";

export const db = new Database(path.join(__dirname, "..", "..", "dayflow.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('ADMIN','HR','EMPLOYEE')),
      verified INTEGER NOT NULL DEFAULT 0,
      phone TEXT,
      address TEXT,
      profile_picture TEXT,
      department TEXT,
      designation TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','INACTIVE')),
      basic_salary REAL NOT NULL DEFAULT 0,
      allowances REAL NOT NULL DEFAULT 0,
      deductions REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      date TEXT NOT NULL,
      check_in TEXT,
      check_out TEXT,
      total_hours REAL,
      UNIQUE(user_id, date)
    );

    CREATE TABLE IF NOT EXISTS leave_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      leave_type TEXT NOT NULL CHECK(leave_type IN ('PAID','SICK','UNPAID')),
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      remarks TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','APPROVED','REJECTED')),
      admin_comment TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      message TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const count = db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number };
  if (count.c === 0) seed();
}

function seed() {
  const insert = db.prepare(`
    INSERT INTO users (employee_id, full_name, email, password_hash, role, verified, phone, address, department, designation, basic_salary, allowances, deductions)
    VALUES (@employee_id, @full_name, @email, @password_hash, @role, 1, @phone, @address, @department, @designation, @basic_salary, @allowances, @deductions)
  `);
  const hash = bcrypt.hashSync("Password123!", 10);

  const demoUsers = [
    { employee_id: "ADM001", full_name: "Ava Admin", email: "admin@dayflow.demo", role: "ADMIN", phone: "555-0100", address: "1 Admin Way", department: "Executive", designation: "System Administrator", basic_salary: 9000, allowances: 1500, deductions: 500 },
    { employee_id: "HR001", full_name: "Harper Reyes", email: "hr@dayflow.demo", role: "HR", phone: "555-0101", address: "2 HR Blvd", department: "Human Resources", designation: "HR Manager", basic_salary: 6500, allowances: 800, deductions: 300 },
    { employee_id: "EMP001", full_name: "Eli Employee", email: "employee@dayflow.demo", role: "EMPLOYEE", phone: "555-0102", address: "3 Employee St", department: "Engineering", designation: "Software Engineer", basic_salary: 5500, allowances: 500, deductions: 250 },
    { employee_id: "EMP002", full_name: "Maria Chen", email: "maria.chen@dayflow.demo", role: "EMPLOYEE", phone: "555-0103", address: "4 Oak Ave", department: "Engineering", designation: "Frontend Developer", basic_salary: 5200, allowances: 400, deductions: 200 },
    { employee_id: "EMP003", full_name: "James Okafor", email: "james.okafor@dayflow.demo", role: "EMPLOYEE", phone: "555-0104", address: "5 Pine Rd", department: "Sales", designation: "Sales Executive", basic_salary: 4800, allowances: 600, deductions: 220 },
  ];

  for (const u of demoUsers) {
    insert.run({ ...u, password_hash: hash });
  }

  // seed a little attendance history for EMP001 (user id 3)
  const today = new Date();
  const attInsert = db.prepare(`INSERT OR IGNORE INTO attendance (user_id, date, check_in, check_out, total_hours) VALUES (?,?,?,?,?)`);
  for (let i = 1; i <= 5; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    attInsert.run(3, dateStr, `${dateStr}T09:00:00`, `${dateStr}T17:30:00`, 8.5);
  }

  db.prepare(`INSERT INTO notifications (user_id, message) VALUES (?,?)`).run(3, "Welcome to DAYFLOW! Your account is verified.");
}
