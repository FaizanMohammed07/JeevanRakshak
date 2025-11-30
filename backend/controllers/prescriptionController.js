import mongoose from "mongoose";
import Prescription from "../models/prescriptionModel.js";
import Patient from "../models/patientModel.js";
import { uploadCompressedImages } from "../utils/uploadS3.js";

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

    // Basic validation
    if (!patientId || !symptoms || !durationOfSymptoms || !medicinesIssued) {
      return res.status(400).json({ msg: "Missing required fields" });
    }

    // Check if patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ msg: "Patient not found" });
    }

    // req.user is the logged-in doctor (from doctor auth middleware)
    const doctorId = req.user._id;

    const prescription = await Prescription.create({
      patient: patientId,
      doctor: doctorId,
      symptoms,
      durationOfSymptoms,
      contagious,
      medicinesIssued,
      suspectedDisease,
      confirmedDisease,
      followUpDate,
      notes,
    });

    res.status(201).json({
      msg: "Prescription added successfully",
      prescription,
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

    res.status(200).json({
      count: prescriptions.length,
      prescriptions,
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
      allPrescriptions: allPrescriptions,
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
      .sort({ dateOfIssue: -1 });
    // .limit(2);

    return res.status(200).json({
      count: prescriptions.length,
      prescriptions,
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

    const imageUrls = await uploadCompressedImages(
      req.files,
      patient.name,
      req.user.name
    );

    // Create new prescription
    const prescription = await Prescription.create({
      patient: patientId,
      doctor: req.user._id,
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
