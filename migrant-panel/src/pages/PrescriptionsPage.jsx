import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ClipboardList, Volume2 } from "lucide-react";
import { usePatientData } from "../context/PatientsContext";
<<<<<<< HEAD
import { requestPrescriptionSpeech } from "../api/prescriptions";
=======
import useTranslateData from "../hooks/useTranslateData";
import { translateBatch } from "../utils/translate"; // used to translate static labels
>>>>>>> af77c17ac373e0303b1d4a239dff9e109d882dac

/** STATIC LABELS (these will also be AI-translated when lang !== 'en') */
const TIME_SLOT_LABELS = {
  morning: "Morning",
  afternoon: "Afternoon",
  night: "Night",
};

const MEAL_LABELS = {
  before: "Before food",
  after: "After food",
  any: "Any time",
};

<<<<<<< HEAD
const SPEECH_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "ml", label: "Malayalam" },
  { code: "ta", label: "Tamil" },
];

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3030/api";
const AUDIO_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

=======
const TIME_SLOT_KEYS = Object.keys(TIME_SLOT_LABELS);

/** Normalize medicine schedule */
>>>>>>> af77c17ac373e0303b1d4a239dff9e109d882dac
const normalizeScheduleForDisplay = (schedule = {}) =>
  TIME_SLOT_KEYS.reduce((acc, key) => {
    const slotValue = schedule?.[key];
    if (!slotValue) {
      acc[key] = { active: false, mealTiming: "after" };
      return acc;
    }
    acc[key] = {
      active: Boolean(slotValue.active),
      mealTiming: slotValue.mealTiming || "after",
    };
    return acc;
  }, {});

/** Normalize each medicine item */
const normalizeMedicineItem = (medicine) => {
  if (!medicine) return null;

  if (typeof medicine === "string") {
    return {
      name: medicine.trim(),
      dosage: "",
      schedule: normalizeScheduleForDisplay({}),
      mealTiming: "any",
    };
  }

  return {
    name: (medicine.name || "").trim(),
    dosage: medicine.dosage || "",
    schedule: normalizeScheduleForDisplay(medicine.schedule),
    mealTiming: medicine.mealTiming || "any",
  };
};

<<<<<<< HEAD
const getMedicineNames = (medicines) => {
  if (!medicines?.length) return "—";
  const names = medicines
    .map(normalizeMedicineItem)
    .filter((item) => item?.name)
    .map((item) => item.name);
  if (!names.length) return "—";
  return names.join(", ");
};

const describeSchedule = (schedule) => {
  if (!schedule) return null;
  const entries = TIME_SLOT_KEYS.reduce((acc, key) => {
    const slotState = schedule[key];
    if (!slotState?.active) return acc;
    const slotLabel = TIME_SLOT_LABELS[key] || key;
    const mealLabel = MEAL_LABELS[slotState.mealTiming] || MEAL_LABELS.after;
    acc.push(`${slotLabel} (${mealLabel})`);
    return acc;
  }, []);
  return entries.length ? entries.join(" • ") : null;
};

