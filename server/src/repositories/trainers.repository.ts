import pool from "../db/pool";
import {
  CreateTrainerInput,
  Trainer,
  TrainerWorkingHour,
  UpsertTrainerWorkingHourInput,
} from "../types/trainer";

const mapTrainer = (row: Record<string, any>): Trainer => ({
  id: row.id,
  name: row.name,
  phone: row.phone,
  email: row.email,
  birthDate: row.birth_date,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapWorkingHour = (row: Record<string, any>): TrainerWorkingHour => ({
  id: row.id,
  trainerId: row.trainer_id,
  dayOfWeek: row.day_of_week,
  startTime: row.start_time,
  endTime: row.end_time,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const trainerColumns = "id, name, phone, email, birth_date, created_at, updated_at";
const workingHourColumns =
  "id, trainer_id, day_of_week, start_time, end_time, is_active, created_at, updated_at";

export const trainersRepository = {
  async createTrainer(input: CreateTrainerInput): Promise<Trainer> {
    const result = await pool.query(
      `INSERT INTO queue.trainers (name, phone, email, birth_date)
       VALUES ($1, $2, $3, $4)
       RETURNING ${trainerColumns}`,
      [input.name, input.phone ?? null, input.email ?? null, input.birthDate ?? null]
    );

    return mapTrainer(result.rows[0]);
  },

  async listTrainers(): Promise<Trainer[]> {
    const result = await pool.query(
      `SELECT ${trainerColumns}
       FROM queue.trainers
       ORDER BY name ASC`
    );

    return result.rows.map(mapTrainer);
  },

  async getTrainerById(id: string): Promise<Trainer | null> {
    const result = await pool.query(
      `SELECT ${trainerColumns}
       FROM queue.trainers
       WHERE id = $1`,
      [id]
    );

    return result.rows[0] ? mapTrainer(result.rows[0]) : null;
  },

  async replaceTrainerWorkingHours(
    trainerId: string,
    workingHours: UpsertTrainerWorkingHourInput[]
  ): Promise<TrainerWorkingHour[]> {
    await pool.query(
      `DELETE FROM queue.trainer_working_hours
       WHERE trainer_id = $1`,
      [trainerId]
    );

    const savedWorkingHours: TrainerWorkingHour[] = [];

    for (const workingHour of workingHours) {
      const result = await pool.query(
        `INSERT INTO queue.trainer_working_hours
           (trainer_id, day_of_week, start_time, end_time, is_active)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING ${workingHourColumns}`,
        [
          trainerId,
          workingHour.dayOfWeek,
          workingHour.startTime,
          workingHour.endTime,
          workingHour.isActive ?? true,
        ]
      );

      savedWorkingHours.push(mapWorkingHour(result.rows[0]));
    }

    return savedWorkingHours;
  },

  async listTrainerWorkingHours(
    trainerId: string
  ): Promise<TrainerWorkingHour[]> {
    const result = await pool.query(
      `SELECT ${workingHourColumns}
       FROM queue.trainer_working_hours
       WHERE trainer_id = $1
       ORDER BY day_of_week ASC, start_time ASC`,
      [trainerId]
    );

    return result.rows.map(mapWorkingHour);
  },
};
