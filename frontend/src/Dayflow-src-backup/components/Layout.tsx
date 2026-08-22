import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, User, Users, Clock, CalendarDays, Wallet, BarChart3, Bell, LogOut, Menu, X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";
import { Notification } from "../types";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fetchUnread = () => api.get("/notifications/unread-count").then((r) => setUnread(r.data.count)).catch(() => {});
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, []);

  async function openNotifications() {
    setNotifOpen((v) => !v);
    if (!notifOpen) {
      const { data } = await api.get("/notifications");
      setNotifications(data);
    }
  }

  async function markAllRead() {
    await api.patch("/notifications/mark-all-read");
    setUnread(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: 1 })));
  }

  const isPrivileged = user?.role === "ADMIN" || user?.role === "HR";

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/profile", label: "Profile", icon: User },
    ...(isPrivileged ? [{ to: "/employees", label: "Employees", icon: Users }] : []),
    { to: "/attendance", label: "Attendance", icon: Clock },
    { to: "/leave", label: "Leave", icon: CalendarDays },
    { to: "/payroll", label: "Payroll", icon: Wallet },
    ...(isPrivileged ? [{ to: "/reports", label: "Reports", icon: BarChart3 }] : []),
  ];

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static z-30 inset-y-0 left-0 w-64 bg-brand-900 text-white transform transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-xl font-bold tracking-tight">DAYFLOW</h1>
            <p className="text-xs text-indigo-300">Every workday, perfectly aligned.</p>
          </div>
          <button className="lg:hidden" onClick={() => setMobileOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <nav className="mt-4 px-3 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-medium transition-colors ${
                  isActive ? "bg-brand-600 text-white" : "text-indigo-100 hover:bg-brand-700/60"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-0 w-full px-3 pb-6">
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-medium text-indigo-100 hover:bg-brand-700/60"
          >
            <LogOut size={18} /> Log Out
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 lg:px-8 py-3 flex items-center justify-between sticky top-0 z-10">
          <button className="lg:hidden" onClick={() => setMobileOpen(true)}>
            <Menu size={22} />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-4">
            <div className="relative">
              <button onClick={openNotifications} className="relative p-2 rounded-full hover:bg-gray-100">
                <Bell size={20} />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                    {unread}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white shadow-xl rounded-2xl border border-gray-100 max-h-96 overflow-y-auto">
                  <div className="flex items-center justify-between px-4 py-3 border-b">
                    <span className="font-semibold text-sm">Notifications</span>
                    <button onClick={markAllRead} className="text-xs text-brand-600 font-medium">
                      Mark all as read
                    </button>
                  </div>
                  {notifications.length === 0 ? (
                    <p className="text-sm text-gray-400 px-4 py-6 text-center">No notifications yet</p>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className={`px-4 py-3 border-b text-sm ${n.read ? "text-gray-500" : "text-gray-900 font-medium bg-brand-50/40"}`}>
                        {n.message}
                        <div className="text-[11px] text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-semibold text-sm">
                {user?.full_name?.[0] ?? "?"}
              </div>
              <div className="hidden sm:block leading-tight">
                <p className="text-sm font-semibold">{user?.full_name}</p>
                <p className="text-xs text-gray-400">{user?.role}</p>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
