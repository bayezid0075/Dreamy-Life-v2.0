import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import AuthGuard from '@/shared/components/AuthGuard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface UserStats {
  postsCount: number;
  followersCount: number;
  followingCount: number;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { accessToken, user: authUser } = useAuthStore();
  const { unreadCount: unreadNotifCount } = useNotificationStore();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken || !authUser?.id) return;
    fetchStats(authUser.id);
  }, [accessToken, authUser]);

  const fetchStats = async (userId: string) => {
    try {
      const res = await fetch(`${API_URL}/users/${userId}/stats`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-aurora">
        <div className="animate-spin h-10 w-10 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <AuthGuard>
      <Head>
        <title>Dreamy Life - Professional Dashboard</title>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </Head>

      <body className="bg-aurora text-on-surface min-h-screen font-['Plus_Jakarta_Sans',sans-serif] antialiased">
        {/* TopAppBar */}
        <header className="fixed top-0 w-full z-50 bg-white/40 backdrop-blur-xl border-b border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
          <div className="flex justify-between items-center px-6 w-full h-16 max-w-[1280px] mx-auto">
            <button
              onClick={() => router.back()}
              className="hover:bg-white/20 transition-colors duration-300 p-2 rounded-full flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-primary">arrow_back</span>
            </button>
            <h1 className="text-[24px] font-bold text-primary tracking-tight">Analytics</h1>
            <div className="w-10" />
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-24 pb-12">
          {/* Stats Cards */}
          <section className="grid grid-cols-3 gap-4 mb-8">
            <div className="glass-panel rounded-2xl p-5 text-center">
              <span className="material-symbols-outlined text-[#2d666d] text-3xl mb-2 block">group</span>
              <div className="text-[28px] font-bold text-on-surface">{stats?.followersCount ?? 0}</div>
              <div className="text-[13px] font-semibold text-on-surface-variant">Followers</div>
            </div>
            <div className="glass-panel rounded-2xl p-5 text-center">
              <span className="material-symbols-outlined text-[#78555e] text-3xl mb-2 block">person_add</span>
              <div className="text-[28px] font-bold text-on-surface">{stats?.followingCount ?? 0}</div>
              <div className="text-[13px] font-semibold text-on-surface-variant">Following</div>
            </div>
            <div className="glass-panel rounded-2xl p-5 text-center">
              <span className="material-symbols-outlined text-[#5d5e64] text-3xl mb-2 block">article</span>
              <div className="text-[28px] font-bold text-on-surface">{stats?.postsCount ?? 0}</div>
              <div className="text-[13px] font-semibold text-on-surface-variant">Posts</div>
            </div>
          </section>

          {/* Engagement Section */}
          <section className="glass-panel rounded-2xl p-6 mb-6">
            <h3 className="text-[16px] font-bold text-on-surface mb-4">Engagement Overview</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#e9fdff] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#2d666d]">visibility</span>
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold text-on-surface">Profile Views</div>
                    <div className="text-[12px] text-on-surface-variant">Last 7 days</div>
                  </div>
                </div>
                <div className="text-[18px] font-bold text-on-surface">--</div>
              </div>
              <div className="h-px bg-white/30" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#ffd1dc]/40 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#78555e]">thumb_up</span>
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold text-on-surface">Post Engagements</div>
                    <div className="text-[12px] text-on-surface-variant">Likes + Comments</div>
                  </div>
                </div>
                <div className="text-[18px] font-bold text-on-surface">--</div>
              </div>
              <div className="h-px bg-white/30" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#f8f8ff] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#5d5e64]">trending_up</span>
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold text-on-surface">Follower Growth</div>
                    <div className="text-[12px] text-on-surface-variant">This month</div>
                  </div>
                </div>
                <div className="text-[18px] font-bold text-on-surface">--</div>
              </div>
            </div>
          </section>

          {/* Quick Actions */}
          <section className="glass-panel rounded-2xl p-6">
            <h3 className="text-[16px] font-bold text-on-surface mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                href="/social/edit-profile"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/30 transition-colors"
              >
                <span className="material-symbols-outlined text-primary">edit</span>
                <span className="text-[14px] font-semibold text-on-surface">Edit Profile</span>
                <span className="material-symbols-outlined text-on-surface-variant ml-auto">chevron_right</span>
              </Link>
              <Link
                href="/posts/create"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/30 transition-colors"
              >
                <span className="material-symbols-outlined text-primary">add_circle</span>
                <span className="text-[14px] font-semibold text-on-surface">Create New Post</span>
                <span className="material-symbols-outlined text-on-surface-variant ml-auto">chevron_right</span>
              </Link>
              <Link
                href="/social/profile"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/30 transition-colors"
              >
                <span className="material-symbols-outlined text-primary">person</span>
                <span className="text-[14px] font-semibold text-on-surface">View Profile</span>
                <span className="material-symbols-outlined text-on-surface-variant ml-auto">chevron_right</span>
              </Link>
            </div>
          </section>
        </main>

        {/* BottomNavBar */}
        <nav className="md:hidden fixed bottom-0 w-full z-50 rounded-t-lg bg-white/40 backdrop-blur-xl shadow-[0_-10px_40px_rgba(0,0,0,0.04)] border-t border-white/30">
          <div className="flex justify-around items-center py-3 px-4">
            <Link href="/social-feed" className="flex flex-col items-center justify-center text-on-surface-variant/60 hover:text-primary transition-all duration-300">
              <span className="material-symbols-outlined mb-1">home</span>
              <span className="text-[10px] font-semibold">Home</span>
            </Link>
            <Link href="/friends" className="flex flex-col items-center justify-center text-on-surface-variant/60 hover:text-primary transition-all duration-300">
              <span className="material-symbols-outlined mb-1">group</span>
              <span className="text-[10px] font-semibold">Friends</span>
            </Link>
            <Link href="/posts/create" className="flex flex-col items-center justify-center text-on-surface-variant/60 hover:text-primary transition-all duration-300">
              <span className="material-symbols-outlined mb-1">add_circle</span>
              <span className="text-[10px] font-semibold">Create</span>
            </Link>
            <Link href="/notifications" className="flex flex-col items-center justify-center text-on-surface-variant/60 hover:text-primary transition-all duration-300 relative">
              <span className="material-symbols-outlined mb-1">notifications</span>
              <span className="text-[10px] font-semibold">Alerts</span>
              {unreadNotifCount > 0 && (
                <span className="absolute -top-0.5 right-1 min-w-[16px] h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center px-1">
                  {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                </span>
              )}
            </Link>
            <Link
              href="/social/profile"
              className="flex flex-col items-center justify-center text-on-surface-variant/60 hover:text-primary transition-all duration-300"
            >
              <span className="material-symbols-outlined mb-1">person</span>
              <span className="text-[10px] font-semibold">Profile</span>
            </Link>
          </div>
        </nav>
      </body>
    </AuthGuard>
  );
}
