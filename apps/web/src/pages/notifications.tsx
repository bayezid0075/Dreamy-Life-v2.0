import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { VendorProfile } from '@/features/vendor/api';
import DesktopHeader from '@/shared/components/DesktopHeader';
import SideDrawer from '@/shared/components/SideDrawer';
import AuthGuard from '@/shared/components/AuthGuard';

interface UserNotification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  imageUrl?: string;
  link?: string;
  type: string;
  category: string;
  sentAt?: string;
  createdAt: string;
  read: boolean;
  readAt?: string;
  recipientId: string;
}

const iconColors: Record<string, { bg: string; color: string }> = {
  local_shipping: { bg: '#e9fdff', color: '#437b81' },
  chat_bubble: { bg: '#ffd1dc', color: '#7a5761' },
  percent: { bg: '#ffdad6', color: '#93000a' },
  star: { bg: '#fffde7', color: '#f9a825' },
  account_circle: { bg: '#e5e2e1', color: '#45474b' },
  notifications: { bg: '#e8eaf6', color: '#3949ab' },
  card_giftcard: { bg: '#f3e5f5', color: '#7b1fa2' },
  campaign: { bg: '#e3f2fd', color: '#1565c0' },
  default: { bg: '#e5e2e1', color: '#5d5e64' },
};

function getTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHr < 24) return `${diffHr}h`;
  if (diffDay < 7) return `${diffDay}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function NotificationsPage() {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const { unreadCount: globalUnreadCount, setUnreadCount: setGlobalUnreadCount, resetCount } = useNotificationStore();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'social' | 'app'>('all');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const fetchNotifications = useCallback(
    async (pageNum: number, append = false, tab?: string) => {
      const category = tab || activeTab;
      try {
        const res = await fetch(`${API_URL}/notifications?page=${pageNum}&limit=20&category=${category}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();
        if (res.ok) {
          if (append) {
            setNotifications((prev) => [...prev, ...data.items]);
          } else {
            setNotifications(data.items);
          }
          setUnreadCount(data.unreadCount);
          setHasMore(data.items.length === 20);
        }
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      }
    },
    [API_URL, accessToken, activeTab],
  );

  useEffect(() => {
    if (accessToken) {
      fetchNotifications(1).finally(() => setLoading(false));
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
        .then((data) => { setVendorProfile(data.data || null); })
        .catch(() => { setVendorProfile(null); });
    }
  }, [accessToken, fetchNotifications]);

  useEffect(() => {
    if (!loading && unreadCount > 0) {
      handleMarkAllAsRead();
    }
  }, [loading]);

  useEffect(() => {
    setPage(1);
    fetchNotifications(1, false, activeTab);
  }, [activeTab]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n.recipientId === id ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      useNotificationStore.getState().decrementCount();
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch(`${API_URL}/notifications/read-all?category=${activeTab}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      resetCount();
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage, true);
  };

  const handleLogout = async () => {
    await useAuthStore.getState().logout();
  };

  const copyReferCode = () => {
    if (user?.ownRefercode) {
      navigator.clipboard.writeText(user.ownRefercode);
    }
  };

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'social', label: 'Social' },
    { key: 'app', label: 'App' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8f8ff' }}>
        <div className="animate-spin h-10 w-10 border-2 border-[#5d5e64] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <Head>
        <title>Dreamy Life - Notifications</title>
      </Head>
      <style>{`
        body {
          min-height: max(884px, 100dvh);
        }
        .aurora-bg {
          background-color: #F8F8FF;
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: -1;
          overflow: hidden;
        }
        .aurora-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.4;
          animation: float 20s infinite ease-in-out alternate;
        }
        .orb-1 { width: 600px; height: 600px; background: rgba(226, 226, 233, 0.6); top: -100px; left: -200px; }
        .orb-2 { width: 500px; height: 500px; background: rgba(179, 236, 243, 0.4); bottom: -50px; right: -100px; animation-delay: -5s; }
        .orb-3 { width: 400px; height: 400px; background: rgba(255, 217, 226, 0.5); top: 40%; left: 50%; transform: translate(-50%, -50%); animation-delay: -10s; }
        @keyframes float {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(50px, 30px) scale(1.1); }
          100% { transform: translate(-30px, 50px) scale(0.9); }
        }
        .glass-panel {
          background: rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.04);
        }
      `}</style>

      <div className="aurora-bg">
        <div className="aurora-orb orb-1"></div>
        <div className="aurora-orb orb-2"></div>
        <div className="aurora-orb orb-3"></div>
      </div>

      <DesktopHeader
        title="Notifications"
        onMenuClick={() => setDrawerOpen(true)}
        avatarUrl={user?.info?.avatarUrl || ''}
        unreadNotifCount={unreadCount}
      />

      <SideDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={user}
        vendorProfile={vendorProfile}
        handleLogout={handleLogout}
        copyReferCode={copyReferCode}
      />

      <header className="md:hidden flex justify-between items-center px-6 py-5 sticky top-0 z-40 bg-white/60 backdrop-blur-xl border-b border-white/30">
        <button onClick={() => router.push('/dashboard')} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/50 border border-white/40 shadow-sm text-[#45474b]">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-extrabold tracking-tight text-[#1c1b1b]">Notifications</h1>
        <div className="w-10"></div>
      </header>

      <main className="pt-20 md:pt-28 pb-10 md:pb-20 px-6 max-w-[1280px] mx-auto min-h-screen flex flex-col">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 w-full max-w-2xl mx-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`px-5 py-2.5 rounded-full text-[14px] font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-[#1A1A1A] text-white shadow-lg shadow-black/10'
                  : 'bg-white/50 backdrop-blur-[24px] text-[#45474b] hover:bg-white/60 border border-white/30'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex justify-between items-end mb-8 w-full max-w-2xl mx-auto">
          <p className="text-sm text-[#45474b]">
            {unreadCount > 0 ? `You have ${unreadCount} unread notifications.` : 'All caught up!'}
          </p>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="uppercase tracking-wider hover:opacity-70 transition-opacity text-sm font-semibold"
              style={{ letterSpacing: '0.05em', color: '#2d666d' }}
            >
              Mark all read
            </button>
          )}
        </div>

        <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto">
          {notifications.length === 0 && (
            <div className="glass-panel rounded-xl p-12 text-center">
              <span className="material-symbols-outlined text-5xl text-[#5d5e64] mb-4">notifications_none</span>
              <p className="text-[#45474b]">
                {activeTab === 'social' && 'No social notifications'}
                {activeTab === 'app' && 'No app notifications'}
                {activeTab === 'all' && 'No notifications yet'}
              </p>
            </div>
          )}

          {notifications.map((n) => {
            const colors = iconColors[n.icon || ''] || iconColors.default;
            return (
              <div
                key={n.recipientId}
                onClick={() => router.push(`/notifications/${n.id}`)}
                className={`glass-panel rounded-lg p-4 flex items-center gap-4 relative overflow-hidden group hover:bg-white/20 transition-all duration-300 cursor-pointer ${
                  !n.read ? 'opacity-100' : 'opacity-70'
                }`}
              >
                {!n.read && (
                  <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: '#2d666d' }}></div>
                )}

                <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.bg, color: colors.color }}>
                  {n.imageUrl ? (
                    <img src={n.imageUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined">{n.icon || 'notifications'}</span>
                  )}
                </div>

                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold truncate text-[#1c1b1b]">{n.title}</h2>
                      {n.category === 'social' && (
                        <span className="px-2 py-0.5 rounded-full bg-[#ffd1dc] text-[#78555e] text-[10px] font-semibold">Social</span>
                      )}
                      {n.link && (
                        <span className="material-symbols-outlined text-xs text-[#2d666d]">link</span>
                      )}
                    </div>
                    <span className="flex-shrink-0 ml-2 text-xs font-semibold text-[#76777b]">
                      {n.sentAt ? getTimeAgo(n.sentAt) : getTimeAgo(n.createdAt)}
                    </span>
                  </div>
                  <p className="line-clamp-1 text-sm text-[#45474b]">{n.body}</p>
                </div>
              </div>
            );
          })}

          {hasMore && notifications.length > 0 && (
            <button
              onClick={handleLoadMore}
              className="glass-panel rounded-xl py-3 text-center text-sm font-semibold text-[#2d666d] hover:bg-white/30 transition-colors"
            >
              Load more
            </button>
          )}
        </div>
      </main>
    </AuthGuard>
  );
}
