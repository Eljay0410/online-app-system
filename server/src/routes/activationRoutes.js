import { Router } from "express";
import { activateAccount } from "../controllers/activationController.js";

const router = Router();

router.post("/activate", activateAccount);

export default router;
