export type AppointmentStatus = "scheduled" | "cancelled" | "completed";

export interface Appointment {
  id: string;
  traineeId: string | null;
  trainee?: {
    id: string;
    name: string;
    phone: string;
  } | null;
  /** Deprecated: use trainee.name. */
  customerName: string;
  /** Deprecated: use trainee.phone. */
  phone: string;
  trainerId: string | null;
  startsAt: Date;
  endsAt: Date;
  status: AppointmentStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAppointmentInput {
  traineeId: string;
  trainerId?: string | null;
  startsAt: Date;
  endsAt: Date;
  notes?: string | null;
}

export interface UpdateAppointmentInput {
  traineeId?: string | null;
  trainerId?: string | null;
  startsAt?: Date;
  endsAt?: Date;
  status?: AppointmentStatus;
  notes?: string | null;
}
