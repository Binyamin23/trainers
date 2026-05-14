import pool from "../db/pool";
import {
  CreateTraineeInput,
  Trainee,
  UpdateTraineeInput,
} from "../types/trainee";

const traineeColumns =
  "id, trainer_id, name, phone, email, birth_date, notes, is_active, created_at, updated_at";

const mapTrainee = (row: Record<string, any>): Trainee => ({
  id: row.id,
  trainerId: row.trainer_id,
  name: row.name,
  phone: row.phone,
  email: row.email,
  birthDate: row.birth_date,
  notes: row.notes,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const traineesRepository = {
  async createTrainee(input: CreateTraineeInput): Promise<Trainee> {
    const result = await pool.query(
      `INSERT INTO queue.trainees
         (trainer_id, name, phone, email, birth_date, notes, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING ${traineeColumns}`,
      [
        input.trainerId ?? null,
        input.name,
        input.phone,
        input.email ?? null,
        input.birthDate ?? null,
        input.notes ?? null,
        input.isActive ?? true,
      ]
    );

    return mapTrainee(result.rows[0]);
  },

  async listTrainees(): Promise<Trainee[]> {
    const result = await pool.query(
      `SELECT ${traineeColumns}
       FROM queue.trainees
       ORDER BY full_name ASC`
    );

    return result.rows.map(mapTrainee);
  },

  async getTraineeById(id: string): Promise<Trainee | null> {
    const result = await pool.query(
      `SELECT ${traineeColumns}
       FROM queue.trainees
       WHERE id = $1`,
      [id]
    );

    return result.rows[0] ? mapTrainee(result.rows[0]) : null;
  },

  async getTraineeByPhone(phone: string): Promise<Trainee | null> {
    const result = await pool.query(
      `SELECT ${traineeColumns}
       FROM queue.trainees
       WHERE phone = $1`,
      [phone]
    );

    return result.rows[0] ? mapTrainee(result.rows[0]) : null;
  },

  async listTraineesByTrainerId(trainerId: string): Promise<Trainee[]> {
    const result = await pool.query(
      `SELECT ${traineeColumns}
       FROM queue.trainees
       WHERE trainer_id = $1
       ORDER BY name ASC`,
      [trainerId]
    );

    return result.rows.map(mapTrainee);
  },

  async updateTrainee(
    id: string,
    input: Required<UpdateTraineeInput>
  ): Promise<Trainee | null> {
    const result = await pool.query(
      `UPDATE queue.trainees
       SET name = $2,
           phone = $3,
           birth_date = $4,
           trainer_id = $5,
           notes = $6,
           email = $7,
           is_active = $8,
           updated_at = now()
       WHERE id = $1
       RETURNING ${traineeColumns}`,
      [
        id,
        input.name,
        input.phone,
        input.birthDate,
        input.trainerId,
        input.notes,
        input.email,
        input.isActive,
      ]
    );

    return result.rows[0] ? mapTrainee(result.rows[0]) : null;
  },

  async deactivateTrainee(id: string): Promise<Trainee | null> {
    const result = await pool.query(
      `UPDATE queue.trainees
       SET is_active = false,
           updated_at = now()
       WHERE id = $1
       RETURNING ${traineeColumns}`,
      [id]
    );

    return result.rows[0] ? mapTrainee(result.rows[0]) : null;
  },
};
