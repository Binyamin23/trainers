CREATE TABLE IF NOT EXISTS queue.trainees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text UNIQUE NOT NULL,
  birth_date date,
  gender text,
  trainer_id uuid REFERENCES queue.trainers(id),
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trainees_trainer_id
ON queue.trainees (trainer_id);

CREATE INDEX IF NOT EXISTS idx_trainees_status
ON queue.trainees (status);
