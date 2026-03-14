import { Queue, ConnectionOptions } from 'bullmq';

const connection: ConnectionOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

const queues = new Map<string, Queue>();

export function getQueue(queueName: string): Queue {
  let queue = queues.get(queueName);
  if (!queue) {
    queue = new Queue(queueName, { connection });
    queues.set(queueName, queue);
  }
  return queue;
}

export interface EnqueueJobOptions {
  jobId: string;
  priority: number;
  delay?: number;
  maxRetries: number;
}

export async function enqueueJob(
  queueName: string,
  jobType: string,
  payload: Record<string, unknown>,
  options: EnqueueJobOptions,
): Promise<void> {
  const queue = getQueue(queueName);
  await queue.add(jobType, payload, {
    jobId: options.jobId,
    priority: options.priority,
    delay: options.delay,
    attempts: options.maxRetries + 1,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: false,
    removeOnFail: false,
  });
}
