import { Router } from "express";
import {
  getCampOverview,
  getHeroAnnouncements,
  deleteCampAnnouncement,
  publishCampAnnouncement,
} from "../controllers/campController.js";

const router = Router();

router.get("/overview", getCampOverview);
router.get("/announcements", getHeroAnnouncements);
router.post("/announcements", publishCampAnnouncement);
router.delete("/announcements/:id", deleteCampAnnouncement);

export default router;
