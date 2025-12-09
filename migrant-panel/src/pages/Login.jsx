import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
import {
  // ShieldCheck,
  // LockKeyhole,
  // Phone,
  HardHat,
  User,
  UserPlus,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { ShieldCheck, LockKeyhole, Phone } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, register, loading, error, isAuthenticated, role } = useAuth(); // Assuming register exists in context

  // State for toggling between User and Contractor
  const [isContractor, setIsContractor] = useState(false);
  // State for toggling between Login and Signup (only for Contractor)
  const [isSignup, setIsSignup] = useState(false);

  const [formState, setFormState] = useState({
    fullName: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });
  const [localError, setLocalError] = useState(null);

  const { t } = useTranslation();

  // Reset signup state if user switches back to Standard User mode
  useEffect(() => {
    if (!isContractor) {
      setIsSignup(false);
      setLocalError(null);
    }
  }, [isContractor]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Redirect according to authenticated user's role to avoid
    // sending contractors into the patient panel.
    if (role === "contractor") {
      navigate("/contractor", { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError(null);

    // Validation Logic
    if (isContractor && isSignup) {
      // Contractor Registration Validation
      if (
        !formState.fullName ||
        !formState.phoneNumber ||
        !formState.password ||
        !formState.confirmPassword
      ) {
        setLocalError("Please fill in all fields.");
        return;
      }
      if (formState.password !== formState.confirmPassword) {
        setLocalError("Passwords do not match.");
        return;
      }
    } else {
      // Login Validation
      if (!formState.phoneNumber || !formState.password) {
        setLocalError(
          isContractor
            ? "Please enter both phone and password."
            : t("login.missingFields")
        );
        return;
      }
    }

    try {
      if (isContractor && isSignup) {
        // Handle Registration
        // Assuming register takes { fullName, phoneNumber, password, role }
        if (register) {
          await register({
            name: formState.fullName,
            phoneNumber: formState.phoneNumber,
            password: formState.password,
            passwordConfirm: formState.confirmPassword,
            role: "contractor",
          });
        } else {
          console.warn("Register function not found in AuthContext");
        }
      } else {
        // Handle Login - rely on AuthContext role + redirect effect
        await login({
          phoneNumber: formState.phoneNumber,
          password: formState.password,
          role: isContractor ? "contractor" : "user",
        });
      }
    } catch (err) {
      console.error("Authentication failed", err);
      setLocalError("Authentication failed. Please try again.");
    }
  };

  const featureList = [
    {
      icon: Phone,
      label: isContractor
        ? "Contractor Priority Support"
        : t("login.featurePhone"),
    },
    {
      icon: LockKeyhole,
      label: isContractor ? "Secure Project Access" : t("login.featureSecure"),
    },
  ];

  const showError = error || localError;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-10">
      <div className="mx-auto grid w-full max-w-6xl gap-6 rounded-[36px] bg-white/5 p-2 text-white shadow-2xl backdrop-blur-lg lg:grid-cols-2">
        {/* Left Side: Branding / Info */}
        <section className="rounded-[28px] bg-white/10 p-8 flex flex-col justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
            {isContractor ? (
              <HardHat className="h-6 w-6" />
            ) : (
              <ShieldCheck className="h-6 w-6" />
            )}
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.4em] text-white/70">
            {isContractor ? "CONTRACTOR PORTAL" : t("app.name")}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {isContractor
              ? isSignup
                ? "Join Our Network"
                : "Partner Access"
              : t("login.title")}
          </h1>
          <p className="mt-3 text-sm text-white/80">
            {isContractor
              ? "Log in to view active contracts, manage bids, and update project statuses."
              : t("login.description")}
          </p>
          <ul className="mt-6 space-y-3 text-sm text-white/85">
            {featureList.map((item) => (
              <li
                key={item.label}
                className="flex items-center gap-3 rounded-2xl bg-white/5 px-3 py-2"
              >
                <item.icon className="h-4 w-4 text-emerald-300" />
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Right Side: Form */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col justify-between rounded-[28px] bg-white px-8 py-10 text-slate-900 shadow-xl"
        >
          <div>
            {/* Toggle Switch (Disable or Hide during Signup to prevent state confusion) */}
            {!isSignup && (
              <div className="mb-8 flex rounded-2xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setIsContractor(false)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-sm font-semibold transition-all ${
                    !isContractor
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <User className="h-4 w-4" />
                  <span>User</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsContractor(true)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-sm font-semibold transition-all ${
                    isContractor
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <HardHat className="h-4 w-4" />
                  <span>Contractor</span>
                </button>
              </div>
            )}

            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">
              {isContractor
                ? isSignup
                  ? "NEW REGISTRATION"
                  : "CONTRACTOR LOGIN"
                : t("login.formTitle")}
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">
              {isContractor
                ? isSignup
                  ? "Create Account"
                  : "Welcome Partner"
                : t("login.welcome")}
            </h2>
            <p className="text-sm text-slate-500">
              {isContractor
                ? isSignup
                  ? "Fill in the details below to register."
                  : "Enter your registered credentials."
                : t("login.formSubtitle")}
            </p>

            <div className="mt-8 space-y-4">
              {/* Extra Field: Full Name (Only for Signup) */}
              {isContractor && isSignup && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">
                    Full Name
                  </label>
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-300 px-4 py-3 focus-within:border-sky-500">
                    <User className="h-4 w-4 text-slate-400" />
                    <input
                      name="fullName"
                      type="text"
                      value={formState.fullName}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="w-full border-none bg-transparent text-base outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Standard Field: Phone Number */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">
                  {isContractor ? "Phone Number" : t("login.phoneLabel")}
                </label>
                <div className="flex items-center gap-2 rounded-2xl border border-slate-300 px-4 py-3 focus-within:border-sky-500">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <input
                    name="phoneNumber"
                    type="tel"
                    inputMode="tel"
                    value={formState.phoneNumber}
                    onChange={handleChange}
                    placeholder={
                      isContractor
                        ? "Enter phone number"
                        : t("login.phonePlaceholder")
                    }
                    className="w-full border-none bg-transparent text-base outline-none"
                  />
                </div>
              </div>

              {/* Standard Field: Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">
                  {isContractor ? "Password" : t("login.passwordLabel")}
                </label>
                <div className="flex items-center gap-2 rounded-2xl border border-slate-300 px-4 py-3 focus-within:border-sky-500">
                  <LockKeyhole className="h-4 w-4 text-slate-400" />
                  <input
                    name="password"
                    type="password"
                    value={formState.password}
                    onChange={handleChange}
                    placeholder={
                      isContractor
                        ? "Enter password"
                        : t("login.passwordPlaceholder")
                    }
                    className="w-full border-none bg-transparent text-base outline-none"
                  />
                </div>
              </div>

              {/* Extra Field: Confirm Password (Only for Signup) */}
              {isContractor && isSignup && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">
                    Confirm Password
                  </label>
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-300 px-4 py-3 focus-within:border-sky-500">
                    <LockKeyhole className="h-4 w-4 text-slate-400" />
                    <input
                      name="confirmPassword"
                      type="password"
                      value={formState.confirmPassword}
                      onChange={handleChange}
                      placeholder="Re-enter password"
                      className="w-full border-none bg-transparent text-base outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {showError && (
              <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {localError || error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-2xl bg-slate-900 px-4 py-3 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? isSignup
                  ? "Creating Account..."
                  : isContractor
                  ? "Signing In..."
                  : t("login.signingIn")
                : isSignup
                ? "Register Contractor"
                : isContractor
                ? "Sign In"
                : t("login.signIn")}
            </button>
            {!isContractor && (
              <p className="mt-4 text-center text-sm text-slate-500">
                {t("login.createAccountPrompt")}{" "}
                <Link className="font-semibold text-slate-900" to="/signup">
                  {t("login.signUpLink")}
                </Link>
              </p>
            )}

            <div className="mt-4 text-center">
              <p className="text-sm text-slate-500">Are you an employer?</p>
              <div className="mt-2 flex items-center justify-center gap-3">
                <Link
                  to="/employer/login"
                  className="text-sm font-semibold text-slate-900"
                >
                  Employer Sign In
                </Link>
                <span className="text-slate-300">|</span>
                <Link
                  to="/employer/signup"
                  className="text-sm font-semibold text-slate-900"
                >
                  Employer Sign Up
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom Section: Footer Actions */}
          <div className="mt-10 border-t border-slate-100 pt-6 text-center">
            {isContractor ? (
              // CONTRACTOR: Toggle between Signup and Login
              <div>
                <p className="text-sm text-slate-600">
                  {isSignup
                    ? "Already have an account?"
                    : "Don't have a contractor account?"}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsSignup(!isSignup);
                    setLocalError(null);
                  }}
                  className="mt-2 text-sm font-bold text-slate-900 transition hover:text-slate-700 hover:underline"
                >
                  {isSignup ? "Sign In" : "Create Account"}
                </button>
              </div>
            ) : (
              // USER: Show Language Switcher
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                  {t("language.prompt")}
                </p>
                <div className="mt-3 flex justify-center">
                  <LanguageSwitcher
                    ariaLabel={t("language.prompt")}
                    className="bg-slate-100 text-slate-900"
                  />
                </div>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
