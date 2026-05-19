BEGIN;

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

CREATE INDEX IF NOT EXISTS rate_limit_buckets_reset_at_idx
  ON rate_limit_buckets(reset_at);

COMMIT;
