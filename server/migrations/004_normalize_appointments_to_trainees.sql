ALTER TABLE queue.trainers
ADD COLUMN IF NOT EXISTS birth_date date;

CREATE TABLE IF NOT EXISTS queue.trainees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid REFERENCES queue.trainers(id),
  name text,
  phone text UNIQUE,
  email text,
  birth_date date,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE queue.trainees
ADD COLUMN IF NOT EXISTS trainer_id uuid REFERENCES queue.trainers(id);

ALTER TABLE queue.trainees
ADD COLUMN IF NOT EXISTS name text;

ALTER TABLE queue.trainees
ADD COLUMN IF NOT EXISTS email text;

ALTER TABLE queue.trainees
ADD COLUMN IF NOT EXISTS birth_date date;

ALTER TABLE queue.trainees
ADD COLUMN IF NOT EXISTS notes text;

ALTER TABLE queue.trainees
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'queue'
      AND table_name = 'trainees'
      AND column_name = 'full_name'
  ) THEN
    EXECUTE 'UPDATE queue.trainees SET name = COALESCE(name, full_name) WHERE name IS NULL';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'queue'
      AND table_name = 'trainees'
      AND column_name = 'status'
  ) THEN
    EXECUTE 'UPDATE queue.trainees SET is_active = CASE WHEN status = ''inactive'' THEN false ELSE true END';
  END IF;
END $$;

ALTER TABLE queue.trainees
ALTER COLUMN name SET NOT NULL;

ALTER TABLE queue.trainees
ALTER COLUMN phone SET NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'queue'
      AND table_name = 'trainees'
      AND column_name = 'full_name'
  ) THEN
    EXECUTE 'ALTER TABLE queue.trainees ALTER COLUMN full_name DROP NOT NULL';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'queue'
      AND table_name = 'trainees'
      AND column_name = 'status'
  ) THEN
    EXECUTE 'ALTER TABLE queue.trainees ALTER COLUMN status DROP NOT NULL';
  END IF;
END $$;

ALTER TABLE queue.appointments
ADD COLUMN IF NOT EXISTS trainee_id uuid REFERENCES queue.trainees(id);

INSERT INTO queue.trainees (name, phone, trainer_id, notes)
SELECT DISTINCT
  appointments.customer_name,
  appointments.phone,
  appointments.trainer_id,
  'Backfilled from appointment data'
FROM queue.appointments appointments
WHERE appointments.trainee_id IS NULL
  AND appointments.phone IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM queue.trainees trainees
    WHERE trainees.phone = appointments.phone
  )
ON CONFLICT (phone) DO NOTHING;

UPDATE queue.appointments appointments
SET trainee_id = trainees.id
FROM queue.trainees trainees
WHERE appointments.trainee_id IS NULL
  AND appointments.phone = trainees.phone;

CREATE INDEX IF NOT EXISTS idx_appointments_trainee_id
ON queue.appointments (trainee_id);

CREATE INDEX IF NOT EXISTS idx_trainees_trainer_id
ON queue.trainees (trainer_id);

CREATE INDEX IF NOT EXISTS idx_trainees_is_active
ON queue.trainees (is_active);
