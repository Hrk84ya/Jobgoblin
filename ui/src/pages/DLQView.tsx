import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PriorityLevel } from '@job-queue/shared';
import type { Job, JobError } from '@job-queue/shared';
import { usePolling } from '../hooks/usePolling';
import { fetchDLQJobs, retryJob, ListJobsResponse } from '../api/client';

const PRIORITY_LABELS: Record<number, string> = {
  [PriorityLevel.CRITICAL]: 'critical',
  [PriorityLevel.HIGH]: 'high',
  [PriorityLevel.NORMAL]: 'normal',
  [PriorityLevel.LOW]: 'low',
};

export default function DLQView() {
  const [page, setPage] = useState(1);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [retryError, setRetryError] = useState<string | null>(null);

  const fetcher = useCallback(() => fetchDLQJobs(page), [page]);
  const { data, error, loading, refresh } = usePolling<ListJobsResponse>(fetcher);

  const handleRetry = async (id: string) => {
    setRetryingId(id);
    setRetryError(null);
    try {
      await retryJob(id);
      await refresh();
    } catch (err) {
      setRetryError(err instanceof Error ? err.message : 'Retry failed');
    } finally {
      setRetryingId(null);
    }
  };

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  if (loading) return <p className="text-gray-500">Loading DLQ…</p>;
  if (error) return <p className="text-red-600">Unable to reach API. Retrying…</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Dead Letter Queue</h1>
      {retryError && <p className="text-red-600 text-sm">{retryError}</p>}

      {data && data.jobs.length === 0 && <p className="text-gray-500">No dead-letter jobs.</p>}

      {data && data.jobs.map((job: Job) => (
        <div key={job.id} className="bg-white rounded-lg shadow p-5 space-y-3">
          <div className="flex items-start justify-between">
            <div className="text-sm space-y-1">
              <p>
                <Link to={`/jobs/${job.id}`} className="text-blue-600 hover:underline font-mono text-xs">{job.id.slice(0, 8)}…</Link>
                <span className="ml-2 font-medium">{job.type}</span>
              </p>
              <p className="text-gray-500">
                Queue: {job.queue} · Priority: {PRIORITY_LABELS[job.priority] ?? job.priority} · Retries: {job.retryCount}/{job.maxRetries}
              </p>
              <p className="text-xs text-gray-400">Created: {new Date(job.createdAt).toLocaleString()}</p>
            </div>
            {job.state === 'failed' && (
              <button
                onClick={() => handleRetry(job.id)}
                disabled={retryingId === job.id}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 shrink-0"
              >
                {retryingId === job.id ? 'Retrying…' : 'Retry'}
              </button>
            )}
          </div>

          {job.errors.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500">Error History</p>
              {job.errors.map((err: JobError, i: number) => (
                <div key={i} className="bg-red-50 rounded p-2 text-xs">
                  <span className="text-gray-500">Attempt {err.attempt} — {new Date(err.timestamp).toLocaleString()}</span>
                  <p className="text-red-700">{err.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {data && totalPages > 1 && (
        <div className="flex items-center gap-4 text-sm">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 border rounded disabled:opacity-40">
            Previous
          </button>
          <span>Page {data.page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 border rounded disabled:opacity-40">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
