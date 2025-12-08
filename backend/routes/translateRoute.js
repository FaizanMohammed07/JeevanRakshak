// backend/routes/translateRoute.js
import express from "express";
import fs from "fs";
import path from "path";

const router = express.Router();

// Simple file-backed cache to reduce repeated calls and improve latency
const CACHE_FILE = path.resolve(process.cwd(), "i18n-cache.json");
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
let cache = new Map();
// Map for coalescing identical in-flight batch requests: key -> Promise
const inFlight = new Map();

// Simple semaphore to limit concurrent outbound API calls
const API_CONCURRENCY_LIMIT = 4; // tune for your environment
let apiActive = 0;
const apiQueue = [];
function acquireApiSlot() {
  if (apiActive < API_CONCURRENCY_LIMIT) {
    apiActive++;
    return Promise.resolve();
  }
  return new Promise((resolve) => apiQueue.push(resolve));
}
function releaseApiSlot() {
  apiActive = Math.max(0, apiActive - 1);
  const next = apiQueue.shift();
  if (next) {
    apiActive++;
    next();
  }
}

function loadCache() {
  try {
    if (!fs.existsSync(CACHE_FILE)) return;
    const raw = fs.readFileSync(CACHE_FILE, "utf8");
    const obj = JSON.parse(raw || "{}");
    const now = Date.now();
    Object.entries(obj).forEach(([k, v]) => {
      if (!v || !v.value) return;
      if (v.ts && now - v.ts > CACHE_TTL_MS) return;
      cache.set(k, v);
    });
  } catch (e) {
    console.warn("Failed to load i18n cache:", e.message);
  }
}

function saveCache() {
  try {
    const obj = {};
    for (const [k, v] of cache.entries()) obj[k] = v;
    fs.writeFileSync(CACHE_FILE, JSON.stringify(obj), "utf8");
  } catch (e) {
    console.warn("Failed to save i18n cache:", e.message);
  }
}

loadCache();

// Simple script detection to validate script of translated text
function detectScript(text = "") {
  if (!text) return null;
  const s = String(text);
  if (/\p{Script=Devanagari}/u.test(s)) return "devanagari";
  if (/\p{Script=Bengali}/u.test(s)) return "bengali";
  if (/\p{Script=Oriya}/u.test(s)) return "oriya";
  if (/\p{Script=Tamil}/u.test(s)) return "tamil";
  if (/\p{Script=Malayalam}/u.test(s)) return "malayalam";
  if (/\p{Script=Telugu}/u.test(s)) return "telugu";
  if (/\p{Script=Kannada}/u.test(s)) return "kannada";
  if (/\p{Script=Latin}/u.test(s)) return "latin";
  return null;
}

function expectedScriptForLang(lang) {
  if (!lang) return null;
  const l = lang.split("-")[0].toLowerCase();
  if (l === "hi") return "devanagari";
  if (l === "bn") return "bengali";
  if (l === "or" || l === "od") return "oriya";
  if (l === "ta") return "tamil";
  if (l === "ml") return "malayalam";
  if (l === "te") return "telugu";
  if (l === "kn") return "kannada";
  if (l === "as") return "bengali"; // Assamese uses Bengali script
  return null;
}

/**
 * POST /api/translate
 * Body: { texts: string[], target?: 'en'|'hi'|... }
 * Response: { translations: string[] }
 */
