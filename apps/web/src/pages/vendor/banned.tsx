import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { getMyVendorProfile, VendorProfile } from '@/features/vendor/api';
import api from '@dreamy-life/api-client';
import DesktopHeader from '@/shared/components/DesktopHeader';
import SideDrawer from '@/shared/components/SideDrawer';
import AuthGuard from '@/shared/components/AuthGuard';

export default function VendorBannedPage() {
  const router = useRouter();
  const { isAuthenticated, logout } = useAuthStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { unreadCount: unreadNotifCount, setUnreadCount: setUnreadNotifCount } = useNotificationStore();
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);

  useEffect(() => {
    if (!isAuthenticated) { router.replace('/login'); return; }
    Promise.all([
      getMyVendorProfile().then(d => { setVendorProfile(d.data || null); }).catch(() => setVendorProfile(null)),
      api.get('/auth/profile').then((d: any) => setUser(d.data?.data?.user)).catch(() => {}),
      api.get('/notifications/unread-count').then((d: any) => { if (d.data?.count !== undefined) setUnreadNotifCount(d.data.count); }).catch(() => {}),
    ]);
  }, [isAuthenticated]);

  const handleLogout = () => { useAuthStore.getState().clearAuth(); router.replace('/login'); };
  const copyReferCode = () => { if (user?.ownRefercode) navigator.clipboard.writeText(user.ownRefercode); };

  return (
    <AuthGuard>
      <Head><title>Account Suspended - Vendor Suite</title></Head>
      <div
        className="min-h-screen overflow-x-hidden selection:bg-[#ffd1dc] selection:text-[#1c1b1b]"
        style={{
          background: `radial-gradient(circle at 10% 20%, rgba(255, 217, 226, 0.4) 0%, transparent 40%),
                       radial-gradient(circle at 90% 80%, rgba(179, 236, 243, 0.4) 0%, transparent 40%),
                       radial-gradient(circle at 50% 50%, rgba(248, 248, 255, 1) 0%, transparent 100%)`,
          backgroundColor: '#f8f8ff',
          color: '#1c1b1b',
          fontFamily: 'Plus Jakarta Sans, sans-serif',
        }}
      >
        <DesktopHeader
          title="Account Suspended"
          onMenuClick={() => setDrawerOpen(true)}
          avatarUrl={user?.info?.avatarUrl || ''}
          unreadNotifCount={unreadNotifCount}
        />

        <SideDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          user={user}
          vendorProfile={vendorProfile}
          handleLogout={handleLogout}
          copyReferCode={copyReferCode}
        />

        <main className="flex items-center justify-center min-h-[calc(100vh-80px)] px-6 py-20 relative z-10">
          <div className="max-w-md w-full bg-white/50 backdrop-blur-[24px] rounded-[2rem] p-10 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)] text-center">
            <div className="w-20 h-20 rounded-full bg-[#ffdad6] flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-[#93000a] text-4xl">block</span>
            </div>

            <h1 className="text-2xl font-extrabold text-[#1c1b1b] mb-3">
              Your Vendor Account Has Been Suspended
            </h1>

            <p className="text-sm text-[#45474b] leading-relaxed mb-8">
              Your vendor account has been temporarily suspended by our team. Please contact support for more information.
            </p>

            <div className="space-y-3">
              <a
                href="https://t.me/dreamylife_support"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 rounded-full bg-[#2d666d] text-white text-sm font-semibold hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-[#2d666d]/20"
              >
                <span className="material-symbols-outlined text-[18px]">support_agent</span>
                Contact Support
              </a>

              <Link
                href="/vendor/dashboard"
                className="w-full py-4 rounded-full bg-white/50 backdrop-blur-[24px] text-[#1c1b1b] text-sm font-semibold hover:bg-white/60 transition-all active:scale-95 flex items-center justify-center gap-2 border border-white/30"
              >
                <span className="material-symbols-outlined text-[18px]">dashboard</span>
                Back to Dashboard
              </Link>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
