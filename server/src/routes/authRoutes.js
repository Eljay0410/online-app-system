import { Router } from "express";
import {
  forgotPassword,
  checkEmail,
  login,
  logout,
  registerApplicant,
  resendActivationEmail,
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { authLimiters } from "../middleware/rateLimit.js";

const router = Router();

router.post(
  "/auth/register",
  authLimiters.register,
  registerApplicant
);
router.post(
  "/auth/email-check",
  authLimiters.emailLookup,
  checkEmail
);
router.post(
  "/auth/login",
  authLimiters.login,
  login
);
router.post(
  "/auth/resend-activation",
  authLimiters.emailAction,
  resendActivationEmail
);
router.post(
  "/auth/forgot-password",
  authLimiters.emailAction,
  forgotPassword
);
router.post("/auth/logout", requireAuth, logout);

export default router;
