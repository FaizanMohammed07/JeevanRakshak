import express from "express";
import { login, signup } from "../controllers/patientController.js";
import { protectDoctor } from "../middleware/protect.js";
import { getPatientByPhone } from "../controllers/doctorController.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);

router.get("/:phoneNumber", protectDoctor, getPatientByPhone);

export default router;
