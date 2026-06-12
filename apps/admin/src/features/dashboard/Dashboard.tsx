import StatsCard from './StatsCard';

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-on-surface">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Users" value="--" />
        <StatsCard title="Active Users" value="--" />
        <StatsCard title="Total Posts" value="--" />
        <StatsCard title="Revenue" value="--" />
      </div>
    </div>
  );
}
