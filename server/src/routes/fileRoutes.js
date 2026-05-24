import { Router } from "express";
import {
  cleanupInactiveUploads,
  getUploadStorageHealth,
  listRequirementFiles,
  removeRequirementFile,
  serveUploadedFile,
  uploadRequirementFile,
} from "../controllers/fileController.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import { requirementUpload } from "../middleware/upload.js";
import {
  authenticatedWriteLimiter,
  uploadLimiter,
} from "../middleware/rateLimit.js";

const router = Router();

router.get(
  "/applicant/requirement-files",
  requireAuth,
  requireRoles("applicant"),
  listRequirementFiles
);

router.post(
  "/applicant/requirement-files/:field",
  requireAuth,
  uploadLimiter,
  requireRoles("applicant"),
  requirementUpload.single("file"),
  uploadRequirementFile
);

router.delete(
  "/applicant/requirement-files/:field",
  requireAuth,
  uploadLimiter,
  requireRoles("applicant"),
  removeRequirementFile
);

router.get("/files/:id/:mode", requireAuth, serveUploadedFile);

router.get(
  "/admin/storage",
  requireAuth,
  requireRoles("admin", "superadmin"),
  getUploadStorageHealth
);

router.post(
  "/admin/storage/cleanup",
  requireAuth,
  authenticatedWriteLimiter,
  requireRoles("admin", "superadmin"),
  cleanupInactiveUploads
);

export default router;
