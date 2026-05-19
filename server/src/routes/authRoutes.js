import { Router } from "express";
import {
  changePassword,
  forgotPassword,
  checkEmail,
  login,
  logout,
  registerApplicant,
  resendActivationEmail,
  updateAccountProfile,
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import {
  authenticatedWriteLimiter,
  authLimiters,
} from "../middleware/rateLimit.js";

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
router.patch(
  "/auth/profile",
  requireAuth,
  authenticatedWriteLimiter,
  updateAccountProfile
);
router.post(
  "/auth/password",
  requireAuth,
  authenticatedWriteLimiter,
  changePassword
);
router.post("/auth/logout", requireAuth, logout);

export default router;
