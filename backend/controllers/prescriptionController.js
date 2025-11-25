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
