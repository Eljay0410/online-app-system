import { Router } from "express";
import { listActivityLogs } from "../controllers/activityLogController.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";

const router = Router();

router.get(
  "/activity-logs",
  requireAuth,
  requireRoles("admin", "superadmin"),
  listActivityLogs
);

export default router;
