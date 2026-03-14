import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { JobState, PriorityLevel } from '@job-queue/shared';
import type { Job } from '@job-queue/shared';
import { usePolling } from '../hooks/usePolling';
import { fetchJobs, ListJobsResponse } from '../api/client';

const STATES = Object.values(JobState);
const PRIORITY_LABELS: Record<number, string> = {
  [PriorityLevel.CRITICAL]: 'critical',
  [PriorityLevel.HIGH]: 'high',
  [PriorityLevel.NORMAL]: 'normal',
  [PriorityLevel.LOW]: 'low',
};

const STATE_BADGE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  active: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  delayed: 'bg-purple-100 text-purple-800',
};

export default function JobList() {
  const [state, setState] = useState('');
  const [queue, setQueue] = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(1);

  const fetcher = useCallback(() => {
    const params: Record<string, string> = { page: String(page), limit: '20' };
    if (state) params.state = state;
    if (queue) params.queue = queue;
    if (priority) params.priority = priority;
    return fetchJobs(params);
  }, [state, queue, priority, page]);

  const { data, error, loading } = usePolling<ListJobsResponse>(fetcher);

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Jobs</h1>

      <div className="flex flex-wrap gap-3 items-end">
        <label className="flex flex-col text-sm">
          <span className="text-gray-600 mb-1">State</span>
          <select value={state} onChange={(e) => { setState(e.target.value); setPage(1); }} className="border rounded px-2 py-1">
            <option value="">All</option>
            {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="flex flex-col text-sm">
          <span className="text-gray-600 mb-1">Queue</span>
          <input value={queue} onChange={(e) => { setQueue(e.target.value); setPage(1); }} placeholder="e.g. email" className="border rounded px-2 py-1" />
        </label>
        <label className="flex flex-col text-sm">
          <span className="text-gray-600 mb-1">Priority</span>
          <select value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }} className="border rounded px-2 py-1">
            <option value="">All</option>
            <option value="critical">critical</option>
            <option value="high">high</option>
            <option value="normal">normal</option>
            <option value="low">low</option>
          </select>
        </label>
      </div>

      {error && <p className="text-red-600">Unable to reach API. Retrying…</p>}
      {loading && <p className="text-gray-500">Loading…</p>}

      {data && (
        <>
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full text-sm" role="table">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2">ID</th>
                  <th className="text-left px-4 py-2">Type</th>
                  <th className="text-left px-4 py-2">Queue</th>
                  <th className="text-left px-4 py-2">Priority</th>
                  <th className="text-left px-4 py-2">State</th>
                  <th className="text-left px-4 py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {data.jobs.map((job: Job) => (
                  <tr key={job.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <Link to={`/jobs/${job.id}`} className="text-blue-600 hover:underline font-mono text-xs">
                        {job.id.slice(0, 8)}…
                      </Link>
                    </td>
                    <td className="px-4 py-2">{job.type}</td>
                    <td className="px-4 py-2">{job.queue}</td>
                    <td className="px-4 py-2">{PRIORITY_LABELS[job.priority] ?? job.priority}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATE_BADGE[job.state] ?? ''}`}>
                        {job.state}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-500">{new Date(job.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
                {data.jobs.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No jobs found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 border rounded disabled:opacity-40">
              Previous
            </button>
            <span>Page {data.page} of {totalPages || 1}</span>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 border rounded disabled:opacity-40">
              Next
            </button>
            <span className="text-gray-500">{data.total} total</span>
          </div>
        </>
      )}
    </div>
  );
}
