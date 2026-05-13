BEGIN;

CREATE TABLE IF NOT EXISTS applicant_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  uan VARCHAR(16) NOT NULL UNIQUE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE job_applications
  ADD COLUMN IF NOT EXISTS job_opening_id INTEGER REFERENCES job_openings(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS applicant_profile_id INTEGER REFERENCES applicant_profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS applicant_profiles_user_id_unique_idx
  ON applicant_profiles(user_id);

CREATE UNIQUE INDEX IF NOT EXISTS applicant_profiles_uan_unique_idx
  ON applicant_profiles(uan);

CREATE INDEX IF NOT EXISTS job_applications_job_opening_id_idx
  ON job_applications(job_opening_id);

CREATE INDEX IF NOT EXISTS job_applications_applicant_profile_id_idx
  ON job_applications(applicant_profile_id);

CREATE UNIQUE INDEX IF NOT EXISTS job_applications_user_job_unique_idx
  ON job_applications(user_id, job_opening_id)
  WHERE job_opening_id IS NOT NULL;

COMMIT;
