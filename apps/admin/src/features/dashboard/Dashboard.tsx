'use client';

import { useEffect, useState } from 'react';
import { getDashboardStats, type DashboardStats } from './api';

function MetricCard({
  title,
  value,
  trend,
  trendValue,
  color,
  chartPath,
}: {
  title: string;
  value: string;
  trend: 'up' | 'down';
  trendValue: string;
  color: string;
  chartPath: string;
}) {
  const colorMap: Record<string, { text: string; bg: string; blur: string }> = {
    tertiary: { text: 'text-tertiary', bg: 'bg-tertiary/10', blur: 'bg-tertiary/20' },
    primary: { text: 'text-primary-container', bg: 'bg-primary-container/10', blur: 'bg-primary-container/20' },
    secondary: { text: 'text-error', bg: 'bg-error/10', blur: 'bg-secondary-container/20' },
  };
  const c = colorMap[color] || colorMap.tertiary;

  return (
    <div className="glass-panel rounded-xl p-md flex flex-col justify-between relative overflow-hidden group">
      <div className={`absolute -right-4 -top-4 w-24 h-24 ${c.blur} rounded-full blur-xl group-hover:blur-2xl transition-all`} />
      <div>
        <p className="font-label-caps text-label-caps text-on-surface-variant uppercase font-bold">{title}</p>
        <h2 className={`font-display-lg text-display-lg mt-xs font-bold ${color === 'primary' ? 'neon-text text-primary-container' : 'text-on-surface'}`}>
          {value}
        </h2>
      </div>
      <div className="flex items-end justify-between mt-md">
        <div className={`flex items-center ${c.text} font-code-sm text-code-sm ${c.bg} px-2 py-1 rounded`}>
          <span className="material-symbols-outlined text-[16px] mr-1">
            {trend === 'up' ? 'trending_up' : 'trending_down'}
          </span>
          {trendValue}
        </div>
        <svg className="w-16 h-8" preserveAspectRatio="none" viewBox="0 0 100 30">
          <path className={c.text} d={chartPath} fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
        </svg>
      </div>
    </div>
  );
}

