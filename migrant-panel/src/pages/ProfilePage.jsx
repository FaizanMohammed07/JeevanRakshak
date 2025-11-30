import { useEffect, useMemo } from "react";
import {
  UserRound,
  Phone,
  MapPin,
  Droplet,
  ShieldCheck,
  IdCard,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { usePatientData } from "../context/PatientsContext";

export default function ProfilePage() {
  const { patient } = useAuth();
  const { loadProfile, status, errors } = usePatientData();

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const quickFacts = useMemo(() => {
    if (!patient) return [];
    return [
      { label: "Gender", value: patient.gender, icon: UserRound },
      {
        label: "Age",
        value: patient.age ? `${patient.age} yrs` : "—",
        icon: ShieldCheck,
      },
      { label: "Blood group", value: patient.bloodGroup || "—", icon: Droplet },
      { label: "Phone", value: patient.phoneNumber || "—", icon: Phone },
    ];
  }, [patient]);

  const locationDetails = patient
    ? [
        { label: "District", value: patient.district },
        { label: "Taluk", value: patient.taluk },
        { label: "Village", value: patient.village },
        { label: "Address", value: patient.address || "Not provided" },
      ]
    : [];

  if (status.profile === "loading" && !patient) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 text-slate-500">
        Fetching your profile...
      </div>
    );
  }

  if (errors.profile) {
    return <p className="text-red-600">{errors.profile}</p>;
  }

  if (!patient) {
    return (
      <EmptyState
        title="Profile unavailable"
        message="We could not find your profile details right now. Please try signing in again."
      />
    );
  }

  return (
    <section className="w-full space-y-8">
      <header className="rounded-3xl border border-sky-100 bg-white/95 px-6 py-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-500">
          Your information
        </p>
        <h2 className="mt-1 text-3xl font-semibold text-slate-900">
          Patient profile
        </h2>
        <p className="text-sm text-slate-500">
          Keep your details current so hospital teams can reach you instantly.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-600 text-white">
              <span className="text-2xl font-semibold">
                {patient.name?.[0]?.toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm uppercase tracking-widest text-slate-400">
                Full name
              </p>
              <h3 className="text-3xl font-semibold text-slate-900">
                {patient.name}
              </h3>
              <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                <MapPin className="h-4 w-4" />
                {[patient.district, patient.taluk].filter(Boolean).join(", ")}
              </p>
            </div>
          </div>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            {quickFacts.map((fact) => {
              const FactIcon = fact.icon;
              return (
                <div
                  key={fact.label}
                  className="rounded-2xl border border-sky-50 bg-sky-50/60 p-4"
                >
                  <dt className="flex items-center gap-2 text-xs uppercase tracking-widest text-slate-400">
                    <FactIcon className="h-3.5 w-3.5 text-slate-500" />
                    {fact.label}
                  </dt>
                  <dd className="mt-1 text-lg font-semibold text-slate-800">
                    {fact.value || "—"}
                  </dd>
                </div>
              );
            })}
          </dl>
        </article>

        <article className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <IdCard className="h-10 w-10 rounded-2xl bg-sky-50 p-2 text-sky-600" />
            <div>
              <p className="text-sm text-slate-500">Emergency contact</p>
              <p className="text-xl font-semibold text-slate-900">
                {patient.emergencyContact || "Not provided"}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Reach out to your health coordinator if this number changes so we
            can contact your family quickly during emergencies.
          </p>
          <dl className="mt-6 space-y-3 text-sm text-slate-600">
            {locationDetails.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between rounded-2xl border border-sky-50 bg-sky-50/60 px-4 py-3"
              >
                <dt className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  {row.label}
                </dt>
                <dd className="text-base font-medium text-slate-900">
                  {row.value || "Not provided"}
                </dd>
              </div>
            ))}
          </dl>
        </article>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <InfoList
          title="Allergies"
          items={patient.allergies}
          empty="No allergies recorded."
        />
        <InfoList
          title="Chronic Conditions"
          items={patient.chronicDiseases}
          empty="No chronic conditions reported."
        />
        <InfoList
          title="Current Medication"
          items={patient.currentMedication}
          empty="No active medication."
        />
        <InfoList
          title="Vaccinations"
          items={(patient.vaccinations || []).map(
            (item) =>
              `${item.vaccine_name || "Vaccine"} • ${formatDate(
                item.date_administered
              )}`
          )}
          empty="No vaccination records."
        />
      </div>
    </section>
  );
}

function InfoList({ title, items = [], empty }) {
  const hasItems = Array.isArray(items) && items.length > 0;
  return (
    <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
        {hasItems && (
          <span className="text-xs uppercase tracking-widest text-slate-400">
            {items.length} entries
          </span>
        )}
      </div>
      {hasItems ? (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-2 text-sm text-slate-700"
            >
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title={empty} />
      )}
    </div>
  );
}

function EmptyState({ title, message }) {
  return (
    <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50/70 px-4 py-6 text-sm text-sky-700">
      <p className="font-semibold">{title}</p>
      {message && <p className="text-xs text-slate-500">{message}</p>}
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
