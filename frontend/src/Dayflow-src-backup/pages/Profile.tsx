import { useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const isPrivileged = user?.role === "ADMIN" || user?.role === "HR";
  const [form, setForm] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    department: user?.department || "",
    designation: user?.designation || "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!user) return null;
  const userId = user.id;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const payload = isPrivileged
        ? form
        : { phone: form.phone, address: form.address };
      await api.put(`/employees/${userId}`, payload);
      await refreshUser();
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  const field = (label: string, key: keyof typeof form, editable: boolean) => (
    <div>
      <label className="text-sm font-medium text-gray-600">{label}</label>
      <input
        disabled={!editable}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
    </div>
  );

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-2xl">
          {user.full_name[0]}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{user.full_name}</h1>
          <p className="text-gray-400 text-sm">{user.employee_id} · {user.role}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
        <div>
          <h2 className="font-semibold text-gray-800 mb-3">Personal Details</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {field("Full Name", "full_name", isPrivileged)}
            {field("Email", "email", isPrivileged)}
            {field("Phone", "phone", true)}
            {field("Address", "address", true)}
          </div>
        </div>
        <div>
          <h2 className="font-semibold text-gray-800 mb-3">Job Details</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {field("Department", "department", isPrivileged)}
            {field("Designation", "designation", isPrivileged)}
          </div>
        </div>
        <div>
          <h2 className="font-semibold text-gray-800 mb-3">Salary Overview</h2>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div className="bg-gray-50 rounded-xl p-3"><p className="text-gray-400 text-xs">Basic Salary</p><p className="font-semibold">${user.basic_salary}</p></div>
            <div className="bg-gray-50 rounded-xl p-3"><p className="text-gray-400 text-xs">Allowances</p><p className="font-semibold">${user.allowances}</p></div>
            <div className="bg-gray-50 rounded-xl p-3"><p className="text-gray-400 text-xs">Deductions</p><p className="font-semibold">${user.deductions}</p></div>
          </div>
        </div>
        {!isPrivileged && (
          <p className="text-xs text-gray-400">You can edit Phone and Address. Contact HR/Admin to update other fields.</p>
        )}
        <div className="flex items-center gap-3">
          <button disabled={saving} className="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-2.5 rounded-2xl text-sm disabled:opacity-60">
            {saving ? "Saving…" : "Save Changes"}
          </button>
          {saved && <span className="text-sm text-emerald-600 font-medium">Saved!</span>}
        </div>
      </form>
    </div>
  );
}
