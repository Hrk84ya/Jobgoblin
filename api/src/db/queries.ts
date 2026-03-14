import pool from './pool';
import { Job, JobState, PriorityLevel, JobError } from '@job-queue/shared';

// --- Mapping helpers ---

const priorityStringToEnum: Record<string, PriorityLevel> = {
  critical: PriorityLevel.CRITICAL,
  high: PriorityLevel.HIGH,
  normal: PriorityLevel.NORMAL,
  low: PriorityLevel.LOW,
};

function toISOString(val: Date | string | null): string | null {
  if (val === null || val === undefined) return null;
  if (val instanceof Date) return val.toISOString();
  return val;
}

function rowToJob(row: Record<string, unknown>): Job {
  return {
    id: row.id as string,
    type: row.type as string,
    queue: row.queue as string,
    priority: priorityStringToEnum[row.priority as string] ?? PriorityLevel.NORMAL,
    state: row.state as JobState,
    payload: (row.payload ?? {}) as Record<string, unknown>,
    createdAt: toISOString(row.created_at as Date | string | null)!,
    startedAt: toISOString(row.started_at as Date | string | null),
    completedAt: toISOString(row.completed_at as Date | string | null),
    retryCount: row.retry_count as number,
    maxRetries: row.max_retries as number,
    errors: (row.errors ?? []) as JobError[],
  };
}

// --- Query functions ---

export interface InsertJobParams {
  id?: string;
  type: string;
  queue: string;
  priority: string;   // 'critical' | 'high' | 'normal' | 'low'
  state: string;      // 'pending' | 'delayed'
  payload: Record<string, unknown>;
  maxRetries: number;
  delay?: number;
}

export async function insertJob(params: InsertJobParams): Promise<Job> {
  const { rows } = await pool.query(
    `INSERT INTO jobs (id, type, queue, priority, state, payload, max_retries)
     VALUES (COALESCE($1, gen_random_uuid()), $2, $3, $4::priority_level, $5::job_state, $6::jsonb, $7)
     RETURNING *`,
    [
      params.id ?? null,
      params.type,
      params.queue,
      params.priority,
      params.state,
      JSON.stringify(params.payload),
      params.maxRetries,
    ],
  );
  return rowToJob(rows[0]);
}

export async function getJobById(id: string): Promise<Job | null> {
  const { rows } = await pool.query('SELECT * FROM jobs WHERE id = $1', [id]);
  if (rows.length === 0) return null;
  return rowToJob(rows[0]);
}

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
): Promise<Job | null> {
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

  const { rows } = await pool.query(
    `UPDATE jobs SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
    values,
  );
  if (rows.length === 0) return null;
  return rowToJob(rows[0]);
}

export interface ListJobsParams {
  state?: string;
  queue?: string;
  priority?: string;
  page: number;
  limit: number;
}

export interface ListJobsResult {
  jobs: Job[];
  total: number;
  page: number;
  limit: number;
}

export async function listJobs(params: ListJobsParams): Promise<ListJobsResult> {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (params.state) {
    conditions.push(`state = $${idx}::job_state`);
    values.push(params.state);
    idx++;
  }
  if (params.queue) {
    conditions.push(`queue = $${idx}`);
    values.push(params.queue);
    idx++;
  }
  if (params.priority) {
    conditions.push(`priority = $${idx}::priority_level`);
    values.push(params.priority);
    idx++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (params.page - 1) * params.limit;

  const countResult = await pool.query(`SELECT COUNT(*) FROM jobs ${where}`, values);
  const total = parseInt(countResult.rows[0].count, 10);

  const { rows } = await pool.query(
    `SELECT * FROM jobs ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...values, params.limit, offset],
  );

  return {
    jobs: rows.map(rowToJob),
    total,
    page: params.page,
    limit: params.limit,
  };
}

export interface QueueStat {
  queue: string;
  pending: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

export async function getQueueStats(): Promise<QueueStat[]> {
  const { rows } = await pool.query(
    `SELECT queue, state, COUNT(*)::int AS count
     FROM jobs
     GROUP BY queue, state
     ORDER BY queue`,
  );

  const statsMap = new Map<string, QueueStat>();
  for (const row of rows) {
    const q = row.queue as string;
    if (!statsMap.has(q)) {
      statsMap.set(q, { queue: q, pending: 0, active: 0, completed: 0, failed: 0, delayed: 0 });
    }
    const stat = statsMap.get(q)!;
    const state = row.state as keyof Omit<QueueStat, 'queue'>;
    if (state in stat) {
      stat[state] = row.count as number;
    }
  }

  return Array.from(statsMap.values());
}

export async function listDLQJobs(page = 1, limit = 20): Promise<ListJobsResult> {
  const offset = (page - 1) * limit;

  const countResult = await pool.query('SELECT COUNT(*) FROM jobs WHERE is_dlq = true');
  const total = parseInt(countResult.rows[0].count, 10);

  const { rows } = await pool.query(
    'SELECT * FROM jobs WHERE is_dlq = true ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset],
  );

  return { jobs: rows.map(rowToJob), total, page, limit };
}

export async function retryJob(id: string): Promise<Job | null> {
  const { rows } = await pool.query(
    `UPDATE jobs
     SET state = 'pending'::job_state,
         retry_count = 0,
         is_dlq = false,
         started_at = NULL,
         completed_at = NULL
     WHERE id = $1 AND state = 'failed'::job_state
     RETURNING *`,
    [id],
  );
  if (rows.length === 0) return null;
  return rowToJob(rows[0]);
}
