// src/hooks/useTranslateData.js

import { useEffect, useState } from "react";
import { translateBatch } from "../utils/translate"; // fixed path

/**
 * items: array of objects (e.g. announcements, prescriptions, reports)
 * fields: array of field names to translate (e.g. ["title", "message"])
 * lang: selected language
 */
export default function useTranslateData(items = [], fields = [], lang = "en") {
  const [translatedItems, setTranslatedItems] = useState(items);

  useEffect(() => {
    let mounted = true;

    // If no translation needed or English selected, return items as-is.
    if (lang === "en" || !items.length || !fields.length) {
      setTranslatedItems(items);
      return;
    }

    (async () => {
      // Collect all texts to translate in order
      const allTexts = [];

      for (const item of items) {
        for (const field of fields) {
          const value = item?.[field] ?? "";
          allTexts.push(String(value));
        }
      }

      // Translate them
      const translations = await translateBatch(allTexts, lang);

      // Reconstruct translated item list
      const rebuilt = items.map((item, itemIndex) => {
        const newItem = { ...item };
        fields.forEach((field, fieldIndex) => {
          const lookupIndex = itemIndex * fields.length + fieldIndex;
          newItem[field] = translations[lookupIndex] || item[field];
        });
        return newItem;
      });

      if (mounted) {
        setTranslatedItems(rebuilt);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [
    JSON.stringify(items), // recalc when items change
    lang, // recalc when language changes
    fields.join(","), // recalc when field list changes
  ]);

  return translatedItems;
}
