import { Request, Response } from "express";
import { trainersService } from "../services/trainers.service";
import { traineesService } from "../services/trainees.service";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isValidUuid = (id: string) => uuidPattern.test(id);

const handleError = (error: unknown, res: Response) => {
  if (error instanceof Error) {
    return res.status(400).json({ message: error.message });
  }

  return res.status(500).json({ message: "Unexpected error" });
};

export const trainersController = {
  async createTrainer(req: Request, res: Response) {
    try {
      const { name, phone, email, birthDate } = req.body;

      const trainer = await trainersService.createTrainer({
        name,
        phone,
        email,
        birthDate: birthDate ? new Date(birthDate) : null,
      });

      return res.status(201).json({ data: trainer });
    } catch (error) {
      return handleError(error, res);
    }
  },

  async listTrainers(_req: Request, res: Response) {
    try {
      const trainers = await trainersService.listTrainers();

      return res.json({ data: trainers });
    } catch (error) {
      return handleError(error, res);
    }
  },

  async getTrainerById(req: Request, res: Response) {
    try {
      const { trainerId } = req.params;

      if (!isValidUuid(trainerId)) {
        return res.status(400).json({ message: "Invalid trainer id" });
      }

      const trainer = await trainersService.getTrainerById(trainerId);

      if (!trainer) {
        return res.status(404).json({ message: "Trainer not found" });
      }

      return res.json({ data: trainer });
    } catch (error) {
      return handleError(error, res);
    }
  },

  async listTrainerTrainees(req: Request, res: Response) {
    try {
      const { trainerId } = req.params;

      if (!isValidUuid(trainerId)) {
        return res.status(400).json({ message: "Invalid trainer id" });
      }

      const trainer = await trainersService.getTrainerById(trainerId);

      if (!trainer) {
        return res.status(404).json({ message: "Trainer not found" });
      }

      const trainees = await traineesService.listTraineesByTrainerId(trainerId);

      return res.json({ data: trainees });
    } catch (error) {
      return handleError(error, res);
    }
  },

  async updateTrainerWorkingHours(req: Request, res: Response) {
    try {
      const { trainerId } = req.params;

      if (!isValidUuid(trainerId)) {
        return res.status(400).json({ message: "Invalid trainer id" });
      }

      const { workingHours } = req.body;

      if (!Array.isArray(workingHours)) {
        return res.status(400).json({ message: "workingHours is required" });
      }

      const updatedWorkingHours =
        await trainersService.updateTrainerWorkingHours(
          trainerId,
          workingHours
        );

      if (!updatedWorkingHours) {
        return res.status(404).json({ message: "Trainer not found" });
      }

      return res.json({ data: updatedWorkingHours });
    } catch (error) {
      return handleError(error, res);
    }
  },

  async getTrainerWorkingHours(req: Request, res: Response) {
    try {
      const { trainerId } = req.params;

      if (!isValidUuid(trainerId)) {
        return res.status(400).json({ message: "Invalid trainer id" });
      }

      const workingHours = await trainersService.getTrainerWorkingHours(
        trainerId
      );

      if (!workingHours) {
        return res.status(404).json({ message: "Trainer not found" });
      }

      return res.json({ data: workingHours });
    } catch (error) {
      return handleError(error, res);
    }
  },
};
