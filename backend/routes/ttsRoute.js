import express from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const router = express.Router();

// Simple local file cache directory
const STORAGE_DIR = path.join(process.cwd(), "storage", "tts");

// Ensure storage dir exists
fs.mkdirSync(STORAGE_DIR, { recursive: true });

router.get("/", async (req, res) => {
  try {
    const text = req.query.text;
    const lang = (req.query.lang || "en").split("-")[0];

    if (!text) return res.status(400).json({ error: "text query required" });

    // cache key
    const key = crypto
      .createHash("sha256")
      .update(lang + "::" + text)
      .digest("hex");
    const filename = `${key}.mp3`;
    const filepath = path.join(STORAGE_DIR, filename);

    if (fs.existsSync(filepath)) {
      return res.json({ url: `/tts-audio/${filename}`, cache: true });
    }

    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_KEY)
      return res.status(500).json({ error: "OpenAI API key not configured" });

    // Call OpenAI TTS endpoint
    const model = process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts";

    const body = JSON.stringify({ model, voice: "alloy", input: String(text) });

    const resp = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body,
    });

    if (!resp.ok) {
      const txt = await resp.text();
      return res
        .status(502)
        .json({ error: "TTS provider error", details: txt });
    }

    const buffer = Buffer.from(await resp.arrayBuffer());

    await fs.promises.writeFile(filepath, buffer);

    return res.json({ url: `/tts-audio/${filename}`, cache: false });
  } catch (err) {
    console.error("/api/tts error:", err);
    return res.status(500).json({ error: "internal" });
  }
});

export default router;
