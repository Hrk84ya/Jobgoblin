import { Worker as BullWorker } from 'bullmq';
import { runMigrations } from '@job-queue/shared/dist/migrate';
import pool from './db/pool';
import { registerAllHandlers } from './handlers';
import { createWorker } from './processor';

async function start() {
  // Run migrations so the worker can start independently
  await runMigrations(pool);

  // Register all sample handlers
  registerAllHandlers();

  // Parse configured queues from env
  const queueNames = (process.env.QUEUES || 'email,video-processing,notifications')
    .split(',')
    .map((q) => q.trim())
    .filter(Boolean);

  // Create a BullMQ worker for each queue
  const workers: BullWorker[] = queueNames.map((name) => {
    console.log(`Starting worker for queue: ${name}`);
    return createWorker(name);
  });

  // Graceful shutdown
  async function shutdown() {
    console.log('Shutting down workers...');
    await Promise.all(workers.map((w) => w.close()));
    process.exit(0);
  }

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  console.log(`Worker running. Processing queues: ${queueNames.join(', ')}`);
}

start().catch((err) => {
  console.error('Failed to start worker:', err);
  process.exit(1);
});
