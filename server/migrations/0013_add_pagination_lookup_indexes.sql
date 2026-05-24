CREATE INDEX IF NOT EXISTS users_role_created_at_idx
  ON users(role, created_at DESC);

CREATE INDEX IF NOT EXISTS users_lower_email_idx
  ON users(LOWER(email));

CREATE INDEX IF NOT EXISTS job_openings_created_at_idx
  ON job_openings(created_at DESC);

CREATE INDEX IF NOT EXISTS job_openings_status_deadline_created_idx
  ON job_openings(status, (deadline + COALESCE(deadline_time, TIME '23:59')), created_at DESC);

CREATE INDEX IF NOT EXISTS job_positions_category_title_idx
  ON job_positions(category, title);

CREATE INDEX IF NOT EXISTS job_applications_user_job_status_idx
  ON job_applications(user_id, job_opening_id, status);

CREATE INDEX IF NOT EXISTS job_applications_created_at_idx
  ON job_applications(created_at DESC);

CREATE INDEX IF NOT EXISTS uploaded_files_owner_job_status_field_idx
  ON uploaded_files(owner_user_id, job_opening_id, status, requirement_field);

CREATE INDEX IF NOT EXISTS uploaded_files_archived_cleanup_idx
  ON uploaded_files(status, deleted_at)
  WHERE status IN ('replaced', 'deleted', 'archived');

CREATE INDEX IF NOT EXISTS activity_logs_action_created_idx
  ON activity_logs(action, created_at DESC);