const PrescriptionDetailPanel = ({ rx }) => {
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(
    SPEECH_LANGUAGES[0].code
  );
  const [speechState, setSpeechState] = useState({
    loading: false,
    error: "",
    preview: "",
  });
  if (!rx) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5 text-center text-sm text-slate-500">
        {
          t(
            "common.selectPrescription"
          ) /* Select a prescription to view complete details. */
        }
      </div>
    );
  }

  const normalizedMedicines = (rx.medicinesIssued || [])
    .map(normalizeMedicineItem)
    .filter(Boolean);
  const rxId = rx?._id;

  useEffect(() => {
    const primary = i18n.language?.split("-")[0];
    if (
      primary &&
      SPEECH_LANGUAGES.some((lang) => lang.code === primary)
    ) {
      setSelectedLanguage(primary);
    }
  }, [i18n.language]);

  useEffect(() => {
    let cancelled = false;
    if (!rxId) {
      setSpeechState((prev) => ({ ...prev, preview: "", error: "" }));
      return () => {
        cancelled = true;
      };
    }

    setSpeechState((prev) => ({ ...prev, preview: "", error: "" }));

    const loadPreview = async () => {
      try {
        const data = await requestPrescriptionSpeech(rxId, selectedLanguage, {
          previewOnly: true,
        });
        if (cancelled) return;
        const speechEntry = data.requestedSpeech;
        setSpeechState((prev) => ({
          ...prev,
          preview: speechEntry?.text || data.narration || "",
          error: speechEntry?.translationError || "",
        }));
      } catch (err) {
        if (cancelled) return;
        setSpeechState((prev) => ({
          ...prev,
          preview: "",
          error: err?.message || "Unable to load speech preview",
        }));
      }
    };

    loadPreview();

    return () => {
      cancelled = true;
    };
  }, [rxId, selectedLanguage]);

  const handleSpeak = async () => {
    if (!rxId) return;
    setSpeechState((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const data = await requestPrescriptionSpeech(rxId, selectedLanguage);
      const speechEntry =
        data.requestedSpeech ||
        (data.speechFiles || []).find(
          (entry) => entry.code === selectedLanguage
        ) ||
        data.speechFiles?.[0];
      const previewText = speechEntry?.text || data.narration || "";
      const audioRelative = speechEntry?.audioUrl;
      const audioUrl = audioRelative
        ? `${AUDIO_BASE_URL}${audioRelative}`
        : null;
      setSpeechState((prev) => ({ ...prev, preview: previewText, error: "" }));
      if (!audioUrl) {
        throw new Error("Audio not available for this language");
      }
      const audio = new Audio(audioUrl);
      await audio.play();
    } catch (err) {
      setSpeechState((prev) => ({
        ...prev,
        loading: false,
        error: err?.message || "Unable to play speech",
      }));
      return;
    }
    setSpeechState((prev) => ({ ...prev, loading: false, error: "" }));
  };

  const formatSlotLabel = (key, slotState) => {
    const slotLabel = TIME_SLOT_LABELS[key] || key;
    if (!slotState?.active) return null;
    const mealLabel = MEAL_LABELS[slotState.mealTiming] || MEAL_LABELS.after;
    return `${slotLabel} (${mealLabel})`;
  };

  const hasActiveSlots = (schedule) =>
    TIME_SLOT_KEYS.some((key) => schedule?.[key]?.active);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-sky-100 bg-sky-50/40 p-5">
      <div>
        {/* <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-500">Condition</p> */}
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-500">
          {t("prescriptions.detail.condition")}
        </p>
        <p className="text-xl font-semibold text-slate-900">
          {
            rx.confirmedDisease ||
              rx.suspectedDisease ||
              t("common.diagnosisPending") /* Diagnosis pending */
          }
        </p>
        <p className="text-sm text-slate-500">
          {t("common.issued") /* Issued */} {formatDate(rx.dateOfIssue)}
        </p>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Speak prescription
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <label className="flex items-center gap-2 text-xs text-slate-500">
            Language
            <select
              value={selectedLanguage}
              onChange={(event) => setSelectedLanguage(event.target.value)}
              className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
            >
              {SPEECH_LANGUAGES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={handleSpeak}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={speechState.loading}
          >
            <Volume2 className="h-4 w-4" />
            {speechState.loading ? "Generating…" : "Speak"}
          </button>
        </div>
        {speechState.error && (
          <p className="mt-2 text-xs text-red-600">{speechState.error}</p>
        )}
        {speechState.preview && (
          <p className="mt-2 text-xs text-slate-500">{speechState.preview}</p>
        )}
      </div>

      <div className="rounded-xl bg-white/80 p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          {t("prescriptions.detail.symptoms") /* Symptoms */}
        </p>
        <p className="text-sm text-slate-800">{rx.symptoms || "—"}</p>
        {rx.durationOfSymptoms && (
          <p className="text-xs text-slate-500">
            {t("prescriptions.detail.duration") /* Duration */}:{" "}
            {rx.durationOfSymptoms}
          </p>
        )}
      </div>

      <div className="rounded-xl bg-white/80 p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          {t("prescriptions.detail.medicines") /* Medicines */}
        </p>
        {normalizedMedicines.length === 0 ? (
          <p className="text-sm text-slate-500">
            {t("common.noMedicines") /* No medicines recorded */}
          </p>
        ) : (
          <div className="space-y-3 mt-3">
            {normalizedMedicines.map((medicine, index) => {
              const scheduleLabel = describeSchedule(medicine.schedule);
              return (
                <div
                  key={`${medicine.name}-${index}`}
                  className="rounded-xl border border-slate-100 bg-white/90 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">
                      {medicine.name}
                    </p>
                    {medicine.dosage && (
                      <span className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-500">
                        {medicine.dosage}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 space-y-2 text-xs text-slate-500">
                    {scheduleLabel ? (
                      <div className="flex flex-wrap gap-2">
                        {TIME_SLOT_KEYS.map((key) => {
                          const slotState = medicine.schedule?.[key];
                          const label = formatSlotLabel(key, slotState);
                          if (!label) return null;
                          return (
                            <span
                              key={key}
                              className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-slate-600"
                            >
                              {label}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <span>Times not specified</span>
                    )}
                    {!hasActiveSlots(medicine.schedule) && (
                      <span className="text-slate-400">
                        Tap a time slot in the doctor view to record timing
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid gap-3 text-sm text-slate-600">
        <p>
          <span className="font-semibold text-slate-800">
            {t("common.followUp") /* Follow-up */}:
          </span>
          {
            rx.followUpDate
              ? formatDate(rx.followUpDate)
              : t("common.notScheduled") /* Not scheduled */
          }
        </p>
        <p>
          <span className="font-semibold text-slate-800">
            {t("common.contagious") /* Contagious */}:
          </span>
          {rx.contagious ? t("common.yes") : t("common.no")}
        </p>
        {rx.notes && (
          <p>
            <span className="font-semibold text-slate-800">
              {t("common.doctorNotes") /* Doctor notes */}:
            </span>
            {rx.notes}
          </p>
        )}
      </div>
    </div>
  );
};
=======
function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
>>>>>>> af77c17ac373e0303b1d4a239dff9e109d882dac

/** --------------------------
 *  MAIN COMPONENT
 * -------------------------- */
export default function PrescriptionsPage() {
  const { prescriptions, loadPrescriptions, status, errors } = usePatientData();
  const { t, i18n } = useTranslation();
  const lang = (i18n.language || "en").split("-")[0];
  const [activeRxId, setActiveRxId] = useState(null);

  // Static labels state (translated)
  const [translatedSlotLabels, setTranslatedSlotLabels] = useState({
    morning: TIME_SLOT_LABELS.morning,
    afternoon: TIME_SLOT_LABELS.afternoon,
    night: TIME_SLOT_LABELS.night,
  });
  const [translatedMealLabels, setTranslatedMealLabels] = useState({
    before: MEAL_LABELS.before,
    after: MEAL_LABELS.after,
    any: MEAL_LABELS.any,
  });

  useEffect(() => {
    loadPrescriptions();
  }, [loadPrescriptions]);

  /** ----------------------
   * TRANSLATION HOOKS (UNCONDITIONAL)
   * Must call hooks in same order every render
   * ---------------------- */

  // fields to translate at prescription level
  const presFields =
    lang === "en"
      ? []
      : [
          "symptoms",
          "durationOfSymptoms",
          "suspectedDisease",
          "confirmedDisease",
          "notes",
        ];

  // 1) Translate prescriptions list (table + cards)
  const translatedPrescriptions = useTranslateData(
    prescriptions,
    presFields,
    lang
  );

  // 2) Build normalized flat list of all medicines (to translate in one go).
  //    This keeps hook usage predictable and allows caching.
  const normalizedMedicinesFlat = useMemo(() => {
    const flat = [];
    // We'll also keep counts to re-attach later
    for (const rx of prescriptions || []) {
      const meds = rx.medicinesIssued || [];
      for (const m of meds) {
        flat.push(normalizeMedicineItem(m));
      }
    }
    return flat;
  }, [prescriptions]);

  const medFields = lang === "en" ? [] : ["name", "dosage"];

  // 3) Translate flattened medicines array (unconditional hook)
  const translatedMedicinesFlat = useTranslateData(
    normalizedMedicinesFlat,
    medFields,
    lang
  );

  // PREFETCH: warm cache by requesting translations for all prescription
  // and medicine texts when user changes language. This prevents UI from
  // waiting on per-item requests and speeds up language switching.
  useEffect(() => {
    if (lang === "en") return;

    let mounted = true;

    (async () => {
      try {
        const allTexts = [];

        // add prescription-level fields
        for (const rx of prescriptions || []) {
          for (const f of presFields) {
            const v = rx?.[f];
            if (v) allTexts.push(String(v));
          }

          // add medicines
          for (const m of rx.medicinesIssued || []) {
            if (m?.name) allTexts.push(String(m.name));
            if (m?.dosage) allTexts.push(String(m.dosage));
          }
        }

        // also include static schedule/meal labels
        allTexts.push(
          TIME_SLOT_LABELS.morning,
          TIME_SLOT_LABELS.afternoon,
          TIME_SLOT_LABELS.night,
          MEAL_LABELS.before,
          MEAL_LABELS.after,
          MEAL_LABELS.any
        );

        // remove empties
        const filtered = allTexts.filter(Boolean);
        if (!filtered.length) return;

        // call translateBatch to warm cache (translate.js will cache results)
        await translateBatch(filtered, lang);
      } catch (err) {
        // don't block UI on errors
        console.debug("prefetch translations failed:", err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [lang, prescriptions]);

  // 4) Reconstruct translated prescriptions with their translated medicines
  const translatedList = useMemo(() => {
    if (!Array.isArray(translatedPrescriptions)) return [];

    // If there are no medicines, simply return translatedPrescriptions
    if (!translatedMedicinesFlat || translatedMedicinesFlat.length === 0) {
      // ensure each rx has medicinesIssued normalized (so UI code is consistent)
      return translatedPrescriptions.map((rx) => ({
        ...rx,
        medicinesIssued:
          (rx.medicinesIssued || []).map(normalizeMedicineItem) || [],
      }));
    }

    const result = [];
    let cursor = 0;
    for (const rx of translatedPrescriptions) {
      const count = (rx.medicinesIssued || []).length;
      const medsSlice = translatedMedicinesFlat.slice(cursor, cursor + count);
      cursor += count;
      // If slice shorter (fallback), fill with normalized originals
      const meds =
        medsSlice.length === count
          ? medsSlice
          : (rx.medicinesIssued || []).map(normalizeMedicineItem);

      result.push({
        ...rx,
        medicinesIssued: meds,
      });
    }
    return result;
  }, [translatedPrescriptions, translatedMedicinesFlat]);

  /** 5) Translate static schedule/meal labels via translateBatch (useEffect) */
  useEffect(() => {
    let mounted = true;

    const staticTexts = [
      TIME_SLOT_LABELS.morning,
      TIME_SLOT_LABELS.afternoon,
      TIME_SLOT_LABELS.night,
      MEAL_LABELS.before,
      MEAL_LABELS.after,
      MEAL_LABELS.any,
    ];

    if (lang === "en") {
      // Reset to defaults if English selected
      setTranslatedSlotLabels({
        morning: TIME_SLOT_LABELS.morning,
        afternoon: TIME_SLOT_LABELS.afternoon,
        night: TIME_SLOT_LABELS.night,
      });
      setTranslatedMealLabels({
        before: MEAL_LABELS.before,
        after: MEAL_LABELS.after,
        any: MEAL_LABELS.any,
      });
      return () => {
        mounted = false;
      };
    }

    (async () => {
      try {
        const translations = await translateBatch(staticTexts, lang);
        if (!mounted) return;
        // Ensure we got at least 6 items (fallback to defaults)
        const t0 = translations[0] || TIME_SLOT_LABELS.morning;
        const t1 = translations[1] || TIME_SLOT_LABELS.afternoon;
        const t2 = translations[2] || TIME_SLOT_LABELS.night;
        const m0 = translations[3] || MEAL_LABELS.before;
        const m1 = translations[4] || MEAL_LABELS.after;
        const m2 = translations[5] || MEAL_LABELS.any;

        setTranslatedSlotLabels({
          morning: t0,
          afternoon: t1,
          night: t2,
        });

        setTranslatedMealLabels({
          before: m0,
          after: m1,
          any: m2,
        });
      } catch (err) {
        console.error("Static label translation failed:", err);
        // fallback — do nothing, defaults remain
      }
    })();

    return () => {
      mounted = false;
    };
  }, [lang]);

  /** Helper to build schedule descriptions using translated labels */
  const describeSchedule = (schedule) => {
    if (!schedule) return null;

    const entries = TIME_SLOT_KEYS.reduce((acc, key) => {
      const slot = schedule[key];
      if (!slot?.active) return acc;

      const slotLabel = translatedSlotLabels[key] || TIME_SLOT_LABELS[key];
      const mealLabel =
        translatedMealLabels[slot.mealTiming] || MEAL_LABELS[slot.mealTiming];

      acc.push(`${slotLabel} (${mealLabel})`);
      return acc;
    }, []);

    return entries.length ? entries.join(" • ") : null;
  };

  /** ----------------------
   * Sorting & Active prescription (based on translatedList)
   * ---------------------- */
  const sorted = useMemo(
    () =>
      [...(translatedList || [])].sort(
        (a, b) => new Date(b.dateOfIssue) - new Date(a.dateOfIssue)
      ),
    [translatedList]
  );

  const activeRx = useMemo(() => {
    if (!sorted.length) return null;
    if (!activeRxId) return sorted[0];
    return sorted.find((item) => item._id === activeRxId) || sorted[0];
  }, [sorted, activeRxId]);

  const activeId = activeRx?._id;
  const isLoading = status.prescriptions === "loading";
  const hasData = sorted.length > 0;

  /** ----------------------
   * RENDER
   * ---------------------- */
  return (
    <section className="w-full space-y-8">
      <header className="rounded-3xl border border-sky-100 bg-white/95 px-6 py-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-500">
          {t("prescriptions.headerLabel")}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h2 className="text-3xl font-semibold text-slate-900">
            {t("prescriptions.title")}
          </h2>

          <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-sky-600">
            {t("common.records", { count: prescriptions.length })}
          </span>
        </div>

        <p className="text-sm text-slate-500">{t("prescriptions.subtitle")}</p>
      </header>

      <article className="rounded-3xl border border-sky-100 bg-white shadow-sm">
        {/* Count block */}
        <div className="flex flex-wrap items-center gap-4 border-b border-slate-100 px-6 py-5">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
            <ClipboardList className="h-5 w-5" />
          </span>

          <div>
            <p className="text-sm text-slate-500">{t("prescriptions.total")}</p>
            <p className="text-2xl font-semibold text-slate-900">
              {prescriptions.length}
            </p>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <p className="px-6 py-5 text-sm text-slate-500">
            {t("prescriptions.loading")}
          </p>
        )}

        {/* Error */}
        {errors.prescriptions && (
          <p className="px-6 py-5 text-sm text-red-600">
            {errors.prescriptions}
          </p>
        )}

        {/* Empty */}
        {!isLoading && !errors.prescriptions && !hasData && (
          <div className="px-6 py-10">
            <EmptyState
              title={t("prescriptions.emptyTitle")}
              message={t("prescriptions.emptyMessage")}
            />
          </div>
        )}

        {/* DATA TABLE */}
        {hasData && (
          <div className="flex flex-col gap-6 px-4 py-6 xl:flex-row">
            {/* Left List */}
            <div className="flex-1">
              <div className="hidden md:block">
                <PrescriptionTable
                  rows={sorted}
                  onSelect={(rx) => setActiveRxId(rx._id)}
                  activeId={activeId}
                />
              </div>

              {/* Mobile cards */}
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

            {/* Right Detail Panel */}
            <div className="xl:w-80">
              <PrescriptionDetailPanel
                rx={activeRx}
                describeSchedule={describeSchedule}
              />
            </div>
          </div>
        )}
      </article>
    </section>
  );
}

/* -----------------------------
   TABLE VIEW
----------------------------- */
function PrescriptionTable({ rows, onSelect, activeId }) {
  const { t } = useTranslation();

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-y-2 text-left">
        <thead>
          <tr className="text-xs uppercase tracking-widest text-slate-500">
            <th className="px-4 py-2 font-semibold">
              {t("prescriptions.table.condition")}
            </th>
            <th className="px-4 py-2 font-semibold">
              {t("prescriptions.table.symptoms")}
            </th>
            <th className="px-4 py-2 font-semibold">
              {t("prescriptions.table.medicines")}
            </th>
            <th className="px-4 py-2 font-semibold">
              {t("prescriptions.table.files")}
            </th>
            <th className="px-4 py-2 font-semibold">
              {t("prescriptions.table.issued")}
            </th>
            <th className="px-4 py-2 font-semibold">
              {t("prescriptions.table.followUp")}
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map((rx) => {
            const isActive = activeId === rx._id;
            const hasImages = rx.images?.length > 0;

            return (
              <tr
                key={rx._id}
                onClick={() => onSelect(rx)}
                className={`cursor-pointer text-sm rounded-2xl shadow-sm transition hover:-translate-y-0.5 hover:shadow ${
                  isActive ? "bg-sky-100/80" : "bg-sky-50/60"
                }`}
              >
                <td className="rounded-l-2xl px-4 py-3 text-slate-900">
                  {rx.confirmedDisease ||
                    rx.suspectedDisease ||
                    t("common.diagnosisPending")}
                </td>

                <td className="px-4 py-3">{rx.symptoms || "—"}</td>

                <td className="px-4 py-3">
                  {(rx.medicinesIssued || [])
                    .map((m) => m.name)
                    .filter(Boolean)
                    .join(", ") || "—"}
                </td>

                <td className="px-4 py-3">
                  {hasImages ? (
                    <a
                      href={rx.images[0]}
                      target="_blank"
                      onClick={(e) => e.stopPropagation()}
                      className="text-blue-600 underline text-xs"
                    >
                      {rx.images.length > 1
                        ? `View (${rx.images.length})`
                        : "View File"}
                    </a>
                  ) : (
                    <span className="text-slate-400 text-xs">None</span>
                  )}
                </td>

                <td className="px-4 py-3 text-slate-800 font-semibold">
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

/* -----------------------------
   CARD VIEW (Mobile)
----------------------------- */
function PrescriptionCard({ rx, onSelect, isActive }) {
  const { t } = useTranslation();

  return (
    <button
      onClick={onSelect}
      className={`w-full rounded-2xl border p-4 text-left shadow-sm transition ${
        isActive ? "border-sky-400 bg-sky-100/60" : "border-sky-50 bg-sky-50/40"
      }`}
    >
      <p className="text-lg font-semibold text-slate-900">
        {rx.confirmedDisease ||
          rx.suspectedDisease ||
          t("common.diagnosisPending")}
      </p>

      <p className="text-sm text-slate-500">
        {t("common.symptoms")}: {rx.symptoms || "—"}
      </p>

      <p className="text-sm text-slate-500">
        {t("common.medicines")}:{" "}
        {(rx.medicinesIssued || []).map((m) => m.name).join(", ") || "—"}
      </p>

      <p className="text-sm text-slate-500 mt-2 font-semibold text-slate-600">
        {t("common.issued")} {formatDate(rx.dateOfIssue)}
      </p>

      <span className="text-xs uppercase tracking-widest text-sky-600 block mt-2">
        {t("prescriptions.detail.tapHint")}
      </span>
    </button>
  );
}

/* -----------------------------
   DETAIL PANEL
----------------------------- */
function PrescriptionDetailPanel({ rx, describeSchedule }) {
  const { t } = useTranslation();

  if (!rx) {
    return (
      <div className="rounded-2xl border bg-slate-50/70 p-5 text-center text-sm text-slate-500">
        {t("common.selectPrescription")}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-sky-100 bg-sky-50/40 p-5 space-y-4">
      {/* Condition */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-500">
          {t("prescriptions.detail.condition")}
        </p>

        <p className="text-xl font-semibold text-slate-900">
          {rx.confirmedDisease ||
            rx.suspectedDisease ||
            t("common.diagnosisPending")}
        </p>

        <p className="text-sm text-slate-500">
          {t("common.issued")} {formatDate(rx.dateOfIssue)}
        </p>
      </div>

      {/* Symptoms */}
      <div className="rounded-xl bg-white/80 p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          {t("prescriptions.detail.symptoms")}
        </p>

        <p className="text-sm text-slate-800">{rx.symptoms || "—"}</p>

        {rx.durationOfSymptoms && (
          <p className="text-xs text-slate-500">
            {t("prescriptions.detail.duration")}: {rx.durationOfSymptoms}
          </p>
        )}
      </div>

      {/* Medicines */}
      <div className="rounded-xl bg-white/80 p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          {t("prescriptions.detail.medicines")}
        </p>

        {(rx.medicinesIssued || []).length === 0 ? (
          <p className="text-sm text-slate-500">{t("common.noMedicines")}</p>
        ) : (
          <div className="space-y-3 mt-3">
            {(rx.medicinesIssued || []).map((medicine, idx) => {
              const scheduleLabel = describeSchedule(medicine.schedule);
              return (
                <div
                  key={`${medicine.name || idx}-${idx}`}
                  className="rounded-xl border bg-white/90 px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{medicine.name}</p>

                    {medicine.dosage && (
                      <span className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-500">
                        {medicine.dosage}
                      </span>
                    )}
                  </div>

                  <div className="mt-2 text-xs text-slate-500">
                    {scheduleLabel || (
                      <span className="text-slate-400">
                        {t("prescriptions.detail.noSchedule")}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Follow-up & Notes */}
      <div className="text-sm text-slate-600 space-y-2">
        <p>
          <span className="font-semibold">{t("common.followUp")}:</span>{" "}
          {rx.followUpDate
            ? formatDate(rx.followUpDate)
            : t("common.notScheduled")}
        </p>

        <p>
          <span className="font-semibold">{t("common.contagious")}:</span>{" "}
          {rx.contagious ? t("common.yes") : t("common.no")}
        </p>

        {rx.notes && (
          <p>
            <span className="font-semibold">{t("common.doctorNotes")}:</span>{" "}
            {rx.notes}
          </p>
        )}
      </div>
    </div>
  );
}

/* -----------------------------
   EMPTY STATE
----------------------------- */
function EmptyState({ title, message }) {
  return (
    <div className="rounded-2xl border border-dashed bg-sky-50/60 px-6 py-8 text-center">
      <p className="text-base font-semibold">{title}</p>
      {message && <p className="text-sm text-slate-500">{message}</p>}
    </div>
  );
}
