import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import DesktopHeader from '@/shared/components/DesktopHeader';
import SideDrawer from '@/shared/components/SideDrawer';
import AuthGuard from '@/shared/components/AuthGuard';
import { VendorProfile } from '@/features/vendor/api';

interface AdminNotification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  imageUrl?: string;
  link?: string;
  type: string;
  category: string;
  status: string;
  sentAt?: string;
  createdAt: string;
  totalRecipients: number;
  totalRead: number;
}

export default function AdminNotificationsPage() {
  const router = useRouter();
  const { accessToken, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [filter, setFilter] = useState<string>('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const fetchNotifications = useCallback(
    async (pageNum: number, append = false) => {
      try {
        const params = new URLSearchParams({ page: String(pageNum), limit: '20' });
        if (filter) params.set('status', filter);
        const res = await fetch(`${API_URL}/admin/notifications?${params}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();
        if (res.ok) {
          if (append) {
            setNotifications((prev) => [...prev, ...data.items]);
          } else {
            setNotifications(data.items || []);
          }
          setHasMore(data.items?.length === 20);
        }
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      }
    },
    [API_URL, accessToken, filter],
  );

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/admin/notifications/stats`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      setStats(data);
    } catch {}
  }, [API_URL, accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    Promise.all([fetchNotifications(1), fetchStats()]).finally(() => setLoading(false));
    fetch(`${API_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.json())
      .then((data) => { if (data.data?.user) setUser(data.data.user); })
      .catch(() => {});
    fetch(`${API_URL}/vendor/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.json())
      .then((data) => setVendorProfile(data.data || null))
      .catch(() => setVendorProfile(null));
  }, [accessToken]);

  useEffect(() => {
    setPage(1);
    fetchNotifications(1);
  }, [filter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this notification?')) return;
    try {
      await fetch(`${API_URL}/admin/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      fetchStats();
    } catch {}
  };

  const handleResend = async (id: string) => {
    try {
      await fetch(`${API_URL}/admin/notifications/${id}/send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      fetchNotifications(1);
      fetchStats();
    } catch {}
  };

  const handleLogout = async () => {
    await logout();
  };

  const copyReferCode = () => {
    if (user?.ownRefercode) navigator.clipboard.writeText(user.ownRefercode);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const statusColors: Record<string, { bg: string; text: string }> = {
    draft: { bg: '#f3f4f6', text: '#6b7280' },
    scheduled: { bg: '#fef3c7', text: '#92400e' },
    sent: { bg: '#d1fae5', text: '#065f46' },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8f8ff' }}>
        <div className="animate-spin h-10 w-10 border-2 border-[#5d5e64] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <AuthGuard>
      <Head>
        <title>Manage Notifications - Dreamy Life Admin</title>
      </Head>
      <style>{`
        .aurora-bg { background-color: #F8F8FF; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -1; overflow: hidden; }
        .aurora-orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.4; animation: float 20s infinite ease-in-out alternate; }
        .orb-1 { width: 600px; height: 600px; background: rgba(226,226,233,0.6); top: -100px; left: -200px; }
        .orb-2 { width: 500px; height: 500px; background: rgba(179,236,243,0.4); bottom: -50px; right: -100px; animation-delay: -5s; }
        .orb-3 { width: 400px; height: 400px; background: rgba(255,217,226,0.5); top: 40%; left: 50%; transform: translate(-50%,-50%); animation-delay: -10s; }
        @keyframes float { 0% { transform: translate(0,0) scale(1); } 50% { transform: translate(50px,30px) scale(1.1); } 100% { transform: translate(-30px,50px) scale(0.9); } }
        .glass-panel { background: rgba(255,255,255,0.5); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.3); box-shadow: 0 20px 40px rgba(0,0,0,0.04); }
      `}</style>

      <div className="aurora-bg">
        <div className="aurora-orb orb-1" />
        <div className="aurora-orb orb-2" />
        <div className="aurora-orb orb-3" />
      </div>

      <DesktopHeader title="Notifications" onMenuClick={() => setDrawerOpen(true)} avatarUrl={user?.info?.avatarUrl || ''} />
      <SideDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} user={user} vendorProfile={vendorProfile} handleLogout={handleLogout} copyReferCode={copyReferCode} />

      <main className="pt-20 md:pt-28 pb-10 md:pb-20 px-6 max-w-[1280px] mx-auto min-h-screen">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-[#1c1b1b]">Notifications</h1>
            <p className="text-sm text-[#76777b] mt-1">Manage and send notifications to users</p>
          </div>
          <button
            onClick={() => router.push('/admin/notifications/create')}
            className="px-6 py-3 rounded-xl bg-[#2d666d] text-white font-bold text-sm hover:bg-[#24585d] transition-colors shadow-lg shadow-[#2d666d]/20 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Create Notification
          </button>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Sent', value: stats.sentNotifications || 0, icon: 'send', color: '#2d666d' },
              { label: 'Drafts', value: stats.draftNotifications || 0, icon: 'edit_note', color: '#6b7280' },
              { label: 'Recipients', value: stats.totalRecipients || 0, icon: 'group', color: '#1565c0' },
              { label: 'Read Rate', value: `${stats.readRate || 0}%`, icon: 'visibility', color: '#065f46' },
            ].map((s) => (
              <div key={s.label} className="glass-panel rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${s.color}15`, color: s.color }}>
                  <span className="material-symbols-outlined">{s.icon}</span>
                </div>
                <div>
                  <p className="text-xl font-extrabold text-[#1c1b1b]">{s.value}</p>
                  <p className="text-xs text-[#76777b]">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 mb-6">
          {[
            { value: '', label: 'All' },
            { value: 'sent', label: 'Sent' },
            { value: 'draft', label: 'Drafts' },
            { value: 'scheduled', label: 'Scheduled' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                filter === f.value
                  ? 'bg-[#1A1A1A] text-white shadow-lg'
                  : 'bg-white/50 backdrop-blur-[24px] text-[#45474b] hover:bg-white/60 border border-white/30'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {notifications.length === 0 && (
            <div className="glass-panel rounded-xl p-12 text-center">
              <span className="material-symbols-outlined text-5xl text-[#5d5e64] mb-4">notifications_none</span>
              <p className="text-[#45474b]">No notifications yet</p>
            </div>
          )}

          {notifications.map((n) => {
            const sc = statusColors[n.status] || statusColors.draft;
            return (
              <div key={n.id} className="glass-panel rounded-xl p-4 flex items-center gap-4 hover:bg-white/20 transition-all">
                <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-[#e8eaf6] text-[#3949ab]">
                  {n.imageUrl ? (
                    <img src={n.imageUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined">{n.icon || 'notifications'}</span>
                  )}
                </div>

                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-[#1c1b1b] truncate">{n.title}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor: sc.bg, color: sc.text }}>
                      {n.status}
                    </span>
                    {n.link && <span className="material-symbols-outlined text-xs text-[#2d666d]">link</span>}
                  </div>
                  <p className="line-clamp-1 text-sm text-[#45474b]">{n.body}</p>
                  <p className="text-xs text-[#76777b] mt-1">
                    {n.sentAt ? formatDate(n.sentAt) : formatDate(n.createdAt)}
                    {n.totalRecipients > 0 && ` · ${n.totalRecipients} recipients`}
                    {n.totalRead > 0 && ` · ${n.totalRead} read`}
                  </p>
                </div>

                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => router.push(`/admin/notifications/${n.id}`)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/30 text-[#45474b]"
                    title="View"
                  >
                    <span className="material-symbols-outlined text-lg">visibility</span>
                  </button>
                  {n.status === 'draft' && (
                    <button
                      onClick={() => handleResend(n.id)}
                      className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/30 text-[#2d666d]"
                      title="Send"
                    >
                      <span className="material-symbols-outlined text-lg">send</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-red-50 text-red-500"
                    title="Delete"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>
            );
          })}

          {hasMore && notifications.length > 0 && (
            <button
              onClick={() => { setPage((p) => p + 1); fetchNotifications(page + 1, true); }}
              className="glass-panel rounded-xl py-3 w-full text-center text-sm font-semibold text-[#2d666d] hover:bg-white/30 transition-colors"
            >
              Load more
            </button>
          )}
        </div>
      </main>
    </AuthGuard>
  );
}
