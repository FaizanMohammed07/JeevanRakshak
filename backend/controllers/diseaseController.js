import { performance } from "node:perf_hooks";
import Prescription from "../models/prescriptionModel.js";
import Patient from "../models/patientModel.js";

// Central controller for disease analytics powering the government dashboards.
// All business logic remains here so other routes can stay thin.....
// ----- Tuning constants (adjust without touching business logic)

const DEFAULT_LOOKBACK_DAYS = 30;
const DEFAULT_TREND_DAYS = 30;
const CAMP_NEW_CASE_WINDOW = 7; // days
const BAR_CHART_MAX_DISEASES = 4;
const LATEST_ADMISSION_LIMIT = 10;
const MAX_LOOKBACK_DAYS = 120;
const MAX_TREND_WINDOW_DAYS = 120;
const MAX_OFFSET_DAYS = 365;
const MAX_CASES_RANGE_DAYS = 45;
const DEFAULT_QUERY_TIMEOUT_MS =
  Number(process.env.DISEASE_CTRL_MAX_TIME_MS || 0) || 5000;
const CONTROLLER_WARN_THRESHOLD_MS =
  Number(process.env.DISEASE_CTRL_WARN_THRESHOLD_MS || 0) || 1500;
const MAX_TALUK_PATIENTS = 20;
const MAX_VILLAGE_PATIENTS = 12;
const MAX_RECENT_PATIENTS = 4;
const PRESCRIPTION_SELECT_FIELDS =
  "patient doctor dateOfIssue followUpDate contagious confirmedDisease suspectedDisease notes";
const PATIENT_POPULATE_FIELDS = "district taluk village address name";
const DOCTOR_POPULATE_FIELDS = "name";

const RANGE_MAP = {
  "1d": 1,
  "7d": 7,
  "10d": 10,
  "15d": 15,
  "30d": 30,
};

// Human friendly placeholders to prevent undefined showing up in payloads.
const FALLBACK_STRINGS = {
  district: "Unassigned District",
  taluk: "Unassigned Taluk",
  village: "Unassigned Village",
  camp: "Unmapped Camp",
  disease: "Unspecified",
};

// Base coordinates for Kerala districts so the heatmap has a reference point
// even when certain districts are missing from the current window.
const DISTRICT_METADATA = [
  { name: "Thiruvananthapuram", coordinates: [76.9415, 8.5241] },
  { name: "Kollam", coordinates: [76.6141, 8.8932] },
  { name: "Pathanamthitta", coordinates: [76.7825, 9.2648] },
  { name: "Alappuzha", coordinates: [76.3388, 9.4981] },
  { name: "Kottayam", coordinates: [76.5222, 9.5916] },
  { name: "Idukki", coordinates: [76.9725, 9.9186] },
  { name: "Ernakulam", coordinates: [76.2673, 9.9312] },
  { name: "Thrissur", coordinates: [76.2141, 10.5276] },
  { name: "Palakkad", coordinates: [76.651, 10.7867] },
  { name: "Malappuram", coordinates: [75.984, 11.0519] },
  { name: "Kozhikode", coordinates: [75.7804, 11.2588] },
  { name: "Wayanad", coordinates: [76.132, 11.6854] },
  { name: "Kannur", coordinates: [75.3704, 11.8745] },
  { name: "Kasaragod", coordinates: [75.0017, 12.4996] },
];

const DEFAULT_COORDINATES = [76.5, 10.2];

// Quick advisory strings that supervisors read on the heatmap panel.
const RISK_NOTE_TEMPLATES = {
  critical: (disease) => `Deploy surge team for ${disease}`,
  observe: (disease) => `${disease} monitoring active`,
  stable: (disease) => `Clinics reporting on schedule`,
};

const PLACEHOLDER_DISEASE_LABELS = new Set([
  "notconfirmed",
  "not-confirmed",
  "not confirmed",
  "pending",
  "awaiting",
  "tbd",
  "na",
  "n/a",
  "none",
  "unknown",
  "--",
  "-",
]);

// ----- Text helpers -----
const makeSlug = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const DEFAULT_DISTRICT_SLUG = makeSlug(FALLBACK_STRINGS.district);

const toTitleCase = (value = "") =>
  value
    .toString()
    .replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
    );

const clampNumber = (
  value,
  {
    min = Number.MIN_SAFE_INTEGER,
    max = Number.MAX_SAFE_INTEGER,
    fallback = 0,
  } = {}
) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  if (parsed < min) return min;
  if (parsed > max) return max;
  return parsed;
};

const sanitizeRangeDays = (value, fallback = DEFAULT_LOOKBACK_DAYS) =>
  clampNumber(value, { min: 1, max: MAX_LOOKBACK_DAYS, fallback });

