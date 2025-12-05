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

export default function Dashboard() {
  const { patient } = useAuth();
  const { t } = useTranslation();
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
  // console.log(reports);
  const [heroAnnouncements, setHeroAnnouncements] = useState([]);
  const [activeAnnouncementIndex, setActiveAnnouncementIndex] = useState(0);
  const [announcementsStatus, setAnnouncementsStatus] = useState("loading");
  const [announcementError, setAnnouncementError] = useState(null);

  const loadHeroAnnouncements = useCallback(
    async ({ showLoading } = {}) => {
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
          t(
            "dashboard.errors.announcements"
          ); /* Unable to load announcements */
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
        // label: "Total Prescriptions",
        label: t("dashboard.stats.totalPrescriptions"),
        value: prescriptions.length,
        icon: FileText,
        accent: "bg-blue-50 text-blue-600",
      },
      {
        // label: "Vaccinations Completed",
        label: t("dashboard.stats.vaccinations"),
        value: vaccinations.length,
        icon: Syringe,
        accent: "bg-emerald-50 text-emerald-600",
      },
      {
        // label: "Recorded Visits",
        label: t("dashboard.stats.visits"),
        value: visits.length,
        icon: CalendarDays,
        accent: "bg-amber-50 text-amber-600",
      },
      {
        // label: "Lab Reports",
        label: t("dashboard.stats.labs"),
        value: reports.length,
        icon: Activity,
        accent: "bg-purple-50 text-purple-600",
      },
    ];
  }, [patient, prescriptions.length, reports.length, t]);

  const hasAnnouncements = heroAnnouncements.length > 0;
  const activeAnnouncement = hasAnnouncements
    ? heroAnnouncements[activeAnnouncementIndex]
    : null;
  const isAnnouncementsLoading = announcementsStatus === "loading";

  return (
    <section className="w-full space-y-8">
      <header className="rounded-3xl bg-white px-6 py-5 shadow-sm ring-1 ring-slate-100">
        {/* <p className="text-sm font-medium uppercase tracking-widest text-slate-400">Overview</p> */}
        <p className="text-sm font-medium uppercase tracking-widest text-slate-400">
          {t("common.overview")}
        </p>
        {/* <h2 className="text-3xl font-semibold text-slate-900">Dashboard</h2> */}
        <h2 className="text-3xl font-semibold text-slate-900">
          {t("common.dashboard")}
        </h2>
        <p className="text-sm text-slate-500">
          {
            t(
              "dashboard.subtitle"
            ) /* Track prescriptions, vaccinations, visits and diagnostics in one place. */
          }
        </p>
      </header>

      <section className="rounded-3xl bg-gradient-to-r from-slate-900 via-blue-900 to-sky-700 px-6 py-6 text-white shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.4em] text-white/70">
              <Megaphone className="h-4 w-4 text-white" />
              {
                hasAnnouncements
                  ? t("dashboard.broadcast") /* Broadcast */
                  : t("dashboard.noBroadcast") /* No Broadcast */
              }
            </p>
            <h3 className="text-2xl font-semibold">
              {
                hasAnnouncements
                  ? activeAnnouncement.title
                  : t("dashboard.upToDate") /* You're up to date */
              }
            </h3>
            <p className="text-sm text-white/80">
              {
                hasAnnouncements
                  ? activeAnnouncement.message
                  : t(
                      "dashboard.defaultMessage"
                    ) /* We will surface government advisories and healthcare alerts here as soon as they are issued. */
              }
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
              {t("common.refresh") /* Refresh */}
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
            {t("common.priority") /* Priority */}:{" "}
            {activeAnnouncement?.priority?.toUpperCase() || "--"}
          </span>
          <span>
            {
              activeAnnouncement
                ? formatAnnouncementTime(activeAnnouncement.timestamp)
                : t("common.awaiting") /* Awaiting broadcast */
            }
          </span>
          <span className="rounded-full bg-white/15 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.3em]">
            {activeAnnouncement?.audience || t("common.audienceAll") /* All */}
          </span>
          <span>
            {hasAnnouncements
              ? `${activeAnnouncementIndex + 1} / ${heroAnnouncements.length}`
              : isAnnouncementsLoading
              ? t("common.syncing")
              : t("common.noBroadcasts")}
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

      <NearbyHospitalsCTA />

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          // title="Recent Prescriptions"
          title={t("dashboard.sections.recentPrescriptions.title")}
          status={status.prescriptions}
          error={errors.prescriptions}
          count={prescriptions.length}
          link={{
            to: "/prescriptions",
            label: t("common.viewAll") /* View all */,
          }}
        >
          {prescriptions.length === 0 ? (
            <EmptyState
              title={
                t(
                  "dashboard.sections.recentPrescriptions.emptyTitle"
                ) /* No prescriptions yet */
              }
              message={
                t(
                  "dashboard.sections.recentPrescriptions.emptyMessage"
                ) /* Your doctor has not issued a prescription. */
              }
            />
          ) : (
            <ul className="space-y-4 overflow-y-auto pr-1 lg:max-h-80">
              {prescriptions.slice(0, 4).map((item) => (
                <li
                  key={item._id}
                  className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4"
                >
                  <p className="font-semibold text-slate-900">
                    {
                      item.confirmedDisease ||
                        item.suspectedDisease ||
                        t("common.diagnosisPending") /* Diagnosis pending */
                    }
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
          // title="Lab Reports"
          title={t("dashboard.sections.labReports.title")}
          // status={status.labs}
          error={reportsError}
          count={reports.length}
          link={{
            to: "/lab-reports",
            label: t("common.viewAll") /* View all */,
          }}
        >
          {reports.length === 0 ? (
            <EmptyState
              title={
                t(
                  "dashboard.sections.labReports.emptyTitle"
                ) /* No lab reports */
              }
              message={
                t(
                  "dashboard.sections.labReports.emptyMessage"
                ) /* Uploaded lab reports will appear here. */
              }
            />
          ) : (
            <ul className="space-y-4 overflow-y-auto pr-1 lg:max-h-80">
              {reports.slice(0, 4).map((report) => (
                <li
                  key={`${report.documentName}-${report.uploaded_at}`}
                  className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4"
                >
                  {/* <p className="font-semibold text-slate-900">
                    {report.documentName}
                  </p> */}
                  <p className="font-semibold text-slate-900">
                    {report.documentName || t("common.labReport") /* Report */}
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
                      {t("labReports.report.view") /* View document */}
                    </a>
                  ) : (
                    <span className="text-slate-400">
                      {t("common.fileNotProvided") /* File not provided */}
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
          {isLoading && <span>{t("common.loading") /* Loading */}</span>}
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

  // Nearly Hospitals CTA is currently disabled

  // return (
  //   <section className="grid gap-6 rounded-[32px] border border-sky-100 bg-gradient-to-br from-white via-sky-50 to-sky-100 p-6 shadow-sm lg:grid-cols-[1.1fr_0.9fr]">
  //     <div className="space-y-4">
  //       <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.4em] text-sky-500">
  //         <MapPin className="h-4 w-4 text-sky-600" />
  //         Nearby Hospitals
  //       </p>
  //       <h3 className="text-2xl font-semibold text-slate-900">
  //         One tap to locate the closest hospital
  //       </h3>
  //       <p className="text-sm text-slate-600">
  //         Migrant workers often stay in unfamiliar towns. This guided flow
  //         removes the language barrier by showing a map, address, and Google
  //         Maps navigation link in seconds.
  //       </p>
  //       <div className="grid gap-3 md:grid-cols-2">
  //         {steps.map((step) => (
  //           <div
  //             key={step.title}
  //             className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm"
  //           >
  //             <p className="text-xs font-semibold uppercase tracking-widest text-sky-500">
  //               {step.title}
  //             </p>
  //             <p className="mt-2 text-sm text-slate-600">{step.body}</p>
  //           </div>
  //         ))}
  //       </div>
  //       <Link to="/nearby-hospitals" className="inline-flex">
  //         <button className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500 md:w-auto">
  //           <Navigation className="h-5 w-5" />
  //           Launch Nearby Hospitals
  //         </button>
  //       </Link>
  //       <p className="text-xs text-slate-500">
  //         We never store your live location. Permission is requested each time
  //         you tap the feature, so migrants always understand why GPS is
  //         required.
  //       </p>
  //     </div>
  //     <div className="space-y-4 rounded-[28px] border border-sky-100 bg-white/80 p-5">
  //       <h4 className="text-sm font-semibold uppercase tracking-[0.4em] text-slate-500">
  //         What migrants see
  //       </h4>
  //       <div className="space-y-3">
  //         {highlights.map(({ icon: Icon, title, body }) => (
  //           <div
  //             key={title}
  //             className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
  //           >
  //             <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
  //               <Icon className="h-5 w-5" />
  //             </div>
  //             <div>
  //               <p className="text-sm font-semibold text-slate-900">{title}</p>
  //               <p className="text-xs text-slate-500">{body}</p>
  //             </div>
  //           </div>
  //         ))}
  //       </div>
  //     </div>
  //   </section>
  // );
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
