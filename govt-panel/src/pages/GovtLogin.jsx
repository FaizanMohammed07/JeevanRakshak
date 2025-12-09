import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, LogIn } from "lucide-react";
import keralaLogo from "../KERALALOGO.webp"; // adjust path as needed

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
        "http://localhost:8080/api/govt/login",
        { govtId, password },
        { withCredentials: true }
      );

      navigate("/govt/dashboard");
    } catch (err) {
      setErrorMsg("Invalid Govt ID or Password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 p-6">
      <div className="w-full max-w-md bg-white shadow-xl rounded-xl p-8">
        <div className="flex flex-col items-center mb-6">
          <img
            src={keralaLogo}
            alt="Kerala Emblem"
            className="w-14 h-14 object-contain brightness-75 contrast-125"
          />
          <h2 className="text-2xl font-bold text-gray-900">
            Govt Officer Login
          </h2>
          <p className="text-gray-600 text-sm">Kerala Migrant Health System</p>
        </div>

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
