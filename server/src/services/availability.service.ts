import {
  AvailabilityAppointmentWindow,
  availabilityRepository,
} from "../repositories/availability.repository";
import { trainersRepository } from "../repositories/trainers.repository";
import { TrainerWorkingHour } from "../types/trainer";

interface AvailabilityResult {
  date: string;
  availableSlots: string[];
}

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const appointmentDurationMinutes = 30;

interface AvailabilitySlot {
  label: string;
  startsAt: Date;
  endsAt: Date;
}

const padTimePart = (value: number): string => String(value).padStart(2, "0");

const createDateTime = (date: string, totalMinutes: number): Date => {
  const [year, month, day] = date.split("-").map(Number);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return new Date(year, month - 1, day, hours, minutes, 0, 0);
};

const formatTime = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${padTimePart(hours)}:${padTimePart(minutes)}`;
};

const parseTimeToMinutes = (value: string): number => {
  const [hours, minutes] = value.slice(0, 5).split(":").map(Number);

  return hours * 60 + minutes;
};

const getDateDayOfWeek = (date: string): number => {
  const [year, month, day] = date.split("-").map(Number);

  return new Date(year, month - 1, day).getDay();
};

const isValidDate = (date: string): boolean => {
  if (!datePattern.test(date)) {
    return false;
  }

  const [year, month, day] = date.split("-").map(Number);
  const parsedDate = new Date(year, month - 1, day);

  return (
    parsedDate.getFullYear() === year &&
    parsedDate.getMonth() === month - 1 &&
    parsedDate.getDate() === day
  );
};

const generateWorkingHourSlots = (
  date: string,
  workingHours: TrainerWorkingHour[]
): AvailabilitySlot[] => {
  const slots: AvailabilitySlot[] = [];
  const dayOfWeek = getDateDayOfWeek(date);
  const activeWorkingHours = workingHours.filter(
    (workingHour) => workingHour.isActive && workingHour.dayOfWeek === dayOfWeek
  );

  for (const workingHour of activeWorkingHours) {
    const startMinutes = parseTimeToMinutes(workingHour.startTime);
    const endMinutes = parseTimeToMinutes(workingHour.endTime);

    for (
      let slotMinutes = startMinutes;
      slotMinutes + appointmentDurationMinutes <= endMinutes;
      slotMinutes += appointmentDurationMinutes
    ) {
      slots.push({
        label: formatTime(slotMinutes),
        startsAt: createDateTime(date, slotMinutes),
        endsAt: createDateTime(date, slotMinutes + appointmentDurationMinutes),
      });
    }
  }

  return slots;
};

const hasOverlap = (
  slot: AvailabilitySlot,
  appointment: AvailabilityAppointmentWindow
): boolean =>
  appointment.startsAt < slot.endsAt && appointment.endsAt > slot.startsAt;

const getUniqueSortedSlots = (slots: AvailabilitySlot[]): AvailabilitySlot[] => {
  const uniqueSlots = new Map<string, AvailabilitySlot>();

  for (const slot of slots) {
    uniqueSlots.set(slot.label, slot);
  }

  return Array.from(uniqueSlots.values()).sort(
    (firstSlot, secondSlot) =>
      firstSlot.startsAt.getTime() - secondSlot.startsAt.getTime()
  );
};

export const availabilityService = {
  async getAvailableSlots(
    trainerId: string,
    date: string
  ): Promise<AvailabilityResult> {
    if (!isValidDate(date)) {
      throw new Error("date must be in YYYY-MM-DD format");
    }

    const trainer = await trainersRepository.getTrainerById(trainerId);

    if (!trainer) {
      throw new Error("Trainer not found");
    }

    const workingHours = await trainersRepository.listTrainerWorkingHours(
      trainerId
    );
    const slots = generateWorkingHourSlots(date, workingHours);
    const appointments =
      await availabilityRepository.listActiveAppointmentsForDate(
        trainerId,
        date
      );
    const availableSlots = getUniqueSortedSlots(slots)
      .filter(
        (slot) =>
          !appointments.some((appointment) => hasOverlap(slot, appointment))
      )
      .map((slot) => slot.label);

    return {
      date,
      availableSlots,
    };
  },
};
