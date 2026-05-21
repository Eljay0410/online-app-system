import { Router } from "express";
import {
  createJobOpening,
  createJobPosition,
  deleteJobOpening,
  deleteJobPosition,
  getJobOpening,
  listAdminJobOpenings,
  listJobPositions,
  listOpenJobOpenings,
  updateJobOpening,
  updateJobPosition,
} from "../controllers/jobOpeningController.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import { authenticatedWriteLimiter } from "../middleware/rateLimit.js";

const router = Router();

router.get("/job-openings", listOpenJobOpenings);
router.get("/job-openings/:id", getJobOpening);
router.get("/job-positions", listJobPositions);
router.get(
  "/admin/job-openings",
  requireAuth,
  requireRoles("admin"),
  listAdminJobOpenings
);
router.get(
  "/superadmin/job-openings",
  requireAuth,
  requireRoles("superadmin"),
  listAdminJobOpenings
);
router.get(
  "/admin/job-positions",
  requireAuth,
  requireRoles("admin"),
  listJobPositions
);
router.post(
  "/admin/job-positions",
  requireAuth,
  authenticatedWriteLimiter,
  requireRoles("admin"),
  createJobPosition
);
router.patch(
  "/admin/job-positions/:id",
  requireAuth,
  authenticatedWriteLimiter,
  requireRoles("admin"),
  updateJobPosition
);
router.delete(
  "/admin/job-positions/:id",
  requireAuth,
  authenticatedWriteLimiter,
  requireRoles("admin"),
  deleteJobPosition
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
