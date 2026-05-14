import { Router } from "express";
import { appointmentsController } from "../controllers/appointments.controller";

const router = Router();

router.get("/availability", appointmentsController.getAvailability);
router.get("/", appointmentsController.listAppointments);
router.get("/:id", appointmentsController.getAppointmentById);
router.post("/", appointmentsController.createAppointment);
router.patch("/:id", appointmentsController.updateAppointment);
router.patch("/:id/cancel", appointmentsController.cancelAppointment);

export default router;
