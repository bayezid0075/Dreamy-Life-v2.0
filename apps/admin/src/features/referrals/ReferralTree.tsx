'use client';

import { useEffect, useState } from 'react';
import { getReferralStats, type ReferralStatsResponse } from './api';

export default function ReferralTree() {
  const [stats, setStats] = useState<ReferralStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getReferralStats();
        setStats(data);
      } catch {
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

  return (
    <div className="max-w-container-max mx-auto space-y-lg">
      <div>
        <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">Referral System</h2>
        <p className="font-body-sm text-on-surface-variant mt-xs">Manage and monitor the referral network</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
        <div className="glass-panel rounded-xl p-md">
          <p className="font-label-caps text-label-caps text-on-surface-variant uppercase font-bold">Total Referrals</p>
          <h2 className="font-display-lg text-display-lg text-on-surface mt-xs font-bold">{stats?.totalReferrals ?? 0}</h2>
        </div>
        <div className="glass-panel rounded-xl p-md">
          <p className="font-label-caps text-label-caps text-on-surface-variant uppercase font-bold">Total Commissions</p>
          <h2 className="font-display-lg text-display-lg text-on-surface mt-xs font-bold">${(stats?.totalCommissions ?? 0).toLocaleString()}</h2>
        </div>
        <div className="glass-panel rounded-xl p-md">
          <p className="font-label-caps text-label-caps text-on-surface-variant uppercase font-bold">Active Levels</p>
          <h2 className="font-display-lg text-display-lg text-on-surface mt-xs font-bold">{stats?.levelBreakdown?.length ?? 0}</h2>
        </div>
      </div>

      {stats?.levelBreakdown && stats.levelBreakdown.length > 0 && (
        <div className="glass-panel rounded-xl p-md">
          <h3 className="font-title-md text-title-md text-on-surface font-bold mb-md">Referrals by Level</h3>
          <div className="space-y-3">
            {stats.levelBreakdown.map((item) => (
              <div key={item.level} className="flex items-center gap-md">
                <span className="font-label-caps text-label-caps text-on-surface-variant w-16">L{item.level}</span>
                <div className="flex-1 h-3 bg-surface-container-high rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-container rounded-full"
                    style={{ width: `${(item.count / (stats.totalReferrals || 1)) * 100}%` }}
                  />
                </div>
                <span className="font-code-sm text-on-surface-variant w-12 text-right">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
