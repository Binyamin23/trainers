import pool from "../db/pool";
import {
  Appointment,
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from "../types/appointment";

const mapAppointment = (row: Record<string, any>): Appointment => ({
  id: row.id,
  traineeId: row.trainee_id,
  trainee: row.trainee_id
    ? {
        id: row.trainee_id,
        name: row.trainee_name,
        phone: row.trainee_phone,
      }
    : null,
  customerName: row.customer_name,
  phone: row.phone,
  trainerId: row.trainer_id,
  startsAt: row.starts_at,
  endsAt: row.ends_at,
  status: row.status,
  notes: row.notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const appointmentColumns =
  `appointments.id,
   appointments.trainee_id,
   appointments.customer_name,
   appointments.phone,
   appointments.trainer_id,
   appointments.starts_at,
   appointments.ends_at,
   appointments.status,
   appointments.notes,
   appointments.created_at,
   appointments.updated_at,
   trainees.name AS trainee_name,
   trainees.phone AS trainee_phone`;

const appointmentFromClause =
  "queue.appointments appointments LEFT JOIN queue.trainees trainees ON trainees.id = appointments.trainee_id";

export const appointmentsRepository = {
  async hasOverlappingScheduledAppointment(
    startsAt: Date,
    endsAt: Date,
    excludeAppointmentId?: string,
    trainerId?: string | null
  ): Promise<boolean> {
    const result = await pool.query(
      `SELECT EXISTS (
         SELECT 1
         FROM queue.appointments
         WHERE status = $3
           AND starts_at < $2
           AND ends_at > $1
           AND ($4::uuid IS NULL OR id <> $4::uuid)
           AND ($5::uuid IS NULL OR trainer_id = $5::uuid)
       ) AS has_overlap`,
      [startsAt, endsAt, "scheduled", excludeAppointmentId ?? null, trainerId ?? null]
    );

    return result.rows[0].has_overlap;
  },

  async createAppointment(input: CreateAppointmentInput): Promise<Appointment> {
    const result = await pool.query(
      `WITH trainee AS (
         SELECT id, name, phone, trainer_id
         FROM queue.trainees
         WHERE id = $1
       ),
       inserted AS (
         INSERT INTO queue.appointments
           (trainee_id, customer_name, phone, trainer_id, starts_at, ends_at, notes)
         SELECT
           trainee.id,
           trainee.name,
           trainee.phone,
           COALESCE($2::uuid, trainee.trainer_id),
           $3,
           $4,
           $5
         FROM trainee
         RETURNING *
       )
       SELECT ${appointmentColumns}
       FROM inserted appointments
       LEFT JOIN queue.trainees trainees ON trainees.id = appointments.trainee_id`,
      [
        input.traineeId,
        input.trainerId ?? null,
        input.startsAt,
        input.endsAt,
        input.notes ?? null,
      ]
    );

    return mapAppointment(result.rows[0]);
  },

  async getAppointmentById(id: string): Promise<Appointment | null> {
    const result = await pool.query(
      `SELECT ${appointmentColumns}
       FROM ${appointmentFromClause}
       WHERE appointments.id = $1`,
      [id]
    );

    return result.rows[0] ? mapAppointment(result.rows[0]) : null;
  },

  async listAppointments(): Promise<Appointment[]> {
    const result = await pool.query(
      `SELECT ${appointmentColumns}
       FROM ${appointmentFromClause}
       ORDER BY appointments.starts_at ASC`
    );

    return result.rows.map(mapAppointment);
  },

  async findActiveAppointmentsByPhone(phone: string): Promise<Appointment[]> {
    const result = await pool.query(
      `SELECT ${appointmentColumns}
       FROM ${appointmentFromClause}
       WHERE trainees.phone = $1
         AND appointments.status = $2
       ORDER BY appointments.starts_at ASC`,
      [phone, "scheduled"]
    );

    return result.rows.map(mapAppointment);
  },

  async updateAppointment(
    id: string,
    input: Required<UpdateAppointmentInput>
  ): Promise<Appointment | null> {
    const result = await pool.query(
      `UPDATE queue.appointments
       SET trainee_id = $2,
           customer_name = COALESCE(trainees.name, appointments.customer_name),
           phone = COALESCE(trainees.phone, appointments.phone),
           trainer_id = $3,
           starts_at = $4,
           ends_at = $5,
           status = $6,
           notes = $7,
           updated_at = now()
       FROM queue.trainees trainees
       WHERE appointments.id = $1
         AND trainees.id = $2
       RETURNING
         appointments.id,
         appointments.trainee_id,
         appointments.customer_name,
         appointments.phone,
         appointments.trainer_id,
         appointments.starts_at,
         appointments.ends_at,
         appointments.status,
         appointments.notes,
         appointments.created_at,
         appointments.updated_at,
         trainees.name AS trainee_name,
         trainees.phone AS trainee_phone`,
      [
        id,
        input.traineeId,
        input.trainerId,
        input.startsAt,
        input.endsAt,
        input.status,
        input.notes,
      ]
    );

    return result.rows[0] ? mapAppointment(result.rows[0]) : null;
  },

  async cancelAppointment(id: string): Promise<Appointment | null> {
    const result = await pool.query(
      `WITH updated AS (
         UPDATE queue.appointments
       SET status = $2,
           updated_at = now()
       WHERE id = $1
         RETURNING *
       )
       SELECT ${appointmentColumns}
       FROM updated appointments
       LEFT JOIN queue.trainees trainees ON trainees.id = appointments.trainee_id`,
      [id, "cancelled"]
    );

    return result.rows[0] ? mapAppointment(result.rows[0]) : null;
  },
};
