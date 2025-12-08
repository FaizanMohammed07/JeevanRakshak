import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  Activity,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileText,
  LocateFixed,
  MapPin,
  Megaphone,
  Navigation,
  RefreshCw,
  Route,
  ShieldCheck,
  Syringe,
  Link2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { usePatientData, usePatientReports } from "../context/PatientsContext";
import { fetchHeroAnnouncements } from "../api/announcements";
import useTranslateData from "../hooks/useTranslateData";

export default function Dashboard() {
  const { patient } = useAuth();
  const { t, i18n } = useTranslation();
  const currentLang = (i18n?.language || "en").split("-")[0];

  const {
    prescriptions,
    labReports,
    loadPrescriptions,
    loadLabReports,
    status,
    errors,
  } = usePatientData();

  const {
    reports,
    loading: reportsLoading,
    error: reportsError,
  } = usePatientReports(patient?._id);

  const [heroAnnouncements, setHeroAnnouncements] = useState([]);
  const [activeAnnouncementIndex, setActiveAnnouncementIndex] = useState(0);
  const [announcementsStatus, setAnnouncementsStatus] = useState("loading");
  const [announcementError, setAnnouncementError] = useState(null);

  const loadHeroAnnouncements = useCallback(
    async ({ showLoading, district } = {}) => {
      if (showLoading) setAnnouncementsStatus("loading");
      try {
        const data = await fetchHeroAnnouncements("Patients", { district });
        setHeroAnnouncements(Array.isArray(data) ? data : []);
        setActiveAnnouncementIndex(0);
        setAnnouncementError(null);
        setAnnouncementsStatus("success");
      } catch (error) {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          t("dashboard.errors.announcements");
        setHeroAnnouncements([]);
        setAnnouncementError(message);
        setAnnouncementsStatus("error");
      }
    },
    [t]
  );

  useEffect(() => {
    let cancelled = false;
    startTransition(() => {
      if (cancelled) return;
      loadPrescriptions();
      loadLabReports();
      loadHeroAnnouncements({ district: patient?.district });
    });
    return () => {
      cancelled = true;
    };
  }, [
    loadPrescriptions,
    loadLabReports,
    loadHeroAnnouncements,
    patient?.district,
  ]);

  useEffect(() => {
    if ((heroAnnouncements || []).length <= 1) return undefined;
    const interval = setInterval(() => {
      setActiveAnnouncementIndex(
        (prev) => (prev + 1) % (heroAnnouncements.length || 1)
      );
    }, 8000);
    return () => clearInterval(interval);
  }, [heroAnnouncements]);

  const handleAnnouncementNav = (direction) => {
    if ((heroAnnouncements || []).length <= 1) return;
    setActiveAnnouncementIndex((prev) => {
      const total = heroAnnouncements.length || 1;
      return (prev + direction + total) % total;
    });
  };

  // ---------------- TRANSLATION HOOKS ----------------
  // Hook short-circuits when currentLang === 'en' (no translation calls)
  const translatedAnnouncements = useTranslateData(
    heroAnnouncements,
    currentLang === "en" ? [] : ["title", "message", "audience", "priority"],
    currentLang
  );
  console.log("RAW FIRST ANNOUNCEMENT:", heroAnnouncements[0]);
  console.log("TRANSLATED FIRST ANNOUNCEMENT:", translatedAnnouncements[0]);

  const translatedPrescriptions = useTranslateData(
    prescriptions,
    currentLang === "en"
      ? []
      : ["confirmedDisease", "suspectedDisease", "symptoms"],
    currentLang
  );

  const translatedReports = useTranslateData(
    reports,
    currentLang === "en" ? [] : ["documentName"],
    currentLang
  );

  const translatedVaccinations = useTranslateData(
    patient?.vaccinations || [],
    currentLang === "en"
      ? []
      : ["name", "location", "notes", "provider", "reason"],
    currentLang
  );

  const translatedVisits = useTranslateData(
    patient?.visits || [],
    currentLang === "en" ? [] : ["name", "location", "notes", "reason"],
    currentLang
  );

  // ALWAYS use translated arrays in the UI (prevents flicker)
  const hasAnnouncements = (translatedAnnouncements || []).length > 0;
  const activeAnnouncement = hasAnnouncements
    ? translatedAnnouncements[activeAnnouncementIndex] ||
      translatedAnnouncements[0]
    : null;
  const isAnnouncementsLoading = announcementsStatus === "loading";

  const statCards = useMemo(() => {
    const vaccinations = translatedVaccinations || patient?.vaccinations || [];
    const visits = translatedVisits || patient?.visits || [];

    return [
      {
        label: t("dashboard.stats.totalPrescriptions"),
        value: translatedPrescriptions.length,
        icon: FileText,
        accent: "bg-blue-50 text-blue-600",
      },
      {
        label: t("dashboard.stats.vaccinations"),
        value: vaccinations.length,
        icon: Syringe,
        accent: "bg-emerald-50 text-emerald-600",
      },
      {
        label: t("dashboard.stats.visits"),
        value: visits.length,
        icon: CalendarDays,
        accent: "bg-amber-50 text-amber-600",
      },
      {
        label: t("dashboard.stats.labs"),
        value: translatedReports.length,
        icon: Activity,
        accent: "bg-purple-50 text-purple-600",
      },
    ];
  }, [
    patient,
    translatedPrescriptions.length,
    translatedReports.length,
    translatedVaccinations,
    translatedVisits,
    t,
  ]);

  return (
    <section className="w-full space-y-8">
      <header className="rounded-3xl bg-white px-6 py-5 shadow-sm ring-1 ring-slate-100">
        <p className="text-sm font-medium uppercase tracking-widest text-slate-400">
          {t("common.overview")}
        </p>
        <h2 className="text-3xl font-semibold text-slate-900">
          {t("common.dashboard")}
        </h2>
        <p className="text-sm text-slate-500">{t("dashboard.subtitle")}</p>
      </header>

      <section className="rounded-3xl bg-gradient-to-r from-slate-900 via-blue-900 to-sky-700 px-6 py-6 text-white shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.4em] text-white/70">
              <Megaphone className="h-4 w-4 text-white" />
              {hasAnnouncements
                ? t("dashboard.broadcast")
                : t("dashboard.noBroadcast")}
            </p>

            <h3 className="text-2xl font-semibold">
              {hasAnnouncements
                ? activeAnnouncement?.title
                : t("dashboard.upToDate")}
            </h3>

            <p className="text-sm text-white/80">
              {hasAnnouncements
                ? activeAnnouncement?.message
                : t("dashboard.defaultMessage")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                loadHeroAnnouncements({
                  showLoading: true,
                  district: patient?.district,
                })
              }
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white hover:bg-white/10"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${
                  isAnnouncementsLoading ? "animate-spin" : ""
                }`}
              />
              {t("common.refresh")}
            </button>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleAnnouncementNav(-1)}
                className="rounded-full border border-white/30 p-2 text-white hover:bg-white/10 disabled:opacity-40"
                disabled={(translatedAnnouncements || []).length <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => handleAnnouncementNav(1)}
                className="rounded-full border border-white/30 p-2 text-white hover:bg-white/10 disabled:opacity-40"
                disabled={(translatedAnnouncements || []).length <= 1}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-white/80">
          <span>
            {t("common.priority")}:{" "}
            {activeAnnouncement?.priority?.toUpperCase() || "--"}
          </span>

          <span>
            {activeAnnouncement
              ? formatAnnouncementTime(activeAnnouncement.timestamp)
              : t("common.awaiting")}
          </span>

          <span className="rounded-full bg-white/15 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.3em]">
            {activeAnnouncement?.audience || t("common.audienceAll")}
          </span>

          <span>
            {hasAnnouncements
              ? `${activeAnnouncementIndex + 1} / ${
                  (translatedAnnouncements || []).length
                }`
              : isAnnouncementsLoading
              ? t("common.syncing")
              : t("common.noBroadcasts")}
          </span>
        </div>

        <div className="mt-4 flex items-center gap-2">
          {(translatedAnnouncements || []).map((announcement, index) => (
            <span
              key={announcement.id || index}
              className={`h-1.5 flex-1 rounded-full transition ${
                index === activeAnnouncementIndex ? "bg-white" : "bg-white/30"
              }`}
            />
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

      <NearbyHospitalsCTA />

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title={t("dashboard.sections.recentPrescriptions.title")}
          status={status.prescriptions}
          error={errors.prescriptions}
          count={translatedPrescriptions.length}
          link={{
            to: "/prescriptions",
            label: t("common.viewAll"),
          }}
        >
          {translatedPrescriptions.length === 0 ? (
            <EmptyState
              title={t("dashboard.sections.recentPrescriptions.emptyTitle")}
              message={t("dashboard.sections.recentPrescriptions.emptyMessage")}
            />
          ) : (
            <ul className="space-y-4 overflow-y-auto pr-1 lg:max-h-80">
              {translatedPrescriptions.slice(0, 4).map((item, idx) => (
                <li
                  key={item._id || `${idx}-${item.dateOfIssue}`}
                  className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4"
                >
                  <p className="font-semibold text-slate-900">
                    {item.confirmedDisease ||
                      item.suspectedDisease ||
                      t("common.diagnosisPending")}
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
          title={t("dashboard.sections.labReports.title")}
          error={reportsError}
          count={translatedReports.length}
          link={{
            to: "/lab-reports",
            label: t("common.viewAll"),
          }}
        >
          {translatedReports.length === 0 ? (
            <EmptyState
              title={t("dashboard.sections.labReports.emptyTitle")}
              message={t("dashboard.sections.labReports.emptyMessage")}
            />
          ) : (
            <ul className="space-y-4 overflow-y-auto pr-1 lg:max-h-80">
              {translatedReports.slice(0, 4).map((report, idx) => (
                <li
                  key={`${report.documentName || idx}-${
                    report.uploaded_at || report.createdAt || idx
                  }`}
                  className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4"
                >
                  <p className="font-semibold text-slate-900">
                    {report.documentName || t("common.labReport")}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatDate(report.createdAt)}
                  </p>
                  {report.file ? (
                    <a
                      href={report.file}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sky-600"
                    >
                      <Link2 className="h-4 w-4" />
                      {t("labReports.report.view")}
                    </a>
                  ) : (
                    <span className="text-slate-400">
                      {t("common.fileNotProvided")}
                    </span>
                  )}
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
  const { t } = useTranslation();
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
          {isLoading && <span>{t("common.loading")}</span>}
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

function NearbyHospitalsCTA() {
  const steps = [
    {
      title: "Step 1 — Open Dashboard",
      body: "Tap the new Nearby Hospitals tile on the migrant dashboard whenever you need urgent care guidance.",
    },
    {
      title: "Step 2 — Share Location",
      body: "We first explain why we need your GPS pin and then request permission in plain language.",
    },
    {
      title: "Step 3 — Fetch Clinics",
      body: "Within seconds we scan government and private hospitals inside a 10–15 km safety radius.",
    },
    {
      title: "Step 4 — Explore Map",
      body: "See your live position, nearby hospitals, and bilingual directions without typing a single word.",
    },
  ];

  const highlights = [
    {
      icon: LocateFixed,
      title: "Auto-detect",
      body: "GPS locks onto the exact spot where the migrant is standing—no manual entry.",
    },
    {
      icon: Route,
      title: "15 km Coverage",
      body: "We combine OpenStreetMap data to surface clinics within a safe travel radius.",
    },
    {
      icon: ShieldCheck,
      title: "Consent First",
      body: "A clear consent card explains why location is needed before the browser prompt appears.",
    },
  ];

  return null;
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
