import { useEffect, useMemo, useState } from "react";
import { useContractor } from "../context/ContractorContext";
import { BellRing, Megaphone, ShieldCheck, Users } from "lucide-react";

export default function ContractorDashboard() {
  const { workers, fetchWorkers, broadcast } = useContractor();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [status, setStatus] = useState(null);
  const [broadcastLoading, setBroadcastLoading] = useState(false);

  useEffect(() => {
    fetchWorkers().catch(() => {});
  }, [fetchWorkers]);

  const totalPatients = workers?.length ?? 0;
  const liveAlerts = workers?.filter((w) => w?.contagiousAlert?.active) || [];
  const activeAlerts = liveAlerts.length;
  const readyToDispatch = totalPatients - activeAlerts;

  const regionBreakdown = useMemo(() => {
    const stats = new Map();
    (workers || []).forEach((w) => {
      const region = w.district || "Unknown";
      stats.set(region, (stats.get(region) || 0) + 1);
    });
    return Array.from(stats.entries())
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [workers]);

  const handleSendBroadcast = async () => {
    if (!message.trim()) {
      setStatus({ ok: false, msg: "Message cannot be empty" });
      return;
    }
    setBroadcastLoading(true);
    setStatus(null);
    try {
      await broadcast({ title: title.trim(), message: message.trim() });
      setStatus({ ok: true, msg: "Broadcast sent to linked patients." });
      setTitle("");
      setMessage("");
      setBroadcastOpen(false);
    } catch (err) {
      setStatus({
        ok: false,
        msg: err?.response?.data?.msg || err?.message || "Failed to send",
      });
    } finally {
      setBroadcastLoading(false);
    }
  };

  return (
    <div className="space-y-6 bg-slate-950/60 p-6 rounded-[32px] shadow-2xl">
      <section className="rounded-[34px] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 text-white shadow-2xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/70">
              Contractor cockpit
            </p>
            <h1 className="mt-2 text-3xl font-semibold">On-field command</h1>
            <p className="mt-2 text-sm text-white/70">
              Stay ahead of alerts, keep your linked patients informed, and keep the field confident.
            </p>
          </div>
          <button
            onClick={() => setBroadcastOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-400 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300"
          >
            <Megaphone className="h-4 w-4" />
            Broadcast update
          </button>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            {
              label: "Linked patients",
              value: totalPatients,
              helper: `${readyToDispatch} ready`,
              icon: Users,
            },
            {
              label: "Live alerts",
              value: activeAlerts,
              helper: "Action required",
              icon: BellRing,
            },
            {
              label: "Ready to dispatch",
              value: readyToDispatch,
              helper: "No active flags",
              icon: ShieldCheck,
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <article
                key={card.label}
                className="rounded-3xl border border-white/10 bg-white/5 px-4 py-5 shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.4em] text-white/60">
                    {card.label}
                  </p>
                  <Icon className="h-5 w-5 text-emerald-200" />
                </div>
                <p className="mt-3 text-3xl font-semibold">{card.value}</p>
                <p className="mt-1 text-xs text-white/60">{card.helper}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="rounded-[32px] border border-white/10 bg-slate-900/70 p-6 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-4 text-white">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-200">
                Campaign control
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Quick actions
              </h2>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-white/60">
              <span className="rounded-full border border-white/20 px-3 py-1">Auto-sync</span>
              <span className="rounded-full border border-white/20 px-3 py-1">Realtime metrics</span>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <button className="rounded-[22px] border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 px-4 py-3 text-left text-sm font-semibold text-white">
              <p className="text-[0.65rem] uppercase tracking-[0.4em] text-emerald-200">Signal</p>
              <p className="mt-1 text-base">Push daily check-in</p>
            </button>
            <button
              onClick={() => setBroadcastOpen(true)}
              className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-semibold text-white transition hover:-translate-y-0.5"
            >
              <p className="text-[0.65rem] uppercase tracking-[0.4em] text-white/70">Broadcast</p>
              <p className="mt-1 text-base text-white">Message linked patients</p>
            </button>
            <button className="rounded-[22px] border border-white/10 bg-white/10 px-4 py-3 text-left text-sm font-semibold text-white">
              <p className="text-[0.65rem] uppercase tracking-[0.4em] text-white/70">Status</p>
              <p className="mt-1 text-base text-white">Resolve alerts</p>
            </button>
          </div>
        </div>
        <aside className="rounded-[32px] border border-white/10 bg-slate-900/60 p-5 text-white shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-200">
            Regions
          </p>
          <div className="mt-4 space-y-3 text-sm text-white/70">
            {regionBreakdown.length ? (
              regionBreakdown.map((region) => (
                <div
                  key={region.region}
                  className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-2"
                >
                  <span>{region.region}</span>
                  <span className="font-semibold text-white">{region.count}</span>
                </div>
              ))
            ) : (
                <p className="text-white/60">Add patients to see regional data</p>
            )}
          </div>
        </aside>
      </section>

      <section className="rounded-[32px] border border-white/20 bg-slate-900/60 p-6 shadow-lg text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-200">
              Live alerts feed
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              {activeAlerts ? `${activeAlerts} active alert${activeAlerts > 1 ? "s" : ""}` : "All clear"}
            </h2>
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-500">
            sync with field
          </span>
        </div>
        <div className="mt-4 space-y-3">
          {liveAlerts.length ? (
            liveAlerts.slice(0, 4).map((worker) => {
              const alertTime = worker.contagiousAlert?.createdAt
                ? new Date(worker.contagiousAlert.createdAt).toLocaleString()
                : "just now";
              return (
                <div
                  key={worker._id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-sm"
                >
                  <div>
                    <p className="font-semibold">{worker.name}</p>
                    <p className="text-xs text-slate-300">{worker.phoneNumber}</p>
                    <p className="text-xs text-emerald-300">
                      {worker.contagiousAlert?.disease || "unspecified"} · {alertTime}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className="rounded-full border border-emerald-300 px-3 py-1 text-[0.6rem] uppercase tracking-[0.3em] text-emerald-500">
                      Resolve
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="rounded-2xl border border-dashed border-white/20 px-4 py-5 text-sm text-white/60">
              No active alerts right now — everything is calm.
            </p>
          )}
        </div>
      </section>

      {status && (
        <p
          className={`rounded-2xl border px-4 py-3 text-sm ${status.ok ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-rose-300 bg-rose-50 text-rose-700"}`}
        >
          {status.msg}
        </p>
      )}

      {broadcastOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 px-4 py-10 backdrop-blur">
          <div className="w-full max-w-4xl rounded-[32px] border border-white/10 bg-slate-900/90 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-200">
                  Broadcast patients
                </p>
                <h3 className="text-xl font-semibold text-white">Send a calming update</h3>
              </div>
              <button
                onClick={() => setBroadcastOpen(false)}
                className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60"
              >
                Close
              </button>
            </div>
            <div className="mt-5 space-y-4">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Optional headline"
                className="w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/50 focus:border-emerald-400 focus:outline-none"
              />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Message for linked patients"
                rows={5}
                className="w-full rounded-[24px] border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/50 focus:border-emerald-400 focus:outline-none"
              />
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs uppercase tracking-[0.3em] text-emerald-200">
                  <Megaphone className="h-4 w-4" />
                  WhatsApp only
                </span>
                <span className="text-xs uppercase tracking-[0.3em] text-white/60">Message automatically logged</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSendBroadcast}
                  disabled={broadcastLoading}
                  className="flex items-center justify-center rounded-2xl bg-emerald-400 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300 disabled:opacity-60"
                >
                  {broadcastLoading ? "Sending…" : "Send broadcast"}
                </button>
                <button
                  onClick={() => setBroadcastOpen(false)}
                  className="rounded-2xl border border-white/30 px-5 py-2 text-sm font-semibold text-white/70"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
