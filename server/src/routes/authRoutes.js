import { Router } from "express";
import { forgotPassword, login } from "../controllers/authController.js";
import { rateLimit } from "../middleware/rateLimit.js";

const router = Router();

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
  "/auth/forgot-password",
  rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    keyPrefix: "forgot-password",
    message:
      "Too many password reset requests. Please try again in 1 hour.",
  }),
  forgotPassword
);

export default router;
