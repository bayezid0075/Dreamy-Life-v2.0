import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import DesktopHeader from '@/shared/components/DesktopHeader';
import SideDrawer from '@/shared/components/SideDrawer';
import { VendorProfile } from '@/features/vendor/api';

export default function DashboardPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated, clearAuth } = useAuthStore();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [vendorExpanded, setVendorExpanded] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  useEffect(() => {
    if (isAuthenticated && accessToken) {
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
    }
  }, [isAuthenticated, accessToken]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      router.replace('/login');
      return;
    }
    fetchUser(accessToken);
  }, [isAuthenticated, accessToken, router]);

  const fetchUser = async (token: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4080'}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.data.user);
        setAvatarUrl(data.data.user?.avatarUrl || '');
      } else {
        clearAuth();
        router.replace('/login');
      }
    } catch (err) {
      console.error('Failed to fetch user', err);
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8f8ff' }}>
        <div className="animate-spin h-10 w-10 border-2 border-[#5d5e64] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dreamy Life - Dashboard</title>
      </Head>
      <style>{`
        body {
          min-height: max(884px, 100dvh);
        }
      `}</style>

      <div
        className="min-h-screen overflow-x-hidden pb-32 selection:bg-[#ffd1dc] selection:text-[#1c1b1b]"
        style={{
          background: `radial-gradient(circle at 10% 20%, rgba(255, 217, 226, 0.4) 0%, transparent 40%),
                       radial-gradient(circle at 90% 80%, rgba(179, 236, 243, 0.4) 0%, transparent 40%),
                       radial-gradient(circle at 50% 50%, rgba(248, 248, 255, 1) 0%, transparent 100%)`,
          backgroundColor: '#f8f8ff',
          color: '#1c1b1b',
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontSize: '16px',
          lineHeight: '1.6',
        }}
      >
        {/* TopAppBar - Desktop */}
        <DesktopHeader
          title="Dreamy Life"
          onMenuClick={() => setDrawerOpen(true)}
          avatarUrl={avatarUrl}
          unreadNotifCount={unreadNotifCount}
          onSearchClick={() => setSearchOpen(true)}
        />

        {/* Mobile Top Bar */}
        <header className="md:hidden flex justify-between items-center px-6 py-5 sticky top-0 z-40 bg-white/60 backdrop-blur-xl border-b border-white/30">
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/50 border border-white/40 shadow-sm text-[#45474b]"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div onClick={() => router.push('/wallet')} className="bg-white/50 backdrop-blur-[20px] px-6 py-2 rounded-full flex items-center gap-2 cursor-pointer hover:bg-white/60 transition-colors border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
            <span className="material-symbols-outlined text-[#5d5e64]" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
            <span className="text-[14px] font-semibold tracking-[0.05em] text-[#1c1b1b]">Tap for Balance</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white/50 border border-white/40 shadow-sm text-[#45474b]"
            >
              <span className="material-symbols-outlined">search</span>
            </button>
            <button
              onClick={() => router.push('/notifications')}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white/50 border border-white/40 shadow-sm text-[#45474b] relative"
            >
              <span className="material-symbols-outlined">notifications</span>
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-[#ba1a1a] text-white text-[11px] font-bold flex items-center justify-center">
                  {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-[1280px] mx-auto px-6 md:px-6 pt-8 md:pt-32 pb-24 space-y-8 relative z-10">
          {/* Hero Section / Banner */}
          <section className="bg-white/50 backdrop-blur-[20px] rounded-xl overflow-hidden relative border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
            <div className="aspect-[21/9] md:aspect-[21/6] bg-[#e5e2e1] relative">
              <img
                alt="Delivery Schedule Banner"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQmhK93LSiFaLEzbKlfCfafO-AnM9smzxf0Sh9t7Gm7JNoNzMULNz9sADTnK9HK4E1bGdh8EPmlMBCR8-KGZcn9VwyMgWtmXK5kcAnEloS3YybPUDI8qzzF4MqmBJJoPIngksccT0f0RnH1M_NZMA8M9uuFlCPpgWpC8_5tJrnGIB2QimMZyBrOGTUgZzn0VkFHDlueYWYobuQNloFPvZROB8akvYvyBUyTAb08ijiCm6pWggt0MAaDKRWLLv_nYiSBjQsYR6sSefI"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#e9fdff]/80 to-transparent flex items-center p-8">
                <div className="max-w-sm space-y-2">
                  <h2 className="text-[32px] font-bold text-[#1c1b1b] drop-shadow-md leading-tight">
                    Seamless Delivery
                  </h2>
                  <p className="text-[16px] text-[#45474b]">
                    Manage all your shipments in one elegant space.
                  </p>
                </div>
              </div>
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              <div className="w-2 h-2 rounded-full bg-[#5d5e64]/30"></div>
              <div className="w-2 h-2 rounded-full bg-[#5d5e64]"></div>
            </div>
          </section>

          {/* Primary Actions Grid */}
          <section className="grid grid-cols-5 gap-4">
            <button className="bg-white/50 backdrop-blur-[20px] flex flex-col items-center justify-center gap-4 hover:scale-95 transition-transform duration-200 group rounded-2xl aspect-[3/4] p-4 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
              <div className="w-12 h-12 rounded-full bg-[#e9fdff] text-[#437b81] flex items-center justify-center group-hover:bg-[#2d666d] group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-2xl">add_box</span>
              </div>
              <span className="text-[14px] font-semibold tracking-[0.05em] text-center leading-none">Add Parcel</span>
            </button>
            <button className="bg-white/50 backdrop-blur-[20px] flex flex-col items-center justify-center gap-4 hover:scale-95 transition-transform duration-200 group rounded-2xl aspect-[3/4] p-4 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
              <div className="w-12 h-12 rounded-full bg-[#ffd1dc] text-[#7a5761] flex items-center justify-center group-hover:bg-[#78555e] group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-2xl">local_shipping</span>
              </div>
              <span className="text-[14px] font-semibold tracking-[0.05em] text-center leading-none">Pickup Request</span>
            </button>
            <button className="bg-white/50 backdrop-blur-[20px] flex flex-col items-center justify-center gap-4 hover:scale-95 transition-transform duration-200 group rounded-2xl aspect-[3/4] p-4 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
              <div className="w-12 h-12 rounded-full bg-[#e2e2e9] text-[#45474c] flex items-center justify-center group-hover:bg-[#5d5e64] group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-2xl">bolt</span>
              </div>
              <span className="text-[14px] font-semibold tracking-[0.05em] text-center leading-none">Express Delivery</span>
            </button>
            <Link href="/social-feed" className="bg-white/50 backdrop-blur-[20px] flex flex-col items-center justify-center gap-4 hover:scale-95 transition-transform duration-200 group rounded-2xl aspect-[3/4] p-4 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
              <div className="w-12 h-12 rounded-full bg-[#e0f7fa] text-[#00838f] flex items-center justify-center group-hover:bg-[#00838f] group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-2xl">public</span>
              </div>
              <span className="text-[14px] font-semibold tracking-[0.05em] text-center leading-none">Social Feed</span>
            </Link>
            <button className="bg-white/50 backdrop-blur-[20px] flex flex-col items-center justify-center gap-4 hover:scale-95 transition-transform duration-200 group rounded-2xl aspect-[3/4] p-4 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
              <div className="w-12 h-12 rounded-full bg-[#ffdad6] text-[#93000a] flex items-center justify-center group-hover:bg-[#ba1a1a] group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-2xl">sync_alt</span>
              </div>
              <span className="text-[14px] font-semibold tracking-[0.05em] text-center leading-none">Pick &amp; Drop</span>
            </button>
          </section>

          {/* Features Grid */}
          <section className="bg-white/50 backdrop-blur-[20px] rounded-xl p-6 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
            <div className="grid grid-cols-4 gap-y-8 gap-x-4">
              {(() => {
                const features = [
                  { icon: 'phone_iphone', label: 'Mobile Recharge', bg: 'bg-[#e9fdff]', text: 'text-[#2d666d]' },
                  { icon: 'directions_car', label: 'Easy Drive', bg: 'bg-[#e3f2fd]', text: 'text-[#1565c0]' },
                  { icon: 'storefront', label: 'Reselling', bg: 'bg-[#f3e5f5]', text: 'text-[#7b1fa2]', href: '/reseller-shop' },
                  { icon: 'business', label: 'Vendorship', bg: 'bg-[#e8eaf6]', text: 'text-[#3949ab]', href: '/vendor/apply' },
                  { icon: 'shopping_cart', label: 'Cart', bg: 'bg-[#ffd1dc]', text: 'text-[#78555e]', href: '/cart' },
                  { icon: 'local_shipping', label: 'My Orders', bg: 'bg-[#e9fdff]', text: 'text-[#2d666d]', href: '/reselling/orders' },
                  { icon: 'groups', label: 'Drive Pack', bg: 'bg-[#e0f7fa]', text: 'text-[#00838f]' },
                  { icon: 'receipt_long', label: 'Pay Bill', bg: 'bg-[#ffd1dc]', text: 'text-[#78555e]' },
                  { icon: 'send', label: 'Telegram Sell', bg: 'bg-[#e3f2fd]', text: 'text-[#1565c0]' },
                  { icon: 'mail', label: 'Gmail Sell', bg: 'bg-[#fce4ec]', text: 'text-[#c62828]' },
                  { icon: 'chat', label: 'WhatsApp Sell', bg: 'bg-[#e8f5e9]', text: 'text-[#2e7d32]' },
                  { icon: 'star', label: 'Premium Apps', bg: 'bg-[#fffde7]', text: 'text-[#f9a825]' },
                  { icon: 'task_alt', label: 'Micro Jobs', bg: 'bg-[#e9fdff]', text: 'text-[#2d666d]' },
                  { icon: 'share', label: 'Social Media', bg: 'bg-[#e0f7fa]', text: 'text-[#00838f]', href: '/social-feed' },
                  { icon: 'work', label: 'Job Post', bg: 'bg-[#e3f2fd]', text: 'text-[#1565c0]' },
                  { icon: 'keyboard', label: 'Typing Work', bg: 'bg-[#e8eaf6]', text: 'text-[#3949ab]' },
                  { icon: 'quiz', label: 'Quiz Work', bg: 'bg-[#f3e5f5]', text: 'text-[#7b1fa2]' },
                  { icon: 'calculate', label: 'Math Work', bg: 'bg-[#e0f7fa]', text: 'text-[#00838f]' },
                  { icon: 'code', label: 'Code Entry', bg: 'bg-[#e8f5e9]', text: 'text-[#2e7d32]' },
                  { icon: 'videocam', label: 'Video Ads', bg: 'bg-[#fce4ec]', text: 'text-[#c62828]' },
                  { icon: 'sports_soccer', label: 'Football Game', bg: 'bg-[#e8f5e9]', text: 'text-[#2e7d32]' },
                  { icon: 'sports', label: 'Carrom Game', bg: 'bg-[#fff3e0]', text: 'text-[#e65100]' },
                  { icon: 'card_giftcard', label: 'Welcome Bonus', bg: 'bg-[#ffd1dc]', text: 'text-[#78555e]' },
                  { icon: 'my_location', label: 'Target Bonus', bg: 'bg-[#fff3e0]', text: 'text-[#e65100]' },
                  { icon: 'date_range', label: 'Weekly Bonus', bg: 'bg-[#e8eaf6]', text: 'text-[#3949ab]' },
                  { icon: 'today', label: 'Daily Bonus', bg: 'bg-[#e9fdff]', text: 'text-[#2d666d]' },
                  { icon: 'calendar_month', label: 'Monthly Bonus', bg: 'bg-[#f3e5f5]', text: 'text-[#7b1fa2]' },
                  { icon: 'redeem', label: 'Gift Code', bg: 'bg-[#fffde7]', text: 'text-[#f9a825]' },
                  { icon: 'health_and_safety', label: 'Daily Service', bg: 'bg-[#fce4ec]', text: 'text-[#c62828]' },
                  { icon: 'bloodtype', label: 'Blood', bg: 'bg-[#fce4ec]', text: 'text-[#c62828]' },
                  { icon: 'store', label: 'Outlet', bg: 'bg-[#e9fdff]', text: 'text-[#2d666d]' },
                ];
                const visible = showAll ? features : features.slice(0, 12);
                return visible.map((item) => {
                  const content = (
                    <>
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${item.bg} ${item.text}`}>
                        <span className="material-symbols-outlined text-xl">{item.icon}</span>
                      </div>
                      <span className="text-xs font-semibold text-center text-[#45474b] leading-tight">{item.label}</span>
                    </>
                  );
                  if ('href' in item && item.href) {
                    return (
                      <Link key={item.label} href={item.href} className="flex flex-col items-center justify-start gap-3 hover:scale-105 transition-transform duration-200">
                        {content}
                      </Link>
                    );
                  }
                  return (
                    <button key={item.label} className="flex flex-col items-center justify-start gap-3 hover:scale-105 transition-transform duration-200">
                      {content}
                    </button>
                  );
                });
              })()}
            </div>
            {!showAll && (
              <button
                onClick={() => setShowAll(true)}
                className="mt-8 flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/60 backdrop-blur-[20px] border border-white/40 shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:bg-white/70 transition-all duration-300"
              >
                <span className="text-sm font-semibold text-[#45474b]">See More</span>
                <span className="material-symbols-outlined text-[#45474b] text-lg">expand_more</span>
              </button>
            )}
            {showAll && (
              <button
                onClick={() => setShowAll(false)}
                className="mt-8 flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/60 backdrop-blur-[20px] border border-white/40 shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:bg-white/70 transition-all duration-300"
              >
                <span className="text-sm font-semibold text-[#45474b]">Show Less</span>
                <span className="material-symbols-outlined text-[#45474b] text-lg">expand_less</span>
              </button>
            )}
          </section>

          {/* Bottom Grid (Support) */}
          <section className="bg-white/50 backdrop-blur-[20px] rounded-xl p-6 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
            <div className="grid grid-cols-4 gap-4">
              <button className="flex flex-col items-center justify-start gap-3 hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 rounded-full bg-[#e5e2e1] flex items-center justify-center text-[#2d666d]">
                  <span className="material-symbols-outlined">support_agent</span>
                </div>
                <span className="text-sm text-center text-[#45474b]">Support</span>
              </button>
              <button className="flex flex-col items-center justify-start gap-3 hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 rounded-full bg-[#e5e2e1] flex items-center justify-center text-[#78555e]">
                  <span className="material-symbols-outlined">pin_drop</span>
                </div>
                <span className="text-sm text-center text-[#45474b]">Pickup Points</span>
              </button>
              <button className="flex flex-col items-center justify-start gap-3 hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 rounded-full bg-[#e5e2e1] flex items-center justify-center text-[#5d5e64]">
                  <span className="material-symbols-outlined">map</span>
                </div>
                <span className="text-sm text-center text-[#45474b]">Coverage</span>
              </button>
              <button className="flex flex-col items-center justify-start gap-3 hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 rounded-full bg-[#e5e2e1] flex items-center justify-center text-[#5d5e64]">
                  <span className="material-symbols-outlined">calculate</span>
                </div>
                <span className="text-sm text-center text-[#45474b]">Pricing</span>
              </button>
            </div>
          </section>
        </main>

        {/* BottomNavBar - Mobile */}
        <nav className="md:hidden bg-white/60 backdrop-blur-[20px] fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.04)] z-50 flex justify-around items-center py-2 px-4 border border-white/30">
          {[
            { icon: 'home', active: true, href: '/dashboard', isButton: false },
            { icon: 'public', active: false, href: '/social-feed', isButton: false },
            { icon: 'search', active: false, href: '#', isButton: true },
            { icon: 'shopping_cart', active: false, href: '/cart', isButton: false },
            { icon: 'person', active: false, href: '/profile', isButton: false },
          ].map((item) => {
            if (item.isButton) {
              return (
                <button
                  key={item.icon}
                  onClick={() => setSearchOpen(true)}
                  className="flex flex-col items-center justify-center p-2 group"
                >
                  <div className="flex items-center justify-center rounded-full p-3 scale-90 transition-all duration-200 text-[#45474b] hover:bg-white/20">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>
                      {item.icon}
                    </span>
                  </div>
                  <span className="text-[14px] font-semibold tracking-[0.05em] text-xs mt-1 text-[#1c1b1b] opacity-0 h-0 group-hover:opacity-100 group-hover:h-auto transition-all">
                    {item.icon}
                  </span>
                </button>
              );
            }
            return (
              <Link key={item.icon} href={item.href} className="flex flex-col items-center justify-center p-2 group">
                <div className={`flex items-center justify-center rounded-full p-3 scale-90 transition-all duration-200 ${
                  item.active ? 'bg-[#1c1b1b] text-white' : 'text-[#45474b] hover:bg-white/20'
                }`}>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: item.active ? "'FILL' 1" : "'FILL' 0" }}>
                    {item.icon}
                  </span>
                </div>
                <span className="text-[14px] font-semibold tracking-[0.05em] text-xs mt-1 text-[#1c1b1b] opacity-0 h-0 group-hover:opacity-100 group-hover:h-auto transition-all">
                  home
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Search Overlay - Mobile */}
        <>
          <div className={`fixed inset-0 z-[100] transition-all duration-300 ease-in-out ${searchOpen ? '' : 'pointer-events-none'}`}>
            <div
              className={`absolute inset-0 cursor-pointer transition-opacity duration-300 ${searchOpen ? 'opacity-100' : 'opacity-0'}`}
              onClick={() => setSearchOpen(false)}
              style={{
                background: `radial-gradient(circle at 10% 20%, rgba(255, 217, 226, 0.4) 0%, transparent 40%),
                             radial-gradient(circle at 90% 80%, rgba(179, 236, 243, 0.4) 0%, transparent 40%),
                             radial-gradient(circle at 50% 50%, rgba(248, 248, 255, 1) 0%, transparent 100%)`,
                backgroundColor: '#f8f8ff',
              }}
            ></div>
            <header
              className={`relative h-full bg-white/60 backdrop-blur-2xl flex flex-col p-6 overflow-y-auto transition-transform duration-300 ease-out ${searchOpen ? 'translate-y-0' : '-translate-y-full'}`}
              style={{
                background: `radial-gradient(circle at 10% 20%, rgba(255, 217, 226, 0.4) 0%, transparent 40%),
                             radial-gradient(circle at 90% 80%, rgba(179, 236, 243, 0.4) 0%, transparent 40%),
                             radial-gradient(circle at 50% 50%, rgba(248, 248, 255, 1) 0%, transparent 100%)`,
                backgroundColor: '#f8f8ff',
              }}
            >
              {/* Top Search Bar */}
              <div className="flex items-center gap-4 bg-white/70 backdrop-blur-[30px] rounded-2xl px-4 py-3 border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
                <button onClick={() => setSearchOpen(false)} className="flex items-center justify-center text-[#45474b] hover:text-[#1c1b1b] transition-colors">
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <input
                  autoFocus
                  className="bg-transparent border-none focus:ring-0 flex-1 text-[16px] text-[#1c1b1b] outline-none placeholder:text-[#45474b]/60"
                  placeholder="Search services, parcels..."
                  type="text"
                />
                <button onClick={() => setSearchOpen(false)} className="flex items-center justify-center p-1 rounded-full hover:bg-white/40 transition-colors text-[#45474b]">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Suggestions Section */}
              <div className="mt-10 space-y-8">
                <div>
                  <h3 className="text-[14px] font-semibold tracking-[0.05em] text-[#45474b] uppercase tracking-widest mb-4 px-2 opacity-80">
                    Suggestions
                  </h3>
                  <div className="space-y-3">
                    <button className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/50 backdrop-blur-[20px] border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)] hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-300 text-left group">
                      <div className="w-12 h-12 rounded-full bg-[#e9fdff]/80 backdrop-blur-md text-[#2d666d] border border-white/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined">package_2</span>
                      </div>
                      <span className="text-[18px] font-semibold text-[#1c1b1b]">Track a Parcel</span>
                    </button>
                    <button className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/50 backdrop-blur-[20px] border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)] hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-300 text-left group">
                      <div className="w-12 h-12 rounded-full bg-[#ffd1dc]/80 backdrop-blur-md text-[#78555e] border border-white/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined">credit_card</span>
                      </div>
                      <span className="text-[18px] font-semibold text-[#1c1b1b]">Pay Invoice</span>
                    </button>
                    <button className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/50 backdrop-blur-[20px] border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)] hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-300 text-left group">
                      <div className="w-12 h-12 rounded-full bg-[#e2e2e9]/80 backdrop-blur-md text-[#5d5e64] border border-white/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined">location_on</span>
                      </div>
                      <span className="text-[18px] font-semibold text-[#1c1b1b]">Nearby Pickup</span>
                    </button>
                  </div>
                </div>

                {/* Recent Searches Section */}
                <div>
                  <h3 className="text-[14px] font-semibold tracking-[0.05em] text-[#45474b] uppercase tracking-widest mb-4 px-2 opacity-80">
                    Recent Searches
                  </h3>
                  <div className="flex flex-wrap gap-3 px-2">
                    <span className="px-5 py-2.5 bg-white/50 backdrop-blur-[20px] rounded-full text-[16px] text-[#45474b] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] cursor-pointer transition-all duration-300 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
                      Express delivery
                    </span>
                    <span className="px-5 py-2.5 bg-white/50 backdrop-blur-[20px] rounded-full text-[16px] text-[#45474b] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] cursor-pointer transition-all duration-300 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
                      Luna Glo Lamp
                    </span>
                    <span className="px-5 py-2.5 bg-white/50 backdrop-blur-[20px] rounded-full text-[16px] text-[#45474b] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] cursor-pointer transition-all duration-300 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
                      Shipping rates
                    </span>
                  </div>
                </div>
              </div>
            </header>
          </div>
        </>

        {/* Side Drawer */}
        <SideDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          user={user}
          vendorProfile={vendorProfile}
          handleLogout={handleLogout}
          copyReferCode={copyReferCode}
        />
      </div>
    </>
  );
}
