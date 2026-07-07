import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import DesktopHeader from '@/shared/components/DesktopHeader';
import SideDrawer from '@/shared/components/SideDrawer';
import { VendorProfile } from '@/features/vendor/api';
import AuthGuard from '@/shared/components/AuthGuard';

interface NotificationDetail {
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
  createdBy: string;
  totalRecipients: number;
  totalRead: number;
}

export default function NotificationDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { accessToken } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<NotificationDetail | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  useEffect(() => {
    if (!id || !accessToken) return;

    fetch(`${API_URL}/notifications/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setNotification(data.data || data.notification || data.data?.notification);
        setLoading(false);
      })
      .catch(() => setLoading(false));

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
  }, [id, accessToken]);

  const handleMarkAsRead = async () => {
    if (!notification || !accessToken) return;
    setActionLoading(true);
    try {
      const recipientRes = await fetch(`${API_URL}/notifications?page=1&limit=1`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const recipientData = await recipientRes.json();
      const matched = recipientData.items?.find((n: any) => n.id === notification.id);
      if (matched?.recipientId) {
        await fetch(`${API_URL}/notifications/${matched.recipientId}/read`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        useNotificationStore.getState().decrementCount();
      }
    } catch {
    }
    setActionLoading(false);
  };

  const handleDelete = async () => {
    if (!notification || !accessToken) return;
    if (!confirm('Delete this notification?')) return;
    setActionLoading(true);
    try {
      await fetch(`${API_URL}/admin/notifications/${notification.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      router.push('/notifications');
    } catch {
    }
    setActionLoading(false);
  };

  const handleLogout = async () => {
    await useAuthStore.getState().logout();
  };

  const copyReferCode = () => {
    if (user?.ownRefercode) navigator.clipboard.writeText(user.ownRefercode);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8f8ff' }}>
        <div className="animate-spin h-10 w-10 border-2 border-[#5d5e64] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!notification) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8f8ff' }}>
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-[#5d5e64] mb-4">notifications_off</span>
          <p className="text-[#45474b] text-lg">Notification not found</p>
          <button onClick={() => router.push('/notifications')} className="mt-4 px-6 py-2 rounded-full bg-[#2d666d] text-white font-semibold">
            Back to Notifications
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <AuthGuard>
      <Head>
        <title>{notification.title} - Dreamy Life</title>
      </Head>
      <style>{`
        .aurora-bg {
          background-color: #F8F8FF;
          position: fixed;
          top: 0; left: 0;
          width: 100vw; height: 100vh;
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
        .orb-1 { width: 600px; height: 600px; background: rgba(226,226,233,0.6); top: -100px; left: -200px; }
        .orb-2 { width: 500px; height: 500px; background: rgba(179,236,243,0.4); bottom: -50px; right: -100px; animation-delay: -5s; }
        .orb-3 { width: 400px; height: 400px; background: rgba(255,217,226,0.5); top: 40%; left: 50%; transform: translate(-50%,-50%); animation-delay: -10s; }
        @keyframes float {
          0% { transform: translate(0,0) scale(1); }
          50% { transform: translate(50px,30px) scale(1.1); }
          100% { transform: translate(-30px,50px) scale(0.9); }
        }
        .glass-panel {
          background: rgba(255,255,255,0.5);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.3);
          box-shadow: 0 20px 40px rgba(0,0,0,0.04);
        }
      `}</style>

      <div className="aurora-bg">
        <div className="aurora-orb orb-1" />
        <div className="aurora-orb orb-2" />
        <div className="aurora-orb orb-3" />
      </div>

      <DesktopHeader
        title="Notification"
        onMenuClick={() => setDrawerOpen(true)}
        avatarUrl={user?.info?.avatarUrl || ''}
      />

      <SideDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} user={user} vendorProfile={vendorProfile} handleLogout={handleLogout} copyReferCode={copyReferCode} />

      <header className="md:hidden flex justify-between items-center px-6 py-5 sticky top-0 z-40 bg-white/60 backdrop-blur-xl border-b border-white/30">
        <button onClick={() => router.push('/notifications')} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/50 border border-white/40 shadow-sm text-[#45474b]">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-extrabold tracking-tight text-[#1c1b1b]">Notification</h1>
        <div className="w-10" />
      </header>

      <main className="pt-20 md:pt-28 pb-10 md:pb-20 px-6 max-w-[800px] mx-auto min-h-screen">
        <div className="glass-panel rounded-2xl p-8 mb-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center" style={{
              backgroundColor: notification.category === 'social' ? '#ffd1dc' : '#e8eaf6',
              color: notification.category === 'social' ? '#78555e' : '#3949ab',
            }}>
              <span className="material-symbols-outlined text-2xl">{notification.icon || 'notifications'}</span>
            </div>
            <div className="flex-grow">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-extrabold text-[#1c1b1b]">{notification.title}</h1>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{
                  backgroundColor: notification.category === 'social' ? '#ffd1dc' : '#e8eaf6',
                  color: notification.category === 'social' ? '#78555e' : '#3949ab',
                }}>
                  {notification.category}
                </span>
              </div>
              <p className="text-sm text-[#76777b]">
                {notification.sentAt ? formatDate(notification.sentAt) : formatDate(notification.createdAt)}
              </p>
            </div>
          </div>

          {notification.imageUrl && (
            <div className="mb-6 rounded-xl overflow-hidden">
              <img
                src={notification.imageUrl}
                alt={notification.title}
                className="w-full h-auto object-cover max-h-[400px]"
              />
            </div>
          )}

          <div className="prose prose-gray max-w-none">
            <p className="text-[#45474b] text-[15px] leading-relaxed whitespace-pre-wrap">{notification.body}</p>
          </div>

          {notification.link && (
            <div className="mt-6 pt-4 border-t border-white/30">
              <a
                href={notification.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#2d666d] text-white font-semibold text-sm hover:bg-[#24585d] transition-colors"
              >
                <span className="material-symbols-outlined text-lg">open_in_new</span>
                Open Link
              </a>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => router.push('/notifications')}
            className="px-6 py-3 rounded-full bg-white/50 backdrop-blur-[24px] border border-white/30 text-[#45474b] font-semibold text-sm hover:bg-white/60 transition-colors"
          >
            Back to Notifications
          </button>
        </div>
      </main>
    </AuthGuard>
  );
}
