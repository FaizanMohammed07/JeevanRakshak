import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useEmployer } from "../context/EmployerContext";

export default function EmployerSignup() {
  const navigate = useNavigate();
  const { register, loading, error } = useEmployer();
  const [form, setForm] = useState({
    name: "",
    phoneNumber: "",
    password: "",
    passwordConfirm: "",
  });

  const handleChange = (e) =>
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(form);
      navigate("/employer", { replace: true });
    } catch (err) {
      // handled in context
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded">
      <h2 className="text-2xl font-semibold mb-4">Employer Sign Up</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Full name"
          className="w-full rounded border px-3 py-2"
        />
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
        <input
          name="passwordConfirm"
          type="password"
          value={form.passwordConfirm}
          onChange={handleChange}
          placeholder="Confirm password"
          className="w-full rounded border px-3 py-2"
        />
        {error && <div className="text-red-600">{error}</div>}
        <button
          disabled={loading}
          className="w-full bg-sky-600 text-white py-2 rounded"
        >
          {loading ? "Creating..." : "Create account"}
        </button>
      </form>
      <p className="mt-4 text-sm">
        Have an account?{" "}
        <Link to="/employer/login" className="text-sky-600 font-semibold">
          Sign in
        </Link>
      </p>
    </div>
  );
}
