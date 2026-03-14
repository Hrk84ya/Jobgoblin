-- migrations/001_create_jobs.sql
-- Idempotent: safe to run multiple times

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE job_state AS ENUM ('pending', 'active', 'completed', 'failed', 'delayed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE priority_level AS ENUM ('critical', 'high', 'normal', 'low');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS jobs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type          TEXT NOT NULL,
  queue         TEXT NOT NULL,
  priority      priority_level NOT NULL DEFAULT 'normal',
  state         job_state NOT NULL DEFAULT 'pending',
  payload       JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  retry_count   INTEGER NOT NULL DEFAULT 0,
  max_retries   INTEGER NOT NULL DEFAULT 3,
  errors        JSONB NOT NULL DEFAULT '[]',
  is_dlq        BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_jobs_state ON jobs (state);
CREATE INDEX IF NOT EXISTS idx_jobs_queue ON jobs (queue);
CREATE INDEX IF NOT EXISTS idx_jobs_priority ON jobs (priority);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_queue_state ON jobs (queue, state);
