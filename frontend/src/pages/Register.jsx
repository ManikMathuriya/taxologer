import { useState } from "react";
import { registerUser } from "../services/authService";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
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

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await registerUser(form);
      navigate("/login");
    } catch (error) {
      setError(
        typeof error.response?.data === "object"
          ? JSON.stringify(error.response.data)
          : "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl p-8 md:p-10 border border-slate-200">
        <h2 className="text-3xl font-bold">Create your account</h2>
        <p className="text-slate-600 mt-2">
          Get started with secure tax filing and service tracking.
        </p>

        <form onSubmit={handleRegister} className="mt-8 grid md:grid-cols-2 gap-4">
          <input
            name="first_name"
            placeholder="First name"
            className="rounded-xl border px-4 py-3"
            value={form.first_name}
            onChange={handleChange}
          />

          <input
            name="last_name"
            placeholder="Last name"
            className="rounded-xl border px-4 py-3"
            value={form.last_name}
            onChange={handleChange}
          />

          <input
            name="username"
            placeholder="Username"
            className="rounded-xl border px-4 py-3"
            value={form.username}
            onChange={handleChange}
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            className="rounded-xl border px-4 py-3"
            value={form.email}
            onChange={handleChange}
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            className="rounded-xl border px-4 py-3 md:col-span-2"
            value={form.password}
            onChange={handleChange}
          />

          {error ? (
            <div className="md:col-span-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-700">
              {error}
            </div>
          ) : null}

          <button
            disabled={loading}
            className="md:col-span-2 rounded-xl bg-blue-600 py-3 text-white font-semibold hover:bg-blue-700 disabled:bg-slate-400"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-600">
          Already have an account?{" "}
          <Link className="text-blue-600 font-semibold" to="/login">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}