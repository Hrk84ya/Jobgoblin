import { runMigrations } from '@job-queue/shared/dist/migrate';
import pool from './db/pool';
import app from './app';

const port = parseInt(process.env.API_PORT || '4000', 10);

async function start() {
  await runMigrations(pool);
  app.listen(port, () => {
    console.log(`API server listening on port ${port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start API server:', err);
  process.exit(1);
});
