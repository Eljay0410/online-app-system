CREATE INDEX IF NOT EXISTS job_openings_position_id_idx
  ON job_openings(position_id);

CREATE INDEX IF NOT EXISTS job_applications_uan_idx
  ON job_applications(uan);

CREATE INDEX IF NOT EXISTS users_role_name_initial_idx
  ON users(role, LOWER(COALESCE(NULLIF(last_name, ''), NULLIF(first_name, ''), '')));

CREATE INDEX IF NOT EXISTS applicant_profiles_personal_name_lookup_idx
  ON applicant_profiles(
    LOWER(COALESCE(data->'personalInfo'->>'lastName', '')),
    LOWER(COALESCE(data->'personalInfo'->>'firstName', ''))
  );
