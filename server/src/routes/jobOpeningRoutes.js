import { Router } from "express";
import {
  createJobOpening,
  deleteJobOpening,
  getJobOpening,
  listAdminJobOpenings,
  listOpenJobOpenings,
  updateJobOpening,
} from "../controllers/jobOpeningController.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import { authenticatedWriteLimiter } from "../middleware/rateLimit.js";

const router = Router();

router.get("/job-openings", listOpenJobOpenings);
router.get("/job-openings/:id", getJobOpening);
router.get(
  "/admin/job-openings",
  requireAuth,
  requireRoles("admin"),
  listAdminJobOpenings
);
router.post(
  "/admin/job-openings",
  requireAuth,
  authenticatedWriteLimiter,
  requireRoles("admin"),
  createJobOpening
);
router.patch(
  "/admin/job-openings/:id",
  requireAuth,
  authenticatedWriteLimiter,
  requireRoles("admin"),
  updateJobOpening
);
router.delete(
  "/admin/job-openings/:id",
  requireAuth,
  authenticatedWriteLimiter,
  requireRoles("admin"),
  deleteJobOpening
);

export default router;
