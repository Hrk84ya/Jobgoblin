import { Worker as BullWorker, Job as BullJob, ConnectionOptions } from 'bullmq';
import { JobState } from '@job-queue/shared';
import type { JobError } from '@job-queue/shared';
import { getHandler } from './handlers/registry';
import { updateJobState, appendJobError, incrementRetryCount } from './db/queries';

const connection: ConnectionOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

function getJobTimeout(jobType: string): number | undefined {
  const envKey = `JOB_TIMEOUT_${jobType.replace(/-/g, '_')}`;
  const val = process.env[envKey];
  return val ? parseInt(val, 10) : undefined;
}

function getConcurrency(queueName: string): number {
  const envKey = `CONCURRENCY_${queueName.replace(/-/g, '_')}`;
  const val = process.env[envKey];
  return val ? parseInt(val, 10) : 1;
}

export function createWorker(queueName: string): BullWorker {
  const concurrency = getConcurrency(queueName);

  const worker = new BullWorker(
    queueName,
    async (job: BullJob) => {
      // Update state to active
      await updateJobState(job.opts.jobId as string, JobState.ACTIVE, {
        startedAt: new Date().toISOString(),
      });

      const handler = getHandler(job.name);
      if (!handler) {
        // No handler — fail immediately, no retry
        throw new Error(`No handler registered for job type: ${job.name}`);
      }

      // Execute with optional timeout
      const timeout = getJobTimeout(job.name);
      if (timeout) {
        await Promise.race([
          handler(job.data),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Job timed out after ${timeout}ms`)), timeout),
          ),
        ]);
      } else {
        await handler(job.data);
      }
    },
    { connection, concurrency },
  );

  // On job completed
  worker.on('completed', async (job: BullJob) => {
    const jobId = job.opts.jobId as string;
    await updateJobState(jobId, JobState.COMPLETED, {
      completedAt: new Date().toISOString(),
    });
  });

  // On job failed
  worker.on('failed', async (job: BullJob | undefined, err: Error) => {
    if (!job) return;
    const jobId = job.opts.jobId as string;
    const attemptsMade = job.attemptsMade;
    const maxAttempts = job.opts.attempts ?? 1;

    const jobError: JobError = {
      attempt: attemptsMade,
      message: err.message,
      timestamp: new Date().toISOString(),
    };

    await appendJobError(jobId, jobError);
    await incrementRetryCount(jobId);

    if (attemptsMade >= maxAttempts) {
      // Retries exhausted — move to DLQ
      await updateJobState(jobId, JobState.FAILED, { isDlq: true });
    } else {
      // Retries remaining — BullMQ handles re-enqueue with backoff
      await updateJobState(jobId, JobState.DELAYED);
    }
  });

  return worker;
}
