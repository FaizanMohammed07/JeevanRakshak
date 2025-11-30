import express from "express";
import { getOutbreakAlerts } from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/outbreaks", getOutbreakAlerts);

export default router;
