import express from "express";
import multer from "multer";
import { allowReportAssistantsOnly, protect } from "../middleware/protect.js";
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
  allowReportAssistantsOnly,
  upload.single("pdf"),
  addPatientReport
);

//get all reports of specific patient
router.get(
  "/patient/:patientId",
  protect,
  //   allowDoctorsOnly,
  getReportsForPatient
);

export default router;
