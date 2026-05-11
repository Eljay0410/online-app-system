BEGIN;

CREATE TABLE IF NOT EXISTS job_openings (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  vacancy INTEGER NOT NULL DEFAULT 1,
  deadline DATE NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'open',
  description TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE job_applications
  ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'submitted',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE INDEX IF NOT EXISTS job_openings_status_deadline_idx
  ON job_openings(status, deadline);

CREATE INDEX IF NOT EXISTS job_applications_status_idx
  ON job_applications(status);

COMMIT;
