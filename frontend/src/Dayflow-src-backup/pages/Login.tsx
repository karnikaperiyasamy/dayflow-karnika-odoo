import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const DEMO_CREDS = [
  { role: "Admin", email: "admin@dayflow.demo", password: "Password123!" },
  { role: "HR", email: "hr@dayflow.demo", password: "Password123!" },
  { role: "Employee", email: "employee@dayflow.demo", password: "Password123!" },
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-brand-900">DAYFLOW</h1>
          <p className="text-sm text-gray-400 mt-1">Every workday, perfectly aligned.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="you@dayflow.demo"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-2xl transition-colors disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div className="mt-6">
          <p className="text-xs text-gray-400 mb-2 text-center">Quick demo credentials</p>
          <div className="grid grid-cols-3 gap-2">
            {DEMO_CREDS.map((c) => (
              <button
                key={c.role}
                onClick={() => {
                  setEmail(c.email);
                  setPassword(c.password);
                }}
                className="text-xs font-medium border border-gray-200 rounded-xl py-2 hover:bg-gray-50"
              >
                {c.role}
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          No account?{" "}
          <Link to="/register" className="text-brand-600 font-medium">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
