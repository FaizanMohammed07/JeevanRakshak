import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, LockKeyhole, Phone } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loading, error, isAuthenticated } = useAuth();
  const [formState, setFormState] = useState({ phoneNumber: "", password: "" });
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError(null);
    if (!formState.phoneNumber || !formState.password) {
      setLocalError("Please enter both phone number and password.");
      return;
    }

    try {
      await login(formState);
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Login failed", err);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 px-4 py-10">
      <div className="grid w-full max-w-5xl gap-6 rounded-[32px] bg-white/5 p-2 text-white shadow-2xl backdrop-blur md:grid-cols-2">
        <div className="rounded-3xl bg-white/10 p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.4em] text-white/70">
            JeevanRakshak
          </p>
          <h1 className="text-3xl font-semibold">Migrant Health Panel</h1>
          <p className="mt-2 text-sm text-white/80">
            Securely access your prescriptions, lab records, and personal
            information anywhere in Kerala.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-white/80">
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4" /> Sign in with your registered phone
              number
            </li>
            <li className="flex items-center gap-2">
              <LockKeyhole className="h-4 w-4" /> Two-factor security enabled at
              hospitals
            </li>
          </ul>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl bg-white p-8 text-slate-900 shadow-xl"
        >
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.4em] text-slate-400">
              Patient login
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">
              Welcome back
            </h2>
            <p className="text-sm text-slate-500">
              Enter your registered details to continue.
            </p>
          </div>

          <div className="mt-6 space-y-2">
            <label
              htmlFor="phoneNumber"
              className="text-sm font-medium text-slate-600"
            >
              Phone Number
            </label>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-300 px-3 py-2 focus-within:border-blue-500">
              <Phone className="h-4 w-4 text-slate-400" />
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                value={formState.phoneNumber}
                onChange={handleChange}
                autoComplete="tel"
                className="w-full border-none bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-slate-600"
            >
              Password
            </label>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-300 px-3 py-2 focus-within:border-blue-500">
              <LockKeyhole className="h-4 w-4 text-slate-400" />
              <input
                id="password"
                name="password"
                type="password"
                value={formState.password}
                onChange={handleChange}
                autoComplete="current-password"
                className="w-full border-none bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          {(error || localError) && (
            <p className="mt-4 text-sm text-red-600">{localError || error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
