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
    ALTER TABLE job_openings
      ADD COLUMN IF NOT EXISTS district VARCHAR(100),
      ADD COLUMN IF NOT EXISTS barangay VARCHAR(120);
  `);

  await pool.query(`
    ALTER TABLE job_applications
      ADD COLUMN IF NOT EXISTS review_notes TEXT;
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
    CREATE INDEX IF NOT EXISTS job_applications_applicant_profile_id_idx
      ON job_applications(applicant_profile_id);
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS job_applications_user_job_unique_idx
      ON job_applications(user_id, job_opening_id)
      WHERE job_opening_id IS NOT NULL;
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS refresh_tokens_token_unique_idx
      ON refresh_tokens(token);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS rate_limit_buckets_reset_at_idx
      ON rate_limit_buckets(reset_at);
  `);
}
