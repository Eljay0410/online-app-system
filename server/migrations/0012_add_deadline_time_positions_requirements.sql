BEGIN;

CREATE TABLE IF NOT EXISTS job_positions (
  id SERIAL PRIMARY KEY,
  category VARCHAR(40) NOT NULL,
  title VARCHAR(255) NOT NULL,
  requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (category, title)
);

ALTER TABLE job_openings
  ADD COLUMN IF NOT EXISTS deadline_time TIME NOT NULL DEFAULT '23:59',
  ADD COLUMN IF NOT EXISTS position_id INTEGER REFERENCES job_positions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS position_category VARCHAR(40),
  ADD COLUMN IF NOT EXISTS requirements JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS job_openings_deadline_at_idx
  ON job_openings ((deadline + COALESCE(deadline_time, TIME '23:59')));

CREATE INDEX IF NOT EXISTS job_positions_category_idx
  ON job_positions(category);

COMMIT;
