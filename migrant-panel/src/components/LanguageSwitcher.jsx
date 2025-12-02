import { useTranslation } from "react-i18next";

export default function LanguageSwitcher({ className = "", ariaLabel }) {
  const { i18n } = useTranslation();

  const languages = [
    { code: "en", label: "English" },
    { code: "hi", label: "हिन्दी" },
    { code: "bn", label: "বাংলা" },
    { code: "ml", label: "മലയാളം" },
    { code: "ta", label: "தமிழ்" },
    { code: "or", label: "ଓଡ଼ିଆ" },
    { code: "as", label: "অসমীয়া" },
  ];

  const handleChange = (event) => {
    const nextLang = event.target.value;
    i18n.changeLanguage(nextLang);
    localStorage.setItem("lang", nextLang); // remember preference
  };

  const currentLanguage = (i18n.resolvedLanguage || i18n.language || "en")
    .split("-")[0]
    .toLowerCase();

  const combinedClassName =
    `px-3 py-2 rounded-lg border border-gray-300 bg-white text-black shadow-sm focus:ring-blue-500 focus:outline-none ${className}`.trim();

  return (
    <select
      onChange={handleChange}
      value={currentLanguage}
      aria-label={ariaLabel || "Select language"}
      title={ariaLabel || "Select language"}
      className={combinedClassName}
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.label}
        </option>
      ))}
    </select>
  );
}
