import { useEffect, useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";
import { usePatientData } from "../context/PatientsContext";

const PrescriptionDetailPanel = ({ rx }) => {
  if (!rx) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5 text-center text-sm text-slate-500">
        Select a prescription to view complete details.
      </div>
    );
  }

  const medicines = rx.medicinesIssued?.length ? rx.medicinesIssued : null;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-sky-100 bg-sky-50/40 p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-500">
          Condition
        </p>
        <p className="text-xl font-semibold text-slate-900">
          {rx.confirmedDisease || rx.suspectedDisease || "Diagnosis pending"}
        </p>
        <p className="text-sm text-slate-500">
          Issued {formatDate(rx.dateOfIssue)}
        </p>
      </div>

      <div className="rounded-xl bg-white/80 p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Symptoms
        </p>
        <p className="text-sm text-slate-800">{rx.symptoms || "—"}</p>
        {rx.durationOfSymptoms && (
          <p className="text-xs text-slate-500">
            Duration: {rx.durationOfSymptoms}
          </p>
        )}
      </div>

      <div className="rounded-xl bg-white/80 p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Medicines
        </p>
        {medicines ? (
          <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-slate-800">
            {medicines.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No medicines recorded</p>
        )}
      </div>

      <div className="grid gap-3 text-sm text-slate-600">
        <p>
          <span className="font-semibold text-slate-800">Follow-up: </span>
          {rx.followUpDate ? formatDate(rx.followUpDate) : "Not scheduled"}
        </p>
        <p>
          <span className="font-semibold text-slate-800">Contagious: </span>
          {rx.contagious ? "Yes" : "No"}
        </p>
        {rx.notes && (
          <p>
            <span className="font-semibold text-slate-800">Doctor notes: </span>
            {rx.notes}
          </p>
        )}
      </div>
    </div>
  );
};

export default function PrescriptionsPage() {
  const { prescriptions, loadPrescriptions, status, errors } = usePatientData();
  const [activeRxId, setActiveRxId] = useState(null);

  useEffect(() => {
    loadPrescriptions();
  }, [loadPrescriptions]);

  const sorted = useMemo(
    () =>
      [...prescriptions].sort(
        (a, b) => new Date(b.dateOfIssue) - new Date(a.dateOfIssue)
      ),
    [prescriptions]
  );

  const activeRx = useMemo(() => {
    if (!sorted.length) return null;
    if (!activeRxId) return sorted[0];
    return sorted.find((item) => item._id === activeRxId) || sorted[0];
  }, [sorted, activeRxId]);
  const activeId = activeRx?._id;

  const isLoading = status.prescriptions === "loading";
  const hasData = sorted.length > 0;

  return (
    <section className="w-full space-y-8">
      <header className="rounded-3xl border border-sky-100 bg-white/95 px-6 py-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-500">
          Treatment history
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h2 className="text-3xl font-semibold text-slate-900">
            Prescriptions
          </h2>
          <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-sky-600">
            {prescriptions.length} records
          </span>
        </div>
        <p className="text-sm text-slate-500">
          All prescriptions issued by your doctor appear instantly. No more
          paper copies.
        </p>
      </header>

      <article className="rounded-3xl border border-sky-100 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-4 border-b border-slate-100 px-6 py-5">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
            <ClipboardList className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm text-slate-500">Total prescriptions</p>
            <p className="text-2xl font-semibold text-slate-900">
              {prescriptions.length}
            </p>
          </div>
        </div>

        {isLoading && (
          <p className="px-6 py-5 text-sm text-slate-500">
            Loading prescriptions...
          </p>
        )}

        {errors.prescriptions && (
          <p className="px-6 py-5 text-sm text-red-600">
            {errors.prescriptions}
          </p>
        )}

        {!isLoading && !errors.prescriptions && !hasData && (
          <div className="px-6 py-10">
            <EmptyState
              title="No prescriptions yet"
              message="Your prescriptions will show up here the moment a doctor uploads them."
            />
          </div>
        )}

        {hasData && (
          <div className="flex flex-col gap-6 px-4 py-6 xl:flex-row">
            <div className="flex-1">
              <div className="hidden md:block">
                <PrescriptionTable
                  rows={sorted}
                  onSelect={(rx) => setActiveRxId(rx._id)}
                  activeId={activeId}
                />
              </div>
              <ul className="space-y-4 md:hidden">
                {sorted.map((rx) => (
                  <li key={rx._id}>
                    <PrescriptionCard
                      rx={rx}
                      onSelect={() => setActiveRxId(rx._id)}
                      isActive={activeId === rx._id}
                    />
                  </li>
                ))}
              </ul>
            </div>
            <div className="xl:w-80">
              <PrescriptionDetailPanel rx={activeRx} />
            </div>
          </div>
        )}
      </article>
    </section>
  );
}

function PrescriptionTable({ rows, onSelect, activeId }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-y-2 text-left">
        <thead>
          <tr className="text-xs uppercase tracking-widest text-slate-500">
            <th className="px-4 py-2 font-semibold">Condition</th>
            <th className="px-4 py-2 font-semibold">Symptoms</th>
            <th className="px-4 py-2 font-semibold">Medicines</th>
            <th className="px-4 py-2 font-semibold">Issued</th>
            <th className="px-4 py-2 font-semibold">Follow-up</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((rx) => {
            const isActive = activeId === rx._id;
            return (
              <tr
                key={rx._id}
                onClick={() => onSelect?.(rx)}
                className={`cursor-pointer rounded-2xl text-sm text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow ${
                  isActive ? "bg-sky-100/80" : "bg-sky-50/60"
                }`}
              >
                <td className="rounded-l-2xl px-4 py-3 text-slate-900">
                  {rx.confirmedDisease ||
                    rx.suspectedDisease ||
                    "Diagnosis pending"}
                </td>
                <td className="px-4 py-3">{rx.symptoms || "—"}</td>
                <td className="px-4 py-3">
                  {(rx.medicinesIssued || []).join(", ") || "—"}
                </td>
                <td className="px-4 py-3 font-semibold text-slate-800">
                  {formatDate(rx.dateOfIssue)}
                </td>
                <td className="rounded-r-2xl px-4 py-3 text-amber-700">
                  {rx.followUpDate ? formatDate(rx.followUpDate) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PrescriptionCard({ rx, onSelect, isActive }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full flex-col gap-4 rounded-2xl border p-4 text-left shadow-sm transition focus:outline-none ${
        isActive ? "border-sky-400 bg-sky-100/60" : "border-sky-50 bg-sky-50/40"
      }`}
    >
      <div className="flex-1">
        <p className="text-lg font-semibold text-slate-900">
          {rx.confirmedDisease || rx.suspectedDisease || "Diagnosis pending"}
        </p>
        <p className="text-sm text-slate-500">Symptoms: {rx.symptoms || "—"}</p>
        <p className="text-sm text-slate-500">
          Medicines: {(rx.medicinesIssued || []).join(", ") || "—"}
        </p>
      </div>
      <div className="text-sm text-slate-500">
        <p className="font-semibold text-slate-600">
          Issued {formatDate(rx.dateOfIssue)}
        </p>
        {rx.followUpDate && (
          <p className="text-amber-600">
            Follow-up {formatDate(rx.followUpDate)}
          </p>
        )}
      </div>
      <span className="text-xs font-semibold uppercase tracking-widest text-sky-600">
        Tap for details
      </span>
    </button>
  );
}

function EmptyState({ title, message }) {
  return (
    <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50/60 px-6 py-8 text-center">
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
