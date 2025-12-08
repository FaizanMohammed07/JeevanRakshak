import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FlaskConical, FileDown, Link2, TimerReset } from "lucide-react";
import { usePatientData, usePatientReports } from "../context/PatientsContext";
import { useAuth } from "../context/AuthContext";

export default function LabReportsPage() {
  const { labReports, loadLabReports, status, errors } = usePatientData();
  const { patient } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    loadLabReports();
  }, [loadLabReports]);

  // console.log(patient?.id);
  let {
    reports,
    loading: reportsLoading,
    error: reportsError,
  } = usePatientReports(patient?._id);
  reports = [];
  const summaryCards = useMemo(
    () => [
      {
        // label: "Total reports",
        label: t("labReports.summary.total"),
        value: reports.length,
        icon: FlaskConical,
        accent: "bg-sky-50 text-sky-600",
      },
      {
        // label: "Downloads ready",
        label: t("labReports.summary.downloads"),
        value: reports.filter((report) => Boolean(report.file_url)).length,
        icon: FileDown,
        accent: "bg-emerald-50 text-emerald-600",
      },
      {
        // label: "Pending uploads",
        label: t("labReports.summary.pending"),
        value: reports.filter((report) => !report.file_url).length,
        icon: TimerReset,
        accent: "bg-amber-50 text-amber-600",
      },
    ],
    [reports, t]
  );

  const isLoading = reportsLoading;
  const hasData = reports.length > 0;

  if (reportsError) {
    return <p className="text-red-600">{reportsError}</p>;
  }

  return (
    <section className="w-full space-y-8">
      <header className="rounded-3xl border border-sky-100 bg-white/95 px-6 py-5 shadow-sm">
        {/* <p className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-500">Diagnostics</p> */}
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-500">
          {t("labReports.headerLabel")}
        </p>
        {/* <h2 className="mt-1 text-3xl font-semibold text-slate-900">Lab Reports</h2> */}
        <h2 className="mt-1 text-3xl font-semibold text-slate-900">
          {t("labReports.title")}
        </h2>
        <p className="text-sm text-slate-500">
          {
            t(
              "labReports.subtitle"
            ) /* Digital lab reports stay safe here, so you can access them anytime. */
          }
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-3xl border border-sky-100 bg-white p-5 shadow-sm"
            >
              <div
                className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${card.accent}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-sm text-slate-500">{card.label}</p>
              <p className="text-3xl font-semibold text-slate-900">
                {card.value}
              </p>
            </div>
          );
        })}
      </div>

      <article className="rounded-3xl border border-sky-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          {reportsLoading ? (
            <p className="text-sm text-slate-500">
              {t("labReports.status.fetching") /* Fetching lab reports... */}
            </p>
          ) : hasData ? (
            <p className="text-sm text-slate-500">
              {
                t("labReports.status.available", {
                  count: reports.length,
                }) /* {{count}} report(s) available */
              }
            </p>
          ) : (
            <p className="text-sm text-slate-500">
              {t("labReports.status.none") /* No reports yet */}
            </p>
          )}
        </div>

        {!hasData && !isLoading ? (
          <div className="px-6 py-10">
            <EmptyState
              title={t("labReports.empty.title") /* No lab reports yet */}
              message={
                t(
                  "labReports.empty.message"
                ) /* When a hospital uploads documents, they will appear in this list automatically. */
              }
            />
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {reports.map((report) => (
              <li
                key={`${report.document_name}-${report.uploaded_at}`}
                className="px-6 py-4"
              >
                <ReportItem report={report} />
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  );
}

function ReportItem({ report }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-sky-50 bg-sky-50/40 p-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-lg font-semibold text-slate-900">
          {report.document_name || t("common.labReport") /* Lab Report */}
        </p>
        <p className="text-sm text-slate-500">
          {report.document_type || t("common.general") /* General */}
        </p>
      </div>
      <div className="flex flex-col gap-2 text-sm text-slate-500 lg:text-right">
        <p className="font-semibold text-slate-600">
          {
            t("labReports.report.uploaded", {
              date: formatDate(report.uploaded_at),
            }) /* Uploaded {{date}} */
          }
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
      </div>
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
