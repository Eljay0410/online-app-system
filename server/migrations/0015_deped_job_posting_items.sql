ALTER TABLE job_openings
  ADD COLUMN IF NOT EXISTS salary_grade VARCHAR(40),
  ADD COLUMN IF NOT EXISTS salary_amount VARCHAR(80),
  ADD COLUMN IF NOT EXISTS education TEXT,
  ADD COLUMN IF NOT EXISTS training TEXT,
  ADD COLUMN IF NOT EXISTS experience TEXT,
  ADD COLUMN IF NOT EXISTS eligibility TEXT;

CREATE TABLE IF NOT EXISTS job_opening_items (
  id SERIAL PRIMARY KEY,
  job_opening_id INTEGER NOT NULL REFERENCES job_openings(id) ON DELETE CASCADE,
  school_station TEXT NOT NULL,
  subject_area TEXT,
  vacancy_count INTEGER NOT NULL DEFAULT 1,
  assigned_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (vacancy_count >= 0),
  CHECK (assigned_count >= 0),
  CHECK (assigned_count <= vacancy_count)
);

CREATE INDEX IF NOT EXISTS job_opening_items_job_opening_id_idx
  ON job_opening_items(job_opening_id);

CREATE INDEX IF NOT EXISTS job_opening_items_station_subject_idx
  ON job_opening_items(LOWER(school_station), LOWER(COALESCE(subject_area, '')));

ALTER TABLE job_applications
  ADD COLUMN IF NOT EXISTS reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS admin_remarks TEXT;

CREATE TABLE IF NOT EXISTS application_assignments (
  id BIGSERIAL PRIMARY KEY,
  job_application_id INTEGER NOT NULL UNIQUE REFERENCES job_applications(id) ON DELETE CASCADE,
  job_opening_item_id INTEGER NOT NULL REFERENCES job_opening_items(id) ON DELETE RESTRICT,
  assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS application_assignments_item_idx
  ON application_assignments(job_opening_item_id);
