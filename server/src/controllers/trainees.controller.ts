import { Request, Response } from "express";
import { traineesService } from "../services/trainees.service";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isValidUuid = (id: string) => uuidPattern.test(id);

const parseOptionalDate = (value: unknown): Date | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  return new Date(String(value));
};

const handleError = (error: unknown, res: Response) => {
  if (error instanceof Error) {
    return res.status(400).json({ message: error.message });
  }

  return res.status(500).json({ message: "Unexpected error" });
};

export const traineesController = {
  async listTrainees(_req: Request, res: Response) {
    try {
      const trainees = await traineesService.listTrainees();

      return res.json({ data: trainees });
    } catch (error) {
      return handleError(error, res);
    }
  },

  async createTrainee(req: Request, res: Response) {
    try {
      const { name, fullName, phone, email, birthDate, trainerId, isActive, notes } =
        req.body;

      const trainee = await traineesService.createTrainee({
        name: name ?? fullName,
        phone,
        birthDate: parseOptionalDate(birthDate) ?? null,
        email,
        trainerId,
        isActive,
        notes,
      });

      return res.status(201).json({ data: trainee });
    } catch (error) {
      return handleError(error, res);
    }
  },

  async getTraineeById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!isValidUuid(id)) {
        return res.status(400).json({ message: "Invalid trainee id" });
      }

      const trainee = await traineesService.getTraineeById(id);

      if (!trainee) {
        return res.status(404).json({ message: "Trainee not found" });
      }

      return res.json({ data: trainee });
    } catch (error) {
      return handleError(error, res);
    }
  },

  async getTraineeByPhone(req: Request, res: Response) {
    try {
      const { phone } = req.params;
      const trainee = await traineesService.getTraineeByPhone(phone);

      if (!trainee) {
        return res.status(404).json({ message: "Trainee not found" });
      }

      return res.json({ data: trainee });
    } catch (error) {
      return handleError(error, res);
    }
  },

  async updateTrainee(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!isValidUuid(id)) {
        return res.status(400).json({ message: "Invalid trainee id" });
      }

      const { name, fullName, phone, email, birthDate, trainerId, isActive, notes } =
        req.body;

      const trainee = await traineesService.updateTrainee(id, {
        name: name ?? fullName,
        phone,
        birthDate: parseOptionalDate(birthDate),
        email,
        trainerId,
        isActive,
        notes,
      });

      if (!trainee) {
        return res.status(404).json({ message: "Trainee not found" });
      }

      return res.json({ data: trainee });
    } catch (error) {
      return handleError(error, res);
    }
  },

  async deactivateTrainee(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!isValidUuid(id)) {
        return res.status(400).json({ message: "Invalid trainee id" });
      }

      const trainee = await traineesService.deactivateTrainee(id);

      if (!trainee) {
        return res.status(404).json({ message: "Trainee not found" });
      }

      return res.json({ data: trainee });
    } catch (error) {
      return handleError(error, res);
    }
  },
};
