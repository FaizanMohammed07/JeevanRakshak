import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileText,
  Megaphone,
  RefreshCw,
  Syringe,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { usePatientData } from "../context/PatientsContext";
import { fetchHeroAnnouncements } from "../api/announcements";

export default function Dashboard() {
  const { patient } = useAuth();
  const {
    prescriptions,
    labReports,
    loadPrescriptions,
    loadLabReports,
    status,
    errors,
  } = usePatientData();
  const [heroAnnouncements, setHeroAnnouncements] = useState([]);
  const [activeAnnouncementIndex, setActiveAnnouncementIndex] = useState(0);
  const [announcementsStatus, setAnnouncementsStatus] = useState("loading");
  const [announcementError, setAnnouncementError] = useState(null);

  const loadHeroAnnouncements = useCallback(async ({ showLoading } = {}) => {
    if (showLoading) {
      setAnnouncementsStatus("loading");
    }
    try {
      const data = await fetchHeroAnnouncements("Patients");
      setHeroAnnouncements(data);
      setActiveAnnouncementIndex(0);
      setAnnouncementError(null);
      setAnnouncementsStatus("success");
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Unable to load announcements";
      setHeroAnnouncements([]);
      setAnnouncementError(message);
      setAnnouncementsStatus("error");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    startTransition(() => {
      if (cancelled) return;
      loadPrescriptions();
      loadLabReports();
      loadHeroAnnouncements();
    });
    return () => {
      cancelled = true;
    };
  }, [loadPrescriptions, loadLabReports, loadHeroAnnouncements]);

  useEffect(() => {
    if (heroAnnouncements.length <= 1) return undefined;
    const interval = setInterval(() => {
      setActiveAnnouncementIndex(
        (prev) => (prev + 1) % heroAnnouncements.length
      );
    }, 8000);
    return () => clearInterval(interval);
  }, [heroAnnouncements]);

  const handleAnnouncementNav = (direction) => {
    if (heroAnnouncements.length <= 1) return;
    setActiveAnnouncementIndex((prev) => {
      const total = heroAnnouncements.length;
      return (prev + direction + total) % total;
    });
  };

  const statCards = useMemo(() => {
    const vaccinations = patient?.vaccinations || [];
    const visits = patient?.visits || [];

    return [
      {
        label: "Total Prescriptions",
        value: prescriptions.length,
        icon: FileText,
        accent: "bg-blue-50 text-blue-600",
      },
      {
        label: "Vaccinations Completed",
        value: vaccinations.length,
        icon: Syringe,
        accent: "bg-emerald-50 text-emerald-600",
      },
      {
        label: "Recorded Visits",
        value: visits.length,
        icon: CalendarDays,
        accent: "bg-amber-50 text-amber-600",
      },
      {
        label: "Lab Reports",
        value: labReports.length,
        icon: Activity,
        accent: "bg-purple-50 text-purple-600",
      },
    ];
  }, [patient, prescriptions.length, labReports.length]);

  const hasAnnouncements = heroAnnouncements.length > 0;
  const activeAnnouncement = hasAnnouncements
    ? heroAnnouncements[activeAnnouncementIndex]
    : null;
  const isAnnouncementsLoading = announcementsStatus === "loading";

  return (
    <section className="w-full space-y-8">
      <header className="rounded-3xl bg-white px-6 py-5 shadow-sm ring-1 ring-slate-100">
        <p className="text-sm font-medium uppercase tracking-widest text-slate-400">
          Overview
        </p>
        <h2 className="text-3xl font-semibold text-slate-900">Dashboard</h2>
        <p className="text-sm text-slate-500">
          Track prescriptions, vaccinations, visits and diagnostics in one
          place.
        </p>
      </header>

      <section className="rounded-3xl bg-gradient-to-r from-slate-900 via-blue-900 to-sky-700 px-6 py-6 text-white shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.4em] text-white/70">
              <Megaphone className="h-4 w-4 text-white" />
              {hasAnnouncements ? "Broadcast" : "No Broadcast"}
            </p>
            <h3 className="text-2xl font-semibold">
              {hasAnnouncements
                ? activeAnnouncement.title
                : "You're up to date"}
            </h3>
            <p className="text-sm text-white/80">
              {hasAnnouncements
                ? activeAnnouncement.message
                : "We will surface government advisories and healthcare alerts here as soon as they are issued."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => loadHeroAnnouncements({ showLoading: true })}
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white hover:bg-white/10"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${
                  isAnnouncementsLoading ? "animate-spin" : ""
                }`}
              />
              Refresh
            </button>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleAnnouncementNav(-1)}
                className="rounded-full border border-white/30 p-2 text-white hover:bg-white/10 disabled:opacity-40"
                disabled={heroAnnouncements.length <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleAnnouncementNav(1)}
                className="rounded-full border border-white/30 p-2 text-white hover:bg-white/10 disabled:opacity-40"
                disabled={heroAnnouncements.length <= 1}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-white/80">
          <span>
            Priority: {activeAnnouncement?.priority?.toUpperCase() || "--"}
          </span>
          <span>
            {activeAnnouncement
              ? formatAnnouncementTime(activeAnnouncement.timestamp)
              : "Awaiting broadcast"}
          </span>
          <span className="rounded-full bg-white/15 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.3em]">
            {activeAnnouncement?.audience || "All"}
          </span>
          <span>
            {hasAnnouncements
              ? `${activeAnnouncementIndex + 1} / ${heroAnnouncements.length}`
              : isAnnouncementsLoading
              ? "Syncing..."
              : "No broadcasts"}
          </span>
        </div>
        <div className="mt-4 flex items-center gap-2">
          {heroAnnouncements.map((announcement, index) => (
            <span
              key={announcement.id || index}
              className={`h-1.5 flex-1 rounded-full transition ${
                index === activeAnnouncementIndex ? "bg-white" : "bg-white/30"
              }`}
            ></span>
          ))}
        </div>
        {announcementError && (
          <p className="mt-3 text-xs text-rose-200">{announcementError}</p>
        )}
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Recent Prescriptions"
          status={status.prescriptions}
          error={errors.prescriptions}
          count={prescriptions.length}
          link={{ to: "/prescriptions", label: "View all" }}
        >
          {prescriptions.length === 0 ? (
            <EmptyState
              title="No prescriptions yet"
              message="Your doctor has not issued a prescription."
            />
          ) : (
            <ul className="space-y-4 overflow-y-auto pr-1 lg:max-h-80">
              {prescriptions.slice(0, 4).map((item) => (
                <li
                  key={item._id}
                  className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4"
                >
                  <p className="font-semibold text-slate-900">
                    {item.confirmedDisease ||
                      item.suspectedDisease ||
                      "Diagnosis pending"}
                  </p>
                  <p className="text-sm text-slate-500">{item.symptoms}</p>
                  <p className="text-xs text-slate-400">
                    {formatDate(item.dateOfIssue)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Lab Reports"
          status={status.labs}
          error={errors.labs}
          count={labReports.length}
          link={{ to: "/lab-reports", label: "View all" }}
        >
          {labReports.length === 0 ? (
            <EmptyState
              title="No lab reports"
              message="Uploaded lab reports will appear here."
            />
          ) : (
            <ul className="space-y-4 overflow-y-auto pr-1 lg:max-h-80">
              {labReports.slice(0, 4).map((report) => (
                <li
                  key={`${report.document_name}-${report.uploaded_at}`}
                  className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4"
                >
                  <p className="font-semibold text-slate-900">
                    {report.document_name}
                  </p>
                  <p className="text-sm text-slate-500">
                    {report.document_type || "Report"}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatDate(report.uploaded_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </section>
  );
}

function StatCard({ label, value, icon, accent }) {
  const Icon = icon;
  return (
    <div className="rounded-3xl border border-sky-100 bg-white p-5 shadow-sm">
      <div className={`mb-4 inline-flex rounded-2xl p-3 ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-3xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function SectionCard({ title, status, error, children, count, link }) {
  const isLoading = status === "loading";

  return (
    <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
          {typeof count === "number" && (
            <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-widest text-sky-600">
              {count}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
          {isLoading && <span>Loading</span>}
          {link && (
            <Link
              to={link.to}
              className="rounded-full border border-sky-100 px-2.5 py-1 text-sky-600 hover:bg-sky-50"
            >
              {link.label}
            </Link>
          )}
        </div>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : children}
    </div>
  );
}

function EmptyState({ title, message }) {
  return (
    <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50/70 px-6 py-8 text-center">
      <p className="text-base font-semibold text-slate-800">{title}</p>
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatAnnouncementTime(value) {
  if (!value) return "--";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "--";
  return parsed.toLocaleString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
