import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";

export default function Register() {
  const [form, setForm] = useState({ employee_id: "", full_name: "", email: "", password: "", role: "EMPLOYEE" });
  const [error, setError] = useState("");
  const [verifyToken, setVerifyToken] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const navigate = useNavigate();

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/auth/register", form);
      setVerifyToken(data.devVerifyToken);
    } catch (err: any) {
      setError(err.response?.data?.error || "Registration failed");
    }
  }

  async function handleVerify() {
    if (!verifyToken) return;
    await api.post("/auth/verify", { token: verifyToken });
    setVerified(true);
    setTimeout(() => navigate("/login"), 1200);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
        <h1 className="text-2xl font-bold text-brand-900 text-center mb-6">Create your DAYFLOW account</h1>

        {!verifyToken ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              required
              placeholder="Employee ID (e.g. EMP010)"
              value={form.employee_id}
              onChange={(e) => update("employee_id", e.target.value)}
              className="w-full rounded-2xl border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <input
              required
              placeholder="Full Name"
              value={form.full_name}
              onChange={(e) => update("full_name", e.target.value)}
              className="w-full rounded-2xl border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <input
              required
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="w-full rounded-2xl border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <input
              required
              type="password"
              placeholder="Password (min 8 chars)"
              minLength={8}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              className="w-full rounded-2xl border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <select
              value={form.role}
              onChange={(e) => update("role", e.target.value)}
              className="w-full rounded-2xl border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="EMPLOYEE">Employee</option>
              <option value="HR">HR</option>
              <option value="ADMIN">Admin</option>
            </select>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <button className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-2xl">
              Register
            </button>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              Registered! In production a verification email would be sent — for this demo, click below to simulate clicking that link.
            </p>
            {verified ? (
              <p className="text-emerald-600 font-medium">Verified! Redirecting to login…</p>
            ) : (
              <button onClick={handleVerify} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-6 rounded-2xl">
                Verify My Email
              </button>
            )}
          </div>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-brand-600 font-medium">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
