import { CreateJobSchema, JobFilterSchema, PriorityLevel } from '@job-queue/shared';
import type { Job, CreateJobInput } from '@job-queue/shared';
import { insertJob, getJobById, listJobs as dbListJobs, retryJob as dbRetryJob } from '../db/queries';
import { enqueueJob } from './queueService';

const priorityNameToNumeric: Record<string, PriorityLevel> = {
  critical: PriorityLevel.CRITICAL,
  high: PriorityLevel.HIGH,
  normal: PriorityLevel.NORMAL,
  low: PriorityLevel.LOW,
};

function getMaxRetries(jobType: string): number {
  const envKey = `MAX_RETRIES_${jobType.replace(/-/g, '_')}`;
  const val = process.env[envKey];
  return val ? parseInt(val, 10) : 3;
}

function computeDelay(data: CreateJobInput): number | undefined {
  if (data.delay) return data.delay;
  if (data.scheduledAt) {
    const diff = new Date(data.scheduledAt).getTime() - Date.now();
    return diff > 0 ? diff : undefined;
  }
  return undefined;
}

export async function createJob(raw: unknown): Promise<Job> {
  const data = CreateJobSchema.parse(raw);
  const delay = computeDelay(data);
  const state = delay ? 'delayed' : 'pending';
  const maxRetries = getMaxRetries(data.type);

  const job = await insertJob({
    type: data.type,
    queue: data.queue,
    priority: data.priority,
    state,
    payload: data.payload,
    maxRetries,
  });

  await enqueueJob(data.queue, data.type, data.payload, {
    jobId: job.id,
    priority: priorityNameToNumeric[data.priority] ?? PriorityLevel.NORMAL,
    delay,
    maxRetries,
  });

  return job;
}

export async function getJob(id: string): Promise<Job | null> {
  return getJobById(id);
}

export async function listJobs(rawFilters: unknown) {
  const filters = JobFilterSchema.parse(rawFilters);
  return dbListJobs(filters);
}

export async function retryJob(id: string): Promise<{ job: Job | null; conflict: boolean }> {
  const existing = await getJobById(id);
  if (!existing) return { job: null, conflict: false };
  if (existing.state !== 'failed') return { job: null, conflict: true };

  const job = await dbRetryJob(id);
  if (!job) return { job: null, conflict: false };

  await enqueueJob(job.queue, job.type, job.payload, {
    jobId: job.id,
    priority: job.priority,
    maxRetries: job.maxRetries,
  });

  return { job, conflict: false };
}
