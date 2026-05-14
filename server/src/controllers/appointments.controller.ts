import { Request, Response } from "express";
import { availabilityService } from "../services/availability.service";
import { appointmentsService } from "../services/appointments.service";
import { AppointmentStatus } from "../types/appointment";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isValidUuid = (id: string) => uuidPattern.test(id);

const handleError = (error: unknown, res: Response) => {
  if (error instanceof Error) {
    return res.status(400).json({ message: error.message });
  }

  return res.status(500).json({ message: "Unexpected error" });
};

export const appointmentsController = {
  async getAvailability(req: Request, res: Response) {
    try {
      const { date, trainerId } = req.query;

      if (typeof date !== "string" || date.trim().length === 0) {
        return res.status(400).json({ message: "date is required" });
      }

      if (typeof trainerId !== "string" || !isValidUuid(trainerId)) {
        return res.status(400).json({ message: "valid trainerId is required" });
      }

      const availability = await availabilityService.getAvailableSlots(
        trainerId,
        date
      );

      return res.json(availability);
    } catch (error) {
      return handleError(error, res);
    }
  },

  async listAppointments(_req: Request, res: Response) {
    try {
      const appointments = await appointmentsService.listAppointments();

      return res.json({ data: appointments });
    } catch (error) {
      return handleError(error, res);
    }
  },

  async getAppointmentById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!isValidUuid(id)) {
        return res.status(400).json({ message: "Invalid appointment id" });
      }

      const appointment = await appointmentsService.getAppointmentById(id);

      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      return res.json({ data: appointment });
    } catch (error) {
      return handleError(error, res);
    }
  },

  async createAppointment(req: Request, res: Response) {
    try {
      const { traineeId, trainerId, startsAt, endsAt, notes } = req.body;

      if (!traineeId || !startsAt || !endsAt) {
        return res.status(400).json({
          message: "traineeId, startsAt, and endsAt are required",
        });
      }

      const appointment = await appointmentsService.createAppointment({
        traineeId,
        trainerId,
        startsAt: new Date(startsAt),
        endsAt: new Date(endsAt),
        notes,
      });

      return res.status(201).json({ data: appointment });
    } catch (error) {
      return handleError(error, res);
    }
  },

  async updateAppointment(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!isValidUuid(id)) {
        return res.status(400).json({ message: "Invalid appointment id" });
      }

      const { traineeId, trainerId, startsAt, endsAt, status, notes } =
        req.body;

      const appointment = await appointmentsService.updateAppointment(id, {
        traineeId,
        trainerId,
        startsAt: startsAt ? new Date(startsAt) : undefined,
        endsAt: endsAt ? new Date(endsAt) : undefined,
        status: status as AppointmentStatus | undefined,
        notes,
      });

      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      return res.json({ data: appointment });
    } catch (error) {
      return handleError(error, res);
    }
  },

  async cancelAppointment(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!isValidUuid(id)) {
        return res.status(400).json({ message: "Invalid appointment id" });
      }

      const appointment = await appointmentsService.cancelAppointment(id);

      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      return res.json({ data: appointment });
    } catch (error) {
      return handleError(error, res);
    }
  },
};
