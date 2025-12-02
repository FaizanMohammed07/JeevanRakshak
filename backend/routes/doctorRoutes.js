import express from "express";
import {
  allowDoctorsOnly,
  allowRoles,
  protect,
} from "../middleware/protect.js";
import {
  login,
  signup,
  getMe,
  logout,
} from "../controllers/doctorController.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/logout", logout);

router.get("/me", protect, allowRoles("doctor"), getMe);

export default router;
