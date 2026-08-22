export type Role = "ADMIN" | "HR" | "EMPLOYEE";

export interface User {
  id: number;
  employee_id: string;
  full_name: string;
  email: string;
  role: Role;
  verified: number;
  phone?: string;
  address?: string;
  profile_picture?: string;
  department?: string;
  designation?: string;
  status: "ACTIVE" | "INACTIVE";
  basic_salary: number;
  allowances: number;
  deductions: number;
}

export interface AttendanceRecord {
  id: number;
  user_id: number;
  date: string;
  check_in: string | null;
  check_out: string | null;
  total_hours: number | null;
}

export interface LeaveRequest {
  id: number;
  user_id: number;
  leave_type: "PAID" | "SICK" | "UNPAID";
  start_date: string;
  end_date: string;
  remarks?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  admin_comment?: string;
  full_name?: string;
  employee_id?: string;
}

export interface Notification {
  id: number;
  message: string;
  read: number;
  created_at: string;
}
