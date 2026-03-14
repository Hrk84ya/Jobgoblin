import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import jobRoutes from './routes/jobs';
import queueRoutes from './routes/queues';
import dlqRoutes from './routes/dlq';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/jobs', jobRoutes);
app.use('/api/queues', queueRoutes);
app.use('/api/dlq', dlqRoutes);

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
