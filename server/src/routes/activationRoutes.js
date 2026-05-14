import { Router } from "express";
import {
  activateAccount,
  inspectActivationToken,
} from "../controllers/activationController.js";

const router = Router();

router.get("/activate", inspectActivationToken);
router.post("/activate", activateAccount);

export default router;
