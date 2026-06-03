import { Router } from "express";
import {
  applyToJob,
  assignApplicationToVacancyItem,
  getAdminApplicationDetail,
  getApplicantProfile,
  listAdminApplications,
  listApplicantApplications,
  replaceApplicationRequirementFile,
  saveApplicantProfile,
  submitApplication,
  updateApplicationRequirementReview,
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

router.get(
  "/admin/applications/:id",
  requireAuth,
  requireRoles("admin"),
  getAdminApplicationDetail
);

router.patch(
  "/admin/applications/:id/status",
  requireAuth,
  authenticatedWriteLimiter,
  requireRoles("admin"),
  updateApplicationStatus
);

router.patch(
  "/admin/applications/:id/assignment",
  requireAuth,
  authenticatedWriteLimiter,
  requireRoles("admin"),
  assignApplicationToVacancyItem
);

router.patch(
  "/admin/applications/:id/requirements/:requirementId",
  requireAuth,
  authenticatedWriteLimiter,
  requireRoles("admin"),
  updateApplicationRequirementReview
);

router.get(
  "/applicant/applications",
  requireAuth,
  requireRoles("applicant"),
  listApplicantApplications
);

router.patch(
  "/applicant/applications/:id/requirements/:requirementId",
  requireAuth,
  authenticatedWriteLimiter,
  requireRoles("applicant"),
  replaceApplicationRequirementFile
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
