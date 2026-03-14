import { Routes, Route, NavLink } from 'react-router-dom';
import QueueOverview from './pages/QueueOverview';
import JobList from './pages/JobList';
import JobDetail from './pages/JobDetail';
import DLQView from './pages/DLQView';
import SubmitJob from './pages/SubmitJob';

const navItems = [
  { to: '/', label: 'Queues' },
  { to: '/jobs', label: 'Jobs' },
  { to: '/submit', label: 'Submit Job' },
  { to: '/dlq', label: 'Dead Letter Queue' },
];

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white border-b px-6 py-3 flex items-center gap-6">
        <span className="font-semibold text-lg mr-4">Job Queue</span>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `text-sm px-2 py-1 rounded ${isActive ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-600 hover:text-gray-900'}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <main className="flex-1 p-6">
        <Routes>
          <Route path="/" element={<QueueOverview />} />
          <Route path="/jobs" element={<JobList />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/submit" element={<SubmitJob />} />
          <Route path="/dlq" element={<DLQView />} />
        </Routes>
      </main>
    </div>
  );
}
