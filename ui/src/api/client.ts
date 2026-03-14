import type { Job } from '@job-queue/shared';

const BASE = import.meta.env.VITE_API_URL ?? '';

export interface ListJobsResponse {
  jobs: Job[];
  total: number;
  page: number;
  limit: number;
}

export interface QueueStat {
  queue: string;
  pending: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export function fetchQueueStats(): Promise<QueueStat[]> {
  return request('/api/queues/stats');
}

export function fetchJobs(params?: Record<string, string>): Promise<ListJobsResponse> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return request(`/api/jobs${qs}`);
}

export function fetchJob(id: string): Promise<Job> {
  return request(`/api/jobs/${id}`);
}

export function fetchDLQJobs(page = 1, limit = 20): Promise<ListJobsResponse> {
  return request(`/api/dlq?page=${page}&limit=${limit}`);
}

export function retryJob(id: string): Promise<Job> {
  return request(`/api/jobs/${id}/retry`, { method: 'POST' });
}

export interface CreateJobRequest {
  type: string;
  queue: string;
  priority?: 'critical' | 'high' | 'normal' | 'low';
  payload?: Record<string, unknown>;
  delay?: number;
}

export function createJob(data: CreateJobRequest): Promise<{ id: string; state: string; createdAt: string }> {
  return request('/api/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}
