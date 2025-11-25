import express from "express";
import { addPrescription } from "../controllers/prescriptionController.js";
import { protectDoctor } from "../middleware/protect.js";

const router = express.Router();

// Doctor adds prescription
router.post("/", protectDoctor, addPrescription);
// router.post("/", addPrescription);

export default router;
