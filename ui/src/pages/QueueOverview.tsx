import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { usePolling } from '../hooks/usePolling';
import { fetchQueueStats, QueueStat } from '../api/client';

const STATE_COLORS: Record<string, string> = {
  pending: '#facc15',
  active: '#3b82f6',
  completed: '#22c55e',
  failed: '#ef4444',
  delayed: '#a855f7',
};

const STATES = ['pending', 'active', 'completed', 'failed', 'delayed'] as const;

export default function QueueOverview() {
  const { data: stats, error, loading } = usePolling(fetchQueueStats);

  if (loading) return <p className="text-gray-500">Loading queue stats…</p>;
  if (error) return <p className="text-red-600">Unable to reach API. Retrying…</p>;
  if (!stats || stats.length === 0) return <p className="text-gray-500">No queues found.</p>;

  const totals = STATES.map((state) => ({
    name: state,
    value: stats.reduce((sum: number, q: QueueStat) => sum + q[state], 0),
  })).filter((t) => t.value > 0);

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">Queue Overview</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-sm font-medium text-gray-600 mb-4">Jobs by Queue</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats}>
              <XAxis dataKey="queue" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              {STATES.map((state) => (
                <Bar key={state} dataKey={state} stackId="a" fill={STATE_COLORS[state]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-sm font-medium text-gray-600 mb-4">Total by State</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={totals} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {totals.map((entry) => (
                  <Cell key={entry.name} fill={STATE_COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm" role="table">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2">Queue</th>
              {STATES.map((s) => (
                <th key={s} className="text-right px-4 py-2 capitalize">{s}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stats.map((q: QueueStat) => (
              <tr key={q.queue} className="border-t">
                <td className="px-4 py-2 font-medium">{q.queue}</td>
                {STATES.map((s) => (
                  <td key={s} className="text-right px-4 py-2">{q[s]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
