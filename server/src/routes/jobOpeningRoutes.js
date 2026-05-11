import { Router } from "express";
import {
  createJobOpening,
  listAdminJobOpenings,
  listOpenJobOpenings,
  updateJobOpening,
} from "../controllers/jobOpeningController.js";

const router = Router();

router.get("/job-openings", listOpenJobOpenings);
router.get("/admin/job-openings", listAdminJobOpenings);
router.post("/admin/job-openings", createJobOpening);
router.patch("/admin/job-openings/:id", updateJobOpening);

export default router;