const sanitizeTrendDays = (value, fallback = DEFAULT_TREND_DAYS) =>
  clampNumber(value, { min: 1, max: MAX_TREND_WINDOW_DAYS, fallback });

const sanitizeOffsetDays = (value) =>
  clampNumber(value, { min: 0, max: MAX_OFFSET_DAYS, fallback: 0 });

const sanitizeCasesRange = (value) =>
  clampNumber(value, { min: 1, max: MAX_CASES_RANGE_DAYS, fallback: 1 });

const sanitizeDistrictSlug = (value) => {
  if (!value) return null;
  const normalized = makeSlug(value);
  return normalized || null;
};

const logSlowController = (label, startedAt) => {
  const duration = performance.now() - startedAt;
  if (duration > CONTROLLER_WARN_THRESHOLD_MS) {
    console.warn(
      `[DiseaseController] ${label} took ${duration.toFixed(
        0
      )}ms (>${CONTROLLER_WARN_THRESHOLD_MS}ms)`
    );
  }
};

// Normalize strings coming from Mongo so aggregations never crash on nulls.
const normalizeText = (value, fallback) => {
  if (!value || typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : fallback;
};

const DISTRICT_LOOKUP = new Map(
  DISTRICT_METADATA.map((entry) => [makeSlug(entry.name), entry])
);

const levenshteinDistance = (a = "", b = "") => {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let i = 0; i < rows; i += 1) {
    matrix[i][0] = i;
  }
  for (let j = 0; j < cols; j += 1) {
    matrix[0][j] = j;
  }

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[rows - 1][cols - 1];
};

const resolveDistrictMeta = (value) => {
  const normalized = normalizeText(value, FALLBACK_STRINGS.district);
  const slug = makeSlug(normalized);
  if (DISTRICT_LOOKUP.has(slug)) {
    const meta = DISTRICT_LOOKUP.get(slug);
    return { slug, name: meta.name, coordinates: meta.coordinates };
  }

  let bestMatch = null;
  let bestScore = Infinity;
  for (const [canonicalSlug, meta] of DISTRICT_LOOKUP.entries()) {
    const score = levenshteinDistance(slug, canonicalSlug);
    if (score < bestScore) {
      bestScore = score;
      bestMatch = {
        slug: canonicalSlug,
        name: meta.name,
        coordinates: meta.coordinates,
      };
    }
  }

  if (bestMatch && bestScore <= 2) {
    return bestMatch;
  }

  return {
    slug,
    name: toTitleCase(normalized),
    coordinates: DEFAULT_COORDINATES,
  };
};

const safeDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

// ----- Location lookups -----
const getDistrictName = (record) =>
  toTitleCase(
    normalizeText(record?.patient?.district, FALLBACK_STRINGS.district)
  );

const getTalukName = (record) =>
  toTitleCase(normalizeText(record?.patient?.taluk, FALLBACK_STRINGS.taluk));

const getVillageName = (record) =>
  toTitleCase(
    normalizeText(record?.patient?.village, FALLBACK_STRINGS.village)
  );

const getLocationNames = (record) => ({
  districtName: getDistrictName(record),
  talukName: getTalukName(record),
  villageName: getVillageName(record),
});

const getCampName = (patient, fallbackLabel) =>
  normalizeText(
    patient?.address,
    fallbackLabel ? `${fallbackLabel} Cluster` : FALLBACK_STRINGS.camp
  );

// Build a compact structure that UI components can consume directly.
const buildPatientDetail = (record, overrides = {}) => {
  const { talukName, villageName } = getLocationNames(record);
  const baseVillage = overrides.village ?? villageName;
  const diseaseMeta = getDiseaseMeta(record);
  return {
    patientId: record?.patient?._id?.toString?.() ?? null,
    name: record?.patient?.name ?? "--",
    disease: diseaseMeta.label,
    contagious: Boolean(record?.contagious),
    doctor: record?.doctor?.name ?? "--",
    camp: getCampName(record?.patient, baseVillage),
    taluk: overrides.taluk ?? talukName,
    village: baseVillage,
    dateOfIssue: record?.dateOfIssue ?? null,
    notes: record?.notes ?? "",
  };
};

// Keep logging format consistent so Ops can grep quickly.
const logControllerError = (context, error) => {
  console.error(`[DiseaseController] ${context}`, error);
};

