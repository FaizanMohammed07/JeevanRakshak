import { useState } from "react";
import { CheckCircle2, Megaphone, Sparkles, X } from "lucide-react";
import { broadcastToContractors as apiBroadcast } from "../api/employers";

const templates = [
  {
    title: "Campaign kickoff",
    message:
      "Hello team, we are kicking off a campaign in the north division. Please confirm availability and share any field constraints.",
    helper: "Ideal for new projects",
  },
  {
    title: "Compliance reminder",
    message:
      "Reminder: please submit proof of ID and vaccination by the end of this week so we can keep your contractor status active.",
    helper: "Keeps everyone compliant",
  },
  {
    title: "Urgent dispatch",
    message:
      "Urgent: head to the urgent care center at Sector 5 once you receive the message. Respond when you arrive.",
    helper: "For quick alerts",
  },
];

export default function BroadcastDialog({
  open,
  onClose,
  contractorCount = 0,
}) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  if (!open) return null;

  const applyTemplate = (template) => {
    setTitle(template.title);
    setMessage(template.message);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!title.trim() || !message.trim()) {
      setError("Title and message are required");
      return;
    }
    setLoading(true);
    try {
      await apiBroadcast({ title: title.trim(), message: message.trim() });
      setSuccess("Broadcast queued — contractors will receive it shortly.");
      setTitle("");
      setMessage("");
      setTimeout(() => {
        setLoading(false);
        onClose?.();
      }, 700);
    } catch (err) {
      setLoading(false);
      setError(
        err?.response?.data?.msg ||
          err?.response?.data?.message ||
          err.message ||
          "Failed"
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4 py-10 backdrop-blur">
      <div className="w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 shadow-2xl">
        <div className="relative flex items-start justify-between border-b border-white/5 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/70">
              Broadcast announcement
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-white">
              Multicast a quick update
            </h2>
            <p className="mt-1 text-sm text-white/70">
              WhatsApp message, verified recipients, no extra steps.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onClose?.()}
            className="rounded-full border border-white/20 bg-white/5 p-2 text-white transition hover:border-white/40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="grid gap-6 px-6 py-7 lg:grid-cols-[1.35fr_0.75fr]">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.5em] text-white/60">
                Headline
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Example: Field camp ready for inspections"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-emerald-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.5em] text-white/60">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add any tactical instructions that contractors must read on arrival."
                className="mt-2 h-36 w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-emerald-400 focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-white/60">
              <span className="flex items-center gap-2 rounded-2xl bg-emerald-500/20 px-3 py-1 text-emerald-200">
                <Megaphone className="h-4 w-4" /> WhatsApp
              </span>
              <span className="px-2 py-1 text-white/60">
                Focus on one clear action
              </span>
            </div>
            <div className="space-y-2 text-sm">
              {error && (
                <p className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-amber-200">
                  {error}
                </p>
              )}
              {success && (
                <p className="flex items-center gap-2 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-emerald-100">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  {success}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="flex items-center justify-center rounded-2xl bg-emerald-400 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-60"
                disabled={loading}
              >
                {loading ? "Sending…" : "Send broadcast"}
              </button>
              <button
                type="button"
                onClick={() => onClose?.()}
                className="rounded-2xl border border-white/30 px-5 py-2 text-sm font-semibold text-white/80 transition hover:border-white/60"
                disabled={loading}
              >
                Close
              </button>
            </div>
          </form>

          <aside className="space-y-5 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-200">
                  Ideas
                </p>
                <p className="text-sm text-white/70">Tap to pre-fill copy.</p>
              </div>
              <Sparkles className="h-4 w-4 text-emerald-200" />
            </div>
            <div className="space-y-3">
              {templates.map((template) => (
                <button
                  key={template.title}
                  type="button"
                  onClick={() => applyTemplate(template)}
                  className="group w-full rounded-2xl border border-white/10 bg-slate-900/40 p-3 text-left transition hover:border-emerald-400/60"
                >
                  <p className="text-sm font-semibold text-white transition group-hover:text-emerald-200">
                    {template.title}
                  </p>
                  <p className="mt-1 text-xs text-white/50">
                    {template.helper}
                  </p>
                </button>
              ))}
            </div>
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/10 to-slate-900/30 p-4 text-xs text-slate-200">
              <div className="flex items-center justify-between text-emerald-200">
                <p className="text-[0.65rem] uppercase tracking-[0.5em]">
                  Reach
                </p>
                <p className="text-sm font-semibold">
                  {contractorCount} contractors
                </p>
              </div>
              <p className="mt-2 text-[0.68rem] text-white/80">
                Replies are routed to JeevanRakshak support so you stay focused
                on the field.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
