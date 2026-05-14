import { traineesRepository } from "../repositories/trainees.repository";
import {
  CreateTraineeInput,
  UpdateTraineeInput,
} from "../types/trainee";

const isBlank = (value: unknown): boolean =>
  typeof value !== "string" || value.trim().length === 0;

const normalizeNullableString = (value: string | null | undefined) =>
  isBlank(value) ? null : value?.trim();

const validateBirthDate = (birthDate?: Date | null) => {
  if (birthDate && Number.isNaN(birthDate.getTime())) {
    throw new Error("birthDate must be a valid date");
  }
};

export const traineesService = {
  createTrainee(input: CreateTraineeInput) {
    if (isBlank(input.name)) {
      throw new Error("name is required");
    }

    if (isBlank(input.phone)) {
      throw new Error("phone is required");
    }

    validateBirthDate(input.birthDate);

    return traineesRepository.createTrainee({
      name: input.name.trim(),
      phone: input.phone.trim(),
      birthDate: input.birthDate ?? null,
      email: normalizeNullableString(input.email),
      trainerId: normalizeNullableString(input.trainerId),
      notes: normalizeNullableString(input.notes),
      isActive: input.isActive ?? true,
    });
  },

  listTrainees() {
    return traineesRepository.listTrainees();
  },

  getTraineeById(id: string) {
    return traineesRepository.getTraineeById(id);
  },

  getTraineeByPhone(phone: string) {
    if (isBlank(phone)) {
      throw new Error("phone is required");
    }

    return traineesRepository.getTraineeByPhone(phone.trim());
  },

  listTraineesByTrainerId(trainerId: string) {
    return traineesRepository.listTraineesByTrainerId(trainerId);
  },

  async updateTrainee(id: string, input: UpdateTraineeInput) {
    const existing = await traineesRepository.getTraineeById(id);

    if (!existing) {
      return null;
    }

    const next = {
      name: input.name ?? existing.name,
      phone: input.phone ?? existing.phone,
      birthDate:
        input.birthDate !== undefined ? input.birthDate : existing.birthDate,
      email: input.email !== undefined ? input.email : existing.email,
      trainerId:
        input.trainerId !== undefined ? input.trainerId : existing.trainerId,
      notes: input.notes !== undefined ? input.notes : existing.notes,
      isActive:
        input.isActive !== undefined ? input.isActive : existing.isActive,
    };

    if (isBlank(next.name)) {
      throw new Error("name cannot be empty");
    }

    if (isBlank(next.phone)) {
      throw new Error("phone cannot be empty");
    }

    validateBirthDate(next.birthDate);

    return traineesRepository.updateTrainee(id, {
      name: next.name.trim(),
      phone: next.phone.trim(),
      birthDate: next.birthDate,
      email: normalizeNullableString(next.email),
      trainerId: normalizeNullableString(next.trainerId),
      notes: normalizeNullableString(next.notes),
      isActive: next.isActive,
    });
  },

  deactivateTrainee(id: string) {
    return traineesRepository.deactivateTrainee(id);
  },
};
