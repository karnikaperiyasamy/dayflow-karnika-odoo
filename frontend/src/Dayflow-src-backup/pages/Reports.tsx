import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Download } from "lucide-react";
import api from "../api/client";

const COLORS = ["#4f46e5", "#e5e7eb"];

export default function Reports() {
  const [pie, setPie] = useState<any[]>([]);
  const [bar, setBar] = useState<any[]>([]);

  useEffect(() => {
    api.get("/reports/attendance-pie").then((r) => setPie(r.data));
    api.get("/reports/payroll-by-department").then((r) => setBar(r.data));
  }, []);

  function exportCsv(type: string) {
    const token = localStorage.getItem("dayflow_token");
    fetch(`/api/reports/export/${type}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${type}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      });
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Reports & Analytics</h1>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold mb-4">Today's Attendance</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {pie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold mb-4">Payroll by Department</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={bar}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="total" fill="#4f46e5" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold mb-4">Export Data</h2>
        <div className="flex flex-wrap gap-3">
          {["attendance", "leave", "payroll"].map((t) => (
            <button key={t} onClick={() => exportCsv(t)} className="flex items-center gap-2 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm font-medium hover:bg-gray-50">
              <Download size={16} /> {t[0].toUpperCase() + t.slice(1)} CSV
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
