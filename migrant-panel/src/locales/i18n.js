import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./en/translation.json";
import hi from "./hi/translation.json";
import bn from "./bn/translation.json";
import or from "./or/translation.json";
import ta from "./ta/translation.json";
import as from "./as/translation.json";
import ml from "./ml/translation.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      bn: { translation: bn },
      or: { translation: or },
      ta: { translation: ta },
      as: { translation: as },
      ml: { translation: ml },
    },
    fallbackLng: "en",
    supportedLngs: ["en", "hi", "bn", "or", "ta", "as", "ml"],
    load: "languageOnly",
    nonExplicitSupportedLngs: true,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
      lookupLocalStorage: "lang",
    },
  });

export default i18n;
