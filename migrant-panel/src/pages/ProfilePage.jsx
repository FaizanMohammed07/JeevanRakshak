import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  UserRound,
  Phone,
  MapPin,
  Droplet,
  ShieldCheck,
  IdCard,
  QrCode,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { usePatientData } from "../context/PatientsContext";

export default function ProfilePage() {
  const { patient } = useAuth();
  const { loadProfile, status, errors } = usePatientData();
  const { t } = useTranslation();
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setShowQR(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const quickFacts = useMemo(() => {
    if (!patient) return [];
    return [
      {
        // label: "Gender",
        label: t("profile.quickFacts.gender"),
        value: patient.gender,
        icon: UserRound,
      },
      {
        // label: "Age",
        label: t("profile.quickFacts.age"),
        value: patient.age
          ? t("profile.quickFacts.ageValue", {
              value: patient.age,
            }) /* {{value}} yrs */
          : "—",
        icon: ShieldCheck,
      },
      {
        // label: "Blood group",
        label: t("profile.quickFacts.bloodGroup"),
        value: patient.bloodGroup || "—",
        icon: Droplet,
      },
      {
        // label: "Phone",
        label: t("profile.quickFacts.phone"),
        value: patient.phoneNumber || "—",
        icon: Phone,
      },
    ];
  }, [patient, t]);

  const locationDetails = patient
    ? [
        {
          // label: "District",
          label: t("profile.location.district"),
          value: patient.district,
        },
        {
          // label: "Taluk",
          label: t("profile.location.taluk"),
          value: patient.taluk,
        },
        {
          // label: "Village",
          label: t("profile.location.village"),
          value: patient.village,
        },
        {
          // label: "Address",
          label: t("profile.location.address"),
          value: patient.address || t("common.notProvided") /* Not provided */,
        },
      ]
    : [];

  if (status.profile === "loading" && !patient) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 text-slate-500">
        {t("profile.loading") /* Fetching your profile... */}
      </div>
    );
  }

  if (errors.profile) {
    return <p className="text-red-600">{errors.profile}</p>;
  }

  if (!patient) {
    return (
      <EmptyState
        title={t("profile.emptyTitle") /* Profile unavailable */}
        message={
          t(
            "profile.emptyMessage"
          ) /* We could not find your profile details right now. Please try signing in again. */
        }
      />
    );
  }

  return (
    <section className="w-full space-y-8">
      <header className="relative rounded-3xl border border-sky-100 bg-white/95 px-6 py-5 shadow-sm">
        {/* <p className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-500">Your information</p> */}
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-500">
          {t("profile.headerLabel")}
        </p>
        {/* <h2 className="mt-1 text-3xl font-semibold text-slate-900">Patient profile</h2> */}
        <h2 className="mt-1 text-3xl font-semibold text-slate-900">
          {t("profile.title")}
        </h2>
        <p className="text-sm text-slate-500">
          {
            t(
              "profile.subtitle"
            ) /* Keep your details current so hospital teams can reach you instantly. */
          }
        </p>
        <div className="absolute top-4 right-4 cursor-pointer">
          <QrCode
            className="h-7 w-7 text-sky-600 hover:text-sky-800 transition"
            onClick={() => setShowQR(true)}
          />
        </div>
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
                {t("profile.fullName") /* Full name */}
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
              {/* /* Emergency contact */ }
              {/* <p className="text-sm text-slate-500">
                {t("profile.emergencyContact") }
              </p> */}
              <p className="text-2xl font-bold text-slate-900">
                {patient.emergencyContact || t("common.notProvided")}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            {t("profile.emergencyMessage") /* Reach out... */}
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
                  {row.value || t("common.notProvided")}
                </dd>
              </div>
            ))}
          </dl>
        </article>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <InfoList
          // title="Allergies"
          title={t("profile.lists.allergies.title")}
          items={patient.allergies}
          empty={
            t("profile.lists.allergies.empty") /* No allergies recorded. */
          }
        />
        <InfoList
          // title="Chronic Conditions"
          title={t("profile.lists.chronic.title")}
          items={patient.chronicDiseases}
          empty={
            t(
              "profile.lists.chronic.empty"
            ) /* No chronic conditions reported. */
          }
        />
        <InfoList
          // title="Current Medication"
          title={t("profile.lists.medication.title")}
          items={patient.currentMedication}
          empty={
            t("profile.lists.medication.empty") /* No active medication. */
          }
        />
        <InfoList
          // title="Vaccinations"
          title={t("profile.lists.vaccinations.title")}
          items={(patient.vaccinations || []).map(
            (item) =>
              `${
                item.vaccine_name ||
                t("profile.lists.vaccinations.fallback") /* Vaccine */
              } • ${formatDate(item.date_administered)}`
          )}
          empty={
            t("profile.lists.vaccinations.empty") /* No vaccination records. */
          }
        />
      </div>
      {showQR && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setShowQR(false)} // clicking outside closes
        >
          <div
            className="relative bg-white p-6 rounded-3xl shadow-xl border border-sky-100"
            onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
          >
            <button
              className="absolute top-3 right-3 text-slate-500 hover:text-slate-700"
              onClick={() => setShowQR(false)}
            >
              <X className="h-6 w-6" />
            </button>

            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=http://localhost:5174/patients/${patient.phoneNumber}`}
              alt="QR Code"
              className="rounded-xl"
            />
          </div>
        </div>
      )}
    </section>
  );
}

function InfoList({ title, items = [], empty }) {
  const { t } = useTranslation();
  const hasItems = Array.isArray(items) && items.length > 0;
  return (
    <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
        {hasItems && (
          <span className="text-xs uppercase tracking-widest text-slate-400">
            {t("common.entries", { count: items.length })}
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
