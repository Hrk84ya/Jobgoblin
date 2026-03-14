import { Router, Request, Response } from 'express';
import { listDLQJobs } from '../db/queries';

const router = Router();

// GET /api/dlq — list dead-letter queue jobs
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const result = await listDLQJobs(page, limit);
    res.json(result);
  } catch (err) {
    console.error('Error listing DLQ jobs:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
