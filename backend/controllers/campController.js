import Patient from "../models/patientModel.js";
import Prescription from "../models/prescriptionModel.js";
import Announcement from "../models/announcementModel.js";
import { sendWhatsAppMessage } from "../utils/sendWhatsAppMessage.js";

const CAMP_ACTIVITY_LOOKBACK_DAYS = 14;
const MAX_ALERT_RESULTS = 12;
const MAX_TRANSFER_RESULTS = 8;
const MAX_AUTOMATION_ITEMS = 8;
const MAX_ANNOUNCEMENTS = 12;
const DEFAULT_CAMPS_LIMIT = 60;
const DEFAULT_VACCINATION_FLOOR = 42;
const DEFAULT_VACCINATION_CEILING = 97;

const HOSPITAL_DIRECTORY = {
  Ernakulam: {
    name: "Ernakulam Govt. Medical College",
    distance: "8 km",
    hotline: "0484-2660601",
  },
  Thiruvananthapuram: {
    name: "Trivandrum Medical College",
    distance: "6 km",
    hotline: "0471-2443152",
  },
  Kozhikode: {
    name: "Kozhikode Beach Hospital",
    distance: "5 km",
    hotline: "0495-2765353",
  },
  Thrissur: {
    name: "Jubilee Mission Hospital",
    distance: "4 km",
    hotline: "0487-2432200",
  },
  Kollam: {
    name: "Kollam District Hospital",
    distance: "9 km",
    hotline: "0474-2792345",
  },
  Palakkad: {
    name: "Palakkad District Hospital",
    distance: "7 km",
    hotline: "0491-2506000",
  },
  Default: {
    name: "State General Hospital, Kerala",
    distance: "--",
    hotline: "0471-2330000",
  },
};

const FALLBACK_LABELS = {
  district: "Unassigned District",
  taluk: "Unassigned Taluk",
  village: "Unassigned Village",
  camp: "Unmapped Camp",
};

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

