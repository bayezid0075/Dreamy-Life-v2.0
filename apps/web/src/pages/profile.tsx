import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { VendorProfile } from '@/features/vendor/api';
import DesktopHeader from '@/shared/components/DesktopHeader';
import SideDrawer from '@/shared/components/SideDrawer';

export default function ProfilePage() {
  const router = useRouter();
  const { accessToken, isAuthenticated, clearAuth } = useAuthStore();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { unreadCount: unreadNotifCount, setUnreadCount: setUnreadNotifCount } = useNotificationStore();
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      router.replace('/login');
      return;
    }
    fetchProfile(accessToken);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4080';
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
  }, [isAuthenticated, accessToken, router]);

  const fetchProfile = async (token: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4080'}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        clearAuth();
        router.replace('/login');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setUser(data.data.user);
        setStats(data.data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
      clearAuth();
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    router.replace('/login');
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

  return (
    <>
      <Head>
        <title>Dreamy Life - Profile</title>
      </Head>
      <style>{`
        body {
          background-color: #F8F8FF;
          position: relative;
          overflow-x: hidden;
          min-height: max(884px, 100dvh);
        }
        .aurora-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: -1;
          pointer-events: none;
          overflow: hidden;
        }
        .aurora-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.6;
        }
        .orb-1 { top: -10%; left: -10%; width: 50vw; height: 50vw; background: #ffe4b5; }
        .orb-2 { bottom: -20%; right: -10%; width: 60vw; height: 60vw; background: #98fb98; opacity: 0.4; }
        .orb-3 { top: 30%; left: 40%; width: 40vw; height: 40vw; background: #ffd1dc; opacity: 0.5; }
        .glass-panel {
          background: rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 20px 40px rgba(0,0,0,0.04);
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.05); opacity: 0.1; }
          100% { transform: scale(1); opacity: 0.3; }
        }
      `}</style>

      {/* Aurora Background */}
      <div className="aurora-bg">
        <div className="aurora-orb orb-1"></div>
        <div className="aurora-orb orb-2"></div>
        <div className="aurora-orb orb-3"></div>
      </div>

      {/* TopAppBar - Desktop */}
      <DesktopHeader
        title="Dreamy Life"
        onMenuClick={() => setDrawerOpen(true)}
        avatarUrl={avatarUrl}
        unreadNotifCount={unreadNotifCount}
      />

      {/* Side Drawer */}
      <SideDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={user}
        vendorProfile={vendorProfile}
        handleLogout={handleLogout}
        copyReferCode={copyReferCode}
      />

      {/* Mobile Top Bar */}
      <header className="md:hidden flex justify-between items-center px-6 py-5 sticky top-0 z-40 bg-white/60 backdrop-blur-xl border-b border-white/30">
        <button
          onClick={() => router.push('/dashboard')}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white/50 border border-white/40 shadow-sm text-[#45474b]"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-extrabold tracking-tight text-[#1c1b1b]">Profile</h1>
        <button
          onClick={() => router.push('/notifications')}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white/50 border border-white/40 shadow-sm text-[#45474b]"
        >
          <span className="material-symbols-outlined">notifications</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="pt-20 md:pt-[100px] px-6 max-w-[1280px] mx-auto flex flex-col gap-8 pb-32">
        {/* Profile Header */}
        <section className="flex flex-col items-center pt-6">
          <div className="relative w-32 h-32 mb-4">
            <div
              className="absolute inset-0 rounded-full border-4"
              style={{
                borderColor: 'rgba(152, 208, 215, 0.3)',
                animation: 'pulse-ring 2s infinite ease-in-out',
              }}
            ></div>
            {avatarUrl ? (
              <img
                alt={displayName}
                className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg relative z-10"
                src={avatarUrl}
              />
            ) : (
              <div className="w-full h-full rounded-full border-4 border-white shadow-lg relative z-10 bg-[#e5e2e1] flex items-center justify-center">
                <span className="material-symbols-outlined text-[#5d5e64] text-6xl">person</span>
              </div>
            )}
          </div>
          <h2 className="text-[32px] font-bold mb-1" style={{ color: '#1c1b1b', lineHeight: '1.3' }}>
            {displayName}
          </h2>
          <p className="mb-6" style={{ color: '#45474b', fontSize: '18px', lineHeight: '1.6' }}>
            {displayEmail}
          </p>
          <button className="glass-panel px-6 py-3 rounded-full hover:bg-white/60 transition-colors" style={{ color: '#1c1b1b', fontSize: '14px', fontWeight: 600, letterSpacing: '0.05em' }}>
            Edit Profile
          </button>
        </section>

        {/* User Stats */}
        <section className="glass-panel rounded-xl p-6 flex justify-between items-center text-center">
          <div className="flex-1 border-r" style={{ borderColor: 'rgba(255,255,255,0.3)' }}>
            <p className="text-[24px] font-bold" style={{ color: '#1c1b1b', lineHeight: '1.4' }}>12</p>
            <p className="mt-1" style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '0.05em', color: '#45474b' }}>Orders</p>
          </div>
          <div className="flex-1 border-r" style={{ borderColor: 'rgba(255,255,255,0.3)' }}>
            <p className="text-[24px] font-bold" style={{ color: '#1c1b1b', lineHeight: '1.4' }}>48</p>
            <p className="mt-1" style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '0.05em', color: '#45474b' }}>Wishlist</p>
          </div>
          <div className="flex-1">
            <p className="text-[24px] font-bold" style={{ color: '#1c1b1b', lineHeight: '1.4' }}>3</p>
            <p className="mt-1" style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '0.05em', color: '#45474b' }}>Coupons</p>
          </div>
        </section>

        {/* Settings List */}
        <section className="glass-panel p-2 flex flex-col" style={{ borderRadius: '30px' }}>
          {[
            { icon: 'person', label: 'Personal Information' },
            { icon: 'location_on', label: 'Shipping Address' },
            { icon: 'receipt_long', label: 'Order History' },
            { icon: 'credit_card', label: 'Payment Methods' },
            { icon: 'account_balance_wallet', label: 'Wallet', href: '/wallet' },
            { icon: 'notifications_active', label: 'Notifications', href: '/notifications' },
          ].map((item, i) => (
            <div key={item.label}>
              <button
                onClick={() => item.href && router.push(item.href)}
                className="flex items-center justify-between w-full p-4 transition-colors"
                style={{ borderRadius: '20px' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.4)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined" style={{ color: '#5d5e64' }}>{item.icon}</span>
                  <span style={{ fontSize: '16px', lineHeight: '1.6', color: '#1c1b1b' }}>{item.label}</span>
                </div>
                <span className="material-symbols-outlined" style={{ color: '#76777b' }}>chevron_right</span>
              </button>
              {i < 5 && <div className="h-px w-[90%] mx-auto" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}></div>}
            </div>
          ))}
        </section>

        {/* Logout */}
        <div className="flex justify-center mt-4 mb-8">
          <button
            onClick={handleLogout}
            className="hover:opacity-80 transition-opacity"
            style={{ color: '#ba1a1a', fontSize: '14px', fontWeight: 600, letterSpacing: '0.05em' }}
          >
            Log Out
          </button>
        </div>
      </main>

      {/* BottomNavBar - Mobile */}
      <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] z-50 flex justify-around items-center py-2 px-4 bg-white/60 backdrop-blur-[20px] border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)] rounded-full">
        <Link href="/dashboard" className="flex items-center justify-center p-3 transition-colors rounded-full" style={{ color: '#45474b' }}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>home</span>
        </Link>
        <button className="flex items-center justify-center p-3 transition-colors rounded-full" style={{ color: '#45474b' }}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>search</span>
        </button>
        <Link href="/cart" className="flex items-center justify-center p-3 transition-colors rounded-full" style={{ color: '#45474b' }}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>shopping_cart</span>
        </Link>
        <Link
          href="/profile"
          className="flex items-center justify-center rounded-full p-3 transition-colors scale-90 duration-200"
          style={{ backgroundColor: '#1c1b1b', color: '#ffffff' }}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
        </Link>
      </nav>
    </>
  );
}