// Convert disease labels into predictable camelCase keys for charts.
const diseaseKeyFromName = (value = FALLBACK_STRINGS.disease) => {
  const cleaned = value
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
  if (!cleaned.length) return "unspecified";
  return cleaned
    .map((word, index) =>
      index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join("");
};

const DEFAULT_DISEASE_META = {
  key: diseaseKeyFromName(FALLBACK_STRINGS.disease),
  label: toTitleCase(FALLBACK_STRINGS.disease),
};

const resolveDiseaseMeta = (record) => {
  const sanitize = (value) => {
    if (!value) return null;
    const trimmed = value.toString().trim();
    if (!trimmed) return null;
    const normalized = trimmed.toLowerCase();
    if (PLACEHOLDER_DISEASE_LABELS.has(normalized)) return null;
    const collapsed = normalized.replace(/\s+/g, "");
    if (PLACEHOLDER_DISEASE_LABELS.has(collapsed)) return null;
    return trimmed;
  };

  const primary = sanitize(record.confirmedDisease);
  const fallback = sanitize(record.suspectedDisease);
  const source = normalizeText(primary || fallback, FALLBACK_STRINGS.disease);
  return {
    key: diseaseKeyFromName(source),
    label: toTitleCase(source),
  };
};

const DISEASE_META_CACHE = new WeakMap();
const getDiseaseMeta = (record) => {
  if (!record || typeof record !== "object") return DEFAULT_DISEASE_META;
  if (DISEASE_META_CACHE.has(record)) {
    return DISEASE_META_CACHE.get(record);
  }
  const meta = resolveDiseaseMeta(record);
  DISEASE_META_CACHE.set(record, meta);
  return meta;
};

const humanizeDiseaseKey = (key = "") =>
  toTitleCase(
    key
      .toString()
      .replace(/([A-Z])/g, " $1")
      .replace(/-/g, " ")
  );

// Always calculate windows relative to end-of-day so dashboards align with SLA.
const getDateWindow = (rangeDays, offsetDays = 0) => {
  const safeRange = Math.max(1, rangeDays);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  if (offsetDays) {
    end.setDate(end.getDate() - offsetDays);
  }
  const start = new Date(end);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (safeRange - 1));
  return { start, end };
};

const dedupeSameDiseaseCases = (records) => {
  const map = new Map();

  for (const rec of records) {
    const pid = rec.patient?._id?.toString();

    const disease =
      rec.confirmedDisease?.trim().toLowerCase() ||
      rec.suspectedDisease?.trim().toLowerCase() ||
      "unknown";

    const key = `${pid}::${disease}`;

    if (!map.has(key)) {
      map.set(key, rec);
    }
  }

  return Array.from(map.values());
};

// Single point that pulls prescriptions plus patient/doctor data.
const fetchPrescriptions = async ({
  rangeDays = null,
  offsetDays = 0,
  districtSlug,
} = {}) => {
  const query = {};
  if (rangeDays) {
    // Build the exact Mongo date filters for the requested window.
    const { start, end } = getDateWindow(rangeDays, offsetDays);
    query.dateOfIssue = { $gte: start, $lte: end };
  }

  const prescriptions = await Prescription.find(
    query,
    PRESCRIPTION_SELECT_FIELDS,
    { maxTimeMS: DEFAULT_QUERY_TIMEOUT_MS }
  )
    .populate({ path: "patient", select: PATIENT_POPULATE_FIELDS })
    .populate({ path: "doctor", select: DOCTOR_POPULATE_FIELDS })
    .lean();

  // if (!districtSlug) return prescriptions;
  // // When the frontend drills into a district we filter post-query to reuse cache.
  // return prescriptions.filter(
  //   (entry) =>
  //     makeSlug(entry?.patient?.district ?? FALLBACK_STRINGS.district) ===
  //     districtSlug
  // );
  let filtered = prescriptions;

  if (districtSlug) {
    filtered = prescriptions.filter(
      (entry) =>
        makeSlug(entry?.patient?.district ?? FALLBACK_STRINGS.district) ===
        districtSlug
    );
  }

  // 🔥 dedupe HERE so downstream counts are correct
  return dedupeSameDiseaseCases(filtered);
};

