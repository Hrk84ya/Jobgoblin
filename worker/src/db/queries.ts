import pool from './pool';
import type { JobError } from '@job-queue/shared';
import { JobState } from '@job-queue/shared';

export async function updateJobState(
  id: string,
  state: JobState,
  extra: Partial<{
    startedAt: string;
    completedAt: string;
    retryCount: number;
    errors: JobError[];
    isDlq: boolean;
  }> = {},
): Promise<void> {
  const sets: string[] = ['state = $2::job_state'];
  const values: unknown[] = [id, state];
  let idx = 3;

  if (extra.startedAt !== undefined) {
    sets.push(`started_at = $${idx}::timestamptz`);
    values.push(extra.startedAt);
    idx++;
  }
  if (extra.completedAt !== undefined) {
    sets.push(`completed_at = $${idx}::timestamptz`);
    values.push(extra.completedAt);
    idx++;
  }
  if (extra.retryCount !== undefined) {
    sets.push(`retry_count = $${idx}`);
    values.push(extra.retryCount);
    idx++;
  }
  if (extra.errors !== undefined) {
    sets.push(`errors = $${idx}::jsonb`);
    values.push(JSON.stringify(extra.errors));
    idx++;
  }
  if (extra.isDlq !== undefined) {
    sets.push(`is_dlq = $${idx}`);
    values.push(extra.isDlq);
    idx++;
  }

  await pool.query(
    `UPDATE jobs SET ${sets.join(', ')} WHERE id = $1`,
    values,
  );
}

export async function appendJobError(id: string, error: JobError): Promise<void> {
  await pool.query(
    `UPDATE jobs SET errors = errors || $2::jsonb WHERE id = $1`,
    [id, JSON.stringify([error])],
  );
}

export async function incrementRetryCount(id: string): Promise<void> {
  await pool.query(
    `UPDATE jobs SET retry_count = retry_count + 1 WHERE id = $1`,
    [id],
  );
}
