import express from "express";
import {
  login,
  signup,
  logout,
  getMe
} from "../controllers/reportAssistantController.js";
// import { protect } from "../middleware/protect.js";
import {
  allowRoles,
  protect,
} from "../middleware/protect.js";
const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/logout", logout);
router.get("/me", protect, allowRoles("reportAssistant"), getMe);

export default router;
