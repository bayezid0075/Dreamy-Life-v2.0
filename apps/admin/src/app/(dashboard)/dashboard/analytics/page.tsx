'use client';

import { useEffect, useState } from 'react';
import api from '@dreamy-life/api-client';

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  proUsers: number;
  totalRevenue: number;
  statusBreakdown: Record<string, number>;
  recentUsers: Array<{
    id: string;
    username: string;
    memberStatus: string;
    createdAt: string;
  }>;
}

function MetricTile({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="glass-panel rounded-xl p-md flex items-center gap-md">
      <div className="w-12 h-12 rounded-xl bg-primary-container/10 flex items-center justify-center">
        <span className="material-symbols-outlined text-primary">{icon}</span>
      </div>
      <div>
        <p className="font-label-caps text-label-caps text-on-surface-variant uppercase font-bold">{label}</p>
        <p className="font-headline-md text-headline-md text-on-surface font-bold">{value}</p>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/admin/stats');
        setData(res.data.data);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    fetch();
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

  const d = data || { totalUsers: 0, activeUsers: 0, proUsers: 0, totalRevenue: 0, statusBreakdown: {}, recentUsers: [] };

  const statusEntries = Object.entries(d.statusBreakdown);

  return (
    <div className="max-w-container-max mx-auto space-y-lg">
      <div>
        <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">Analytics</h2>
        <p className="font-body-md text-on-surface-variant mt-xs">Platform-wide insights and metrics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-md">
        <MetricTile label="Total Users" value={d.totalUsers.toLocaleString()} icon="group" />
        <MetricTile label="Active Users" value={d.activeUsers.toLocaleString()} icon="person" />
        <MetricTile label="Pro Users" value={d.proUsers.toLocaleString()} icon="star" />
        <MetricTile label="Revenue" value={`$${(d.totalRevenue / 1000).toFixed(1)}k`} icon="payments" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
        <div className="glass-panel rounded-xl p-md">
          <h3 className="font-title-md text-title-md text-on-surface font-bold mb-md">User Status Breakdown</h3>
          {statusEntries.length > 0 ? (
            <div className="space-y-sm">
              {statusEntries.map(([status, count]) => {
                const total = d.totalUsers || 1;
                const pct = Math.round((Number(count) / total) * 100);
                return (
                  <div key={status} className="flex items-center gap-sm">
                    <span className="text-on-surface font-body-sm text-body-sm font-bold w-32 capitalize">{status.replace('_', ' ')}</span>
                    <div className="flex-1 h-3 bg-surface-variant rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-on-surface-variant font-body-sm text-body-sm font-bold w-12 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-on-surface-variant text-body-sm">No data available</p>
          )}
        </div>

        <div className="glass-panel rounded-xl p-md">
          <h3 className="font-title-md text-title-md text-on-surface font-bold mb-md">Recent Registrations</h3>
          {d.recentUsers.length > 0 ? (
            <div className="space-y-sm">
              {d.recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between py-2 border-b border-outline-variant/30 last:border-0">
                  <div className="flex items-center gap-sm">
                    <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-surface-variant text-sm">person</span>
                    </div>
                    <span className="text-on-surface font-body-sm text-body-sm font-bold">{user.username}</span>
                  </div>
                  <span className="text-on-surface-variant font-body-sm text-body-sm">{new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-on-surface-variant text-body-sm">No recent registrations</p>
          )}
        </div>
      </div>
    </div>
  );
}
