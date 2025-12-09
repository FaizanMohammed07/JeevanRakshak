import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useEmployer } from "../context/EmployerContext";

export default function EmployerLogin() {
  const navigate = useNavigate();
  const { login, loading, error } = useEmployer();
  const [form, setForm] = useState({ phoneNumber: "", password: "" });

  const handleChange = (e) =>
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(form);
      navigate("/employer", { replace: true });
    } catch (err) {
      // error is handled in context
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded">
      <h2 className="text-2xl font-semibold mb-4">Employer Sign In</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          name="phoneNumber"
          value={form.phoneNumber}
          onChange={handleChange}
          placeholder="Phone number"
          className="w-full rounded border px-3 py-2"
        />
        <input
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Password"
          className="w-full rounded border px-3 py-2"
        />
        {error && <div className="text-red-600">{error}</div>}
        <button
          disabled={loading}
          className="w-full bg-sky-600 text-white py-2 rounded"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
      <p className="mt-4 text-sm">
        New employer?{" "}
        <Link to="/employer/signup" className="text-sky-600 font-semibold">
          Create account
        </Link>
      </p>
    </div>
  );
}
