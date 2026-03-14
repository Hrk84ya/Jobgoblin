import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createJob } from '../api/client';

const PRIORITIES = ['critical', 'high', 'normal', 'low'] as const;
const SAMPLE_TYPES = ['send-email', 'resize-image', 'generate-report'];
const SAMPLE_QUEUES = ['email', 'video-processing', 'notifications'];

export default function SubmitJob() {
  const navigate = useNavigate();
  const [type, setType] = useState(SAMPLE_TYPES[0]);
  const [queue, setQueue] = useState(SAMPLE_QUEUES[0]);
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>('normal');
  const [payloadStr, setPayloadStr] = useState('{}');
  const [delay, setDelay] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(payloadStr);
    } catch {
      setError('Payload must be valid JSON');
      return;
    }

    setSubmitting(true);
    try {
      const result = await createJob({
        type,
        queue,
        priority,
        payload,
        ...(delay ? { delay: parseInt(delay, 10) } : {}),
      });
      navigate(`/jobs/${result.id}`);
    } catch (err: any) {
      setError(err.message ?? 'Failed to submit job');
    } finally {
      setSubmitting(false);
    }
  }

  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';
  const inputClass = 'w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400';

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-semibold mb-4">Submit Job</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Job Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
            {SAMPLE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Queue</label>
          <select value={queue} onChange={(e) => setQueue(e.target.value)} className={inputClass}>
            {SAMPLE_QUEUES.map((q) => (
              <option key={q} value={q}>{q}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Priority</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value as any)} className={inputClass}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Payload (JSON)</label>
          <textarea
            value={payloadStr}
            onChange={(e) => setPayloadStr(e.target.value)}
            rows={4}
            className={inputClass + ' font-mono'}
          />
        </div>

        <div>
          <label className={labelClass}>Delay (ms, optional)</label>
          <input
            type="number"
            value={delay}
            onChange={(e) => setDelay(e.target.value)}
            placeholder="e.g. 5000"
            min={0}
            className={inputClass}
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : 'Submit Job'}
        </button>
      </form>
    </div>
  );
}
