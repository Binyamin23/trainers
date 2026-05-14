export interface Trainee {
  id: string;
  trainerId: string | null;
  name: string;
  phone: string;
  email: string | null;
  birthDate: Date | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTraineeInput {
  name: string;
  phone: string;
  email?: string | null;
  trainerId?: string | null;
  birthDate?: Date | null;
  notes?: string | null;
  isActive?: boolean;
}

export interface UpdateTraineeInput {
  name?: string;
  phone?: string;
  email?: string | null;
  trainerId?: string | null;
  birthDate?: Date | null;
  notes?: string | null;
  isActive?: boolean;
}