// Snapshot taluk totals from a window so we can compare against the next one.
const buildTalukCountMap = (prescriptions = []) => {
  const map = new Map();
  prescriptions.forEach((record) => {
    const district = makeSlug(
      normalizeText(record?.patient?.district, FALLBACK_STRINGS.district)
    );
    const taluk = makeSlug(
      normalizeText(record?.patient?.taluk, FALLBACK_STRINGS.taluk)
    );
    const key = `${district}::${taluk}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  });
  return map;
};

const formatTrendLabel = (delta) => {
  if (delta > 0) return `+${delta} vs last period`;
  if (delta < 0) return `${delta} vs last period`;
  return "Stable";
};

// Builds district -> taluk -> village hierarchy for drill-down cards.
const buildDistrictHierarchy = (currentWindow, previousWindow) => {
  const previousTalukCounts = buildTalukCountMap(previousWindow);
  const districts = new Map();

  currentWindow.forEach((record) => {
    const { districtName, talukName, villageName } = getLocationNames(record);

    const districtKey = makeSlug(districtName);
    if (!districts.has(districtKey)) {
      // Create district bucket on first encounter.
      districts.set(districtKey, {
        district: districtName,
        totalCases: 0,
        taluks: new Map(),
      });
    }
    const districtEntry = districts.get(districtKey);
    districtEntry.totalCases += 1;

    if (!districtEntry.taluks.has(talukName)) {
      // Lazy-create taluk tracker so we keep memory small.
      districtEntry.taluks.set(talukName, {
        name: talukName,
        cases: 0,
        trend: "Stable",
        villages: new Map(),
        patients: [],
      });
    }
    const talukEntry = districtEntry.taluks.get(talukName);
    talukEntry.cases += 1;

    const patientDetail = buildPatientDetail(record, {
      taluk: talukName,
      village: villageName,
    });

    const existingVillage = talukEntry.villages.get(villageName);
    if (existingVillage) {
      existingVillage.cases += 1;
      if (existingVillage.patients.length < MAX_VILLAGE_PATIENTS) {
        // Cap the patient list; UI only shows a handful.
        existingVillage.patients.push(patientDetail);
      }
    } else {
      talukEntry.villages.set(villageName, {
        name: villageName,
        cases: 1,
        patients: [patientDetail],
      });
    }

    if (talukEntry.patients.length < MAX_TALUK_PATIENTS) {
      // Track latest patients at taluk level for modal popups.
      talukEntry.patients.push(patientDetail);
    }
  });

  const result = Array.from(districts.values()).map((districtEntry) => {
    const taluks = Array.from(districtEntry.taluks.values()).map(
      (talukEntry) => {
        const key = `${makeSlug(districtEntry.district)}::${makeSlug(
          talukEntry.name
        )}`;
        const previous = previousTalukCounts.get(key) ?? 0;
        return {
          ...talukEntry,
          trend: formatTrendLabel(talukEntry.cases - previous),
          villages: Array.from(talukEntry.villages.values()).sort(
            (a, b) => b.cases - a.cases
          ),
        };
      }
    );
    return {
      district: districtEntry.district,
      totalCases: districtEntry.totalCases,
      taluks: taluks.sort((a, b) => b.cases - a.cases),
    };
  });

  return result.sort((a, b) => b.totalCases - a.totalCases);
};

// Summaries used by the stacked bar chart at the top of the dashboard.
const buildDistrictCases = (prescriptions) => {
  const districtMap = new Map();
  const diseaseTotals = new Map();

  prescriptions.forEach((record) => {
    const districtName = getDistrictName(record);
    const diseaseMeta = getDiseaseMeta(record);

    if (!districtMap.has(districtName)) {
      // Each district row stores total + per-disease counters.
      districtMap.set(districtName, {
        district: districtName,
        totalCases: 0,
        counts: new Map(),
      });
    }
    const districtEntry = districtMap.get(districtName);
    districtEntry.totalCases += 1;
    districtEntry.counts.set(
      diseaseMeta.key,
      (districtEntry.counts.get(diseaseMeta.key) ?? 0) + 1
    );

    if (!diseaseTotals.has(diseaseMeta.key)) {
      diseaseTotals.set(diseaseMeta.key, {
        key: diseaseMeta.key,
        label: diseaseMeta.label,
        total: 0,
      });
    }
    const diseaseEntry = diseaseTotals.get(diseaseMeta.key);
    diseaseEntry.total += 1;
  });

  const diseaseKeys = Array.from(diseaseTotals.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, BAR_CHART_MAX_DISEASES);

  const districtCases = Array.from(districtMap.values())
    .map((entry) => {
      const row = { district: entry.district, totalCases: entry.totalCases };
      // Only include the top diseases to keep the bar chart readable.
      diseaseKeys.forEach(({ key }) => {
        row[key] = entry.counts.get(key) ?? 0;
      });
      return row;
    })
    .sort((a, b) => b.totalCases - a.totalCases);

  return { districtCases, diseaseKeys };
};

// Build per-day counts for the line chart. Only keep top diseases to reduce noise.
const buildTrendData = (
  prescriptions,
  districtSlug,
  rangeDays = DEFAULT_TREND_DAYS
) => {
  const filtered = districtSlug
    ? prescriptions.filter(
        (record) =>
          makeSlug(
            normalizeText(record?.patient?.district, FALLBACK_STRINGS.district)
          ) === districtSlug
      )
    : prescriptions;

  const dayFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });

  const dayMap = new Map();
  const diseaseTotals = new Map();

  const days = [];
  const { start } = getDateWindow(rangeDays);
  const cursor = new Date(start);
  for (let i = 0; i < rangeDays; i += 1) {
    const key = cursor.toISOString().slice(0, 10);
    days.push({ key, label: dayFormatter.format(cursor) });
    cursor.setDate(cursor.getDate() + 1);
  }
  days.forEach((day) => {
    // Pre-seed every day to avoid gaps in the chart.
    dayMap.set(day.key, { day: day.label });
  });

  filtered.forEach((record) => {
    const dayKey = new Date(record.dateOfIssue).toISOString().slice(0, 10);
    if (!dayMap.has(dayKey)) return;
    const diseaseMeta = getDiseaseMeta(record);
    const target = dayMap.get(dayKey);
    // Increment per disease per day for the line chart.
    target[diseaseMeta.key] = (target[diseaseMeta.key] ?? 0) + 1;

    diseaseTotals.set(
      diseaseMeta.key,
      (diseaseTotals.get(diseaseMeta.key) ?? 0) + 1
    );
  });

  const trendKeys = Array.from(diseaseTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([key]) => key);

  const trendSeries = days.map((day) => {
    const entry = dayMap.get(day.key);
    trendKeys.forEach((key) => {
      entry[key] = entry[key] ?? 0;
    });
    return entry;
  });

  return {
    trendData: trendSeries,
    trendKeys,
  };
};

// Quick severity tag for the Active Districts table.
const deriveDistrictStatus = ({ totalCases, newCases, contagiousHits }) => {
  if (totalCases >= 80 || contagiousHits >= 12 || newCases >= 25)
    return "critical";
  if (totalCases >= 30 || newCases >= 10) return "moderate";
  return "stable";
};

// Leaderboard exposed to the "Active Disease Cases" widget.
const buildActiveCases = (prescriptions, districtSlug) => {
  const newCaseCutoff = getDateWindow(CAMP_NEW_CASE_WINDOW).start;
  const districtMap = new Map();
  const latestAdmissionsBucket = [];

  prescriptions.forEach((record) => {
    const { districtName, talukName, villageName } = getLocationNames(record);
    const districtKey = makeSlug(districtName);
    if (districtSlug && districtKey !== districtSlug) return;
    const diseaseMeta = getDiseaseMeta(record);

    if (!districtMap.has(districtKey)) {
      // Each district row mirrors the widget columns.
      districtMap.set(districtKey, {
        district: districtName,
        totalCases: 0,
        newCases: 0,
        contagiousHits: 0,
        diseaseCounts: new Map(),
        recentPatients: [],
        lastUpdated: null,
      });
    }

    const entry = districtMap.get(districtKey);
    entry.totalCases += 1;
    if (record.contagious) entry.contagiousHits += 1;

    const issuedAt = safeDate(record?.dateOfIssue);
    if (issuedAt) {
      const issuedMs = issuedAt.getTime();
      if (!Number.isNaN(issuedMs)) {
        // Keep lastUpdated for sorting the leaderboard.
        entry.lastUpdated = Math.max(entry.lastUpdated ?? issuedMs, issuedMs);
      }
    }

    const isNew = issuedAt ? issuedAt >= newCaseCutoff : false;
    if (isNew) {
      entry.newCases += 1;
      // Only retain a small list for the hover modal to stay light.
      const patientDetail = {
        name: record?.patient?.name ?? "--",
        disease: diseaseMeta.label,
        taluk: talukName,
        village: villageName,
        dateOfIssue: record?.dateOfIssue ?? null,
        contagious: Boolean(record?.contagious),
      };
      entry.recentPatients.unshift(patientDetail);
      entry.recentPatients = entry.recentPatients.slice(0, MAX_RECENT_PATIENTS);
    }

    entry.diseaseCounts.set(
      diseaseMeta.key,
      (entry.diseaseCounts.get(diseaseMeta.key) ?? 0) + 1
    );

    latestAdmissionsBucket.push({
      name: record?.patient?.name ?? "--",
      disease: diseaseMeta.label,
      district: districtName,
      taluk: talukName,
      village: villageName,
      dateOfIssue: record?.dateOfIssue ?? null,
      contagious: Boolean(record?.contagious),
      camp: getCampName(record?.patient, villageName),
    });
  });

  const cases = Array.from(districtMap.values())
    .map((entry) => {
      const [topDiseaseKey, topDiseaseCount] = Array.from(
        entry.diseaseCounts.entries()
      ).sort((a, b) => b[1] - a[1])[0] ?? ["unspecified", 0];
      return {
        district: entry.district,
        newCases: entry.newCases,
        totalCases: entry.totalCases,
        status: deriveDistrictStatus(entry),
        topDisease: toTitleCase(topDiseaseKey),
        topDiseaseCount,
        recentPatients: entry.recentPatients,
        lastUpdated: entry.lastUpdated
          ? new Date(entry.lastUpdated).toISOString()
          : null,
      };
    })
    .sort(
      (a, b) =>
        (b.lastUpdated ?? 0) - (a.lastUpdated ?? 0) ||
        b.newCases - a.newCases ||
        b.totalCases - a.totalCases
    )
    .slice(0, 19);

  const latestAdmissions = latestAdmissionsBucket
    .sort((a, b) => {
      const aTime = safeDate(a.dateOfIssue)?.getTime() ?? 0;
      const bTime = safeDate(b.dateOfIssue)?.getTime() ?? 0;
      return bTime - aTime;
    })
    .slice(0, LATEST_ADMISSION_LIMIT);

  return { cases, latestAdmissions };
};

const deriveRiskStatus = (activeCases, percentDelta) => {
  if (activeCases >= 60 || percentDelta >= 30) return "critical";
  if (activeCases >= 25 || percentDelta >= 10) return "observe";
  return "stable";
};

const buildRiskNote = (status, diseaseKey) => {
  const disease = humanizeDiseaseKey(diseaseKey || "health");
  const template = RISK_NOTE_TEMPLATES[status] || RISK_NOTE_TEMPLATES.stable;
  return template(disease);
};

// Produces statewide payload for the Kerala Heatmap markers.
const buildRiskProfile = (currentWindow, previousWindow) => {
  const baseMap = new Map(
    DISTRICT_METADATA.map((entry) => [makeSlug(entry.name), { ...entry }])
  );
  const previousCounts = new Map();
  previousWindow.forEach((record) => {
    const { slug: districtKey } = resolveDistrictMeta(
      record?.patient?.district
    );
    // Used to compute percent deltas later on.
    previousCounts.set(districtKey, (previousCounts.get(districtKey) ?? 0) + 1);
  });

  const workingMap = new Map();

  currentWindow.forEach((record) => {
    const districtMeta = resolveDistrictMeta(record?.patient?.district);
    const districtKey = districtMeta.slug;
    const districtName = districtMeta.name;

    if (!workingMap.has(districtKey)) {
      const base = baseMap.get(districtKey) ?? {
        name: districtName,
        coordinates: districtMeta.coordinates ?? DEFAULT_COORDINATES,
      };
      workingMap.set(districtKey, {
        ...base,
        name: districtName,
        activeCases: 0,
        diseaseCounts: new Map(),
        patientIds: new Set(),
      });
    }

    const entry = workingMap.get(districtKey);
    entry.activeCases += 1;
    const diseaseMeta = getDiseaseMeta(record);
    // Track which disease dominates this district during the window.
    entry.diseaseCounts.set(
      diseaseMeta.key,
      (entry.diseaseCounts.get(diseaseMeta.key) ?? 0) + 1
    );
    if (record?.patient?._id) {
      entry.patientIds.add(record.patient._id.toString());
    }
  });

  const allKeys = new Set([...baseMap.keys(), ...workingMap.keys()]);

  return Array.from(allKeys)
    .map((key) => {
      const existing = workingMap.get(key);
      const base = baseMap.get(key) ?? null;
      const entry = existing ?? {
        ...(base ?? {
          name: toTitleCase(key.replace(/-/g, " ")), // fallback label
          coordinates: DEFAULT_COORDINATES,
        }),
        activeCases: 0,
        diseaseCounts: new Map(),
        patientIds: new Set(),
      };

      const previous = previousCounts.get(key) ?? 0;
      const delta = entry.activeCases - previous;
      const percentDelta =
        previous === 0
          ? entry.activeCases > 0
            ? 100
            : 0
          : Math.round((delta / previous) * 100);
      const [topDiseaseKey] = Array.from(entry.diseaseCounts.entries()).sort(
        (a, b) => b[1] - a[1]
      )[0] ?? ["health"];
      const risk = deriveRiskStatus(entry.activeCases, percentDelta);
      const topDisease = humanizeDiseaseKey(topDiseaseKey);
      return {
        name: entry.name,
        migrants: entry.patientIds.size,
        activeCases: entry.activeCases,
        risk,
        topDisease,
        topDiseaseKey,
        changePercent: percentDelta,
        riskNote: buildRiskNote(risk, topDiseaseKey),
        trend: `${percentDelta >= 0 ? "+" : ""}${percentDelta}% vs last period`,
        coordinates: entry.coordinates ?? DEFAULT_COORDINATES,
      };
    })
    .sort((a, b) => b.activeCases - a.activeCases);
};

// SLA-style average between issue date and follow-up when available.
const computeAverageResponse = (prescriptions) => {
  const durations = prescriptions
    .map((record) => {
      const start = new Date(record.dateOfIssue).getTime();
      const end = record.followUpDate
        ? new Date(record.followUpDate).getTime()
        : Date.now();
      if (!start || !end || end < start) return null;
      return (end - start) / (1000 * 60 * 60);
    })
    .filter((value) => typeof value === "number");

  if (!durations.length) return "--";
  const avg =
    durations.reduce((sum, value) => sum + value, 0) / durations.length;
  const hours = Math.floor(avg);
  const minutes = Math.round((avg - hours) * 60);
  return `${hours}h ${minutes}m`;
};

// Estimate coverage by comparing active taluks vs total observed in DB.
const computeCoverage = async (prescriptions) => {
  const totalTaluks = (await Patient.distinct("taluk")).filter(Boolean);
  if (!totalTaluks.length) return "0%";
  const activeTaluks = new Set(
    prescriptions.map(
      (record) =>
        `${makeSlug(record?.patient?.district ?? "")}-${makeSlug(
          record?.patient?.taluk ?? ""
        )}`
    )
  );
  const coverage = Math.round((activeTaluks.size / totalTaluks.length) * 100);
  return `${coverage}%`;
};

/**
 * Returns a district → taluk → village hierarchy for the requested window.
 * Useful for drill-down views and hotspot detection.
 */
const getDiseaseDistricts = async (req, res) => {
  const startedAt = performance.now();
  try {
    const rangeDays = sanitizeRangeDays(req.query.rangeDays);
    const offsetDays = sanitizeOffsetDays(req.query.offsetDays);
    // Compare back-to-back windows so we can display trend labels per taluk.
    const previousOffset = sanitizeOffsetDays(offsetDays + rangeDays);
    const [currentWindow, previousWindow] = await Promise.all([
      fetchPrescriptions({ rangeDays, offsetDays }),
      fetchPrescriptions({ rangeDays, offsetDays: previousOffset }),
    ]);
    const districts = buildDistrictHierarchy(currentWindow, previousWindow);
    res.json({ districts });
    logSlowController("getDiseaseDistricts", startedAt);
  } catch (error) {
    logControllerError("Failed to assemble district hierarchy", error);
    res.status(500).json({ message: "Unable to build district insights" });
  }
};

/**
 * Returns taluk + village hierarchy for a specific district window.
 */
const getDistrictTaluks = async (req, res) => {
  const startedAt = performance.now();
  try {
    const districtSlug = sanitizeDistrictSlug(req.params.district);
    if (!districtSlug) {
      return res
        .status(400)
        .json({ message: "District parameter is required" });
    }
    const rangeDays = sanitizeRangeDays(req.query.rangeDays, 1);
    const offsetDays = sanitizeOffsetDays(req.query.offsetDays);
    const previousOffset = sanitizeOffsetDays(offsetDays + rangeDays);

    const [currentWindow, previousWindow] = await Promise.all([
      fetchPrescriptions({ rangeDays, offsetDays, districtSlug }),
      fetchPrescriptions({
        rangeDays,
        offsetDays: previousOffset,
        districtSlug,
      }),
    ]);

    const hierarchy = buildDistrictHierarchy(currentWindow, previousWindow);
    const districtEntry =
      hierarchy.find((entry) => makeSlug(entry.district) === districtSlug) ??
      null;

    if (!districtEntry) {
      const fallbackLabel = toTitleCase(req.params.district);
      res.json({
        district: {
          district: fallbackLabel,
          totalCases: 0,
          taluks: [],
        },
      });
    } else {
      res.json({ district: districtEntry });
    }
    logSlowController("getDistrictTaluks", startedAt);
  } catch (error) {
    logControllerError("Failed to assemble taluk hierarchy", error);
    res.status(500).json({ message: "Unable to build taluk drill-down" });
  }
};

/**
 * Returns district comparison bars plus disease trend lines for a district.
 */
const getDiseaseSummary = async (req, res) => {
  const startedAt = performance.now();
  try {
    const districtSlug =
      sanitizeDistrictSlug(req.query.district) ?? DEFAULT_DISTRICT_SLUG;
    const trendRangeDays = sanitizeTrendDays(req.query.rangeDays);
    const trendWindowDays = Math.min(MAX_LOOKBACK_DAYS, trendRangeDays * 2);
    const casesRangeDays = sanitizeCasesRange(req.query.casesRangeDays);
    const casesOffsetDays = sanitizeOffsetDays(req.query.casesOffsetDays);

    const [trendWindow, districtWindow] = await Promise.all([
      // Pull a larger window so trend lines stay smooth.
      fetchPrescriptions({ rangeDays: trendWindowDays }),
      fetchPrescriptions({
        rangeDays: casesRangeDays,
        offsetDays: casesOffsetDays,
      }),
    ]);

    const { districtCases, diseaseKeys } = buildDistrictCases(districtWindow);
    const { trendData, trendKeys } = buildTrendData(
      trendWindow,
      districtSlug,
      trendRangeDays
    );

    const labeledDiseaseKeys = diseaseKeys.map((entry) => ({
      key: entry.key,
      label: entry.label,
    }));
    const labeledTrendKeys = trendKeys.map((key) => ({
      key,
      label: toTitleCase(key),
    }));

    res.json({
      districtCases,
      diseaseKeys: labeledDiseaseKeys,
      trendData,
      trendKeys: labeledTrendKeys,
    });
    logSlowController("getDiseaseSummary", startedAt);
  } catch (error) {
    logControllerError("Failed to compute disease summary", error);
    res.status(500).json({ message: "Unable to compute disease summary" });
  }
};

/**
 * Produces the active cases leaderboard along with recent admissions.
 */
const getActiveDiseaseCases = async (req, res) => {
  const startedAt = performance.now();
  try {
    const districtSlug = sanitizeDistrictSlug(req.query.district);
    const rangeDays = sanitizeRangeDays(req.query.rangeDays);
    const offsetDays = sanitizeOffsetDays(req.query.offsetDays);
    // Reuse the same aggregator for statewide and district views.
    const prescriptions = await fetchPrescriptions({ rangeDays, offsetDays });
    const snapshot = buildActiveCases(prescriptions, districtSlug);
    res.json(snapshot);
    logSlowController("getActiveDiseaseCases", startedAt);
  } catch (error) {
    logControllerError("Failed to build active disease cases", error);
    res.status(500).json({ message: "Unable to build active case list" });
  }
};

/**
 * Calculates quick KPIs (case delta, SLA response, coverage) for dashboards.
 */
const getTimelineStats = async (req, res) => {
  const startedAt = performance.now();
  try {
    const districtSlug = sanitizeDistrictSlug(req.query.district);
    const rangeParam = req.query.range || "7d";
    const requestedRange = RANGE_MAP[rangeParam] ?? Number(rangeParam);
    const rangeDays = sanitizeRangeDays(
      Number.isFinite(requestedRange) ? requestedRange : DEFAULT_LOOKBACK_DAYS
    );

    // Measure current vs previous range for delta and SLA insights.
    const previousOffset = sanitizeOffsetDays(rangeDays);
    const [currentWindow, previousWindow] = await Promise.all([
      fetchPrescriptions({ rangeDays, districtSlug }),
      fetchPrescriptions({
        rangeDays,
        offsetDays: previousOffset,
        districtSlug,
      }),
    ]);

    const delta = currentWindow.length - previousWindow.length;
    const casesDelta = delta === 0 ? "0" : delta > 0 ? `+${delta}` : `${delta}`;
    const response = computeAverageResponse(currentWindow);
    const coverage = await computeCoverage(currentWindow);

    res.json({ casesDelta, response, coverage });
    logSlowController("getTimelineStats", startedAt);
  } catch (error) {
    logControllerError("Failed to compute timeline stats", error);
    res.status(500).json({ message: "Unable to compute timeline stats" });
  }
};

/**
 * Builds the statewide risk profile for the Kerala heatmap overlay.
 */
const getKeralaRiskMap = async (req, res) => {
  const startedAt = performance.now();
  try {
    const rangeDays = sanitizeRangeDays(req.query.rangeDays);
    const previousOffset = sanitizeOffsetDays(rangeDays);
    const [currentWindow, previousWindow] = await Promise.all([
      fetchPrescriptions({ rangeDays }),
      fetchPrescriptions({ rangeDays, offsetDays: previousOffset }),
    ]);
    const districts = buildRiskProfile(currentWindow, previousWindow);
    res.json({ districts });
    logSlowController("getKeralaRiskMap", startedAt);
  } catch (error) {
    logControllerError("Failed to compute Kerala risk map", error);
    res.status(500).json({ message: "Unable to compute risk map" });
  }
};

export {
  getDiseaseDistricts,
  getDistrictTaluks,
  getDiseaseSummary,
  getActiveDiseaseCases,
  getTimelineStats,
  getKeralaRiskMap,
};
