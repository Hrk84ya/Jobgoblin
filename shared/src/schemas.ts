import { z } from 'zod';

export const CreateJobSchema = z.object({
  type: z.string().min(1),
  queue: z.string().min(1),
  priority: z.enum(['critical', 'high', 'normal', 'low']).default('normal'),
  payload: z.record(z.unknown()).default({}),
  delay: z.number().int().positive().optional(),
  scheduledAt: z.string().datetime().optional(),
});

export type CreateJobInput = z.infer<typeof CreateJobSchema>;

export const JobFilterSchema = z.object({
  state: z.enum(['pending', 'active', 'completed', 'failed', 'delayed']).optional(),
  queue: z.string().optional(),
  priority: z.enum(['critical', 'high', 'normal', 'low']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type JobFilterInput = z.infer<typeof JobFilterSchema>;
