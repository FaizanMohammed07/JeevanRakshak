import express from "express";
import { protectDoctor } from "../middleware/protect.js";
import {
  login,
  signup,
  getPatientByPhone,
} from "../controllers/doctorController.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);

// router.get("/patients", protectDoctor, getPatientByPhone);
// router.post("/patient-by-phone", getPatientByPhone);

export default router;
