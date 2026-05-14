import { appointmentsRepository } from "../repositories/appointments.repository";
import { traineesRepository } from "../repositories/trainees.repository";
import {
  AppointmentStatus,
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from "../types/appointment";

const allowedStatuses: AppointmentStatus[] = [
  "scheduled",
  "cancelled",
  "completed",
];

const isBlank = (value: unknown): boolean =>
  typeof value !== "string" || value.trim().length === 0;

const validateAppointmentTime = (startsAt: Date, endsAt: Date) => {
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    throw new Error("startsAt and endsAt must be valid dates");
  }

  if (startsAt >= endsAt) {
    throw new Error("startsAt must be before endsAt");
  }
};

const validateStatus = (status: AppointmentStatus) => {
  if (!allowedStatuses.includes(status)) {
    throw new Error("Invalid appointment status");
  }
};

const validateNoOverlap = async (
  startsAt: Date,
  endsAt: Date,
  excludeAppointmentId?: string,
  trainerId?: string | null
) => {
  const hasOverlap =
    await appointmentsRepository.hasOverlappingScheduledAppointment(
      startsAt,
      endsAt,
      excludeAppointmentId,
      trainerId
    );

  if (hasOverlap) {
    throw new Error("Appointment overlaps an existing scheduled appointment");
  }
};

export const appointmentsService = {
  async createAppointment(input: CreateAppointmentInput) {
    if (isBlank(input.traineeId)) {
      throw new Error("traineeId is required");
    }

    const trainee = await traineesRepository.getTraineeById(input.traineeId);

    if (!trainee || !trainee.isActive) {
      throw new Error("Active trainee not found");
    }

    const trainerId = input.trainerId ?? trainee.trainerId;

    validateAppointmentTime(input.startsAt, input.endsAt);
    await validateNoOverlap(input.startsAt, input.endsAt, undefined, trainerId);

    return appointmentsRepository.createAppointment({
      ...input,
      trainerId,
    });
  },

  getAppointmentById(id: string) {
    return appointmentsRepository.getAppointmentById(id);
  },

  listAppointments() {
    return appointmentsRepository.listAppointments();
  },

  getActiveAppointmentsByPhone(phone: string) {
    if (isBlank(phone)) {
      throw new Error("phone is required");
    }

    return appointmentsRepository.findActiveAppointmentsByPhone(phone.trim());
  },

  async updateAppointment(id: string, input: UpdateAppointmentInput) {
    const existing = await appointmentsRepository.getAppointmentById(id);

    if (!existing) {
      return null;
    }

    const next = {
      traineeId:
        input.traineeId !== undefined ? input.traineeId : existing.traineeId,
      trainerId:
        input.trainerId !== undefined ? input.trainerId : existing.trainerId,
      startsAt: input.startsAt ?? existing.startsAt,
      endsAt: input.endsAt ?? existing.endsAt,
      status: input.status ?? existing.status,
      notes: input.notes !== undefined ? input.notes : existing.notes,
    };

    if (isBlank(next.traineeId)) {
      throw new Error("traineeId cannot be empty");
    }

    const trainee = await traineesRepository.getTraineeById(next.traineeId);

    if (!trainee || !trainee.isActive) {
      throw new Error("Active trainee not found");
    }

    const trainerId = next.trainerId ?? trainee.trainerId;

    validateStatus(next.status);
    validateAppointmentTime(next.startsAt, next.endsAt);

    if (next.status !== "cancelled") {
      await validateNoOverlap(next.startsAt, next.endsAt, id, trainerId);
    }

    return appointmentsRepository.updateAppointment(id, {
      ...next,
      trainerId,
      traineeId: next.traineeId,
    });
  },

  cancelAppointment(id: string) {
    return appointmentsRepository.cancelAppointment(id);
  },
};
