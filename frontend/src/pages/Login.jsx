import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../services/authService";

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await loginUser(form);

      localStorage.setItem("token", data.access);
      localStorage.setItem("refresh", data.refresh);
      localStorage.setItem("role", data.user.role);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.user.role === "ADMIN") {
        navigate("/admin/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      setError(
        error.response?.data?.error ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-white/5 backdrop-blur">
        <div className="p-8 md:p-12 hidden lg:flex flex-col justify-between bg-gradient-to-br from-blue-600/20 to-cyan-400/10">
          <div>
            <p className="text-blue-200 font-semibold mb-4">Taxologer</p>
            <h1 className="text-4xl font-bold leading-tight">
              Simple, smart, and reliable ITR filing.
            </h1>
            <p className="mt-5 text-slate-200">
              Track your filing status, upload documents securely, and get expert
              support in one place.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-white/10 p-4">Fast onboarding</div>
            <div className="rounded-2xl bg-white/10 p-4">Secure upload</div>
            <div className="rounded-2xl bg-white/10 p-4">Real-time tracking</div>
            <div className="rounded-2xl bg-white/10 p-4">Expert help</div>
          </div>
        </div>

        <div className="p-8 md:p-12 bg-white text-slate-900">
          <h2 className="text-3xl font-bold">Login</h2>
          <p className="mt-2 text-slate-600">
            Welcome back. Access your dashboard and track your service status.
          </p>

          <form onSubmit={handleLogin} className="mt-8 space-y-4">
            <input
              type="text"
              name="username"
              placeholder="Username"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
              value={form.username}
              onChange={handleChange}
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
              value={form.password}
              onChange={handleChange}
            />

            {error ? (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-700">
                {error}
              </div>
            ) : null}

            <button
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-3 text-white font-semibold hover:bg-blue-700 disabled:bg-slate-400"
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-600">
            Don’t have an account?{" "}
            <Link className="text-blue-600 font-semibold" to="/register">
              Register now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;