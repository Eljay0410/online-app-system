import pool from "./db.js";

export async function ensureDatabaseSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS applicant_profiles (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      uan VARCHAR(16) NOT NULL UNIQUE,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS rate_limit_buckets (
      id BIGSERIAL PRIMARY KEY,
      key_prefix TEXT NOT NULL,
      key_hash CHAR(64) NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      reset_at TIMESTAMP WITH TIME ZONE NOT NULL,
      first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE (key_prefix, key_hash)
    );
  `);

  await pool.query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100),
      ADD COLUMN IF NOT EXISTS no_middle_name BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS contact_number VARCHAR(30),
      ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS last_password_reset_sent_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS last_activation_sent_at TIMESTAMP WITH TIME ZONE;
  `);

  await pool.query(`
    ALTER TABLE activation_tokens
      ADD COLUMN IF NOT EXISTS purpose VARCHAR(40) NOT NULL DEFAULT 'email_verification',
      ADD COLUMN IF NOT EXISTS used_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMP WITH TIME ZONE;
  `);

  await pool.query(`
    ALTER TABLE refresh_tokens
      ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMP WITH TIME ZONE;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS job_positions (
      id SERIAL PRIMARY KEY,
      category VARCHAR(40) NOT NULL,
      title VARCHAR(255) NOT NULL,
      requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE (category, title)
    );
  `);

  await pool.query(`
    ALTER TABLE job_openings
      ADD COLUMN IF NOT EXISTS district VARCHAR(100),
      ADD COLUMN IF NOT EXISTS barangay VARCHAR(120),
      ADD COLUMN IF NOT EXISTS salary_grade VARCHAR(40),
      ADD COLUMN IF NOT EXISTS salary_amount VARCHAR(80),
      ADD COLUMN IF NOT EXISTS education TEXT,
      ADD COLUMN IF NOT EXISTS training TEXT,
      ADD COLUMN IF NOT EXISTS experience TEXT,
      ADD COLUMN IF NOT EXISTS eligibility TEXT,
      ADD COLUMN IF NOT EXISTS requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS deadline_time TIME NOT NULL DEFAULT '23:59',
      ADD COLUMN IF NOT EXISTS position_id INTEGER REFERENCES job_positions(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS position_category VARCHAR(40),
      ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
  `);

  await pool.query(`
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
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id BIGSERIAL PRIMARY KEY,
      actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      actor_role VARCHAR(40),
      action VARCHAR(80) NOT NULL,
      entity_type VARCHAR(80) NOT NULL,
      entity_id INTEGER,
      entity_label TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS uploaded_files (
      id UUID PRIMARY KEY,
      owner_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      applicant_profile_id INTEGER REFERENCES applicant_profiles(id) ON DELETE SET NULL,
      job_application_id INTEGER REFERENCES job_applications(id) ON DELETE SET NULL,
      job_opening_id INTEGER REFERENCES job_openings(id) ON DELETE SET NULL,
      requirement_field VARCHAR(120) NOT NULL,
      requirement_label TEXT,
      original_name TEXT NOT NULL,
      stored_name TEXT NOT NULL,
      relative_path TEXT NOT NULL,
      mime_type VARCHAR(160) NOT NULL,
      size_bytes BIGINT NOT NULL,
      original_size_bytes BIGINT,
      checksum_sha256 CHAR(64),
      image_width INTEGER,
      image_height INTEGER,
      status VARCHAR(30) NOT NULL DEFAULT 'active',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      deleted_at TIMESTAMP WITH TIME ZONE
    );
  `);

  await pool.query(`
    ALTER TABLE uploaded_files
      ADD COLUMN IF NOT EXISTS job_application_id INTEGER REFERENCES job_applications(id) ON DELETE SET NULL;
  `);

  await pool.query(`
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
  `);

  await pool.query(`
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
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS job_openings_deadline_at_idx
      ON job_openings ((deadline + COALESCE(deadline_time, TIME '23:59')));
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS job_openings_created_at_idx
      ON job_openings(created_at DESC);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS job_openings_status_deadline_created_idx
      ON job_openings(status, (deadline + COALESCE(deadline_time, TIME '23:59')), created_at DESC);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS job_opening_items_job_opening_id_idx
      ON job_opening_items(job_opening_id);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS job_opening_items_station_subject_idx
      ON job_opening_items(LOWER(school_station), LOWER(COALESCE(subject_area, '')));
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS job_positions_category_idx
      ON job_positions(category);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS job_positions_category_title_idx
      ON job_positions(category, title);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS activity_logs_created_at_idx
      ON activity_logs(created_at DESC);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS activity_logs_action_created_idx
      ON activity_logs(action, created_at DESC);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS activity_logs_entity_idx
      ON activity_logs(entity_type, entity_id);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS uploaded_files_owner_status_idx
      ON uploaded_files(owner_user_id, status, created_at DESC);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS uploaded_files_profile_idx
      ON uploaded_files(applicant_profile_id);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS uploaded_files_application_idx
      ON uploaded_files(job_application_id);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS uploaded_files_job_requirement_idx
      ON uploaded_files(job_opening_id, requirement_field, status);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS uploaded_files_cleanup_idx
      ON uploaded_files(status, deleted_at);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS uploaded_files_owner_job_status_field_idx
      ON uploaded_files(owner_user_id, job_opening_id, status, requirement_field);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS uploaded_files_owner_library_field_idx
      ON uploaded_files(owner_user_id, requirement_field, status, created_at DESC)
      WHERE job_opening_id IS NULL;
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS uploaded_files_archived_cleanup_idx
      ON uploaded_files(status, deleted_at)
      WHERE status IN ('replaced', 'deleted', 'archived');
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS application_requirements_application_idx
      ON application_requirements(job_application_id);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS application_requirements_status_idx
      ON application_requirements(status, updated_at DESC);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS application_requirement_history_application_idx
      ON application_requirement_history(job_application_id, created_at DESC);
  `);

  await pool.query(`
    ALTER TABLE job_applications
      ADD COLUMN IF NOT EXISTS review_notes TEXT,
      ADD COLUMN IF NOT EXISTS reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS admin_remarks TEXT;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS application_assignments (
      id BIGSERIAL PRIMARY KEY,
      job_application_id INTEGER NOT NULL UNIQUE REFERENCES job_applications(id) ON DELETE CASCADE,
      job_opening_item_id INTEGER NOT NULL REFERENCES job_opening_items(id) ON DELETE RESTRICT,
      assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  await pool.query(`
    ALTER TABLE job_applications
      ADD COLUMN IF NOT EXISTS job_opening_id INTEGER REFERENCES job_openings(id) ON DELETE CASCADE,
      ADD COLUMN IF NOT EXISTS applicant_profile_id INTEGER REFERENCES applicant_profiles(id) ON DELETE CASCADE,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS applicant_profiles_user_id_unique_idx
      ON applicant_profiles(user_id);
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS applicant_profiles_uan_unique_idx
      ON applicant_profiles(uan);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS job_applications_job_opening_id_idx
      ON job_applications(job_opening_id);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS job_applications_status_created_idx
      ON job_applications(status, created_at DESC);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS job_applications_user_created_idx
      ON job_applications(user_id, created_at DESC);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS job_applications_user_job_status_idx
      ON job_applications(user_id, job_opening_id, status);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS job_applications_created_at_idx
      ON job_applications(created_at DESC);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS job_applications_applicant_profile_id_idx
      ON job_applications(applicant_profile_id);
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS job_applications_user_job_unique_idx
      ON job_applications(user_id, job_opening_id)
      WHERE job_opening_id IS NOT NULL;
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS application_assignments_item_idx
      ON application_assignments(job_opening_item_id);
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS refresh_tokens_token_unique_idx
      ON refresh_tokens(token);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS rate_limit_buckets_reset_at_idx
      ON rate_limit_buckets(reset_at);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS users_role_created_at_idx
      ON users(role, created_at DESC);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS users_role_uan_idx
      ON users(role, uan);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS users_uan_idx
      ON users(uan);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS users_role_lower_email_created_idx
      ON users(role, LOWER(email), created_at DESC);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS users_role_name_search_idx
      ON users(role, LOWER(first_name), LOWER(last_name));
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS users_role_name_initial_idx
      ON users(role, LOWER(COALESCE(NULLIF(last_name, ''), NULLIF(first_name, ''), '')));
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS users_lower_email_idx
      ON users(LOWER(email));
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS applicant_profiles_user_updated_idx
      ON applicant_profiles(user_id, updated_at DESC);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS applicant_profiles_personal_name_lookup_idx
      ON applicant_profiles(
        LOWER(COALESCE(data->'personalInfo'->>'lastName', '')),
        LOWER(COALESCE(data->'personalInfo'->>'firstName', ''))
      );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS job_openings_position_id_idx
      ON job_openings(position_id);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS job_applications_uan_idx
      ON job_applications(uan);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS job_applications_user_status_created_idx
      ON job_applications(user_id, status, created_at DESC);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS uploaded_files_owner_application_status_idx
      ON uploaded_files(owner_user_id, job_application_id, status, created_at DESC);
  `);
}
