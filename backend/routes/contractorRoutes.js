import express from "express";
import {
  signupContractor,
  loginContractor,
  addWorker,
  listWorkers,
  getWorker,
  removeWorker,
  fetchContractorProfile,
  linkWorkerByPhone,
  clearWorkerAlert,
  broadcastToPatients,
} from "../controllers/contractorController.js";
import { protect, allowContractorsOnly } from "../middleware/protect.js";

const router = express.Router();

router.post("/signup", signupContractor);
router.post("/login", loginContractor);
// Protected contractor routes (requires valid contractor token)
router.use(protect, allowContractorsOnly);

// Return current contractor profile
router.get("/me", fetchContractorProfile);
// Create a new worker (original behavior)
router.post("/workers", addWorker);

// Link an existing patient to this contractor by phone number
router.post("/workers/link", linkWorkerByPhone);
router.get("/workers", listWorkers);
router.get("/workers/:workerId", getWorker);
router.delete("/workers/:workerId", removeWorker);
// Clear contagious alert on a worker
router.post("/workers/:workerId/clear-alert", clearWorkerAlert);
// Broadcast a WhatsApp message to all linked patients
router.post("/broadcast", broadcastToPatients);

export default router;
