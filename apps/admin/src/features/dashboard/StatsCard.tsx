interface StatsCardProps {
  title: string;
  value: string;
  trend?: 'up' | 'down';
}

export default function StatsCard({ title, value }: StatsCardProps) {
  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-5 border border-white/80 shadow-sm">
      <p className="text-sm text-on-surface-variant mb-1">{title}</p>
      <p className="text-3xl font-bold text-on-surface">{value}</p>
    </div>
  );
}
