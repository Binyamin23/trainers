import { Router } from "express";
import { aiController } from "../controllers/ai.controller";

const router = Router();

router.post("/chat", aiController.chat);
router.post("/parse-message", aiController.parseMessage);
router.post("/process-message", aiController.processMessage);

export default router;
