import express from "express";
import {
  getDiseaseDistricts,
  getDiseaseSummary,
  getActiveDiseaseCases,
  getTimelineStats,
  getKeralaRiskMap,
} from "../controllers/diseaseController.js";

const router = express.Router();

router.get("/districts", getDiseaseDistricts);
router.get("/summary", getDiseaseSummary);
router.get("/active-cases", getActiveDiseaseCases);
router.get("/timeline", getTimelineStats);
router.get("/risk-map", getKeralaRiskMap);

export default router;
