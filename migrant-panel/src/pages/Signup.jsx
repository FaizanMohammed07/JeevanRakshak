import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ShieldCheck, LockKeyhole, Phone } from "lucide-react";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { signupPatient } from "../api/patients";
import { useAuth } from "../context/AuthContext";

const REQUIRED_FIELDS = [
  "name",
  "age",
  "phoneNumber",
  "password",
  "passwordConfirm",
  "district",
  "taluk",
  "village",
];

const initialFormState = {
  name: "",
  age: "",
  phoneNumber: "",
  password: "",
  passwordConfirm: "",
  district: "",
  taluk: "",
  village: "",
};

export default function SignupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formState, setFormState] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const validateFieldValue = (fieldName, values) => {
    const nextValue = values[fieldName];
    const hasValue =
      nextValue !== undefined &&
      nextValue !== null &&
      nextValue.toString().trim().length > 0;

    if (REQUIRED_FIELDS.includes(fieldName) && !hasValue) {
      return t("signup.requiredField");
    }

    if (
      fieldName === "passwordConfirm" &&
      values.password &&
      values.passwordConfirm &&
      values.password !== values.passwordConfirm
    ) {
      return t("signup.passwordMismatch");
    }

    return "";
  };

  const updateFieldError = (fieldName, nextFormState) => {
    const nextMessage = validateFieldValue(fieldName, nextFormState);
    setFieldErrors((prev) => {
      if (nextMessage) {
        return { ...prev, [fieldName]: nextMessage };
      }
      const { [fieldName]: omitted, ...rest } = prev;
      return rest;
    });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    const nextFormState = { ...formState, [name]: value };
    setFormState(nextFormState);
    setTouchedFields((prev) => ({ ...prev, [name]: true }));
    updateFieldError(name, nextFormState);
    if (name === "password" || name === "passwordConfirm") {
      updateFieldError("passwordConfirm", nextFormState);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSubmitAttempted(true);
    setTouchedFields((prev) => {
      const nextTouched = { ...prev };
      REQUIRED_FIELDS.forEach((field) => {
        nextTouched[field] = true;
      });
      return nextTouched;
    });
    setFieldErrors({});

    const validationErrors = {};
    REQUIRED_FIELDS.forEach((field) => {
      const value = formState[field];
      if (!value?.toString().trim()) {
        validationErrors[field] = t("signup.requiredField");
      }
    });

    if (
      formState.password &&
      formState.passwordConfirm &&
      formState.password !== formState.passwordConfirm
    ) {
      validationErrors.passwordConfirm = t("signup.passwordMismatch");
    }

    if (Object.keys(validationErrors).length) {
      setFieldErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      await signupPatient({
        ...formState,
        age: Number(formState.age) || undefined,
      });
      await login({
        phoneNumber: formState.phoneNumber,
        password: formState.password,
      });
      navigate("/", { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.msg || err.response?.data?.error || err.message;
      setError(message || t("signup.failed"));
    } finally {
      setLoading(false);
    }
  };

  const featureList = [
    { icon: Phone, label: t("login.featurePhone") },
    { icon: LockKeyhole, label: t("login.featureSecure") },
  ];

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
            {t("signup.title")}
          </h1>
          <p className="mt-3 text-sm text-white/80">
            {t("signup.description")}
          </p>
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
            <p className="mt-1 text-white/70">{t("signup.formSubtitle")}</p>
          </div>
        </section>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col justify-between rounded-[28px] bg-white px-8 py-10 text-slate-900 shadow-xl"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">
              {t("signup.formTitle")}
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">
              {t("signup.welcome")}
            </h2>
            <p className="text-sm text-slate-500">{t("signup.formSubtitle")}</p>

            <div className="mt-8 grid gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="text-sm font-medium text-slate-600"
                >
                  {t("signup.nameLabel")}
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formState.name}
                  onChange={handleChange}
                  placeholder={t("signup.namePlaceholder")}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 focus:border-sky-500 focus:outline-none"
                />
                {(touchedFields.name || submitAttempted) &&
                  fieldErrors.name && (
                    <p className="text-xs text-rose-600">{fieldErrors.name}</p>
                  )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="age"
                    className="text-sm font-medium text-slate-600"
                  >
                    {t("signup.ageLabel")}
                  </label>
                  <input
                    id="age"
                    name="age"
                    type="number"
                    min={0}
                    value={formState.age}
                    onChange={handleChange}
                    placeholder={t("signup.agePlaceholder")}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 focus:border-sky-500 focus:outline-none"
                  />
                  {(touchedFields.age || submitAttempted) &&
                    fieldErrors.age && (
                      <p className="text-xs text-rose-600">{fieldErrors.age}</p>
                    )}
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="phoneNumber"
                    className="text-sm font-medium text-slate-600"
                  >
                    {t("login.phoneLabel")}
                  </label>
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    inputMode="tel"
                    pattern="^[0-9+\-\s]{6,}$"
                    value={formState.phoneNumber}
                    onChange={handleChange}
                    placeholder={t("signup.phonePlaceholder")}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 focus:border-sky-500 focus:outline-none"
                  />
                  {(touchedFields.phoneNumber || submitAttempted) &&
                    fieldErrors.phoneNumber && (
                      <p className="text-xs text-rose-600">
                        {fieldErrors.phoneNumber}
                      </p>
                    )}
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-slate-600"
                >
                  {t("login.passwordLabel")}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formState.password}
                  onChange={handleChange}
                  placeholder={t("login.passwordPlaceholder")}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 focus:border-sky-500 focus:outline-none"
                />
                {(touchedFields.password || submitAttempted) &&
                  fieldErrors.password && (
                    <p className="text-xs text-rose-600">
                      {fieldErrors.password}
                    </p>
                  )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="passwordConfirm"
                  className="text-sm font-medium text-slate-600"
                >
                  {t("signup.passwordConfirmLabel")}
                </label>
                <input
                  id="passwordConfirm"
                  name="passwordConfirm"
                  type="password"
                  value={formState.passwordConfirm}
                  onChange={handleChange}
                  placeholder={t("signup.passwordConfirmPlaceholder")}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 focus:border-sky-500 focus:outline-none"
                />
                {(touchedFields.passwordConfirm || submitAttempted) &&
                  fieldErrors.passwordConfirm && (
                    <p className="text-xs text-rose-600">
                      {fieldErrors.passwordConfirm}
                    </p>
                  )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="district"
                    className="text-sm font-medium text-slate-600"
                  >
                    {t("signup.districtLabel")}
                  </label>
                  <input
                    id="district"
                    name="district"
                    type="text"
                    value={formState.district}
                    onChange={handleChange}
                    placeholder={t("signup.districtPlaceholder")}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 focus:border-sky-500 focus:outline-none"
                  />
                  {(touchedFields.district || submitAttempted) &&
                    fieldErrors.district && (
                      <p className="text-xs text-rose-600">
                        {fieldErrors.district}
                      </p>
                    )}
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="taluk"
                    className="text-sm font-medium text-slate-600"
                  >
                    {t("signup.talukLabel")}
                  </label>
                  <input
                    id="taluk"
                    name="taluk"
                    type="text"
                    value={formState.taluk}
                    onChange={handleChange}
                    placeholder={t("signup.talukPlaceholder")}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 focus:border-sky-500 focus:outline-none"
                  />
                  {(touchedFields.taluk || submitAttempted) &&
                    fieldErrors.taluk && (
                      <p className="text-xs text-rose-600">
                        {fieldErrors.taluk}
                      </p>
                    )}
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="village"
                  className="text-sm font-medium text-slate-600"
                >
                  {t("signup.villageLabel")}
                </label>
                <input
                  id="village"
                  name="village"
                  type="text"
                  value={formState.village}
                  onChange={handleChange}
                  placeholder={t("signup.villagePlaceholder")}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 focus:border-sky-500 focus:outline-none"
                />
                {(touchedFields.village || submitAttempted) &&
                  fieldErrors.village && (
                    <p className="text-xs text-rose-600">
                      {fieldErrors.village}
                    </p>
                  )}
              </div>
            </div>
          </div>

          {error && (
            <p
              className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
              role="alert"
              aria-live="assertive"
            >
              {error}
            </p>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-2xl bg-slate-900 px-4 py-3 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? t("signup.submitting") : t("signup.signUp")}
            </button>
            <p className="mt-4 text-center text-sm text-slate-500">
              {t("signup.haveAccount")}{" "}
              <Link className="font-semibold text-slate-900" to="/login">
                {t("signup.signInLink")}
              </Link>
            </p>
          </div>

          <div className="mt-10 border-t border-slate-100 pt-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
              {t("language.prompt")}
            </p>
            <div className="mt-3 flex justify-center">
              <LanguageSwitcher
                ariaLabel={t("language.prompt")}
                className="bg-slate-100 text-slate-900"
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
