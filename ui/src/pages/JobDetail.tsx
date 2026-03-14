import { useParams, Link } from 'react-router-dom';
import { useCallback, useState } from 'react';
import { PriorityLevel } from '@job-queue/shared';
import type { Job, JobError } from '@job-queue/shared';
import { usePolling } from '../hooks/usePolling';
import { fetchJob, retryJob } from '../api/client';

const PRIORITY_LABELS: Record<number, string> = {
  [PriorityLevel.CRITICAL]: 'critical',
  [PriorityLevel.HIGH]: 'high',
  [PriorityLevel.NORMAL]: 'normal',
  [PriorityLevel.LOW]: 'low',
};

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  const fetcher = useCallback(() => fetchJob(id!), [id]);
  const { data: job, error, loading, refresh } = usePolling<Job>(fetcher);

  const handleRetry = async () => {
    if (!id) return;
    setRetrying(true);
    setRetryError(null);
    try {
      await retryJob(id);
      await refresh();
    } catch (err) {
      setRetryError(err instanceof Error ? err.message : 'Retry failed');
    } finally {
      setRetrying(false);
    }
  };

  if (loading) return <p className="text-gray-500">Loading job…</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!job) return <p className="text-gray-500">Job not found.</p>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link to="/jobs" className="text-blue-600 hover:underline text-sm">← Jobs</Link>
        <h1 className="text-xl font-semibold">Job Detail</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-5 space-y-4">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <dt className="text-gray-500">ID</dt>
          <dd className="font-mono">{job.id}</dd>
          <dt className="text-gray-500">Type</dt>
          <dd>{job.type}</dd>
          <dt className="text-gray-500">Queue</dt>
          <dd>{job.queue}</dd>
          <dt className="text-gray-500">Priority</dt>
          <dd>{PRIORITY_LABELS[job.priority] ?? job.priority}</dd>
          <dt className="text-gray-500">State</dt>
          <dd>{job.state}</dd>
          <dt className="text-gray-500">Created</dt>
          <dd>{new Date(job.createdAt).toLocaleString()}</dd>
          <dt className="text-gray-500">Started</dt>
          <dd>{job.startedAt ? new Date(job.startedAt).toLocaleString() : '—'}</dd>
          <dt className="text-gray-500">Completed</dt>
          <dd>{job.completedAt ? new Date(job.completedAt).toLocaleString() : '—'}</dd>
          <dt className="text-gray-500">Retry Count</dt>
          <dd>{job.retryCount} / {job.maxRetries}</dd>
        </dl>

        <div>
          <h2 className="text-sm font-medium text-gray-600 mb-1">Payload</h2>
          <pre className="bg-gray-50 rounded p-3 text-xs overflow-auto max-h-48">{JSON.stringify(job.payload, null, 2)}</pre>
        </div>

        {job.state === 'failed' && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {retrying ? 'Retrying…' : 'Retry'}
            </button>
            {retryError && <span className="text-red-600 text-sm">{retryError}</span>}
          </div>
        )}
      </div>

      {job.errors.length > 0 && (
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="text-sm font-medium text-gray-600 mb-3">Retry History</h2>
          <ul className="space-y-2">
            {job.errors.map((err: JobError, i: number) => (
              <li key={i} className="bg-red-50 rounded p-3 text-sm">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Attempt {err.attempt}</span>
                  <span>{new Date(err.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-red-700">{err.message}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
