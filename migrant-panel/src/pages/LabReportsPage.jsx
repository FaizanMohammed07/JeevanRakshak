import { useEffect, useMemo } from "react";
import { FlaskConical, FileDown, Link2, TimerReset } from "lucide-react";
import { usePatientData } from "../context/PatientsContext";

export default function LabReportsPage() {
  const { labReports, loadLabReports, status, errors } = usePatientData();

  useEffect(() => {
    loadLabReports();
  }, [loadLabReports]);

  const summaryCards = useMemo(
    () => [
      {
        label: "Total reports",
        value: labReports.length,
        icon: FlaskConical,
        accent: "bg-sky-50 text-sky-600",
      },
      {
        label: "Downloads ready",
        value: labReports.filter((report) => Boolean(report.file_url)).length,
        icon: FileDown,
        accent: "bg-emerald-50 text-emerald-600",
      },
      {
        label: "Pending uploads",
        value: labReports.filter((report) => !report.file_url).length,
        icon: TimerReset,
        accent: "bg-amber-50 text-amber-600",
      },
    ],
    [labReports]
  );

  const isLoading = status.labs === "loading";
  const hasData = labReports.length > 0;

  if (errors.labs) {
    return <p className="text-red-600">{errors.labs}</p>;
  }

  return (
    <section className="w-full space-y-8">
      <header className="rounded-3xl border border-sky-100 bg-white/95 px-6 py-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-500">
          Diagnostics
        </p>
        <h2 className="mt-1 text-3xl font-semibold text-slate-900">
          Lab Reports
        </h2>
        <p className="text-sm text-slate-500">
          Digital lab reports stay safe here, so you can access them anytime.
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
          {isLoading ? (
            <p className="text-sm text-slate-500">Fetching lab reports...</p>
          ) : hasData ? (
            <p className="text-sm text-slate-500">
              {labReports.length} report(s) available
            </p>
          ) : (
            <p className="text-sm text-slate-500">No reports yet</p>
          )}
        </div>

        {!hasData && !isLoading ? (
          <div className="px-6 py-10">
            <EmptyState
              title="No lab reports yet"
              message="When a hospital uploads documents, they will appear in this list automatically."
            />
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {labReports.map((report) => (
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
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-sky-50 bg-sky-50/40 p-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-lg font-semibold text-slate-900">
          {report.document_name || "Lab Report"}
        </p>
        <p className="text-sm text-slate-500">
          {report.document_type || "General"}
        </p>
      </div>
      <div className="flex flex-col gap-2 text-sm text-slate-500 lg:text-right">
        <p className="font-semibold text-slate-600">
          Uploaded {formatDate(report.uploaded_at)}
        </p>
        {report.file_url ? (
          <a
            href={report.file_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sky-600"
          >
            <Link2 className="h-4 w-4" /> View document
          </a>
        ) : (
          <span className="text-slate-400">File not provided</span>
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
