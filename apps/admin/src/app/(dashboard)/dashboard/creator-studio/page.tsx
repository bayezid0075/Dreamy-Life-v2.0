'use client';

import { useEffect, useState } from 'react';
import { getSocialStats, type SocialStats } from '@/features/social/api';

function StatCard({ title, value, icon, color }: { title: string; value: string; icon: string; color: string }) {
  const colorMap: Record<string, { text: string; bg: string; blur: string }> = {
    tertiary: { text: 'text-tertiary', bg: 'bg-tertiary/10', blur: 'bg-tertiary/20' },
    primary: { text: 'text-primary-container', bg: 'bg-primary-container/10', blur: 'bg-primary-container/20' },
    secondary: { text: 'text-error', bg: 'bg-error/10', blur: 'bg-secondary-container/20' },
  };
  const c = colorMap[color] || colorMap.tertiary;

  return (
    <div className="glass-panel rounded-xl p-md flex flex-col justify-between relative overflow-hidden group">
      <div className={`absolute -right-4 -top-4 w-24 h-24 ${c.blur} rounded-full blur-xl group-hover:blur-2xl transition-all`} />
      <div className="flex items-center justify-between">
        <div>
          <p className="font-label-caps text-label-caps text-on-surface-variant uppercase font-bold">{title}</p>
          <h2 className={`font-display-lg text-display-lg mt-xs font-bold ${color === 'primary' ? 'neon-text text-primary-container' : 'text-on-surface'}`}>
            {value}
          </h2>
        </div>
        <span className={`material-symbols-outlined text-3xl ${c.text}`}>{icon}</span>
      </div>
    </div>
  );
}

export default function CreatorStudioPage() {
  const [stats, setStats] = useState<SocialStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getSocialStats();
        setStats(data);
      } catch (err: any) {
        setError(err?.message || 'Failed to load creator studio');
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

  const s = stats || { totalPosts: 0, totalComments: 0, totalLikes: 0, totalFollows: 0, totalUsers: 0, activeUsers: 0 };

  return (
    <div className="max-w-container-max mx-auto space-y-lg">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">Creator Studio</h1>
        <p className="text-on-surface-variant font-body-sm text-body-sm mt-xs">
          Social media analytics and content management
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md">
        <StatCard title="Total Posts" value={s.totalPosts.toLocaleString()} icon="article" color="tertiary" />
        <StatCard title="Total Likes" value={s.totalLikes.toLocaleString()} icon="favorite" color="secondary" />
        <StatCard title="Total Comments" value={s.totalComments.toLocaleString()} icon="comment" color="primary" />
        <StatCard title="Total Follows" value={s.totalFollows.toLocaleString()} icon="group_add" color="tertiary" />
        <StatCard title="Active Users" value={s.activeUsers.toLocaleString()} icon="person" color="primary" />
        <StatCard title="Total Users" value={s.totalUsers.toLocaleString()} icon="groups" color="secondary" />
      </div>

      <div className="glass-panel rounded-xl p-md">
        <h3 className="font-title-md text-title-md text-on-surface font-bold mb-md">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
          <a href="/dashboard/notifications" className="glass-panel rounded-xl p-md hover:bg-primary-container/10 transition-colors text-center">
            <span className="material-symbols-outlined text-3xl text-primary mb-2">notifications</span>
            <p className="font-body-sm text-body-sm text-on-surface font-bold">Send Notification</p>
          </a>
          <a href="/dashboard/users" className="glass-panel rounded-xl p-md hover:bg-primary-container/10 transition-colors text-center">
            <span className="material-symbols-outlined text-3xl text-primary mb-2">group</span>
            <p className="font-body-sm text-body-sm text-on-surface font-bold">Manage Users</p>
          </a>
          <a href="/dashboard/analytics" className="glass-panel rounded-xl p-md hover:bg-primary-container/10 transition-colors text-center">
            <span className="material-symbols-outlined text-3xl text-primary mb-2">monitoring</span>
            <p className="font-body-sm text-body-sm text-on-surface font-bold">View Analytics</p>
          </a>
        </div>
      </div>
    </div>
  );
}
