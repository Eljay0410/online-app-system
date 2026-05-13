import { Router } from "express";
import {
  createJobOpening,
  deleteJobOpening,
  getJobOpening,
  listAdminJobOpenings,
  listOpenJobOpenings,
  updateJobOpening,
} from "../controllers/jobOpeningController.js";

const router = Router();

router.get("/job-openings", listOpenJobOpenings);
router.get("/job-openings/:id", getJobOpening);
router.get("/admin/job-openings", listAdminJobOpenings);
router.post("/admin/job-openings", createJobOpening);
router.patch("/admin/job-openings/:id", updateJobOpening);
router.delete("/admin/job-openings/:id", deleteJobOpening);

export default router;
