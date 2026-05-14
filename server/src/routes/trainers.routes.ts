import { Router } from "express";
import { trainersController } from "../controllers/trainers.controller";

const router = Router();

router.get("/", trainersController.listTrainers);
router.post("/", trainersController.createTrainer);
router.get("/:trainerId/working-hours", trainersController.getTrainerWorkingHours);
router.get("/:trainerId/trainees", trainersController.listTrainerTrainees);
router.patch(
  "/:trainerId/working-hours",
  trainersController.updateTrainerWorkingHours
);
router.get("/:trainerId", trainersController.getTrainerById);

export default router;
