import Prescription from "../models/prescriptionModel.js";
import Patient from "../models/patientModel.js";

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
    res.status(500).json({ error: err.message });
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
      .sort({ dateOfIssue: -1 })
      .limit(2);

    return res.status(200).json({
      count: prescriptions.length,
      prescriptions,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
