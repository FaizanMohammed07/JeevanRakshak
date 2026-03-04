import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Briefcase,
  Link as LinkIcon,
  Users,
  MessageCircle,
  ShieldCheck,
  PieChart,
} from "lucide-react";
import { useEmployer } from "../context/EmployerContext";
import { linkContractorByPhone, unlinkContractor } from "../api/employers";

export default function EmployerContractors() {
  const { contractors = [], fetchContractors } = useEmployer();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchContractors().catch(() => {});
  }, [fetchContractors]);

  const handleLink = async () => {
    if (!phone.trim()) {
      setError("Enter a contractor phone number first.");
      return;
    }
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      await linkContractorByPhone(phone);
      await fetchContractors();
      setPhone("");
      setSuccessMessage("Contractor linked successfully.");
    } catch (err) {
      setError(err.response?.data?.msg || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async (id) => {
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      await unlinkContractor(id);
      await fetchContractors();
      setSuccessMessage("Contractor unlinked successfully.");
    } catch (err) {
      setError(err.response?.data?.msg || err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredContractors = useMemo(() => {
    if (!searchTerm) return contractors;
    const normalized = searchTerm.trim().toLowerCase();
    return contractors.filter((contractor) => {
      const nameMatch = contractor.name?.toLowerCase().includes(normalized);
      const phoneMatch = contractor.phoneNumber?.includes(normalized);
      const regionMatch = contractor.region?.toLowerCase().includes(normalized);
      return nameMatch || phoneMatch || regionMatch;
    });
  }, [contractors, searchTerm]);

  const regionDistribution = useMemo(() => {
    const bucket = new Map();
    contractors.forEach((contractor) => {
      const region = contractor.region?.trim() || "Unspecified";
      bucket.set(region, (bucket.get(region) || 0) + 1);
    });
    return Array.from(bucket.entries())
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => b.count - a.count);
  }, [contractors]);

  const totalContractors = contractors.length;
  const shownCount = filteredContractors.length;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="rounded-[36px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-2xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-200">
                Contractor command
              </p>
              <h1 className="mt-2 text-3xl font-semibold">
                Contractor relationships
              </h1>
              <p className="text-sm text-white/80">
                Manage the contractors that staff your health missions and keep
                every region compliant with real-time oversight.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.3em]">
              <Link
                to="/employer"
                className="rounded-2xl border border-white/40 px-4 py-2 text-white transition hover:border-white"
              >
                Back to dashboard
              </Link>
              <button
                onClick={() => fetchContractors().catch(() => {})}
                className="rounded-2xl border border-white/40 px-4 py-2 text-white transition hover:border-white"
              >
                Refresh
              </button>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/20 bg-white/5 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.4em] text-white/70">
                Total contractors
              </p>
              <p className="text-3xl font-semibold">{totalContractors}</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/5 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.4em] text-white/70">
                Regions active
              </p>
              <p className="text-3xl font-semibold">
                {regionDistribution.length || "—"}
              </p>
            </div>
          </div>
        </header>

        <section className="rounded-[28px] bg-white p-6 shadow-lg">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
                Link contractor
              </p>
              <h2 className="text-2xl font-semibold text-slate-900">
                Bring a new partner online
              </h2>
              <p className="text-sm text-slate-500">
                Share the employer token once and we'll attach the contractor to
                your roster.
              </p>
            </div>
            <button
              onClick={handleLink}
              disabled={loading}
              className="w-full rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 md:w-auto"
            >
              {loading ? "Linking..." : "Link contractor"}
            </button>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="sr-only" htmlFor="contractor-phone">
              Contractor phone
            </label>
            <input
              id="contractor-phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Enter contractor phone"
              className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-base text-slate-700 shadow-sm focus:border-slate-500 focus:outline-none"
            />
            <p className="text-xs text-slate-500">
              We only allow 10-digit numbers that are already registered.
            </p>
          </div>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            {error && <p className="text-red-600">{error}</p>}
            {successMessage && (
              <p className="text-emerald-600">{successMessage}</p>
            )}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.9fr]">
          <div className="rounded-[28px] bg-white p-6 shadow-lg">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
                <Briefcase className="h-4 w-4 text-slate-400" />
                Contractor log
              </div>
              <span className="text-xs text-slate-500">
                Showing {shownCount} of {totalContractors}
              </span>
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by name, phone, or region"
                className="flex-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none"
              />
              <span className="text-xs text-slate-400">
                Tip: try a district or phone snippet.
              </span>
            </div>
            <div className="mt-5 grid gap-4">
              {filteredContractors.length ? (
                filteredContractors.map((contractor) => (
                  <article
                    key={contractor._id}
                    className="rounded-2xl border border-slate-100/80 bg-slate-50/70 p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-lg font-semibold text-slate-900">
                          {contractor.name || "Contractor"}
                        </p>
                        <p className="text-sm text-slate-600">
                          {contractor.companyName || "Independent"}
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-600">
                        {contractor.region || "Unspecified"}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between text-sm text-slate-500">
                      <p>Phone: {contractor.phoneNumber || "—"}</p>
                      <p>
                        Linked on{" "}
                        {contractor.createdAt
                          ? new Date(contractor.createdAt).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => handleUnlink(contractor._id)}
                        disabled={loading}
                        className="rounded-2xl border border-red-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-red-600 transition hover:border-red-400"
                      >
                        Unlink
                      </button>
                      <Link
                        to={`/employer/contractors/${contractor._id}`}
                        className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-900 transition hover:border-slate-400"
                      >
                        <LinkIcon className="h-3 w-3" />
                        View
                      </Link>
                    </div>
                  </article>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  No contractors found. Expand your roster to see data here.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <aside className="rounded-[28px] bg-white p-6 shadow-lg">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
                <Users className="h-4 w-4 text-slate-400" />
                Region coverage
              </div>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                {regionDistribution.length ? (
                  regionDistribution.map((entry) => (
                    <div
                      key={entry.region}
                      className="flex items-center justify-between rounded-2xl bg-slate-100/60 px-4 py-2"
                    >
                      <span>{entry.region}</span>
                      <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                        {entry.count}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500">
                    No regions yet. Link contractors to see distribution.
                  </p>
                )}
              </div>
            </aside>
            <aside className="rounded-[28px] bg-gradient-to-br from-emerald-500/90 to-slate-900 p-6 text-white shadow-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-100">
                Command center
              </p>
              <h3 className="mt-2 text-xl font-semibold">
                Operate with clarity
              </h3>
              <p className="mt-1 text-sm text-emerald-100/80">
                Quick links, live alerts, and broadcast access for every
                mission.
              </p>
              <div className="mt-4 grid gap-3 text-sm font-semibold uppercase tracking-[0.3em]">
                {["Live roster", "Broadcast", "Compliance"].map(
                  (label, index) => (
                    <button
                      key={label}
                      className="flex items-center justify-between rounded-2xl border border-white/40 bg-white/10 px-3 py-3 text-left transition hover:border-white"
                    >
                      <span>{label}</span>
                      {index === 0 && <Users className="h-4 w-4" />}
                      {index === 1 && <MessageCircle className="h-4 w-4" />}
                      {index === 2 && <ShieldCheck className="h-4 w-4" />}
                    </button>
                  )
                )}
              </div>
              <div className="mt-6 grid gap-3 text-sm text-emerald-100">
                <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-2">
                  <span>Contractors linked</span>
                  <span>{totalContractors}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-2">
                  <span>Regions active</span>
                  <span>{regionDistribution.length || "—"}</span>
                </div>
                <Link
                  to="/employer"
                  className="mt-2 flex items-center justify-center rounded-2xl border border-white/40 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white"
                >
                  <PieChart className="mr-2 h-3 w-3" /> Mission overview
                </Link>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </div>
  );
}
