import express from "express";
import multer from "multer";
import { allowRoles, protect } from "../middleware/protect.js";
import {
  addPatientReport,
  getReportsForPatient,
} from "../controllers/reportController.js";

const upload = multer({
  storage: multer.memoryStorage(),
});

const router = express.Router();

router.post(
  "/",
  protect,
  allowRoles("doctor", "reportAssistant"),
  upload.single("pdf"),
  addPatientReport
);

//get all reports of specific patient
router.get(
  "/patient/:patientId",
  protect,
  allowRoles("doctor", "reportAssistant", "patient"),
  getReportsForPatient
);

export default router;
