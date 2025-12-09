import express from "express";
import {
  signup,
  login,
  logout,
  listContractors,
  linkContractorByPhone,
  unlinkContractor,
  fetchEmployerProfile,
  broadcastToContractors,
  getContractorDetails,
  pingContractor,
} from "../controllers/employerController.js";
import { protect, allowEmployersOnly } from "../middleware/protect.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/logout", logout);

router.get("/me", protect, allowEmployersOnly, fetchEmployerProfile);

// Protected employer operations
router.get("/contractors", protect, allowEmployersOnly, listContractors);
router.post(
  "/contractors/link",
  protect,
  allowEmployersOnly,
  linkContractorByPhone
);
router.delete(
  "/contractors/:contractorId",
  protect,
  allowEmployersOnly,
  unlinkContractor
);
router.post(
  "/contractors/broadcast",
  protect,
  allowEmployersOnly,
  broadcastToContractors
);

router.get(
  "/contractors/:contractorId",
  protect,
  allowEmployersOnly,
  getContractorDetails
);

router.post(
  "/contractors/:contractorId/ping",
  protect,
  allowEmployersOnly,
  pingContractor
);

export default router;
