import { Building2, Briefcase, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useEmployer } from "../context/EmployerContext";
import LanguageSwitcher from "../components/LanguageSwitcher";

const featureHighlights = [
  {
    icon: Briefcase,
    label: "Auto-match workers to your campaign needs",
  },
  {
    icon: ShieldCheck,
    label: "Verified compliance and trust signals",
  },
  {
    icon: Building2,
    label: "Live visibility on contractor performance",
  },
];

export default function EmployerLogin() {
  const navigate = useNavigate();
  const { login, loading, error } = useEmployer();
  const [form, setForm] = useState({ phoneNumber: "", password: "" });

  const handleChange = (event) =>
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await login(form);
      navigate("/employer", { replace: true });
    } catch (err) {
      console.error("Employer login failed", err);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-10">
      <div className="mx-auto grid w-full max-w-6xl gap-6 rounded-[36px] bg-white/5 p-2 text-white shadow-2xl backdrop-blur-lg lg:grid-cols-2">
        <section className="rounded-[28px] bg-white/10 p-8 flex flex-col justify-between">
          <div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
              <Building2 className="h-6 w-6" />
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.4em] text-white/70">
              EMPLOYER COMMAND DESK
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">
              Contractor intelligence for high-impact campaigns
            </h1>
            <p className="mt-3 text-sm text-white/80">
              Track compliance, deploy workers faster, and keep every health
              camp staffed from a single desk.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-white/90">
              {featureHighlights.map((feature) => {
                const HighlightIcon = feature.icon;
                return (
                  <li
                    key={feature.label}
                    className="flex items-center gap-3 rounded-2xl bg-white/5 px-3 py-2"
                  >
                    <HighlightIcon className="h-4 w-4 text-emerald-300" />
                    <span>{feature.label}</span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="mt-6 border-t border-white/20 pt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/70">
              Translate the portal
            </p>
            <LanguageSwitcher className="mt-3 bg-slate-900 text-white border-white/20" />
          </div>
        </section>

        <section className="flex flex-col justify-between rounded-[28px] bg-white px-8 py-10 text-slate-900 shadow-xl">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Employer Login
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">
              Command your contractor network
            </h2>
            <p className="text-sm text-slate-500">
              Sign in with your registered phone number to unlock schedules,
              compliance logs, and trusted workforce insights.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">
                  Phone Number
                </label>
                <input
                  name="phoneNumber"
                  value={form.phoneNumber}
                  onChange={handleChange}
                  type="tel"
                  inputMode="tel"
                  placeholder="Enter registered phone"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 placeholder-slate-400 outline-none transition focus:border-sky-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">
                  Password
                </label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 placeholder-slate-400 outline-none transition focus:border-sky-500"
                />
              </div>
              {error && <div className="text-sm text-red-600">{error}</div>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          </div>
          <div className="mt-8 text-center text-sm text-slate-500">
            <p>
              New to JeevanRakshak?
              <Link
                to="/employer/signup"
                className="ml-1 font-semibold text-slate-900 hover:text-slate-700"
              >
                Create employer account
              </Link>
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Want the migrant view?
              <Link
                to="/login"
                className="ml-1 font-semibold text-slate-900 hover:text-slate-700"
              >
                Go back to Migrant login
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
