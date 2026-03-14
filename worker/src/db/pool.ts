import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5432', 10),
  user: process.env.PG_USER || 'jobqueue',
  password: process.env.PG_PASSWORD || 'jobqueue_secret',
  database: process.env.PG_DATABASE || 'jobqueue',
});

export default pool;