function RecentActivityTable({ users }: { users: DashboardStats['recentUsers'] }) {
  const statusColors: Record<string, string> = {
    super_admin: 'bg-tertiary-container/20 text-on-tertiary-container',
    vvip: 'bg-secondary-container/20 text-on-secondary-container',
    smart: 'bg-primary-container/20 text-primary',
    standard: 'bg-surface-variant text-on-surface-variant',
    basic: 'bg-outline-variant text-on-surface-variant',
    user: 'bg-error/10 text-error',
  };

  return (
    <div className="glass-panel rounded-xl p-md lg:col-span-2 flex flex-col">
      <div className="flex justify-between items-center mb-md">
        <h3 className="font-title-md text-title-md text-on-surface font-bold">Recent Activity</h3>
        <button className="text-primary font-label-caps text-label-caps hover:underline font-bold">View All</button>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left font-body-sm text-body-sm">
          <thead>
            <tr className="text-on-surface-variant border-b border-outline-variant/50">
              <th className="py-2 font-bold">User</th>
              <th className="py-2 font-bold">Status</th>
              <th className="py-2 font-bold text-right">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-outline-variant/30 hover:bg-primary-container/10 transition-colors">
                <td className="py-3 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-surface-variant" />
                  <span className="text-on-surface font-bold">{user.username}</span>
                </td>
                <td className="py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusColors[user.memberStatus] || 'bg-surface-variant text-on-surface-variant'}`}>
                    {user.memberStatus}
                  </span>
                </td>
                <td className="py-3 text-right text-on-surface-variant font-bold">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={3} className="py-8 text-center text-on-surface-variant">No recent activity</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RevenueDoughnut({ revenue }: { revenue: number }) {
  return (
    <div className="glass-panel rounded-xl p-md flex flex-col items-center justify-center relative">
      <div className="absolute inset-0 bg-secondary-container/10 blur-2xl rounded-xl" />
      <h3 className="font-title-md text-title-md text-on-surface font-bold self-start w-full mb-md relative z-10">Revenue Distribution</h3>
      <div className="relative w-48 h-48 mb-md z-10">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" fill="transparent" r="40" stroke="rgba(0,0,0,0.05)" strokeWidth="15" />
          <circle cx="50" cy="50" fill="transparent" r="40" stroke="#fc79bd" strokeDasharray="251.2" strokeDashoffset="60" strokeWidth="15" />
          <circle cx="50" cy="50" fill="transparent" r="40" stroke="#2dd4bf" strokeDasharray="251.2" strokeDashoffset="200" strokeWidth="15" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display-lg text-title-md text-on-surface font-bold">76%</span>
          <span className="font-label-caps text-[10px] text-on-surface-variant font-bold">Pro Tier</span>
        </div>
      </div>
      <div className="w-full flex justify-around text-body-sm z-10">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-secondary-container" />
          <span className="text-on-surface-variant font-bold">Pro</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary-container" />
          <span className="text-on-surface-variant font-bold">Enterprise</span>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel rounded-xl p-lg text-center">
        <span className="material-symbols-outlined text-error text-4xl mb-4">error</span>
        <p className="text-on-surface-variant">{error}</p>
      </div>
    );
  }

  const d = stats || { totalUsers: 0, activeUsers: 0, proUsers: 0, totalRevenue: 0, recentUsers: [], recentPurchases: [] };

  return (
    <div className="max-w-container-max mx-auto space-y-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-md">
        <MetricCard
          title="Total Users"
          value={d.totalUsers.toLocaleString()}
          trend="up"
          trendValue="+12.5%"
          color="tertiary"
          chartPath="M0 30 L20 20 L40 25 L60 10 L80 15 L100 0"
        />
        <MetricCard
          title="Active Now"
          value={d.activeUsers.toLocaleString()}
          trend="up"
          trendValue="+5.2%"
          color="primary"
          chartPath="M0 25 L20 15 L40 20 L60 5 L80 10 L100 2"
        />
        <MetricCard
          title="Pro Users"
          value={d.proUsers.toLocaleString()}
          trend="down"
          trendValue="-2.4%"
          color="secondary"
          chartPath="M0 5 L20 10 L40 5 L60 20 L80 15 L100 25"
        />
        <MetricCard
          title="Monthly Revenue"
          value={`$${(d.totalRevenue / 1000).toFixed(1)}k`}
          trend="up"
          trendValue="+8.1%"
          color="tertiary"
          chartPath="M0 20 L20 25 L40 10 L60 15 L80 5 L100 0"
        />
      </div>

      <div className="glass-panel rounded-xl p-md h-96 flex flex-col relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-primary-container/10 blur-3xl rounded-full" />
        <div className="flex justify-between items-center mb-md z-10">
          <div>
            <h3 className="font-title-md text-title-md text-on-surface font-bold">User Growth</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Active users over the last 30 days</p>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1 font-label-caps text-label-caps rounded bg-primary-container text-on-primary-container font-bold">30D</button>
            <button className="px-3 py-1 font-label-caps text-label-caps rounded border border-outline-variant text-on-surface hover:border-primary-container transition-colors font-bold">90D</button>
            <button className="px-3 py-1 font-label-caps text-label-caps rounded border border-outline-variant text-on-surface hover:border-primary-container transition-colors font-bold">1Y</button>
          </div>
        </div>
        <div className="flex-1 w-full relative z-10">
          <div className="absolute inset-0 flex items-end">
            <div className="w-full h-full bg-gradient-to-t from-primary-container/30 to-transparent border-t-2 border-primary-container rounded-t glow-ring-effect" style={{ clipPath: 'polygon(0 80%, 10% 75%, 20% 85%, 30% 60%, 40% 65%, 50% 40%, 60% 45%, 70% 20%, 80% 30%, 90% 10%, 100% 5%, 100% 100%, 0 100%)' }} />
          </div>
          <div className="absolute inset-0 flex flex-col justify-between border-l border-b border-outline-variant/30 pb-6 pl-8">
            <div className="w-full border-t border-outline-variant/30 h-0 relative"><span className="absolute -left-8 -top-3 text-xs text-on-surface-variant font-bold">150k</span></div>
            <div className="w-full border-t border-outline-variant/30 h-0 relative"><span className="absolute -left-8 -top-3 text-xs text-on-surface-variant font-bold">100k</span></div>
            <div className="w-full border-t border-outline-variant/30 h-0 relative"><span className="absolute -left-8 -top-3 text-xs text-on-surface-variant font-bold">50k</span></div>
            <div className="w-full border-t border-outline-variant/30 h-0 relative"><span className="absolute -left-8 -top-3 text-xs text-on-surface-variant font-bold">0</span></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
        <RecentActivityTable users={d.recentUsers} />
        <RevenueDoughnut revenue={d.totalRevenue} />
      </div>
    </div>
  );
}
