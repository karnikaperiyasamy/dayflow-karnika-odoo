import { useEffect, useState } from "react";
import { Search, Plus, X } from "lucide-react";
import api from "../api/client";
import { User } from "../types";

const emptyForm = {
  employee_id: "", full_name: "", email: "", password: "", role: "EMPLOYEE",
  department: "", designation: "", phone: "", address: "", basic_salary: 0, allowances: 0, deductions: 0,
};

export default function Employees() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState(emptyForm);
  const [editing, setEditing] = useState<User | null>(null);
  const [error, setError] = useState("");

  async function load() {
    const { data } = await api.get("/employees", { params: { search, department, status } });
    setEmployees(data);
  }

  useEffect(() => {
    load();
  }, [search, department, status]);

  const departments = Array.from(new Set(employees.map((e) => e.department).filter(Boolean)));

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/employees", addForm);
      setShowAdd(false);
      setAddForm(emptyForm);
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to add employee");
    }
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    await api.put(`/employees/${editing.id}`, editing);
    setEditing(null);
    load();
  }

  async function toggleStatus(emp: User) {
    const next = emp.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    await api.patch(`/employees/${emp.id}/status`, { status: next });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Employee Directory</h1>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-4 py-2.5 rounded-2xl text-sm">
          <Plus size={16} /> Add Employee
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or ID…"
            className="w-full pl-9 pr-3 py-2 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <select value={department} onChange={(e) => setDepartment(e.target.value)} className="rounded-2xl border border-gray-200 px-3 py-2 text-sm">
          <option value="">All Departments</option>
          {departments.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-2xl border border-gray-200 px-3 py-2 text-sm">
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-5 py-3 font-medium">ID</th>
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Department</th>
              <th className="px-5 py-3 font-medium">Role</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id} className="border-t border-gray-100">
                <td className="px-5 py-3">{e.employee_id}</td>
                <td className="px-5 py-3 font-medium">{e.full_name}</td>
                <td className="px-5 py-3 text-gray-500">{e.email}</td>
                <td className="px-5 py-3">{e.department}</td>
                <td className="px-5 py-3">
                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700">{e.role}</span>
                </td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${e.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                    {e.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right space-x-3">
                  <button onClick={() => setEditing(e)} className="text-brand-600 font-medium">Edit</button>
                  <button onClick={() => toggleStatus(e)} className="text-rose-600 font-medium">
                    {e.status === "ACTIVE" ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <Modal title="Add Employee" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input required placeholder="Employee ID" value={addForm.employee_id} onChange={(e) => setAddForm({ ...addForm, employee_id: e.target.value })} className="input" />
              <input required placeholder="Full Name" value={addForm.full_name} onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })} className="input" />
              <input required type="email" placeholder="Email" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} className="input" />
              <input required type="password" placeholder="Temp Password" value={addForm.password} onChange={(e) => setAddForm({ ...addForm, password: e.target.value })} className="input" />
              <select value={addForm.role} onChange={(e) => setAddForm({ ...addForm, role: e.target.value })} className="input">
                <option value="EMPLOYEE">Employee</option>
                <option value="HR">HR</option>
                <option value="ADMIN">Admin</option>
              </select>
              <input placeholder="Department" value={addForm.department} onChange={(e) => setAddForm({ ...addForm, department: e.target.value })} className="input" />
              <input placeholder="Designation" value={addForm.designation} onChange={(e) => setAddForm({ ...addForm, designation: e.target.value })} className="input" />
              <input placeholder="Phone" value={addForm.phone} onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })} className="input" />
              <input type="number" placeholder="Basic Salary" value={addForm.basic_salary} onChange={(e) => setAddForm({ ...addForm, basic_salary: Number(e.target.value) })} className="input" />
              <input type="number" placeholder="Allowances" value={addForm.allowances} onChange={(e) => setAddForm({ ...addForm, allowances: Number(e.target.value) })} className="input" />
              <input type="number" placeholder="Deductions" value={addForm.deductions} onChange={(e) => setAddForm({ ...addForm, deductions: Number(e.target.value) })} className="input" />
            </div>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <button className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-2xl text-sm">Create Employee</button>
          </form>
        </Modal>
      )}

      {editing && (
        <Modal title={`Edit ${editing.full_name}`} onClose={() => setEditing(null)}>
          <form onSubmit={handleEditSave} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input value={editing.full_name} onChange={(e) => setEditing({ ...editing, full_name: e.target.value })} className="input" placeholder="Full Name" />
              <input value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} className="input" placeholder="Email" />
              <input value={editing.department || ""} onChange={(e) => setEditing({ ...editing, department: e.target.value })} className="input" placeholder="Department" />
              <input value={editing.designation || ""} onChange={(e) => setEditing({ ...editing, designation: e.target.value })} className="input" placeholder="Designation" />
              <input type="number" value={editing.basic_salary} onChange={(e) => setEditing({ ...editing, basic_salary: Number(e.target.value) })} className="input" placeholder="Basic Salary" />
              <input type="number" value={editing.allowances} onChange={(e) => setEditing({ ...editing, allowances: Number(e.target.value) })} className="input" placeholder="Allowances" />
              <input type="number" value={editing.deductions} onChange={(e) => setEditing({ ...editing, deductions: Number(e.target.value) })} className="input" placeholder="Deductions" />
            </div>
            <button className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-2xl text-sm">Save Changes</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">{title}</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
