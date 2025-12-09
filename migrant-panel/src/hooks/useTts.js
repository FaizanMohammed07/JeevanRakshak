import { useCallback } from "react";
import { TTS_LANG_MAP } from "../i18n/ttsMap";

export default function useTts() {
  const speakBrowser = useCallback((text, lang) => {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined" || !window.speechSynthesis)
        return reject(new Error("No browser TTS"));

      try {
        window.speechSynthesis.cancel();
      } catch (e) {}

      const utter = new SpeechSynthesisUtterance(String(text));
      utter.lang = TTS_LANG_MAP[lang]?.locale || lang + "-IN" || "en-US";
      utter.rate = 0.98;
      utter.pitch = 1;
      utter.onend = () => resolve();
      utter.onerror = (e) => reject(e);

      // Try to pick a voice matching the language
      try {
        const voices = window.speechSynthesis.getVoices() || [];
        let code = (lang || "en").toLowerCase();
        let voice = voices.find(
          (v) => v.lang && v.lang.toLowerCase().startsWith(code)
        );
        if (!voice)
          voice = voices.find(
            (v) => v.lang && v.lang.toLowerCase().includes(code)
          );
        if (voice) utter.voice = voice;
      } catch (e) {
        // ignore voice selection errors
      }

      try {
        window.speechSynthesis.speak(utter);
      } catch (err) {
        reject(err);
      }
    });
  }, []);

  const speakServer = useCallback(async (text, lang) => {
    // const url = `http://localhost:8080/api/tts?text=${encodeURIComponent(
    //   text
    // )}&lang=${encodeURIComponent(lang)}`;
    const url = `${
      import.meta.env.VITE_API_URL
    }/api/tts?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(
      lang
    )}`;
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`TTS server error: ${txt}`);
    }
    const json = await res.json();
    if (!json.url) throw new Error("No audio url returned");
    // ensure absolute URL (backend returns relative path like '/tts-audio/<file>')
    // const audioUrl = json.url.startsWith("http")
    //   ? json.url
    //   : `http://localhost:8080${json.url}`;
    const audioUrl = json.url.startsWith("http")
      ? json.url
      : `${import.meta.env.VITE_API_URL}${json.url}`;
    // play
    return new Promise((resolve, reject) => {
      const audio = new Audio(audioUrl);
      audio.onended = resolve;
      audio.onerror = (e) => reject(e);
      audio.play().catch(reject);
    });
  }, []);

  // Helper: determine if browser has a matching local voice for the language
  const hasLocalVoice = useCallback((lang) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return false;
    try {
      const voices = window.speechSynthesis.getVoices() || [];
      const code = (lang || "en").toLowerCase();
      if (!voices.length) return false;
      return (
        voices.some((v) => v.lang && v.lang.toLowerCase().startsWith(code)) ||
        voices.some((v) => v.lang && v.lang.toLowerCase().includes(code)) ||
        voices.some((v) => v.name && v.name.toLowerCase().includes(code))
      );
    } catch (e) {
      return false;
    }
  }, []);

  const speak = useCallback(
    async (text, lang = "en") => {
      // If requested language is non-English and browser lacks a matching voice,
      // prefer server-side TTS to ensure correct pronunciation (numbers/names).
      if (lang && lang !== "en" && !hasLocalVoice(lang)) {
        try {
          await speakServer(text, lang);
          return { provider: "server" };
        } catch (err) {
          console.warn(
            "Server TTS failed, attempting browser as fallback:",
            err
          );
          // attempt browser as last resort
          await speakBrowser(text, lang);
          return { provider: "browser-fallback" };
        }
      }

      // Otherwise prefer browser TTS first
      try {
        await speakBrowser(text, lang);
        return { provider: "browser" };
      } catch (e) {
        console.info("Browser TTS failed, falling back to server TTS:", e);
        await speakServer(text, lang);
        return { provider: "server" };
      }
    },
    [speakBrowser, speakServer, hasLocalVoice]
  );

  // Speak an array of chunks sequentially with small pauses.
  const speakSequence = useCallback(
    async (chunks = [], lang = "en", { pauseMs = 300 } = {}) => {
      for (let i = 0; i < chunks.length; i++) {
        const chunk = String(chunks[i] || "").trim();
        if (!chunk) continue;
        // For each chunk prefer same logic as speak()
        try {
          await speak(chunk, lang);
        } catch (err) {
          // If a chunk failed, retry once with server TTS
          console.warn("TTS chunk failed, retrying with server:", err);
          try {
            await speakServer(chunk, lang);
          } catch (err2) {
            console.error("TTS chunk server retry failed:", err2);
          }
        }

        // small pause between chunks to improve clarity
        if (pauseMs > 0 && i < chunks.length - 1) {
          await new Promise((r) => setTimeout(r, pauseMs));
        }
      }
      return { provider: "sequence" };
    },
    [speak, speakServer]
  );

  return { speak, speakBrowser, speakServer };
}
