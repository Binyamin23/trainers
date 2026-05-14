import pool from "../db/pool";

export interface AvailabilityAppointmentWindow {
  startsAt: Date;
  endsAt: Date;
}

const mapAppointmentWindow = (
  row: Record<string, any>
): AvailabilityAppointmentWindow => ({
  startsAt: row.starts_at,
  endsAt: row.ends_at,
});

export const availabilityRepository = {
  async listActiveAppointmentsForDate(
    trainerId: string,
    date: string
  ): Promise<AvailabilityAppointmentWindow[]> {
    const result = await pool.query(
      `SELECT starts_at, ends_at
       FROM queue.appointments
       WHERE trainer_id = $2
         AND status <> $3
         AND starts_at < ($1::date + interval '1 day')
         AND ends_at > $1::date
       ORDER BY starts_at ASC`,
      [date, trainerId, "cancelled"]
    );

    return result.rows.map(mapAppointmentWindow);
  },
};
