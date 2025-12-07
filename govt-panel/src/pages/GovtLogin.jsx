import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, LogIn, Globe, Users } from "lucide-react";

const features = [
  { icon: Globe, label: "Secure statewide access" },
  { icon: Users, label: "Centralized health intelligence" },
];

function GovtLogin() {
  const [govtId, setGovtId] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    setErrorMsg("");

    try {
      await axios.post(
        "http://localhost:3030/api/govt/login",
        { govtId, password },
        { withCredentials: true }
      );

      navigate("/govt/dashboard");
    } catch (err) {
      setErrorMsg("Invalid Govt ID or Password");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-10">
      <div className="mx-auto grid w-full max-w-6xl gap-6 rounded-[36px] bg-white/5 p-2 text-white shadow-2xl backdrop-blur-lg lg:grid-cols-2">
        <section className="rounded-[28px] bg-white/10 p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.4em] text-white/70">
            Kerala Govt Panel
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Government Health Console
          </h1>
          <p className="mt-3 text-sm text-white/80">
            Monitor migrant health incidents, approve alerts, and govern relief
            efforts securely.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-white/85">
            {features.map((item) => (
              <li
                key={item.label}
                className="flex items-center gap-3 rounded-2xl bg-white/5 px-3 py-2"
              >
                <item.icon
                  className="h-4 w-4 text-emerald-300"
                  aria-hidden="true"
                />
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 rounded-2xl border border-white/20 bg-black/20 p-4 text-sm text-white/80">
            <p className="font-semibold tracking-wide text-white">
              Real-time governance
            </p>
            <p className="mt-1 text-white/70">
              Stay connected to Kerala’s migrant health pulse.
            </p>
          </div>
        </section>

        <form
          onSubmit={handleLogin}
          className="flex flex-col justify-between rounded-[28px] bg-white px-8 py-10 text-slate-900 shadow-xl"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">
              Secure Sign-in
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">
              Govt Officer Login
            </h2>
            <p className="text-sm text-slate-500">
              Enter your credentials to access the migrant health console.
            </p>

            <div className="mt-8 space-y-6">
              <div className="space-y-2">
                <label
                  htmlFor="govtId"
                  className="text-sm font-medium text-slate-600"
                >
                  Government ID
                </label>
                <div className="flex items-center gap-2 rounded-2xl border border-slate-300 px-4 py-3 focus-within:border-sky-500">
                  <input
                    id="govtId"
                    name="govtId"
                    type="text"
                    value={govtId}
                    onChange={(e) => setGovtId(e.target.value)}
                    placeholder="Enter Govt ID"
                    className="w-full border-none bg-transparent text-base outline-none"
                    aria-required="true"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-slate-600"
                >
                  Password
                </label>
                <div className="flex items-center gap-2 rounded-2xl border border-slate-300 px-4 py-3 focus-within:border-sky-500">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter Password"
                    className="w-full border-none bg-transparent text-base outline-none"
                    aria-required="true"
                  />
                </div>
              </div>
            </div>

            {errorMsg && (
              <p
                className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                role="alert"
              >
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              className="mt-6 w-full rounded-2xl bg-slate-900 px-4 py-3 text-base font-semibold text-white transition hover:bg-slate-800"
            >
              <span className="inline-flex items-center justify-center gap-2">
                <LogIn className="h-4 w-4" />
                Login
              </span>
            </button>
          </div>

          <div className="mt-10 border-t border-slate-100 pt-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
              Migrant Health System
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Kerala state government secure interface.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default GovtLogin;
