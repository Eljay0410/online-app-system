BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS no_middle_name BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS contact_number VARCHAR(30),
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS last_password_reset_sent_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE activation_tokens
  ADD COLUMN IF NOT EXISTS purpose VARCHAR(40) NOT NULL DEFAULT 'email_verification',
  ADD COLUMN IF NOT EXISTS used_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE refresh_tokens
  ALTER COLUMN token SET NOT NULL,
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE job_applications
  ADD COLUMN IF NOT EXISTS review_notes TEXT;

UPDATE activation_tokens
SET purpose = 'email_verification'
WHERE purpose IS NULL OR purpose = '';

UPDATE activation_tokens
SET used_at = created_at
WHERE used = TRUE AND used_at IS NULL;

CREATE INDEX IF NOT EXISTS activation_tokens_active_idx
  ON activation_tokens(user_id, purpose, expires_at)
  WHERE used = FALSE AND revoked_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS refresh_tokens_token_unique_idx
  ON refresh_tokens(token);

CREATE INDEX IF NOT EXISTS refresh_tokens_active_idx
  ON refresh_tokens(user_id, expires_at)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS users_role_idx
  ON users(role);

CREATE INDEX IF NOT EXISTS job_openings_location_idx
  ON job_openings(LOWER(location));

CREATE INDEX IF NOT EXISTS job_openings_title_idx
  ON job_openings(LOWER(title));

COMMIT;
