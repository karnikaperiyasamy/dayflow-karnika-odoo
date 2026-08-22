import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, Wallet, CalendarDays, Users, UserCheck, UserX, ClipboardList } from "lucide-react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { AttendanceRecord } from "../types";

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-3xl shadow-sm border border-gray-100 p-6 ${className}`}>{children}</div>;
}

function EmployeeDashboard() {
  const { user } = useAuth();
  const [today, setToday] = useState<AttendanceRecord | null>(null);
  const [balance, setBalance] = useState<{ allocated: number; used: number; remaining: number } | null>(null);
  const [net, setNet] = useState<number | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);

  async function loadAll() {
    const [t, b, p] = await Promise.all([
      api.get("/attendance/today"),
      api.get("/leave/balance"),
      api.get("/payroll/me"),
    ]);
    setToday(t.data);
    setBalance(b.data);
    setNet(p.data.net_salary);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function checkIn() {
    setLoadingAction(true);
    try {
      await api.post("/attendance/check-in");
      await loadAll();
    } finally {
      setLoadingAction(false);
    }
  }

  async function checkOut() {
    setLoadingAction(true);
    try {
      await api.post("/attendance/check-out");
      await loadAll();
    } finally {
      setLoadingAction(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-brand-700 to-brand-500 text-white">
        <h2 className="text-2xl font-bold">Welcome back, {user?.full_name?.split(" ")[0]} 👋</h2>
        <p className="text-indigo-100 mt-1">{user?.designation} · {user?.department}</p>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-3"><Clock size={16} /> Today's Attendance</div>
          {today ? (
            <div className="space-y-1 text-sm">
              <p>Check-in: <span className="font-semibold">{today.check_in ? new Date(today.check_in).toLocaleTimeString() : "—"}</span></p>
              <p>Check-out: <span className="font-semibold">{today.check_out ? new Date(today.check_out).toLocaleTimeString() : "—"}</span></p>
            </div>
          ) : (
            <p className="text-sm text-gray-400 mb-3">Not checked in yet</p>
          )}
          <div className="flex gap-2 mt-4">
            <button
              disabled={!!today || loadingAction}
              onClick={checkIn}
              className="flex-1 bg-brand-600 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-semibold py-2 rounded-xl"
            >
              Check In
            </button>
            <button
              disabled={!today || !!today?.check_out || loadingAction}
              onClick={checkOut}
              className="flex-1 bg-gray-900 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-semibold py-2 rounded-xl"
            >
              Check Out
            </button>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-3"><CalendarDays size={16} /> Paid Leave Balance</div>
          {balance && (
            <>
              <p className="text-3xl font-bold text-brand-700">{balance.remaining}</p>
              <p className="text-xs text-gray-400 mt-1">{balance.used} used of {balance.allocated} days</p>
            </>
          )}
          <Link to="/leave" className="block text-center mt-4 text-sm font-semibold text-brand-600">Apply for Leave →</Link>
        </Card>

        <Card>
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-3"><Wallet size={16} /> Net Salary</div>
          <p className="text-3xl font-bold text-emerald-600">${net?.toLocaleString()}</p>
          <Link to="/payroll" className="block text-center mt-4 text-sm font-semibold text-brand-600">View Paystub →</Link>
        </Card>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    api.get("/reports/dashboard-metrics").then((r) => setMetrics(r.data));
  }, []);

  const stats = metrics
    ? [
        { label: "Total Staff", value: metrics.totalStaff, icon: Users, color: "text-brand-600" },
        { label: "Present Today", value: metrics.presentToday, icon: UserCheck, color: "text-emerald-600" },
        { label: "Absent Today", value: metrics.absentToday, icon: UserX, color: "text-rose-600" },
        { label: "Pending Leave", value: metrics.pendingLeaveApprovals, icon: ClipboardList, color: "text-amber-600" },
      ]
    : [];

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-brand-900 to-brand-700 text-white">
        <h2 className="text-2xl font-bold">Executive Overview</h2>
        <p className="text-indigo-200 mt-1">Live workforce metrics at a glance</p>
      </Card>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s) => (
          <Card key={s.label}>
            <s.icon className={s.color} size={22} />
            <p className="text-3xl font-bold mt-3">{s.value}</p>
            <p className="text-sm text-gray-400">{s.label}</p>
          </Card>
        ))}
      </div>

      {metrics && (
        <Card>
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-2"><Wallet size={16} /> Total Monthly Payroll</div>
          <p className="text-3xl font-bold text-emerald-600">${Number(metrics.totalMonthlyPayroll).toLocaleString()}</p>
        </Card>
      )}

      <div className="flex gap-4 flex-wrap">
        <Link to="/employees" className="bg-white border border-gray-200 rounded-2xl px-5 py-3 text-sm font-semibold hover:bg-gray-50">Manage Employees</Link>
        <Link to="/leave" className="bg-white border border-gray-200 rounded-2xl px-5 py-3 text-sm font-semibold hover:bg-gray-50">Review Leave Requests</Link>
        <Link to="/reports" className="bg-white border border-gray-200 rounded-2xl px-5 py-3 text-sm font-semibold hover:bg-gray-50">View Reports</Link>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  if (!user) return null;
  return user.role === "EMPLOYEE" ? <EmployeeDashboard /> : <AdminDashboard />;
}
