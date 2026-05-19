import { Router } from "express";
import {
  activateAccount,
  inspectActivationToken,
} from "../controllers/activationController.js";
import { authLimiters } from "../middleware/rateLimit.js";

const router = Router();

router.get("/activate", authLimiters.activation, inspectActivationToken);
router.post("/activate", authLimiters.activation, activateAccount);

export default router;
