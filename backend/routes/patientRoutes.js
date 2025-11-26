import express from "express";
import { login, signup } from "../controllers/patientController.js";
import { allowDoctorsOnly, protect } from "../middleware/protect.js";
import { getPatientByPhone } from "../controllers/doctorController.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
// router.get("/logout", logout);

router.get("/:phoneNumber", protect, allowDoctorsOnly, getPatientByPhone);

export default router;
