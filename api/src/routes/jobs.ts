import { Router, Request, Response } from 'express';
import { ZodError } from 'zod';
import { createJob, getJob, listJobs, retryJob } from '../services/jobService';
import { listDLQJobs } from '../db/queries';

const router = Router();

// POST /api/jobs — submit a new job
router.post('/', async (req: Request, res: Response) => {
  try {
    const job = await createJob(req.body);
    res.status(201).json({ id: job.id, state: job.state, createdAt: job.createdAt });
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
      return;
    }
    console.error('Error creating job:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/jobs/:id — get job by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const job = await getJob(req.params.id);
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }
    res.json(job);
  } catch (err) {
    console.error('Error fetching job:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/jobs — list jobs with filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await listJobs(req.query);
    res.json(result);
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
      return;
    }
    console.error('Error listing jobs:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/jobs/:id/retry — retry a failed job
router.post('/:id/retry', async (req: Request, res: Response) => {
  try {
    const { job, conflict } = await retryJob(req.params.id);
    if (conflict) {
      res.status(409).json({ error: 'Job is not in failed state' });
      return;
    }
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }
    res.json(job);
  } catch (err) {
    console.error('Error retrying job:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
