// src/utils/translate.js

// Simple in-memory cache: key = "lang::text"
const memoryCache = new Map();

const makeKey = (text, lang) => `${lang}::${text}`;

/**
 * Translate an array of texts into target language.
 * Will only call backend translation if target !== "en".
 * @param {string[]} texts
 * @param {string} target
 * @returns {Promise<string[]>}
 */
export async function translateBatch(texts = [], target = "en") {
  // If target is English, do NOT translate
  if (!texts || texts.length === 0) return texts;
  if (target === "en") return texts;

  const results = new Array(texts.length).fill("");
  const missingIndices = [];
  const missingTexts = [];

  // Check cache first
  texts.forEach((t, i) => {
    const text = t == null ? "" : String(t);
    const key = makeKey(text, target);

    if (memoryCache.has(key)) {
      results[i] = memoryCache.get(key);
    } else {
      missingIndices.push(i);
      missingTexts.push(text);
    }
  });

  // If everything was cached, return immediately
  if (missingTexts.length === 0) {
    return results;
  }

  try {
    const response = await fetch("http://localhost:3030/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts: missingTexts, target }),
    });

    const json = await response.json();

    let translatedList = json.translations || [];

    // Safety fallback: ensure same length
    if (
      !Array.isArray(translatedList) ||
      translatedList.length !== missingTexts.length
    ) {
      translatedList = missingTexts; // fallback to original text
    }

    // Insert into results + cache
    missingIndices.forEach((originalIndex, idx) => {
      const translated = translatedList[idx] || texts[originalIndex];
      results[originalIndex] = translated;

      const key = makeKey(missingTexts[idx], target);
      memoryCache.set(key, translated);
    });

    return results;
  } catch (err) {
    console.error("translateBatch error:", err);
    // On error: return original texts to avoid breaking UI
    return texts;
  }
}
