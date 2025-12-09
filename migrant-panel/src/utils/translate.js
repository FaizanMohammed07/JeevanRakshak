// src/utils/translate.js

// Simple in-memory + persistent cache
// memoryCache maps key -> { value: string, ts: number }
const memoryCache = new Map();
const CACHE_KEY = "i18nCache_v1";
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

function loadPersistentCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return;
    const obj = JSON.parse(raw);
    const now = Date.now();
    Object.keys(obj).forEach((k) => {
      const entry = obj[k];
      if (!entry || typeof entry.value !== "string") return;
      // respect TTL
      if (entry.ts && now - entry.ts > CACHE_TTL_MS) return;
      memoryCache.set(k, { value: entry.value, ts: entry.ts || now });
    });
  } catch (e) {
    // ignore parse errors
    console.warn("Failed to load i18n cache:", e);
  }
}

function savePersistentCache() {
  try {
    const obj = {};
    memoryCache.forEach((v, k) => {
      obj[k] = { value: v.value, ts: v.ts };
    });
    localStorage.setItem(CACHE_KEY, JSON.stringify(obj));
  } catch (e) {
    console.warn("Failed to save i18n cache:", e);
  }
}

// initialize cache from localStorage
try {
  loadPersistentCache();
} catch (e) {
  // noop
}

/**
 * Generate cache key
 */
const makeKey = (text, lang) => `${lang}::${text}`;

/**
 * Translate array of raw strings into target language.
 * @param {string[]} texts - EX: ["Morning","Before food","Night"]
 * @param {string} lang   - EX: "hi", "ml", "ta", "bn"
 */
export async function translateBatch(texts = [], lang = "en") {
  // No translation needed
  if (!texts || texts.length === 0) return texts;
  if (lang === "en") return texts;

  const normalized = texts.map((t) => (t == null ? "" : String(t)));

  const results = new Array(normalized.length);
  const missingTexts = [];
  const missingIndex = [];

  // 1) Check cache (in-memory / persistent)
  normalized.forEach((t, i) => {
    const key = makeKey(t, lang);
    if (memoryCache.has(key)) {
      results[i] = memoryCache.get(key).value;
    } else {
      missingTexts.push(t);
      missingIndex.push(i);
    }
  });

  // If everything was cached → return
  if (missingTexts.length === 0) return results;

  try {
    // 2) Call backend
    const response = await fetch("http://localhost:8080/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // ⭐ IMPORTANT: Backend expects {texts, target}
      body: JSON.stringify({
        texts: missingTexts,
        target: lang,
      }),
    });

    const json = await response.json();

    // Safety
    let translated = json.translations;
    if (
      !Array.isArray(translated) ||
      translated.length !== missingTexts.length
    ) {
      console.warn("⚠ translateBatch fallback – invalid translation array");
      translated = missingTexts.slice();
    }

    // Sanitize translations: sometimes upstream/model returns just the
    // language code (e.g. "hi") instead of actual translated text.
    // In those cases, fall back to the original missing text.
    translated = translated.map((t, i) => {
      if (typeof t !== "string") return missingTexts[i] ?? "";
      const trimmed = t.trim();
      // If model returned the target language code (like "hi") or
      // language name (like "hindi"), ignore it and fallback.
      if (
        trimmed.toLowerCase() === String(lang).toLowerCase() ||
        trimmed.toLowerCase() ===
          new Intl.DisplayNames([lang], {
            type: "language",
          })
            ?.of(lang)
            ?.toLowerCase()
      ) {
        return missingTexts[i] ?? "";
      }
      return trimmed;
    });

    // 3) Fill results & cache
    missingIndex.forEach((idx, i) => {
      const finalText = translated[i] ?? normalized[idx];
      results[idx] = finalText;

      const key = makeKey(missingTexts[i], lang);
      memoryCache.set(key, { value: finalText, ts: Date.now() });
    });

    // persist cache to localStorage (best-effort)
    try {
      savePersistentCache();
    } catch (e) {
      /* ignore */
    }

    return results;
  } catch (err) {
    console.error("translateBatch error:", err);
    return normalized; // safe fallback
  }
}
