import express from "express";
import {
  login,
  signup,
  getPatientProfile,
  getMyProfile,
  getMyLabReports,
} from "../controllers/patientController.js";
import {
  allowDoctorsOnly,
  allowPatientsOnly,
  protect,
} from "../middleware/protect.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);

router.get("/me", protect, allowPatientsOnly, getMyProfile);
router.get("/me/labs", protect, allowPatientsOnly, getMyLabReports);

router.get("/:identifier", protect, allowDoctorsOnly, getPatientProfile);

export default router;
