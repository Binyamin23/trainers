import { Router } from "express";
import { traineesController } from "../controllers/trainees.controller";

const router = Router();

router.get("/", traineesController.listTrainees);
router.post("/", traineesController.createTrainee);
router.get("/by-phone/:phone", traineesController.getTraineeByPhone);
router.get("/:id", traineesController.getTraineeById);
router.patch("/:id", traineesController.updateTrainee);
router.delete("/:id", traineesController.deactivateTrainee);

export default router;
