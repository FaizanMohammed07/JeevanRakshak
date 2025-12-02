import express from "express";
import {
  addPrescription,
  getMyPrescriptions,
  getDoctorPrescriptions,
  getPrescriptionsForPatient,
  diseasesByArea,
  addPrescriptionImagesOnly,
} from "../controllers/prescriptionController.js";
import {
  allowDoctorsOnly,
  allowPatientsOnly,
  allowRoles,
  protect,
} from "../middleware/protect.js";
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(), // IMPORTANT: no disk usage
});

const router = express.Router();

// Doctor adds prescription
router.post("/", protect, allowRoles("doctor"), addPrescription);

//get my prescriptions (patient)
router.get("/my", protect, allowRoles("patinet"), getMyPrescriptions);

// Doctor Dashboard Data
router.get("/doctor/my", protect, allowRoles("doctor"), getDoctorPrescriptions);

//get all prescriptions of specific patient
router.get(
  "/patient/:patientId",
  protect,
  allowRoles("doctor", "patient"),
  getPrescriptionsForPatient
);

router.get("/diseases", diseasesByArea);

router.post(
  "/images",
  protect,
  allowRoles("doctor"),
  upload.array("images", 10), // allow up to 10 images
  addPrescriptionImagesOnly
);

export default router;
