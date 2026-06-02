ALTER TABLE application_requirements
  DROP CONSTRAINT IF EXISTS application_requirements_job_application_id_requirement_field_key;

CREATE INDEX IF NOT EXISTS application_requirements_application_field_idx
  ON application_requirements(job_application_id, requirement_field);

CREATE INDEX IF NOT EXISTS job_applications_status_created_at_idx
  ON job_applications(status, created_at DESC);

CREATE INDEX IF NOT EXISTS job_applications_job_opening_created_at_idx
  ON job_applications(job_opening_id, created_at DESC);

CREATE INDEX IF NOT EXISTS job_applications_status_job_opening_created_at_idx
  ON job_applications(status, job_opening_id, created_at DESC);

CREATE INDEX IF NOT EXISTS users_name_lookup_idx
  ON users(LOWER(first_name), LOWER(last_name));

CREATE INDEX IF NOT EXISTS users_full_name_lookup_idx
  ON users(LOWER(COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')));

CREATE INDEX IF NOT EXISTS job_openings_lower_title_idx
  ON job_openings(LOWER(title));
