import mongoose from "mongoose";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import Prescription from "../models/prescriptionModel.js";
import Patient from "../models/patientModel.js";
import { uploadCompressedImages } from "../utils/uploadS3.js";
import translate from "@vitalets/google-translate-api";
import Gtts from "gtts";

const DEFAULT_MEAL_TIMING = "after";
const VALID_MEAL_OPTIONS = ["before", "after", "any"];
const TIME_SLOT_KEYS = ["morning", "afternoon", "night"];
const TIME_SLOT_LABELS = {
  morning: "Morning",
  afternoon: "Afternoon",
  night: "Night",
};
const MEAL_SPEECH_LABELS = {
  before: "before meals",
  after: "after meals",
  any: "any time",
};

const TTS_OUTPUT_BASE = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "tts-files"
);
const TTS_WEB_ROUTE = "/tts-files";
const SUPPORTED_SPEECH_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "ml", label: "Malayalam" },
  { code: "ta", label: "Tamil" },
];

const normalizeSchedule = (schedule = {}) =>
  TIME_SLOT_KEYS.reduce((acc, key) => {
    const value = schedule[key];
    if (value && typeof value === "object") {
      acc[key] = {
        active: Boolean(value.active),
        mealTiming: VALID_MEAL_OPTIONS.includes(value.mealTiming)
          ? value.mealTiming
          : DEFAULT_MEAL_TIMING,
      };
      return acc;
    }
    acc[key] = {
      active: Boolean(value),
      mealTiming: DEFAULT_MEAL_TIMING,
    };
    return acc;
  }, {});

const normalizeMedicineEntry = (entry) => {
  if (!entry) return null;
  if (typeof entry === "string") {
    const trimmed = entry.trim();
    if (!trimmed) return null;
    return {
      name: trimmed,
      dosage: "",
      schedule: normalizeSchedule({}),
      mealTiming: DEFAULT_MEAL_TIMING,
    };
  }

  const name = (entry.name || entry.medicineName || "").trim();
  if (!name) return null;

  const mealTiming = VALID_MEAL_OPTIONS.includes(entry.mealTiming)
    ? entry.mealTiming
    : DEFAULT_MEAL_TIMING;

  return {
    name,
    dosage: (entry.dosage || "").trim(),
    schedule: normalizeSchedule(entry.schedule),
    mealTiming,
  };
};

const normalizeMedicineList = (list) => {
  if (!Array.isArray(list)) return [];
  return list.map(normalizeMedicineEntry).filter(Boolean);
};

const ensureDirectoryExists = async (dirPath) => {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (err) {
    console.error("ensureDirectoryExists error:", err);
    throw err;
  }
};

const joinWithCommaAndAnd = (items) => {
  if (!items.length) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
};

const medicineToSpeech = (medicine) => {
  if (!medicine || !medicine.name) {
    return "";
  }
  const base = `${medicine.name}${
    medicine.dosage ? ` ${medicine.dosage}` : ""
  }`;
  const slotDescriptions = TIME_SLOT_KEYS.reduce((acc, key) => {
    const slot = medicine.schedule?.[key];
    if (!slot?.active) return acc;
    const timeLabel = (TIME_SLOT_LABELS[key] || key).toLowerCase();
    const mealLabel =
      MEAL_SPEECH_LABELS[slot.mealTiming] || MEAL_SPEECH_LABELS.after;
    acc.push(`${timeLabel} (${mealLabel})`);
    return acc;
  }, []);

  if (!slotDescriptions.length) {
    return `Take ${base} as directed.`;
  }

  const slotText = joinWithCommaAndAnd(slotDescriptions);
  return `Take ${base} in the ${slotText}.`;
};

