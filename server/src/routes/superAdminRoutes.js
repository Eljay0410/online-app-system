import { Router } from "express";
import {
  createAdminAccount,
  getOverview,
  listManagementUsers,
} from "../controllers/superAdminController.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";

const router = Router();

router.get("/superadmin/overview", requireAuth, requireRoles("superadmin"), getOverview);
router.get("/superadmin/users", requireAuth, requireRoles("superadmin"), listManagementUsers);
router.post("/superadmin/admins", requireAuth, requireRoles("superadmin"), createAdminAccount);

export default router;
