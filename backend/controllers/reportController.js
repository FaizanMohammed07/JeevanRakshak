import Patient from "../models/patientModel.js";
import Reports from "../models/reportsModels.js";
import { uploadPdfToS3 } from "../utils/uploadS3.js";

export const addPatientReport = async (req, res) => {
  try {
    const { patientId, doctor, documentName, notes } = req.body;

    if (!patientId || !documentName || !doctor) {
      return res
        .status(400)
        .json({ msg: "patientId, documentName and doctor name are required" });
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ msg: "Patient not found" });
    }

    if (!req.file) {
      return res.status(400).json({ msg: "Please upload a PDF file" });
    }

    if (req.file.mimetype !== "application/pdf") {
      return res.status(400).json({ msg: "Only PDF files are allowed" });
    }

    const pdfUrl = await uploadPdfToS3(req.file, patient.name, doctor);

    const report = await Reports.create({
      patient: patientId,
      doctor: doctor,
      documentName,
      notes,
      file: pdfUrl,
    });

    return res.status(201).json({
      msg: "Report uploaded successfully",
      report,
    });
  } catch (err) {
    console.error("Error adding report:", err);
    return res.status(500).json({ error: err.message });
  }
};

export const getReportsForPatient = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!patientId) {
      return res.status(400).json({ msg: "Patient ID is required" });
    }

    const reports = await Reports.find({
      patient: patientId,
    })
      .populate("patient", "name age phoneNumber district taluk village")
      .sort({ dateOfIssue: -1 });
    // .limit(2);

    return res.status(200).json({
      count: reports.length,
      reports,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
