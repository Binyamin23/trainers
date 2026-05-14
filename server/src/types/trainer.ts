export interface Trainer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  birthDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTrainerInput {
  name: string;
  phone?: string | null;
  email?: string | null;
  birthDate?: Date | null;
}

export interface TrainerWorkingHour {
  id: string;
  trainerId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpsertTrainerWorkingHourInput {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive?: boolean;
}
