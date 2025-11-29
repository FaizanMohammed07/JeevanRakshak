import express from "express";
import {getPatientByPhone,latestPatients,govtLogin,govtSignup,govtLogout,checkGovtAuth} from "../controllers/govtController.js";
import { govtProtect } from "../middleware/protect.js";
const router = express.Router();
// Public Route (Login)
router.post("/login", govtLogin);
router.post("/signup",govtSignup);
// Protected Routes
router.get("/check", checkGovtAuth);
router.get("/patient", govtProtect, getPatientByPhone);
router.get("/latestPatients", govtProtect, latestPatients);
router.get("/logout", govtLogout);

export default router;
