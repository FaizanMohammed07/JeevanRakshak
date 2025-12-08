// backend/routes/translateRoute.js
import express from "express";

const router = express.Router();

/**
 * POST /api/translate
 * Body: { texts: string[], target?: 'en'|'hi'|... }
 * Response: { translations: string[] }
 */
router.post("/", async (req, res) => {
  const { texts = [], target = "en" } = req.body ?? {};

  if (!Array.isArray(texts) || texts.length === 0) {
    return res.status(400).json({ error: "texts must be a non-empty array" });
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error("OpenAI API key missing");
    return res.status(500).json({ error: "OpenAI key not configured" });
  }

  try {
    // Build a strict instruction asking for JSON output.
    const systemPrompt = `
You are a translation engine. Translate each input string independently into "${target}".
Return EXACTLY a JSON object in the following format (no extra text):

{
  "translations": ["t1", "t2", "t3", ...]
}

Rules:
- Preserve order.
- If an item is an empty string, return an empty string for that index.
- Do NOT add commentary or explanation.
- Do NOT wrap output in markdown unless it is only a JSON block.
`;

    // We send the texts array as JSON so the model knows boundaries.
    const userPrompt = `Translate this JSON array of strings:\n${JSON.stringify(
      texts
    )}`;

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
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
    });

    const data = await resp.json();

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

    // If parsing failed or translations missing, fallback to originals
    if (!parsed || !Array.isArray(parsed.translations)) {
      console.warn(
        "OpenAI response did not include parsed.translations - falling back to originals."
      );
      return res.json({ translations: texts });
    }

    // If translations array length mismatches, fix by mapping where necessary
    const translations = parsed.translations;
    if (!Array.isArray(translations) || translations.length !== texts.length) {
      // Make a best-effort mapping: pad/truncate to match original length
      const fixed = texts.map((_, i) =>
        typeof translations[i] === "string" ? translations[i] : texts[i]
      );
      return res.json({ translations: fixed });
    }

    // Success
    return res.json({ translations });
  } catch (err) {
    console.error("Translation route error:", err);
    // safe fallback so frontend continues to work
    return res
      .status(500)
      .json({ error: "Translation failed", translations: texts });
  }
});

export default router;
