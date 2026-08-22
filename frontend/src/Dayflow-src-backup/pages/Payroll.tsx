import { useEffect, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Payroll() {
  const { user } = useAuth();
  const isPrivileged = user?.role === "ADMIN" || user?.role === "HR";
  const [mine, setMine] = useState<any>(null);
  const [all, setAll] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);

  useEffect(() => {
    api.get("/payroll/me").then((r) => setMine(r.data));
    if (isPrivileged) api.get("/payroll").then((r) => setAll(r.data));
  }, [isPrivileged]);

  async function saveEdit() {
    if (!editing) return;
    const { data } = await api.put(`/payroll/${editing.id}`, {
      basic_salary: editing.basic_salary,
      allowances: editing.allowances,
      deductions: editing.deductions,
    });
    setAll((prev) => prev.map((r) => (r.id === editing.id ? { ...r, ...editing, net_salary: data.net_salary } : r)));
    setEditing(null);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-4">Payroll & Compensation</h1>
        {mine && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 max-w-md">
            <h2 className="font-semibold mb-4">My Paystub</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Basic Salary</span><span className="font-medium">${mine.basic_salary.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Allowances</span><span className="font-medium text-emerald-600">+${mine.allowances.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Deductions</span><span className="font-medium text-rose-600">-${mine.deductions.toLocaleString()}</span></div>
              <div className="border-t pt-2 flex justify-between text-base font-bold"><span>Net Salary</span><span className="text-brand-700">${mine.net_salary.toLocaleString()}</span></div>
            </div>
          </div>
        )}
      </div>

      {isPrivileged && (
        <div>
          <h2 className="text-xl font-bold mb-4">Payroll Directory</h2>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-left">
                <tr>
                  <th className="px-5 py-3 font-medium">Employee</th>
                  <th className="px-5 py-3 font-medium">Department</th>
                  <th className="px-5 py-3 font-medium">Basic</th>
                  <th className="px-5 py-3 font-medium">Allowances</th>
                  <th className="px-5 py-3 font-medium">Deductions</th>
                  <th className="px-5 py-3 font-medium">Net</th>
                  <th className="px-5 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {all.map((r) => (
                  <tr key={r.id} className="border-t border-gray-100">
                    <td className="px-5 py-3 font-medium">{r.full_name}</td>
                    <td className="px-5 py-3">{r.department}</td>
                    <td className="px-5 py-3">${r.basic_salary.toLocaleString()}</td>
                    <td className="px-5 py-3">${r.allowances.toLocaleString()}</td>
                    <td className="px-5 py-3">${r.deductions.toLocaleString()}</td>
                    <td className="px-5 py-3 font-semibold text-brand-700">${r.net_salary.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => setEditing({ ...r })} className="text-brand-600 font-medium">Update</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-3">
            <h2 className="font-bold text-lg">{editing.full_name}</h2>
            <label className="text-xs text-gray-500">Basic Salary</label>
            <input type="number" value={editing.basic_salary} onChange={(e) => setEditing({ ...editing, basic_salary: Number(e.target.value) })} className="input" />
            <label className="text-xs text-gray-500">Allowances</label>
            <input type="number" value={editing.allowances} onChange={(e) => setEditing({ ...editing, allowances: Number(e.target.value) })} className="input" />
            <label className="text-xs text-gray-500">Deductions</label>
            <input type="number" value={editing.deductions} onChange={(e) => setEditing({ ...editing, deductions: Number(e.target.value) })} className="input" />
            <p className="text-sm font-semibold pt-2">Net: ${(editing.basic_salary + editing.allowances - editing.deductions).toLocaleString()}</p>
            <div className="flex gap-3 pt-2">
              <button onClick={saveEdit} className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-2xl text-sm">Save</button>
              <button onClick={() => setEditing(null)} className="px-4 text-sm text-gray-500">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
