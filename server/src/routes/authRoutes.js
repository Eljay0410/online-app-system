import { Router } from "express";
import {
  forgotPassword,
  login,
  logout,
  registerApplicant,
  resendActivationEmail,
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";

const router = Router();

router.post(
  "/auth/register",
  rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 8,
    keyPrefix: "register",
    message: "Too many registration attempts. Please try again in 1 hour.",
  }),
  registerApplicant
);
router.post(
  "/auth/login",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    keyPrefix: "login",
    message: "Too many login attempts. Please try again in 15 minutes.",
  }),
  login
);
router.post(
  "/auth/resend-activation",
  rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    keyPrefix: "resend-activation",
    message:
      "Too many verification email requests. Please try again in 1 hour.",
  }),
  resendActivationEmail
);
router.post(
  "/auth/forgot-password",
  rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    keyPrefix: "forgot-password",
    message:
      "Too many password reset requests. Please try again in 1 hour.",
  }),
  forgotPassword
);
router.post("/auth/logout", requireAuth, logout);

export default router;
