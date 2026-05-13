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

const router = Router();

router.get(
  "/admin/applications",
  listAdminApplications
);

router.patch(
  "/admin/applications/:id/status",
  updateApplicationStatus
);

router.get(
  "/applicant/applications",
  listApplicantApplications
);

router.get(
  "/applicant/profile",
  getApplicantProfile
);

router.put(
  "/applicant/profile",
  saveApplicantProfile
);

router.post(
  "/applications",
  applyToJob
);

router.post(
  "/submit-application",
  submitApplication
);

export default router;
