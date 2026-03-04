import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { UserPlus, Globe, PieChart } from "lucide-react";
import { useEmployer } from "../context/EmployerContext";
import BroadcastDialog from "../components/BroadcastDialog";

export default function EmployerDashboard() {
  const { employer, fetchContractors, contractors } = useEmployer();
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);

  useEffect(() => {
    fetchContractors()
      .then(() => setLastSynced(new Date()))
      .catch(() => {});
  }, [fetchContractors]);

  const regionDistribution = useMemo(() => {
    const map = new Map();
    (contractors || []).forEach((c) => {
      const region = (c.region || "Unknown").trim() || "Unspecified";
      map.set(region, (map.get(region) || 0) + 1);
    });
    if (!map.size) return [];
    return Array.from(map.entries())
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => b.count - a.count);
  }, [contractors]);

  const summaryCards = useMemo(() => {
    const total = contractors?.length ?? 0;
    const regionCount = regionDistribution.length;
    return [
      {
        label: "Contractors linked",
        value: total,
        helper: `${total} verified partners`,
        icon: UserPlus,
      },
      {
        label: "Regions covered",
        value: regionCount || "—",
        helper: regionDistribution[0]
          ? `Top: ${regionDistribution[0].region}`
          : "Add contractors",
        icon: Globe,
      },
      {
        label: "Last synced",
        value: lastSynced
          ? new Intl.DateTimeFormat("en-IN", {
              hour: "numeric",
              minute: "numeric",
              hour12: true,
            }).format(lastSynced)
          : "Pending",
        helper: "Refresh page to update",
        icon: PieChart,
      },
    ];
  }, [contractors, regionDistribution, lastSynced]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <section className="rounded-[36px] border border-white/20 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-6 text-white shadow-2xl">
          <div className="flex flex-col gap-6 text-sm lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-300">
                Employer cockpit
              </p>
              <h1 className="mt-2 text-3xl font-semibold">
                {employer?.name ?? "JeevanRakshak Employer"}
              </h1>
              <p className="mt-2 text-sm text-slate-300">
                Manage the contractors you trust, broadcast updates, and keep
                every health touchpoint synchronized.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/employer/contractors"
                className="rounded-2xl bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-white/20"
              >
                See contractor roster
              </Link>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {summaryCards.map((card) => {
              const CardIcon = card.icon;
              return (
                <article
                  key={card.label}
                  className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 shadow-xl"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.4em] text-white/70">
                      {card.label}
                    </p>
                    <CardIcon className="h-5 w-5 text-emerald-300" />
                  </div>
                  <p className="mt-3 text-3xl font-semibold">{card.value}</p>
                  <p className="mt-1 text-xs text-white/70">{card.helper}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="grid gap-6 rounded-[28px] bg-white p-6 text-slate-800 shadow-lg lg:grid-cols-[1.4fr_0.6fr]">
          <div>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">
                  Broadcast
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  Share a quick update
                </h2>
                <p className="text-sm text-slate-500">
                  Inform contractors about new campaigns, compliance reminders,
                  or urgent alerts.
                </p>
              </div>
              <button
                onClick={() => setShowBroadcast(true)}
                className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Broadcast
              </button>
            </div>
            <div className="mt-6 grid gap-3 rounded-2xl border border-slate-100/80 bg-slate-50 p-4 text-sm">
              <p className="text-slate-600">
                Contractors linked: {contractors?.length ?? 0}
              </p>
              <p className="text-slate-600">
                Regions covered: {regionDistribution.length || "—"}
              </p>
              <p className="text-slate-600">
                Last synced:{" "}
                {lastSynced ? lastSynced.toLocaleString() : "Just now"}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-100/80 bg-slate-950/90 p-5 text-white">
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-200">
              Region snapshot
            </h3>
            <div className="flex flex-wrap gap-2 text-xs text-slate-300">
              {regionDistribution.length ? (
                regionDistribution.slice(0, 5).map((entry) => (
                  <span
                    key={entry.region}
                    className="rounded-full bg-emerald-500/20 px-3 py-1 text-emerald-100"
                  >
                    {entry.region}: {entry.count}
                  </span>
                ))
              ) : (
                <p className="text-slate-400">
                  Add contractors to see region data
                </p>
              )}
            </div>
            <Link
              to="/employer/contractors"
              className="mt-auto rounded-2xl border border-white/40 px-4 py-2 text-center text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:border-white"
            >
              Manage contractors
            </Link>
          </div>
        </section>

        <BroadcastDialog
          open={showBroadcast}
          onClose={() => setShowBroadcast(false)}
          contractorCount={contractors?.length ?? 0}
        />
      </div>
    </div>
  );
}
