import { useEffect, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Attendance() {
  const { user } = useAuth();
  const isPrivileged = user?.role === "ADMIN" || user?.role === "HR";
  const [rows, setRows] = useState<any[]>([]);
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    if (isPrivileged) {
      api.get("/attendance/all", { params: dateFilter ? { date: dateFilter } : {} }).then((r) => setRows(r.data));
    } else {
      api.get("/attendance/history").then((r) => setRows(r.data));
    }
  }, [isPrivileged, dateFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">{isPrivileged ? "Attendance — All Employees" : "My Attendance (Last 30 Days)"}</h1>
        {isPrivileged && (
          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="input max-w-[180px]" />
        )}
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              {isPrivileged && <th className="px-5 py-3 font-medium">Employee</th>}
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Check In</th>
              <th className="px-5 py-3 font-medium">Check Out</th>
              <th className="px-5 py-3 font-medium">Total Hours</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-gray-100">
                {isPrivileged && <td className="px-5 py-3 font-medium">{r.full_name} <span className="text-gray-400 text-xs">({r.employee_id})</span></td>}
                <td className="px-5 py-3">{r.date}</td>
                <td className="px-5 py-3">{r.check_in ? new Date(r.check_in).toLocaleTimeString() : "—"}</td>
                <td className="px-5 py-3">{r.check_out ? new Date(r.check_out).toLocaleTimeString() : "—"}</td>
                <td className="px-5 py-3">{r.total_hours ?? "—"}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400">No records found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
