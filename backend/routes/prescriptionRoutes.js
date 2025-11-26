import express from "express";
import {
  addPrescription,
  getMyPrescriptions,
  getDoctorPrescriptions,
  getPrescriptionsForPatient,
  diseasesByArea,
} from "../controllers/prescriptionController.js";
import {
  allowDoctorsOnly,
  allowPatientsOnly,
  protect,
} from "../middleware/protect.js";

const router = express.Router();

// Doctor adds prescription
router.post("/", protect, allowDoctorsOnly, addPrescription);

//get my prescriptions (patient)
router.get("/my", protect, allowPatientsOnly, getMyPrescriptions);

// Doctor Dashboard Data
router.get("/doctor/my", protect, allowDoctorsOnly, getDoctorPrescriptions);

//get all prescriptions of specific patient
router.get(
  "/patient/:patientId",
  protect,
  allowDoctorsOnly,
  getPrescriptionsForPatient
);

router.get("/diseases", diseasesByArea);

export default router;
