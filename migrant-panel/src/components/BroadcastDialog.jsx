import { useState } from "react";
import { broadcastToContractors as apiBroadcast } from "../api/employers";

export default function BroadcastDialog({ open, onClose }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  if (!open) return null;

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
      setSuccess("Broadcast started — contractors will receive the message shortly.");
      setTitle("");
      setMessage("");
      setTimeout(() => {
        setLoading(false);
        onClose?.();
      }, 700);
    } catch (err) {
      setLoading(false);
      setError(err?.response?.data?.msg || err?.response?.data?.message || err.message || "Failed");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg bg-white rounded shadow-lg p-6 mx-4">
        <h3 className="text-lg font-semibold">Broadcast to Contractors</h3>
        <p className="text-sm text-slate-600 mb-4">This will send a WhatsApp message to all contractors linked to your employer account.</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium">Title</label>
            <input
              className="mt-1 block w-full rounded border px-3 py-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short headline"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Message</label>
            <textarea
              className="mt-1 block w-full rounded border px-3 py-2 h-28"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Message to send via WhatsApp to your contractors"
            />
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}
          {success && <div className="text-green-600 text-sm">{success}</div>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="px-4 py-2 rounded border bg-white"
              onClick={() => onClose?.()}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Sending…" : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
