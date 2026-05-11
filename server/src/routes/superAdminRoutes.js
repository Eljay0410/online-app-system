import { Router } from "express";
import {
  createAdminAccount,
  getOverview,
  listManagementUsers,
} from "../controllers/superAdminController.js";

const router = Router();

router.get("/superadmin/overview", getOverview);
router.get("/superadmin/users", listManagementUsers);
router.post("/superadmin/admins", createAdminAccount);

export default router;
