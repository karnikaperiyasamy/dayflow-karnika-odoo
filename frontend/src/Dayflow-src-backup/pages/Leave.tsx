import { useEffect, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { LeaveRequest } from "../types";

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700",
    APPROVED: "bg-emerald-50 text-emerald-700",
    REJECTED: "bg-rose-50 text-rose-700",
  };
  return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[status]}`}>{status}</span>;
}

export default function Leave() {
  const { user } = useAuth();
  const isPrivileged = user?.role === "ADMIN" || user?.role === "HR";
  const [mine, setMine] = useState<LeaveRequest[]>([]);
  const [balance, setBalance] = useState<any>(null);
  const [form, setForm] = useState({ leave_type: "PAID", start_date: "", end_date: "", remarks: "" });
  const [error, setError] = useState("");

  const [allRequests, setAllRequests] = useState<LeaveRequest[]>([]);
  const [drawer, setDrawer] = useState<LeaveRequest | null>(null);
  const [comment, setComment] = useState("");

  async function loadMine() {
    const [m, b] = await Promise.all([api.get("/leave/mine"), api.get("/leave/balance")]);
    setMine(m.data);
    setBalance(b.data);
  }

  async function loadAll() {
    const { data } = await api.get("/leave");
    setAllRequests(data);
  }

  useEffect(() => {
    loadMine();
    if (isPrivileged) loadAll();
  }, [isPrivileged]);

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/leave", form);
      setForm({ leave_type: "PAID", start_date: "", end_date: "", remarks: "" });
      loadMine();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to submit request");
    }
  }

  async function decide(status: "APPROVED" | "REJECTED") {
    if (!drawer) return;
    await api.patch(`/leave/${drawer.id}/decision`, { status, admin_comment: comment });
    setDrawer(null);
    setComment("");
    loadAll();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-4">Leave / Time Off</h1>
        {balance && (
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-4"><p className="text-xs text-gray-400">Allocated</p><p className="text-2xl font-bold">{balance.allocated}</p></div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4"><p className="text-xs text-gray-400">Used</p><p className="text-2xl font-bold">{balance.used}</p></div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4"><p className="text-xs text-gray-400">Remaining</p><p className="text-2xl font-bold text-brand-600">{balance.remaining}</p></div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          <form onSubmit={handleApply} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-3">
            <h2 className="font-semibold">Apply for Leave</h2>
            <select value={form.leave_type} onChange={(e) => setForm({ ...form, leave_type: e.target.value })} className="input">
              <option value="PAID">Paid</option>
              <option value="SICK">Sick</option>
              <option value="UNPAID">Unpaid</option>
            </select>
            <div className="grid grid-cols-2 gap-3">
              <input required type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="input" />
              <input required type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="input" />
            </div>
            <textarea placeholder="Remarks (optional)" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} className="input" rows={2} />
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <button className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-2xl text-sm">Submit Request</button>
          </form>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold mb-3">My Requests</h2>
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {mine.map((r) => (
                <div key={r.id} className="flex items-center justify-between border-b border-gray-50 pb-2">
                  <div>
                    <p className="text-sm font-medium">{r.leave_type} · {r.start_date} → {r.end_date}</p>
                    {r.admin_comment && <p className="text-xs text-gray-400">HR: {r.admin_comment}</p>}
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              ))}
              {mine.length === 0 && <p className="text-sm text-gray-400">No requests yet</p>}
            </div>
          </div>
        </div>
      </div>

      {isPrivileged && (
        <div>
          <h2 className="text-xl font-bold mb-4">Approvals</h2>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-left">
                <tr>
                  <th className="px-5 py-3 font-medium">Employee</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Dates</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {allRequests.map((r) => (
                  <tr key={r.id} className="border-t border-gray-100">
                    <td className="px-5 py-3 font-medium">{r.full_name} <span className="text-gray-400 text-xs">({r.employee_id})</span></td>
                    <td className="px-5 py-3">{r.leave_type}</td>
                    <td className="px-5 py-3">{r.start_date} → {r.end_date}</td>
                    <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-5 py-3 text-right">
                      {r.status === "PENDING" ? (
                        <button onClick={() => setDrawer(r)} className="text-brand-600 font-medium">Review</button>
                      ) : (
                        <span className="text-gray-300">Done</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {drawer && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6">
            <h2 className="font-bold text-lg mb-1">{drawer.full_name}'s Request</h2>
            <p className="text-sm text-gray-500 mb-4">{drawer.leave_type} · {drawer.start_date} → {drawer.end_date}</p>
            {drawer.remarks && <p className="text-sm text-gray-600 mb-4">"{drawer.remarks}"</p>}
            <textarea placeholder="Feedback comment (optional)" value={comment} onChange={(e) => setComment(e.target.value)} className="input mb-4" rows={3} />
            <div className="flex gap-3">
              <button onClick={() => decide("APPROVED")} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-2xl text-sm">Approve</button>
              <button onClick={() => decide("REJECTED")} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2.5 rounded-2xl text-sm">Reject</button>
              <button onClick={() => setDrawer(null)} className="px-4 text-sm text-gray-500">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
