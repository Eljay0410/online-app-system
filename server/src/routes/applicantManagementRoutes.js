import { Router } from "express";
import {
  getApplicantManagementDetail,
  listApplicantManagement,
  updateApplicantBasicInfo,
} from "../controllers/applicantManagementController.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import { authenticatedWriteLimiter } from "../middleware/rateLimit.js";

const router = Router();

router.get(
  "/admin/applicant-management",
  requireAuth,
  requireRoles("admin"),
  listApplicantManagement
);

router.get(
  "/admin/applicant-management/:id",
  requireAuth,
  requireRoles("admin"),
  getApplicantManagementDetail
);

router.patch(
  "/admin/applicant-management/:id",
  requireAuth,
  authenticatedWriteLimiter,
  requireRoles("admin"),
  updateApplicantBasicInfo
);

export default router;
