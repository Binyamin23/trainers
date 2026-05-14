CREATE TABLE IF NOT EXISTS queue.trainers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS queue.trainer_working_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid NOT NULL REFERENCES queue.trainers(id) ON DELETE CASCADE,
  day_of_week int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (start_time < end_time)
);

ALTER TABLE queue.appointments
ADD COLUMN IF NOT EXISTS trainer_id uuid REFERENCES queue.trainers(id);

CREATE INDEX IF NOT EXISTS idx_trainer_working_hours_trainer_day
ON queue.trainer_working_hours (trainer_id, day_of_week);

CREATE INDEX IF NOT EXISTS idx_appointments_trainer_starts_at
ON queue.appointments (trainer_id, starts_at);
