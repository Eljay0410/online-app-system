import { Router } from "express";
import { sendTestEmail } from "../controllers/emailController.js";

const router = Router();

router.post("/test-email", sendTestEmail);

export default router;
