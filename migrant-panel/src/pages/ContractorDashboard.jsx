import React, { useState } from "react";
import { useContractor } from "../context/ContractorContext";

export default function ContractorDashboard() {
  const { broadcast, loading } = useContractor();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(null);

  const handleSend = async () => {
    setStatus(null);
    try {
      await broadcast({ title, message });
      setStatus({ ok: true, msg: "Broadcast queued" });
      setTitle("");
      setMessage("");
      setOpen(false);
    } catch (err) {
      setStatus({ ok: false, msg: err.response?.data?.msg || err.message });
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h3 className="text-2xl font-bold">Contractor Dashboard</h3>
      <p className="mt-3 text-sm text-slate-600">
        Welcome to the contractor dashboard. Use the broadcast tool to message
        your linked patients.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-md border p-4">
          <h4 className="font-semibold">Active Contracts</h4>
          <p className="mt-2 text-sm text-slate-500">No data (placeholder)</p>
        </div>
        <div className="rounded-md border p-4">
          <h4 className="font-semibold">Notifications</h4>
          <p className="mt-2 text-sm text-slate-500">No notifications</p>
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={() => setOpen(true)}
          className="rounded-md bg-sky-600 px-4 py-2 text-white"
        >
          Broadcast Message to Patients
        </button>
        {status && (
          <div
            className={`mt-3 ${
              status.ok ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {status.msg}
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-xl rounded-lg bg-white p-6 shadow-2xl">
            <h4 className="text-lg font-semibold">
              Broadcast to Linked Patients
            </h4>
            <p className="text-sm text-slate-600 mt-1">
              This will send a WhatsApp message to all patients linked to you.
            </p>

            <div className="mt-4">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Optional title"
                className="w-full rounded-md border px-3 py-2"
              />
            </div>

            <div className="mt-3">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Message body"
                rows={4}
                className="w-full rounded-md border px-3 py-2"
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="rounded-md border px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                className="rounded-md bg-sky-600 px-4 py-2 text-white disabled:opacity-60"
                disabled={loading || !message.trim()}
              >
                Send Broadcast
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
