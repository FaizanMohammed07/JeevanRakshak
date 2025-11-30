import express from "express";
import {
  getDashboardSummary,
  getRapidRiskSnapshot,
  getSdgImpact,
  getTrendWidgets,
  getOversightChecklist,
} from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/summary", getDashboardSummary);
router.get("/risk-snapshot", getRapidRiskSnapshot);
router.get("/sdg-impact", getSdgImpact);
router.get("/trends", getTrendWidgets);
router.get("/oversight", getOversightChecklist);

export default router;
