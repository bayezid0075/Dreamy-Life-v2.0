import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useI18n } from '@/i18n';
import { VendorProfile } from '@/features/vendor/api';
import DesktopHeader from '@/shared/components/DesktopHeader';
import SideDrawer from '@/shared/components/SideDrawer';
import AuthGuard from '@/shared/components/AuthGuard';
import AdSenseBannerAd from '@/shared/components/ads/AdSenseBannerAd';

export default function ProfilePage() {
  const router = useRouter();
  const { accessToken, logout } = useAuthStore();
  const { t } = useI18n();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { unreadCount: unreadNotifCount, setUnreadCount: setUnreadNotifCount } = useNotificationStore();
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);

  useEffect(() => {
    if (accessToken) {
      fetchProfile(accessToken);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      fetch(`${apiUrl}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
        .then((res) => res.json())
        .then((data) => { if (data.count !== undefined) setUnreadNotifCount(data.count); })
        .catch(() => {});
      fetch(`${apiUrl}/vendor/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
        .then((res) => res.json())
        .then((data) => { setVendorProfile(data.data || null); })
        .catch(() => { setVendorProfile(null); });
    }
  }, [accessToken]);

  const fetchProfile = async (token: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        await logout();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setUser(data.data.user);
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
      await logout();
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const copyReferCode = () => {
    if (user?.ownRefercode) {
      navigator.clipboard.writeText(user.ownRefercode);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8F8FF' }}>
        <div className="animate-spin h-10 w-10 border-2 border-[#5d5e64] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const displayName = user?.info?.fullName || user?.username || 'User';
  const displayEmail = user?.info?.email || 'No email set';
  const avatarUrl = user?.info?.avatarUrl;

  const settingsItems = [
    { icon: 'person', label: t('personalInformation'), href: '/edit-profile' },
    { icon: 'language', label: t('language'), href: '/settings/language' },
    { icon: 'location_on', label: t('shippingAddress') },
    { icon: 'receipt_long', label: t('orderHistory') },
    { icon: 'credit_card', label: t('paymentMethods') },
    { icon: 'notifications_active', label: t('notifications'), href: '/notifications' },
  ];

  return (
    <AuthGuard>
      <Head>
        <title>Dreamy Life - {t('profile')}</title>
      </Head>
      <style>{`
        body { background-color: #F8F8FF; position: relative; overflow-x: hidden; min-height: max(884px, 100dvh); }
        .aurora-bg { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -1; pointer-events: none; overflow: hidden; }
        .aurora-orb { position: absolute; border-radius: 50%; filter: blur(100px); opacity: 0.6; }
        .orb-1 { top: -10%; left: -10%; width: 50vw; height: 50vw; background: #ffe4b5; }
        .orb-2 { bottom: -20%; right: -10%; width: 60vw; height: 60vw; background: #98fb98; opacity: 0.4; }
        .orb-3 { top: 30%; left: 40%; width: 40vw; height: 40vw; background: #ffd1dc; opacity: 0.5; }
        .glass-panel { background: rgba(255, 255, 255, 0.5); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.3); box-shadow: 0 20px 40px rgba(0,0,0,0.04); }
        @keyframes pulse-ring { 0% { transform: scale(1); opacity: 0.3; } 50% { transform: scale(1.05); opacity: 0.1; } 100% { transform: scale(1); opacity: 0.3; } }
      `}</style>

      <div className="aurora-bg">
        <div className="aurora-orb orb-1"></div>
        <div className="aurora-orb orb-2"></div>
        <div className="aurora-orb orb-3"></div>
      </div>

      {/* Desktop Header */}
      <DesktopHeader title="Dreamy Life" onMenuClick={() => setDrawerOpen(true)} avatarUrl={avatarUrl} unreadNotifCount={unreadNotifCount} />
      <SideDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} user={user} vendorProfile={vendorProfile} handleLogout={handleLogout} copyReferCode={copyReferCode} />

      {/* Mobile Top Bar */}
      <header className="md:hidden fixed top-0 w-full z-40 flex justify-between items-center px-6 py-4 bg-white/40 backdrop-blur-xl border-b border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
        <div className="w-10 h-10 rounded-full overflow-hidden border border-white/50">
          {avatarUrl ? (
            <img alt="User Avatar" className="w-full h-full object-cover" src={avatarUrl} />
          ) : (
            <div className="w-full h-full bg-[#e5e2e1] flex items-center justify-center">
              <span className="material-symbols-outlined text-[#5d5e64] text-xl">person</span>
            </div>
          )}
        </div>
        <h1 className="text-xl font-extrabold text-[#1c1b1b]">Dreamy Life</h1>
        <button onClick={() => router.push('/notifications')} className="text-[#1c1b1b] hover:opacity-80 transition-opacity">
          <span className="material-symbols-outlined">notifications</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="pt-[100px] px-6 max-w-[1280px] mx-auto flex flex-col gap-8 pb-32">
        {/* Profile Header */}
        <section className="flex flex-col items-center pt-6">
          <div className="relative w-32 h-32 mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-[#98d0d7]/30 animate-pulse"></div>
            {avatarUrl ? (
              <img alt={displayName} className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg relative z-10" src={avatarUrl} />
            ) : (
              <div className="w-full h-full rounded-full border-4 border-white shadow-lg relative z-10 bg-[#e5e2e1] flex items-center justify-center">
                <span className="material-symbols-outlined text-[#5d5e64] text-6xl">person</span>
              </div>
            )}
          </div>
          <h2 className="text-[32px] font-bold text-[#1c1b1b] mb-1">{displayName}</h2>
          <p className="text-lg text-[#45474b] mb-6">{displayEmail}</p>
          <button onClick={() => router.push('/edit-profile')} className="glass-panel px-6 py-3 rounded-full text-[#1c1b1b] text-sm font-semibold hover:bg-white/60 transition-colors">
            {t('editProfile')}
          </button>
        </section>

        {/* User Stats */}
        <section className="glass-panel rounded-xl p-6 flex justify-between items-center text-center">
          <div className="flex-1 border-r border-white/30">
            <p className="text-[24px] font-bold text-[#1c1b1b]">12</p>
            <p className="text-xs font-semibold text-[#45474b] mt-1 tracking-wider">{t('orders')}</p>
          </div>
          <div className="flex-1 border-r border-white/30">
            <p className="text-[24px] font-bold text-[#1c1b1b]">48</p>
            <p className="text-xs font-semibold text-[#45474b] mt-1 tracking-wider">{t('wishlist')}</p>
          </div>
          <div className="flex-1">
            <p className="text-[24px] font-bold text-[#1c1b1b]">3</p>
            <p className="text-xs font-semibold text-[#45474b] mt-1 tracking-wider">{t('coupons')}</p>
          </div>
        </section>

        {/* Ad Banner */}
        <div className="my-2">
          <AdSenseBannerAd adSlot="3051399239" format="horizontal" />
        </div>

        {/* Settings List */}
        <section className="glass-panel rounded-[30px] p-2 flex flex-col">
          {settingsItems.map((item, i) => (
            <div key={item.label}>
              <button
                onClick={() => item.href && router.push(item.href)}
                className="flex items-center justify-between w-full p-4 rounded-[20px] hover:bg-white/40 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-[#5d5e64]" style={{ fontVariationSettings: "'FILL' 0" }}>{item.icon}</span>
                  <span className="text-base text-[#1c1b1b]">{item.label}</span>
                </div>
                <span className="material-symbols-outlined text-[#76777b]">chevron_right</span>
              </button>
              {i < settingsItems.length - 1 && <div className="h-px w-[90%] mx-auto bg-white/30"></div>}
            </div>
          ))}
        </section>

        {/* Logout */}
        <div className="flex justify-center mt-4 mb-8">
          <button onClick={handleLogout} className="text-[#ba1a1a] text-sm font-semibold hover:opacity-80 transition-opacity">
            {t('logOut')}
          </button>
        </div>
      </main>

      {/* BottomNavBar - Mobile */}
      <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] z-50 flex justify-around items-center py-2 px-4 bg-white/60 backdrop-blur-[20px] border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)] rounded-full">
        <Link href="/dashboard" className="flex items-center justify-center text-[#45474b] p-3 hover:bg-white/20 transition-colors rounded-full">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>home</span>
        </Link>
        <button className="flex items-center justify-center text-[#45474b] p-3 hover:bg-white/20 transition-colors rounded-full">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>search</span>
        </button>
        <Link href="/cart" className="flex items-center justify-center text-[#45474b] p-3 hover:bg-white/20 transition-colors rounded-full">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>shopping_cart</span>
        </Link>
        <Link href="/profile" className="flex items-center justify-center bg-[#1c1b1b] text-white rounded-full p-3 hover:bg-white/20 transition-colors scale-90 duration-200">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
        </Link>
      </nav>
    </AuthGuard>
  );
}
