import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, LockKeyhole, Phone } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loading, error, isAuthenticated } = useAuth();
  const [formState, setFormState] = useState({ phoneNumber: "", password: "" });
  const [localError, setLocalError] = useState(null);

  const { t } = useTranslation(); // <-- translation hook

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
      setLocalError(t("login.missingFields"));
      return;
    }

    try {
      await login(formState);
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Login failed", err);
    }
  };

  const featureList = [
    { icon: Phone, label: t("login.featurePhone") },
    { icon: LockKeyhole, label: t("login.featureSecure") },
  ];

  const showError = error || localError;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-10">
      <div className="mx-auto grid w-full max-w-6xl gap-6 rounded-[36px] bg-white/5 p-2 text-white shadow-2xl backdrop-blur-lg lg:grid-cols-2">
        <section className="rounded-[28px] bg-white/10 p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.4em] text-white/70">
            {t("app.name")}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {t("login.title")}
          </h1>
          <p className="mt-3 text-sm text-white/80">{t("login.description")}</p>
          <ul className="mt-6 space-y-3 text-sm text-white/85">
            {featureList.map((item) => (
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
              {t("language.prompt")}
            </p>
            <p className="mt-1 text-white/70">{t("login.formSubtitle")}</p>
          </div>
        </section>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col justify-between rounded-[28px] bg-white px-8 py-10 text-slate-900 shadow-xl"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">
              {t("login.formTitle")}
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">
              {t("login.welcome")}
            </h2>
            <p className="text-sm text-slate-500">{t("login.formSubtitle")}</p>

            <div className="mt-8 space-y-6">
              <div className="space-y-2">
                <label
                  htmlFor="phoneNumber"
                  className="text-sm font-medium text-slate-600"
                >
                  {t("login.phoneLabel")}
                </label>
                <div className="flex items-center gap-2 rounded-2xl border border-slate-300 px-4 py-3 focus-within:border-sky-500">
                  <Phone
                    className="h-4 w-4 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    inputMode="tel"
                    pattern="^[0-9+\-\s]{6,}$"
                    value={formState.phoneNumber}
                    onChange={handleChange}
                    autoComplete="tel"
                    placeholder={t("login.phonePlaceholder")}
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
                  {t("login.passwordLabel")}
                </label>
                <div className="flex items-center gap-2 rounded-2xl border border-slate-300 px-4 py-3 focus-within:border-sky-500">
                  <LockKeyhole
                    className="h-4 w-4 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formState.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                    placeholder={t("login.passwordPlaceholder")}
                    className="w-full border-none bg-transparent text-base outline-none"
                    aria-required="true"
                  />
                </div>
              </div>
            </div>

            {showError && (
              <p
                className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                role="alert"
                aria-live="assertive"
              >
                {localError || error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-2xl bg-slate-900 px-4 py-3 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              aria-busy={loading}
            >
              {loading ? t("login.signingIn") : t("login.signIn")}
            </button>
          </div>

          {/* <div className="mt-10 border-t border-slate-100 pt-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
              {t("language.prompt")}
            </p>
            <div className="mt-3 flex justify-center">
              <LanguageSwitcher
                ariaLabel={t("language.prompt")}
                className="bg-slate-100 text-slate-900"
              />
            </div>
          </div> */}
        </form>
      </div>
    </div>
  );
}