const formatDateForSpeech = (value) => {
  if (!value) return null;
  try {
    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch (err) {
    return null;
  }
};

const buildPrescriptionNarrative = (prescription) => {
  const normalized = normalizeMedicineList(prescription.medicinesIssued);
  const lines = [];
  if (prescription.symptoms) {
    lines.push(`Symptoms: ${prescription.symptoms}.`);
  }
  if (prescription.durationOfSymptoms) {
    lines.push(`Duration of symptoms: ${prescription.durationOfSymptoms}.`);
  }
  if (normalized.length) {
    lines.push(...normalized.map(medicineToSpeech).filter(Boolean));
  } else {
    lines.push("No medicines recorded yet.");
  }
  if (prescription.followUpDate) {
    const followUpText = formatDateForSpeech(prescription.followUpDate);
    if (followUpText) {
      lines.push(`Follow-up appointment is on ${followUpText}.`);
    }
  }
  return lines.join(" ");
};

const translateText = async (text, targetLang) => {
  if (!text) return "";
  try {
    const result = await translate(text, { to: targetLang });
    return result.text || "";
  } catch (err) {
    console.error(`translateText error for ${targetLang}:`, err);
    throw err;
  }
};

const generateAudio = (text, langCode, destination) =>
  new Promise((resolve, reject) => {
    const speech = new Gtts(text, langCode);
    speech.save(destination, (err) => {
      if (err) return reject(err);
      resolve(destination);
    });
  });

const findLanguageLabel = (code) =>
  SUPPORTED_SPEECH_LANGUAGES.find((lang) => lang.code === code)?.label ||
  code;

const buildSpeechEntry = async ({
  langCode,
  englishNarrative,
  prescriptionId,
  prescriptionDir,
  needAudio,
}) => {
  let textContent = englishNarrative;
  let translationError = null;
  if (langCode !== "en") {
    try {
      textContent = await translateText(englishNarrative, langCode);
    } catch (err) {
      translationError = err?.message || "Translation failed";
      textContent = englishNarrative;
    }
  }

  const textFileName = `prescription_${langCode}.txt`;
  const textFilePath = path.join(prescriptionDir, textFileName);
  await fs.writeFile(textFilePath, textContent, "utf-8");

  const entry = {
    code: langCode,
    label: findLanguageLabel(langCode),
    text: textContent,
    textUrl: `${TTS_WEB_ROUTE}/${prescriptionId}/${textFileName}`,
    translationError,
  };

  if (needAudio) {
    const audioFileName = `prescription_${langCode}.mp3`;
    const audioFilePath = path.join(prescriptionDir, audioFileName);
    try {
      await generateAudio(textContent, langCode, audioFilePath);
      entry.audioUrl = `${TTS_WEB_ROUTE}/${prescriptionId}/${audioFileName}`;
    } catch (err) {
      entry.audioError = err?.message || "Audio generation failed";
      console.error(`gtts save failed for ${langCode}:`, err);
    }
  }

  return entry;
};

const sanitizePrescriptionForResponse = (prescription) => {
  if (!prescription) return null;
  const doc = prescription.toObject
    ? prescription.toObject({ getters: true })
    : { ...prescription };
  doc.medicinesIssued = normalizeMedicineList(doc.medicinesIssued);
  return doc;
};

export const generatePrescriptionSpeech = async (req, res) => {
  try {
    const { prescriptionId } = req.params;
    if (!prescriptionId) {
      return res.status(400).json({ msg: "Prescription ID is required" });
    }

    const prescription = await Prescription.findById(prescriptionId);
    if (!prescription) {
      return res.status(404).json({ msg: "Prescription not found" });
    }

    let storedPatientId = null;
    if (prescription.patient) {
      if (prescription.patient._id) {
        storedPatientId = prescription.patient._id.toString();
      } else if (typeof prescription.patient.toString === "function") {
        storedPatientId = prescription.patient.toString();
      }
    }

    if (!storedPatientId) {
      return res.status(403).json({ msg: "Cannot verify patient ownership" });
    }

    if (storedPatientId !== req.user._id.toString()) {
      return res.status(403).json({ msg: "Access denied" });
    }

    const englishNarrative = buildPrescriptionNarrative(prescription);
    await ensureDirectoryExists(TTS_OUTPUT_BASE);
    const prescriptionDir = path.join(TTS_OUTPUT_BASE, prescriptionId);
    await ensureDirectoryExists(prescriptionDir);

    const previewOnly = req.query.previewOnly === "true";
    const requestedCode = (req.query.lang || "en").toLowerCase();

    if (previewOnly) {
      const requestedSpeech = await buildSpeechEntry({
        langCode: requestedCode,
        englishNarrative,
        prescriptionId,
        prescriptionDir,
        needAudio: false,
      });

      return res.status(200).json({
        prescriptionId,
        narration: englishNarrative,
        requestedSpeech,
        speechFiles: [],
      });
    }

    const speechRecords = [];
    for (const lang of SUPPORTED_SPEECH_LANGUAGES) {
      const entry = await buildSpeechEntry({
        langCode: lang.code,
        englishNarrative,
        prescriptionId,
        prescriptionDir,
        needAudio: true,
      });
      speechRecords.push(entry);
    }

    const requestedSpeech =
      speechRecords.find((entry) => entry.code === requestedCode) ||
      speechRecords[0];

    return res.status(200).json({
      prescriptionId,
      narration: englishNarrative,
      requestedSpeech,
      speechFiles: speechRecords,
    });
  } catch (err) {
    console.error("generatePrescriptionSpeech error:", err);
    return res.status(500).json({ error: err.message });
  }
};

export const addPrescription = async (req, res) => {
  try {
    const {
      patientId,
      symptoms,
      durationOfSymptoms,
      contagious,
      medicinesIssued,
      suspectedDisease,
      confirmedDisease,
      followUpDate,
      notes,
    } = req.body;

    const normalizedMedicines = normalizeMedicineList(medicinesIssued);
    if (
      !patientId ||
      !symptoms ||
      !durationOfSymptoms ||
      !normalizedMedicines.length
    ) {
      return res.status(400).json({ msg: "Missing required fields" });
    }

    // Check if patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ msg: "Patient not found" });
    }

    // req.user is the logged-in doctor (from doctor auth middleware)
    const doctorId = req.user._id;

    // Check if the doctor already wrote a prescription for this patient within 30 mins TIME LIMIT-PRESCRPTION
    // const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    // const recentPrescription = await Prescription.findOne({
    //   patient: patientId,
    //   doctor: doctorId,
    //   dateOfIssue: { $gte: thirtyMinutesAgo },
    // });

    // if (recentPrescription) {
    //   return res.status(429).json({
    //     msg: "You already added a prescription for this patient within the last 30 minutes.",
    //   });
    // }

    const prescription = await Prescription.create({
      patient: patientId,
      doctor: doctorId,
      symptoms,
      durationOfSymptoms,
      contagious,
      medicinesIssued: normalizedMedicines,
      suspectedDisease,
      confirmedDisease,
      followUpDate,
      notes,
    });

    // console.log(prescription + prescription.medicinesIssued.schedule);

    res.status(201).json({
      msg: "Prescription added successfully",
      prescription: sanitizePrescriptionForResponse(prescription),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const getMyPrescriptions = async (req, res) => {
  try {
    const patientId = req.user._id;

    const prescriptions = await Prescription.find({ patient: patientId })
      .populate("doctor", "name")
      .sort({ dateOfIssue: -1 });

    const normalized = prescriptions.map(sanitizePrescriptionForResponse);
    res.status(200).json({
      count: normalized.length,
      prescriptions: normalized,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getDoctorPrescriptions = async (req, res) => {
  try {
    const doctorId = req.user._id;

    // TODAY range
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // === 1. Get all prescriptions issued by this doctor ===
    const allPrescriptions = await Prescription.find({ doctor: doctorId })
      .populate("patient", "name age phoneNumber")
      .sort({ dateOfIssue: -1 });

    // === 2. Total prescriptions ===
    const totalCount = allPrescriptions.length;

    // === 3. Today’s prescriptions ===
    const todaysCount = allPrescriptions.filter(
      (p) =>
        new Date(p.dateOfIssue) >= startOfDay &&
        new Date(p.dateOfIssue) <= endOfDay
    ).length;

    // === 4. Recent 10 prescriptions ===
    // const recent10 = allPrescriptions.slice(0, 10);

    return res.status(200).json({
      totalPrescriptions: totalCount,
      todaysPrescriptions: todaysCount,
      // recentPrescriptions: recent10,
      allPrescriptions: allPrescriptions.map(sanitizePrescriptionForResponse),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getPrescriptionsForPatient = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!patientId) {
      return res.status(400).json({ msg: "Patient ID is required" });
    }

    // Fetch prescriptions
    const prescriptions = await Prescription.find({
      patient: patientId,
      // doctor: req.user._id, // doctor sees ONLY their own prescriptions
    })
      // .populate("patient", "name age phoneNumber district taluk village")
      .populate("doctor", "name")
      .sort({ dateOfIssue: -1 });
    // .limit(2);

    return res.status(200).json({
      count: prescriptions.length,
      prescriptions: prescriptions.map(sanitizePrescriptionForResponse),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const diseasesByArea = async (req, res) => {
  try {
    // Accept location and duration in query params
    const { district, taluk, village, duration } = req.query;

    // validation
    if (!district && !taluk && !village) {
      return res
        .status(400)
        .json({ msg: "Provide at least one of district, taluk or village" });
    }
    if (!duration) {
      return res.status(400).json({ msg: "Please provide duration" });
    }
    const days = parseInt(duration, 10);
    if (Number.isNaN(days) || days <= 0) {
      return res
        .status(400)
        .json({ msg: "duration must be a positive integer (number of days)" });
    }

    // Build patient filter (case-insensitive)
    const patientFilter = {};
    if (district)
      patientFilter.district = { $regex: `^${district}$`, $options: "i" };
    if (taluk) patientFilter.taluk = { $regex: `^${taluk}$`, $options: "i" };
    if (village)
      patientFilter.village = { $regex: `^${village}$`, $options: "i" };

    // 1) Find patient ids for that area
    const patients = await Patient.find(patientFilter).select("_id").lean();

    if (!patients.length) {
      return res.status(200).json({ totalPatients: 0, diseases: [] });
    }

    const patientIds = patients.map((p) => p._id);

    // 2) Calculate start date
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // 3) Aggregate prescriptions for those patients in the duration window
    // Use confirmedDisease if present and non-empty otherwise suspectedDisease
    const pipeline = [
      {
        $match: {
          patient: {
            $in: patientIds.map((id) => new mongoose.Types.ObjectId(id)),
          },
          dateOfIssue: { $gte: startDate },
        },
      },
      {
        $project: {
          // Normalize disease: prefer confirmedDisease if non-empty else suspectedDisease
          disease: {
            $cond: [
              {
                $and: [
                  { $ifNull: ["$confirmedDisease", false] },
                  { $ne: ["$confirmedDisease", ""] },
                ],
              },
              "$confirmedDisease",
              "$suspectedDisease",
            ],
          },
        },
      },
      // remove documents where disease is null/empty
      { $match: { disease: { $exists: true, $ne: null, $ne: "" } } },
      { $group: { _id: "$disease", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { _id: 0, disease: "$_id", count: 1 } },
    ];

    const diseases = await Prescription.aggregate(pipeline);

    // 4) Return counts + meta
    return res.status(200).json({
      totalPatients: patients.length,
      durationDays: days,
      since: startDate.toISOString(),
      diseases, // [{ disease: "Malaria", count: 4 }, ...]
    });
  } catch (err) {
    console.error("diseasesByArea error:", err);
    return res.status(500).json({ error: err.message });
  }
};

export const addPrescriptionImagesOnly = async (req, res) => {
  try {
    const { patientId, contagious, confirmedDisease } = req.body;

    // Basic validation
    if (!patientId) {
      return res.status(400).json({ msg: "patientId is required" });
    }

    // Check patient existence
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ msg: "Patient not found" });
    }

    // Must have files
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ msg: "No images uploaded" });
    }

    const doctorId = req.user._id;

    // Check if the doctor already wrote a prescription for this patient within 30 mins
    // const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    // const recentPrescription = await Prescription.findOne({
    //   patient: patientId,
    //   doctor: doctorId,
    //   dateOfIssue: { $gte: thirtyMinutesAgo },
    // });

    // if (recentPrescription) {
    //   return res.status(429).json({
    //     msg: "You already added a prescription for this patient within the last 30 minutes.",
    //   });
    // }

    const imageUrls = await uploadCompressedImages(
      req.files,
      patient.name,
      req.user.name
    );

    // Create new prescription
    const prescription = await Prescription.create({
      patient: patientId,
      doctor: doctorId,
      contagious: contagious || false,
      confirmedDisease: confirmedDisease || "",
      images: imageUrls,
    });

    return res.status(201).json({
      msg: "Prescription images added successfully",
      prescription,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
