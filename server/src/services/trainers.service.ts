import { trainersRepository } from "../repositories/trainers.repository";
import {
  CreateTrainerInput,
  UpsertTrainerWorkingHourInput,
} from "../types/trainer";

const timePattern = /^\d{2}:\d{2}$/;

const isBlank = (value: unknown): boolean =>
  typeof value !== "string" || value.trim().length === 0;

const validateTime = (value: string, fieldName: string) => {
  if (!timePattern.test(value)) {
    throw new Error(`${fieldName} must be in HH:MM format`);
  }

  const [hours, minutes] = value.split(":").map(Number);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error(`${fieldName} must be a valid time`);
  }
};

const validateWorkingHour = (workingHour: UpsertTrainerWorkingHourInput) => {
  if (
    !Number.isInteger(workingHour.dayOfWeek) ||
    workingHour.dayOfWeek < 0 ||
    workingHour.dayOfWeek > 6
  ) {
    throw new Error("dayOfWeek must be an integer between 0 and 6");
  }

  validateTime(workingHour.startTime, "startTime");
  validateTime(workingHour.endTime, "endTime");

  if (workingHour.startTime >= workingHour.endTime) {
    throw new Error("startTime must be before endTime");
  }
};

export const trainersService = {
  createTrainer(input: CreateTrainerInput) {
    if (isBlank(input.name)) {
      throw new Error("name is required");
    }

    return trainersRepository.createTrainer({
      name: input.name.trim(),
      phone: isBlank(input.phone) ? null : input.phone?.trim(),
      email: isBlank(input.email) ? null : input.email?.trim(),
      birthDate: input.birthDate ?? null,
    });
  },

  listTrainers() {
    return trainersRepository.listTrainers();
  },

  getTrainerById(id: string) {
    return trainersRepository.getTrainerById(id);
  },

  async updateTrainerWorkingHours(
    trainerId: string,
    workingHours: UpsertTrainerWorkingHourInput[]
  ) {
    const trainer = await trainersRepository.getTrainerById(trainerId);

    if (!trainer) {
      return null;
    }

    for (const workingHour of workingHours) {
      validateWorkingHour(workingHour);
    }

    return trainersRepository.replaceTrainerWorkingHours(
      trainerId,
      workingHours
    );
  },

  async getTrainerWorkingHours(trainerId: string) {
    const trainer = await trainersRepository.getTrainerById(trainerId);

    if (!trainer) {
      return null;
    }

    return trainersRepository.listTrainerWorkingHours(trainerId);
  },
};
