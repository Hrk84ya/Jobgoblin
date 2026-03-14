import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';

/**
 * Runs the idempotent migration SQL against PostgreSQL.
 * Resolves the migration file relative to the repo root (../migrations from shared/).
 * Callers should pass their own Pool instance.
 */
export async function runMigrations(pool: Pool): Promise<void> {
  // In Docker the working dir is /app, so migrations/ is at the repo root
  const paths = [
    join(process.cwd(), 'migrations', '001_create_jobs.sql'),
    join(__dirname, '..', '..', 'migrations', '001_create_jobs.sql'),
  ];

  let sql: string | undefined;
  for (const p of paths) {
    try {
      sql = readFileSync(p, 'utf-8');
      break;
    } catch {
      // try next path
    }
  }

  if (!sql) {
    console.warn('Migration file not found, skipping migration.');
    return;
  }

  await pool.query(sql);
  console.log('Database migrations applied successfully.');
}
