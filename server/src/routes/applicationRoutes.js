import { Router } from "express";
import {
  listAdminApplications,
  listApplicantApplications,
  saveApplicationRemoved,
  submitApplication,
  updateApplicationStatus,
} from "../controllers/applicationController.js";

const router = Router();

router.get("/admin/applications", listAdminApplications);
router.patch("/admin/applications/:id/status", updateApplicationStatus);
router.get("/applicant/applications", listApplicantApplications);
router.post("/submit-application", submitApplication);
router.post("/save-application", saveApplicationRemoved);

export default router;