router.post("/", async (req, res) => {
  const { texts = [], target, targetLang } = req.body ?? {};
  const targetLangValue = target || targetLang || "en";

  if (!Array.isArray(texts) || texts.length === 0) {
    return res.status(400).json({ error: "texts must be a non-empty array" });
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error("OpenAI API key missing");
    return res.status(500).json({ error: "OpenAI key not configured" });
  }

  try {
    // First: check file-backed cache and only request missing entries from API
    const resultsFromCache = new Array(texts.length);
    const missingTexts = [];
    const missingIndex = [];
    texts.forEach((txt, i) => {
      const key = `${targetLangValue}::${String(txt)}`;
      if (cache.has(key)) {
        resultsFromCache[i] = cache.get(key).value;
      } else {
        missingTexts.push(txt);
        missingIndex.push(i);
      }
    });

    if (missingTexts.length === 0) {
      return res.json({ translations: resultsFromCache });
    }

    // Build a strict instruction asking for JSON output.
    const systemPrompt = `You are a translation engine. Translate each input string independently into "${targetLangValue}".
You MUST return EXACTLY a JSON object and nothing else. The format MUST be:

{"translations": ["t1", "t2", ...]}

Rules:
- Preserve order exactly.
- For empty input strings return an empty string at the same index.
- Do NOT add commentary, explanation, or additional keys.
- Do NOT include markdown or code fences.
`;

    // We send the missing texts array as JSON so the model knows boundaries.
    const userPrompt = `Translate this JSON array of strings exactly as provided (preserve order):\n${JSON.stringify(
      missingTexts
    )}`;

    // coalesce identical in-flight requests to avoid duplicate API calls
    const batchKey = `${targetLangValue}::${JSON.stringify(missingTexts)}`;
    let batchPromise = inFlight.get(batchKey);
    if (!batchPromise) {
      batchPromise = (async () => {
        await acquireApiSlot();
        try {
          const resp = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: process.env.OPENAI_MODEL || "gpt-4o-mini",
                temperature: 0,
                messages: [
                  { role: "system", content: systemPrompt },
                  { role: "user", content: userPrompt },
                ],
                // tokens limit - increase if you send many/long strings
                max_tokens: 2000,
              }),
            }
          );

          const data = await resp.json();
          return { resp, data };
        } finally {
          releaseApiSlot();
        }
      })();

      inFlight.set(batchKey, batchPromise);
      // Cleanup inFlight once done (do not block callers)
      batchPromise.finally(() => inFlight.delete(batchKey)).catch(() => {});
    }

    // wait for the shared batch result
    const { resp, data } = await batchPromise;

    if (!resp.ok) {
      console.error("OpenAI error:", data);
      // fallback: return original texts to avoid breaking UI
      return res.status(resp.status || 500).json({ translations: texts });
    }

    // Extract assistant content
    let content =
      data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text ?? "";

    // Clean content from markdown/code fences
    content = content
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    // Try to find a JSON substring (in case model adds whitespace)
    let parsed = null;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      // try to extract JSON substring between first { and last }
      const start = content.indexOf("{");
      const end = content.lastIndexOf("}");
      if (start !== -1 && end !== -1 && end > start) {
        try {
          parsed = JSON.parse(content.slice(start, end + 1));
        } catch (e2) {
          // intentionally empty - will fallback below
          console.error("JSON parse fallback failed:", e2, "raw:", content);
        }
      } else {
        console.error("No JSON in OpenAI response. Raw content:", content);
      }
    }

    // If parsing failed or translations missing, fallback to originals for missing entries
    if (!parsed || !Array.isArray(parsed.translations)) {
      console.warn(
        "OpenAI response did not include parsed.translations - falling back to originals for missing entries.",
        { raw: content }
      );
      // fill missing with originals
      missingIndex.forEach((idx, i) => {
        resultsFromCache[idx] = missingTexts[i];
      });
      return res.json({ translations: resultsFromCache });
    }

    // translations correspond to missingTexts
    const translations = parsed.translations;
    if (
      !Array.isArray(translations) ||
      translations.length !== missingTexts.length
    ) {
      // best-effort: map what we have, and fallback remaining to originals
      missingIndex.forEach((idx, i) => {
        resultsFromCache[idx] =
          typeof translations[i] === "string"
            ? translations[i]
            : missingTexts[i];
      });
      return res.json({ translations: resultsFromCache });
    }

    // Reconstruct full translations in original order and cache the newly translated values
    const fullTranslations = resultsFromCache.slice();
    translations.forEach((val, i) => {
      const idx = missingIndex[i];
      fullTranslations[idx] = val;
      try {
        const key = `${targetLangValue}::${String(missingTexts[i])}`;
        cache.set(key, { value: val, ts: Date.now() });
      } catch (e) {
        /* ignore cache set errors */
      }
    });
    // persist cache async (best-effort)
    try {
      saveCache();
    } catch (e) {
      /* ignore */
    }

    // Defensive checks: detect identical translations or wrong-script results
    // and attempt targeted retries.
    const uniqueTranslations = Array.from(
      new Set(fullTranslations.map((s) => String(s).trim()))
    );
    const uniqueInputs = Array.from(
      new Set(texts.map((s) => String(s).trim()))
    );

    // Check script validity for the target language
    const expectedScript = expectedScriptForLang(targetLangValue);
    const scriptMismatches = [];
    if (expectedScript) {
      fullTranslations.forEach((tr, idx) => {
        const script = detectScript(tr || "");
        if (script && script !== expectedScript) scriptMismatches.push(idx);
      });
    }

    // If model returned one identical translation for many distinct inputs,
    // or many translations are in an unexpected script, try per-item retries
    const suspicious =
      uniqueTranslations.length === 1 && uniqueInputs.length > 1;
    const manyScriptProblems =
      scriptMismatches.length > Math.max(1, texts.length * 0.25);

    if (suspicious || manyScriptProblems) {
      console.warn("Suspicious translation result detected", {
        suspicious,
        manyScriptProblems,
        uniqueTranslationsCount: uniqueTranslations.length,
        scriptMismatchesCount: scriptMismatches.length,
        rawPreview: fullTranslations.slice(0, 5),
      });

      // For typical UI batches, translate problematic items individually
      // to get more accurate results.
      if (texts.length <= 50) {
        const perItem = [];
        for (let i = 0; i < texts.length; i++) {
          // if translation looks OK and not in mismatch list, keep it
          if (!suspicious && !scriptMismatches.includes(i)) {
            perItem.push(fullTranslations[i]);
            continue;
          }

          const item = texts[i];
          try {
            await acquireApiSlot();
            try {
              const r = await fetch(
                "https://api.openai.com/v1/chat/completions",
                {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
                    temperature: 0,
                    messages: [
                      {
                        role: "system",
                        content: `You are a translator. Translate the following string into "${targetLangValue}" and return ONLY the translated string, with no extra text or markdown.`,
                      },
                      {
                        role: "user",
                        content: String(item),
                      },
                    ],
                    max_tokens: 500,
                  }),
                }
              );

              const d = await r.json();
              const c =
                d?.choices?.[0]?.message?.content ??
                d?.choices?.[0]?.text ??
                "";
              perItem.push(c.replace(/```/g, "").trim());
            } finally {
              releaseApiSlot();
            }
          } catch (e) {
            console.error("Per-item translation failed:", e);
            perItem.push(texts[i]);
          }
        }

        // save successful per-item translations to cache
        try {
          perItem.forEach((val, i) => {
            const key = `${targetLangValue}::${String(texts[i])}`;
            cache.set(key, { value: val, ts: Date.now() });
          });
          saveCache();
        } catch (e) {
          /* ignore cache save errors */
        }

        return res.json({ translations: perItem });
      }

      // For large batches, avoid many calls; return originals
      return res.json({ translations: texts });
    }

    // Success - return the full translations array (in original order)
    return res.json({ translations: fullTranslations });
  } catch (err) {
    console.error("Translation route error:", err);
    // safe fallback so frontend continues to work
    return res
      .status(500)
      .json({ error: "Translation failed", translations: texts });
  }
});

export default router;
