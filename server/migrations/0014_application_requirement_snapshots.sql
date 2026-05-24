ALTER TABLE uploaded_files
  ADD COLUMN IF NOT EXISTS job_application_id INTEGER REFERENCES job_applications(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS application_requirements (
  id BIGSERIAL PRIMARY KEY,
  job_application_id INTEGER NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  requirement_field VARCHAR(120) NOT NULL,
  requirement_label TEXT NOT NULL,
  requirement_description TEXT,
  required BOOLEAN NOT NULL DEFAULT TRUE,
  file_id UUID REFERENCES uploaded_files(id) ON DELETE SET NULL,
  source_file_id UUID REFERENCES uploaded_files(id) ON DELETE SET NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'pending',
  remarks TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (job_application_id, requirement_field)
);

CREATE TABLE IF NOT EXISTS application_requirement_history (
  id BIGSERIAL PRIMARY KEY,
  application_requirement_id BIGINT REFERENCES application_requirements(id) ON DELETE CASCADE,
  job_application_id INTEGER REFERENCES job_applications(id) ON DELETE CASCADE,
  actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(80) NOT NULL,
  from_status VARCHAR(40),
  to_status VARCHAR(40),
  previous_file_id UUID REFERENCES uploaded_files(id) ON DELETE SET NULL,
  next_file_id UUID REFERENCES uploaded_files(id) ON DELETE SET NULL,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS uploaded_files_owner_library_field_idx
  ON uploaded_files(owner_user_id, requirement_field, status, created_at DESC)
  WHERE job_opening_id IS NULL;

CREATE INDEX IF NOT EXISTS uploaded_files_application_idx
  ON uploaded_files(job_application_id);

CREATE INDEX IF NOT EXISTS application_requirements_application_idx
  ON application_requirements(job_application_id);

CREATE INDEX IF NOT EXISTS application_requirements_status_idx
  ON application_requirements(status, updated_at DESC);

CREATE INDEX IF NOT EXISTS application_requirement_history_application_idx
  ON application_requirement_history(job_application_id, created_at DESC);
