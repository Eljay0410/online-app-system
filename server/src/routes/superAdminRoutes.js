import { Router } from "express";
import {
  createAdminAccount,
  getOverview,
  listApplicantUsers,
  listOfficeUsers,
  listManagementUsers,
  updateUserAccount,
  updateUserStatus,
} from "../controllers/superAdminController.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import { authenticatedWriteLimiter } from "../middleware/rateLimit.js";

const router = Router();

router.get(
  "/superadmin/overview",
  requireAuth,
  requireRoles("superadmin"),
  getOverview
);
router.get(
  "/superadmin/users",
  requireAuth,
  requireRoles("superadmin"),
  listManagementUsers
);
router.get(
  "/superadmin/user-accounts",
  requireAuth,
  requireRoles("superadmin"),
  listApplicantUsers
);
router.get(
  "/superadmin/office-accounts",
  requireAuth,
  requireRoles("superadmin"),
  listOfficeUsers
);
router.post(
  "/superadmin/admins",
  requireAuth,
  authenticatedWriteLimiter,
  requireRoles("superadmin"),
  createAdminAccount
);
router.patch(
  "/superadmin/users/:id",
  requireAuth,
  authenticatedWriteLimiter,
  requireRoles("superadmin"),
  updateUserAccount
);
router.patch(
  "/superadmin/users/:id/status",
  requireAuth,
  authenticatedWriteLimiter,
  requireRoles("superadmin"),
  updateUserStatus
);

export default router;
