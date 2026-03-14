import { Router, Request, Response } from 'express';
import { getQueueStats } from '../db/queries';

const router = Router();

// GET /api/queues/stats — queue statistics per named queue
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await getQueueStats();
    res.json(stats);
  } catch (err) {
    console.error('Error fetching queue stats:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
