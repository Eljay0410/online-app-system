import { Router } from "express";
import {
  createAdminAccount,
  getOverview,
  listManagementUsers,
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
router.post(
  "/superadmin/admins",
  requireAuth,
  authenticatedWriteLimiter,
  requireRoles("superadmin"),
  createAdminAccount
);

export default router;
