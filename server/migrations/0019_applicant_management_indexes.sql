CREATE INDEX IF NOT EXISTS users_role_uan_idx
  ON users(role, uan);

CREATE INDEX IF NOT EXISTS users_uan_idx
  ON users(uan);

CREATE INDEX IF NOT EXISTS users_role_lower_email_created_idx
  ON users(role, LOWER(email), created_at DESC);

CREATE INDEX IF NOT EXISTS users_role_name_search_idx
  ON users(role, LOWER(first_name), LOWER(last_name));

CREATE INDEX IF NOT EXISTS applicant_profiles_user_updated_idx
  ON applicant_profiles(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS job_applications_user_status_created_idx
  ON job_applications(user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS uploaded_files_owner_application_status_idx
  ON uploaded_files(owner_user_id, job_application_id, status, created_at DESC);
