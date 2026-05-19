import { Router } from "express";
import {
  applyToJob,
  getApplicantProfile,
  listAdminApplications,
  listApplicantApplications,
  saveApplicantProfile,
  submitApplication,
  updateApplicationStatus,
} from "../controllers/applicationController.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import { authenticatedWriteLimiter } from "../middleware/rateLimit.js";

const router = Router();

router.get(
  "/admin/applications",
  requireAuth,
  requireRoles("admin"),
  listAdminApplications
);

router.patch(
  "/admin/applications/:id/status",
  requireAuth,
  authenticatedWriteLimiter,
  requireRoles("admin"),
  updateApplicationStatus
);

router.get(
  "/applicant/applications",
  requireAuth,
  requireRoles("applicant"),
  listApplicantApplications
);

router.get(
  "/applicant/profile",
  requireAuth,
  requireRoles("applicant"),
  getApplicantProfile
);

router.put(
  "/applicant/profile",
  requireAuth,
  authenticatedWriteLimiter,
  requireRoles("applicant"),
  saveApplicantProfile
);

router.post(
  "/applications",
  requireAuth,
  authenticatedWriteLimiter,
  requireRoles("applicant"),
  applyToJob
);

router.post(
  "/submit-application",
  requireAuth,
  authenticatedWriteLimiter,
  requireRoles("applicant"),
  submitApplication
);

export default router;
