// pages/api/translate.js

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { texts, target = "en" } = req.body;

    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ error: "No texts provided" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OpenAI key missing" });
    }

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    // Build numbered text
    const numbered = texts.map((t, i) => `${i + 1}. ${t}`).join("\n");

    const systemPrompt = `
You are a professional translator. 
Translate each line into ${target}.
Return ONLY a JSON object like:
{"translations":["t1","t2","t3"...]}
Do NOT add extra text.
Preserve numbers, punctuation, and formatting.
`;

    const userPrompt = `Translate the following:\n${numbered}`;

    const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "OpenAI error",
      });
    }

    // Extract model response content
    const content =
      data.choices?.[0]?.message?.content || data.choices?.[0]?.text || "";

    // Parse JSON safely
    let parsed;
    try {
      const cleaned = content
        .trim()
        .replace(/^```json/, "")
        .replace(/```$/, "");
      parsed = JSON.parse(cleaned);
    } catch (e) {
      // Fallback: return original texts
      return res.json({ translations: texts });
    }

    return res.json({ translations: parsed.translations });
  } catch (err) {
    console.error("Translation Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
