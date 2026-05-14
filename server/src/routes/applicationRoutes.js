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
  requireRoles("applicant"),
  saveApplicantProfile
);

router.post(
  "/applications",
  requireAuth,
  requireRoles("applicant"),
  applyToJob
);

router.post(
  "/submit-application",
  requireAuth,
  requireRoles("applicant"),
  submitApplication
);

export default router;
