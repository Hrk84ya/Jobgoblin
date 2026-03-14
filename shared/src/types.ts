export enum JobState {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DELAYED = 'delayed',
}

export enum PriorityLevel {
  CRITICAL = 1,
  HIGH = 2,
  NORMAL = 3,
  LOW = 4,
}

export interface JobError {
  attempt: number;
  message: string;
  timestamp: string; // ISO 8601
}

export interface Job {
  id: string; // UUID v4
  type: string; // e.g. "send-email"
  queue: string; // Named_Queue name
  priority: PriorityLevel;
  state: JobState;
  payload: Record<string, unknown>;
  createdAt: string; // ISO 8601
  startedAt: string | null;
  completedAt: string | null;
  retryCount: number;
  maxRetries: number;
  errors: JobError[];
}
