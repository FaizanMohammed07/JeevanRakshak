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
import useTranslateData from "../hooks/useTranslateData";
import { translateLocationField } from "../utils/locationTranslations";

// ======================================================
//              FULLY FIXED PROFILE PAGE
// ======================================================

export default function ProfilePage() {
  const { patient } = useAuth();
  const { loadProfile, status, errors } = usePatientData();
  const { t, i18n } = useTranslation();
  const currentLang = (i18n.language || "en").split("-")[0];
  const [showQR, setShowQR] = useState(false);

  // ---------------- FETCH PROFILE ----------------
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    const handleEsc = (e) => e.key === "Escape" && setShowQR(false);
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // ---------------- TRANSLATION HELPERS ----------------

  // Helper: translate arrays of simple strings
  const translateStringList = (list) =>
    useTranslateData(
      (list || []).map((v) => ({ text: v })),
      currentLang === "en" ? [] : ["text"],
      currentLang
    ).map((obj) => obj.text);

  // 1) Translate LOCATION fields (object)
  const locationTranslated = useTranslateData(
    patient
      ? [
          {
            district: patient.district,
            taluk: patient.taluk,
            village: patient.village,
            address: patient.address,
          },
        ]
      : [],
    currentLang === "en" ? [] : ["district", "taluk", "village", "address"],
    currentLang
  );

  const translatedLoc =
    locationTranslated && locationTranslated.length > 0
      ? locationTranslated[0]
      : {};

  // Prefer hard-coded translations for district/village when available
  const mappedDistrict = translateLocationField(
    currentLang,
    "district",
    translatedLoc.district || patient?.district
  );
  const mappedVillage = translateLocationField(
    currentLang,
    "village",
    translatedLoc.village || patient?.village
  );

  // 2) Translate arrays of strings
  const translatedAllergies = translateStringList(patient?.allergies);
  const translatedChronic = translateStringList(patient?.chronicDiseases);
  const translatedMedication = translateStringList(patient?.currentMedication);

  // 3) Translate vaccinations (object list)
  const translatedVaccinations = useTranslateData(
    (patient?.vaccinations || []).map((v) => ({
      vaccine_name: v.vaccine_name,
      date_administered: v.date_administered,
    })),
    currentLang === "en" ? [] : ["vaccine_name"],
    currentLang
  );

  // ---------------- QUICK FACTS ----------------
  const quickFacts = useMemo(() => {
    if (!patient) return [];
    return [
      {
        label: t("profile.quickFacts.gender"),
        value: patient.gender,
        icon: UserRound,
      },
      {
        label: t("profile.quickFacts.age"),
        value: patient.age
          ? t("profile.quickFacts.ageValue", { value: patient.age })
          : "—",
        icon: ShieldCheck,
      },
      {
        label: t("profile.quickFacts.bloodGroup"),
        value: patient.bloodGroup || "—",
        icon: Droplet,
      },
      {
        label: t("profile.quickFacts.phone"),
        value: patient.phoneNumber || "—",
        icon: Phone,
      },
    ];
  }, [patient, t]);

  // ---------------- LOCATION DETAILS ----------------
  const locationDetails = patient
    ? [
        {
          label: t("profile.location.district"),
          value: mappedDistrict || translatedLoc.district || patient.district,
        },
        {
          label: t("profile.location.taluk"),
          value: translatedLoc.taluk || patient.taluk,
        },
        {
          label: t("profile.location.village"),
          value: mappedVillage || translatedLoc.village || patient.village,
        },
        {
          label: t("profile.location.address"),
          value:
            translatedLoc.address || patient.address || t("common.notProvided"),
        },
      ]
    : [];

  // ---------------- LOADING + ERROR STATES ----------------
  if (status.profile === "loading" && !patient) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 text-slate-500">
        {t("profile.loading")}
      </div>
    );
  }

  if (errors.profile) {
    return <p className="text-red-600">{errors.profile}</p>;
  }

  if (!patient) {
    return (
      <EmptyState
        title={t("profile.emptyTitle")}
        message={t("profile.emptyMessage")}
      />
    );
  }

  // ======================================================
  //                    MAIN UI
  // ======================================================

  return (
    <section className="w-full space-y-8">
      {/* HEADER */}
      <header className="relative rounded-3xl border border-sky-100 bg-white/95 px-6 py-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-500">
          {t("profile.headerLabel")}
        </p>

        <h2 className="mt-1 text-3xl font-semibold text-slate-900">
          {t("profile.title")}
        </h2>

        <p className="text-sm text-slate-500">{t("profile.subtitle")}</p>

        <div className="absolute top-4 right-4 cursor-pointer">
          <QrCode
            className="h-7 w-7 text-sky-600 hover:text-sky-800 transition"
            onClick={() => setShowQR(true)}
          />
        </div>
      </header>

      {/* TOP GRID */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        {/* LEFT CARD */}
        <article className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-600 text-white">
              <span className="text-2xl font-semibold">
                {patient.name?.[0]?.toUpperCase()}
              </span>
            </div>

            <div>
              <p className="text-sm uppercase tracking-widest text-slate-400">
                {t("profile.fullName")}
              </p>
              <h3 className="text-3xl font-semibold text-slate-900">
                {patient.name}
              </h3>

              <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                <MapPin className="h-4 w-4" />
                {[
                  translatedLoc.district || patient.district,
                  translatedLoc.taluk || patient.taluk,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
          </div>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            {quickFacts.map((fact, idx) => {
              const FactIcon = fact.icon;
              return (
                <div
                  key={idx}
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

        {/* RIGHT CARD */}
        <article className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <IdCard className="h-10 w-10 rounded-2xl bg-sky-50 p-2 text-sky-600" />
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {patient.emergencyContact || t("common.notProvided")}
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm text-slate-500">
            {t("profile.emergencyMessage")}
          </p>

          <dl className="mt-6 space-y-3 text-sm text-slate-600">
            {locationDetails.map((row, idx) => (
              <div
                key={idx}
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

      {/* LISTS */}
      <div className="grid gap-6 lg:grid-cols-2">
        <InfoList
          title={t("profile.lists.allergies.title")}
          items={translatedAllergies}
          empty={t("profile.lists.allergies.empty")}
        />

        <InfoList
          title={t("profile.lists.chronic.title")}
          items={translatedChronic}
          empty={t("profile.lists.chronic.empty")}
        />

        <InfoList
          title={t("profile.lists.medication.title")}
          items={translatedMedication}
          empty={t("profile.lists.medication.empty")}
        />

        <InfoList
          title={t("profile.lists.vaccinations.title")}
          items={translatedVaccinations.map((v) =>
            v?.vaccine_name
              ? `${v.vaccine_name} • ${formatDate(v.date_administered)}`
              : ""
          )}
          empty={t("profile.lists.vaccinations.empty")}
        />
      </div>

      {/* QR MODAL */}
      {showQR && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setShowQR(false)}
        >
          <div
            className="relative bg-white p-6 rounded-3xl shadow-xl border border-sky-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 text-slate-500 hover:text-slate-700"
              onClick={() => setShowQR(false)}
            >
              <X className="h-6 w-6" />
            </button>

            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://motorzan.com/patients/${patient.phoneNumber}`}
              alt="QR Code"
              className="rounded-xl"
            />
          </div>
        </div>
      )}
    </section>
  );
}

// ======================================================
// SMALL COMPONENTS
// ======================================================

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
