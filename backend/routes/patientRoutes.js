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
  allowRoles,
  protect,
} from "../middleware/protect.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);

router.get("/me", protect, allowRoles("patient"), getMyProfile);
router.get("/me/labs", protect, allowRoles("patient"), getMyLabReports);

router.get("/:identifier", protect, allowRoles("patient"), getPatientProfile);

export default router;
