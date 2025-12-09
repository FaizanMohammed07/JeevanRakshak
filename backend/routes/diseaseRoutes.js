import express from "express";
import {
  getDiseaseDistricts,
  getDistrictTaluks,
  getDiseaseSummary,
  getActiveDiseaseCases,
  getTimelineStats,
  getKeralaRiskMap,
  getEmployersList,
  getEmployerAnalysis,
} from "../controllers/diseaseController.js";

const router = express.Router();

router.get("/districts", getDiseaseDistricts);
router.get("/districts/:district/taluks", getDistrictTaluks);
router.get("/summary", getDiseaseSummary);
router.get("/active-cases", getActiveDiseaseCases);
router.get("/timeline", getTimelineStats);
router.get("/risk-map", getKeralaRiskMap);
router.get("/employers", getEmployersList);
router.get("/employer/:employerId/analysis", getEmployerAnalysis);

export default router;