const normalizeText = (value, fallback = "") => {
  if (!value || typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : fallback;
};

const makeSlug = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const getCampLabel = (patient) => {
  const baseVillage = normalizeText(patient?.village, FALLBACK_LABELS.village);
  return normalizeText(
    patient?.address,
    baseVillage ? `${baseVillage} Cluster` : FALLBACK_LABELS.camp
  );
};

const getHospitalProfile = (district) =>
  HOSPITAL_DIRECTORY[district] || HOSPITAL_DIRECTORY.Default;

const determineRiskLevel = ({ population, sickResidents, contagiousHits }) => {
  const sickRatio =
    sickResidents && population ? sickResidents / population : 0;
  if (sickRatio >= 0.08 || contagiousHits >= 8) return "high";
  if (sickRatio >= 0.04 || contagiousHits >= 4) return "medium";
  return "low";
};

const deriveVaccinationPercent = ({ population, sickResidents }) => {
  if (!population) return DEFAULT_VACCINATION_FLOOR;
  const healthyRatio = Math.max(0, 1 - (sickResidents || 0) / population);
  const derived = Math.round(healthyRatio * 100);
  return Math.min(
    DEFAULT_VACCINATION_CEILING,
    Math.max(DEFAULT_VACCINATION_FLOOR, derived)
  );
};

const deriveCampAlerts = (camp) => {
  const alerts = [];
  const sickRatio = camp.population
    ? ((camp.sickResidents || 0) / camp.population) * 100
    : 0;
  if (camp.risk === "high") {
    alerts.push({
      severity: "critical",
      message: `${camp.name} reporting ${
        camp.sickResidents
      } sick (${sickRatio.toFixed(
        1
      )}% residents). Immediate surge recommended.`,
      recommendation: "Deploy field medical team and increase lab capacity",
    });
  } else if (camp.risk === "medium") {
    alerts.push({
      severity: "warning",
      message: `${camp.name} trending upward with ${camp.contagiousHits} contagious cases in last window.`,
      recommendation: "Schedule inspection within 48h and audit isolation bays",
    });
  }
  if (camp.contagiousHits >= 5) {
    alerts.push({
      severity: "warning",
      message: `${camp.contagiousHits} contagious prescriptions filed this fortnight at ${camp.name}.`,
      recommendation: "Replenish PPE stock and re-run tracing drills",
    });
  }
  return alerts;
};

const formatAnnouncements = (records = []) =>
  records.map((record) => ({
    id: record._id.toString(),
    title: record.title,
    message: record.message,
    audience: record.audience,
    priority: record.priority,
    districts: record.districts || [],
    timestamp: record.createdAt,
  }));

const normalizeAudience = (value = "All") => {
  if (!value) return "All";
  const normalized = value.toString().trim().toLowerCase();
  if (normalized.startsWith("doctor")) return "Doctors";
  if (normalized.startsWith("patient")) return "Patients";
  return "All";
};

const normalizeDistrictFilters = (value) => {
  if (!Array.isArray(value)) return [];
  const extracted = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((entry) => entry.length);
  return Array.from(new Set(extracted));
};

const buildQueryDistrictFilters = (query) => {
  if (Array.isArray(query)) return normalizeDistrictFilters(query);
  if (typeof query === "string") return normalizeDistrictFilters([query]);
  return [];
};

// Helper: Convert DB phone number into WhatsApp format
function formatWhatsAppNumber(rawNumber) {
  if (!rawNumber) return null;

  // Remove all non-digits
  const cleaned = rawNumber.toString().replace(/\D/g, "");

  // If number already starts with 91 → assume correct
  if (cleaned.startsWith("91")) {
    return `whatsapp:+${cleaned}`;
  }

  // Otherwise assume it's an Indian number without country code
  return `whatsapp:+91${cleaned}`;
}

const buildAutomationTasks = (camps = []) =>
  camps
    .filter((camp) => camp.risk !== "low")
    .slice(0, MAX_AUTOMATION_ITEMS)
    .map((camp) => ({
      id: `${camp.slug}-${camp.risk}`,
      camp: camp.name,
      district: camp.district,
      priority: camp.risk === "high" ? "urgent" : "routine",
      action:
        camp.risk === "high"
          ? "Auto-assign surge medical officer"
          : "Schedule preventive audit",
      deadline: new Date(
        Date.now() + (camp.risk === "high" ? 6 : 18) * 60 * 60 * 1000
      ).toISOString(),
      metric: `${camp.sickResidents} sick / ${camp.population}`,
    }));

const collectCampInsights = async (rangeDays) => {
  const patients = await Patient.find(
    {},
    "district taluk village address"
  ).lean();
  if (!patients.length) {
    return {
      camps: [],
      summary: null,
      alerts: [],
      transferQueue: [],
      automation: [],
      announcements: [],
    };
  }

  const campMap = new Map();
  const patientCampIndex = new Map();

  patients.forEach((patient) => {
    const campName = getCampLabel(patient);
    const slug = makeSlug(campName);
    if (!campMap.has(slug)) {
      campMap.set(slug, {
        slug,
        name: campName,
        district: normalizeText(patient?.district, FALLBACK_LABELS.district),
        taluk: normalizeText(patient?.taluk, FALLBACK_LABELS.taluk),
        village: normalizeText(patient?.village, FALLBACK_LABELS.village),
        population: 0,
        patientIds: new Set(),
        sickSet: new Set(),
        contagiousHits: 0,
        hospital: getHospitalProfile(patient?.district),
      });
    }
    const campEntry = campMap.get(slug);
    campEntry.population += 1;
    const patientId = patient._id.toString();
    campEntry.patientIds.add(patientId);
    patientCampIndex.set(patientId, slug);
  });

  const lookbackStart = new Date();
  lookbackStart.setDate(lookbackStart.getDate() - rangeDays);

  const relevantPatientIds = Array.from(patientCampIndex.keys());
  if (relevantPatientIds.length) {
    const prescriptions = await Prescription.find(
      {
        patient: { $in: relevantPatientIds },
        dateOfIssue: { $gte: lookbackStart },
      },
      "patient contagious confirmedDisease suspectedDisease"
    )
      .sort({ dateOfIssue: -1 })
      .lean();

    prescriptions.forEach((record) => {
      const patientId =
        record.patient?.toString?.() || record.patient.toString();
      const campSlug = patientCampIndex.get(patientId);
      if (!campSlug || !campMap.has(campSlug)) return;
      const campEntry = campMap.get(campSlug);
      campEntry.sickSet.add(patientId);
      if (record.contagious) campEntry.contagiousHits += 1;
    });
  }

  const camps = Array.from(campMap.values())
    .map((camp) => {
      const sickResidents = camp.sickSet.size;
      const risk = determineRiskLevel({
        population: camp.population,
        sickResidents,
        contagiousHits: camp.contagiousHits,
      });
      const vaccinated = deriveVaccinationPercent({
        population: camp.population,
        sickResidents,
      });
      return {
        id: camp.slug,
        slug: camp.slug,
        name: camp.name,
        district: camp.district,
        taluk: camp.taluk,
        village: camp.village,
        population: camp.population,
        sick: sickResidents,
        risk,
        vaccinated,
        contagiousHits: camp.contagiousHits,
        hospital: camp.hospital,
        lastUpdated: new Date().toISOString(),
      };
    })
    .sort((a, b) => b.sick - a.sick)
    .slice(0, DEFAULT_CAMPS_LIMIT);

  const totalPopulation = camps.reduce((sum, camp) => sum + camp.population, 0);
  const totalSick = camps.reduce((sum, camp) => sum + camp.sick, 0);
  const avgVaccination = camps.length
    ? Math.round(
        camps.reduce((sum, camp) => sum + camp.vaccinated, 0) / camps.length
      )
    : 0;
  const highRiskCount = camps.filter((camp) => camp.risk === "high").length;
  const hotspot = camps[0] ?? null;
  const urgentAlerts = camps
    .filter((camp) => camp.risk !== "low")
    .slice(0, 4)
    .map((camp) => ({
      id: camp.slug,
      name: camp.name,
      district: camp.district,
      sick: camp.sick,
      risk: camp.risk,
    }));

  const summary = {
    metrics: [
      {
        label: "Total Population",
        value: totalPopulation,
        subline: `${totalSick} currently sick`,
        iconKey: "users",
      },
      {
        label: "High-Risk Camps",
        value: highRiskCount,
        subline: "Requires field inspection",
        iconKey: "alert",
      },
      {
        label: "Avg. Vaccination",
        value: `${avgVaccination}%`,
        subline: "Goal: 85%+",
        iconKey: "shield",
      },
    ],
    hotspot,
    urgentAlerts,
  };

  const alerts = camps
    .flatMap((camp) =>
      deriveCampAlerts(camp).map((alert, index) => ({
        id: `${camp.slug}-${index}`,
        camp: camp.name,
        district: camp.district,
        severity: alert.severity,
        message: alert.message,
        recommendation: alert.recommendation,
      }))
    )
    .slice(0, MAX_ALERT_RESULTS);

  const transferQueue = camps
    .filter((camp) => camp.risk !== "low")
    .map((camp) => ({
      id: camp.slug,
      name: camp.name,
      district: camp.district,
      risk: camp.risk,
      sick: camp.sick,
      population: camp.population,
      hospital: camp.hospital,
    }))
    .slice(0, MAX_TRANSFER_RESULTS);

  const automation = buildAutomationTasks(camps);

  const announcements = await Announcement.find()
    .sort({ createdAt: -1 })
    .limit(MAX_ANNOUNCEMENTS)
    .lean();

  return {
    camps,
    summary,
    alerts,
    transferQueue,
    automation,
    announcements: formatAnnouncements(announcements),
  };
};

export const getCampOverview = async (req, res) => {
  try {
    const rangeDays = clampNumber(req.query.rangeDays, {
      min: 7,
      max: 60,
      fallback: CAMP_ACTIVITY_LOOKBACK_DAYS,
    });
    const payload = await collectCampInsights(rangeDays);
    res.json(payload);
  } catch (error) {
    console.error("[CampController] Failed to build camp overview", error);
    res.status(500).json({ message: "Unable to assemble camp overview" });
  }
};

// export const publishCampAnnouncement = async (req, res) => {
//   try {
//     const {
//       title,
//       message,
//       audience = "Doctors",
//       priority = "medium",
//     } = req.body || {};

//     // --------------------------
//     // 1️⃣ Basic validation
//     // --------------------------
//     if (!title || !message) {
//       return res.status(400).json({
//         message: "Title and message are required",
//       });
//     }

//     // --------------------------
//     // 2️⃣ Store announcement
//     // --------------------------
//     const record = await Announcement.create({
//       title,
//       message,
//       audience,
//       priority,
//       createdBy: req.user?.name || "dashboard",
//     });

//     // --------------------------
//     // 3️⃣ Decide if WhatsApp must be sent
//     // --------------------------
//     const shouldNotifyPatients =
//       audience.toLowerCase().includes("patient") ||
//       audience.toLowerCase() === "all";

//     let whatsappResults = [];

//     if (shouldNotifyPatients) {
//       console.log("📢 Broadcasting WhatsApp alerts to patients…");

//       // Fetch patient numbers
//       const patients = await Patient.find({}, "phoneNumber name");

//       // Send messages in parallel (promise batch)
//       const sendOps = patients.map(async (user) => {
//         if (!user.phoneNumber) return null;

//         const formatted = convertToWhatsAppNumber(user.phoneNumber); // your helper function

//         if (!formatted) {
//           console.log("❌ Invalid number skipped:", user.phoneNumber);
//           return null;
//         }

//         try {
//           await sendWhatsAppMessage(
//             formatted,
//             `📢 *Health Announcement*\n\n${title}\n${message}\n\n— Kerala Health Department`
//           );

//           console.log("✅ WhatsApp sent to:", formatted);

//           return { number: formatted, status: "sent" };
//         } catch (err) {
//           console.log("⚠️ WhatsApp FAILED:", formatted, err.message);
//           return { number: formatted, status: "failed", error: err.message };
//         }
//       });

//       // Resolve all promises safely
//       whatsappResults = await Promise.all(sendOps);
//     }

//     // --------------------------
//     // 4️⃣ Respond safely
//     // --------------------------
//     return res.status(201).json({
//       announcement: formatAnnouncements([record])[0],
//       whatsappBroadcast: shouldNotifyPatients
//         ? "Processed with partial successes — see logs"
//         : "No WhatsApp broadcast (audience not patients)",
//       deliveryReport: whatsappResults.filter(Boolean),
//     });
//   } catch (error) {
//     console.error("[CampController] CRITICAL ERROR:", error);
//     return res.status(500).json({
//       message: "System error while publishing announcement",
//     });
//   }
// };

export const publishCampAnnouncement = async (req, res) => {
  try {
    const {
      title,
      message,
      audience = "Doctors",
      priority = "medium",
      districts,
    } = req.body;

    if (!title || !message) {
      return res
        .status(400)
        .json({ message: "Title and message are required" });
    }

    const targetDistricts = normalizeDistrictFilters(districts);

    // 1️⃣ Save announcement
    const record = await Announcement.create({
      title,
      message,
      audience,
      priority,
      districts: targetDistricts,
      createdBy: req.user?.name || "dashboard",
    });

    const shouldNotifyPatients =
      audience.toLowerCase().includes("patient") ||
      audience.toLowerCase() === "all";

    // 2️⃣ Respond immediately → no waiting!
    res.status(201).json({
      announcement: formatAnnouncements([record])[0],
      info: "Announcement saved. WhatsApp delivery started in background.",
    });

    // 3️⃣ Background WhatsApp broadcast (no blocking)
    setTimeout(async () => {
      try {
        if (!shouldNotifyPatients) return;

        const patientFilter = targetDistricts.length
          ? { district: { $in: targetDistricts } }
          : {};

        const patients = await Patient.find(
          patientFilter,
          "phoneNumber name district"
        );

        for (const user of patients) {
          const wa = formatWhatsAppNumber(user.phoneNumber);
          if (!wa) continue;

          try {
            await sendWhatsAppMessage(
              wa,
              `📢 *Health Announcement*\n\n${title}\n${message}\n\n— Kerala Health Department`
            );
            console.log("WhatsApp sent:", wa);
          } catch (err) {
            console.log("WhatsApp FAILED:", wa, err.message);
          }
        }
      } catch (err) {
        console.log("Background WhatsApp error:", err.message);
      }
    }, 100); // slight delay so response is already sent
  } catch (error) {
    console.error("[CampController] Failed to publish announcement", error);
    return res.status(500).json({ message: "Unable to publish announcement" });
  }
};

export const deleteCampAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Announcement id is required" });
    }
    const record = await Announcement.findByIdAndDelete(id);
    if (!record) {
      return res.status(404).json({ message: "Announcement not found" });
    }
    res.json({ success: true, id });
  } catch (error) {
    console.error("[CampController] Failed to delete announcement", error);
    res.status(500).json({ message: "Unable to delete announcement" });
  }
};

export const getHeroAnnouncements = async (req, res) => {
  try {
    const audience = normalizeAudience(req.query.audience || "All");
    const match =
      audience === "All"
        ? {}
        : {
            audience: { $in: ["All", audience] },
          };

    const districtFilters = buildQueryDistrictFilters(
      req.query.districts ?? req.query.district
    ).map((value) => value.toLowerCase());

    const announcements = await Announcement.find(match)
      .sort({ priority: -1, createdAt: -1 })
      .limit(MAX_ANNOUNCEMENTS)
      .lean();

    const filtered = announcements.filter((record) => {
      if (!districtFilters.length) return true;
      const recordDistricts = normalizeDistrictFilters(
        record.districts || []
      ).map((value) => value.toLowerCase());
      if (!recordDistricts.length) return true;
      return recordDistricts.some((district) =>
        districtFilters.includes(district)
      );
    });

    res.json({ announcements: formatAnnouncements(filtered) });
  } catch (error) {
    console.error("[CampController] Failed to fetch hero announcements", error);
    res.status(500).json({ message: "Unable to load announcements" });
  }
};
