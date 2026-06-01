ALTER TABLE IF EXISTS job_positions
  DROP COLUMN IF EXISTS requirements;

ALTER TABLE IF EXISTS job_openings
  DROP COLUMN IF EXISTS requirements;
