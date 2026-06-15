import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export default function DashboardPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated, clearAuth } = useAuthStore();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      router.replace('/login');
      return;
    }
    fetchUser(accessToken);
  }, [isAuthenticated, accessToken, router]);

  const fetchUser = async (token: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.data.user);
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
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
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
        <header className="fixed top-0 left-0 w-full z-50 bg-white/70 backdrop-blur-[30px] border-b border-white/40 shadow-[0_20px_40px_rgba(0,0,0,0.06)] px-6 py-4 flex justify-between items-center hidden md:flex">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#e5e2e1] overflow-hidden">
              <img
                alt="User Avatar"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC8VJBubFq2WsSNxWaWY2MkbBsQ5atSANwKw-mD9h9fOc28g3crPE8wgBS9cjPJ-2baMdLS6kWjFhhZbdOvuDOZ-s8wCLMrUangK6NAjMHhDpaY7_bjT_7Ez_6l1kX3wFPSYf1G1LBBAcIrEzBfTv3Q55bbyUL-K2DS-2jeM5Y4oemjyRzvcNMmE6NBRPSA8WWg9s-mLGjrdf5BygttLeHVHfL0pGXW2OfFZ7gJBYZTTJZubsMB9OaqMEZbqiTv4l_3tUsI9l5b1znu"
              />
            </div>
          </div>
          <div className="text-lg font-extrabold tracking-tight text-[#1c1b1b]">
            Dreamy Life
          </div>
          <button
            onClick={() => router.push('/notifications')}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/40 transition-colors text-[#45474b]"
          >
            <span className="material-symbols-outlined">notifications</span>
          </button>
        </header>

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
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white/50 border border-white/40 shadow-sm text-[#45474b]"
            >
              <span className="material-symbols-outlined">notifications</span>
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
          <section className="grid grid-cols-4 gap-4">
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
            <button className="bg-white/50 backdrop-blur-[20px] flex flex-col items-center justify-center gap-4 hover:scale-95 transition-transform duration-200 group rounded-2xl aspect-[3/4] p-4 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
              <div className="w-12 h-12 rounded-full bg-[#ffdad6] text-[#93000a] flex items-center justify-center group-hover:bg-[#ba1a1a] group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-2xl">sync_alt</span>
              </div>
              <span className="text-[14px] font-semibold tracking-[0.05em] text-center leading-none">Pick &amp; Drop</span>
            </button>
          </section>

          {/* Secondary Features Grid */}
          <section className="bg-white/50 backdrop-blur-[20px] rounded-xl p-6 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
            <div className="grid grid-cols-4 gap-y-8 gap-x-4">
              {[
                { icon: 'inventory_2', label: 'Parcels', color: 'primary' },
                { icon: 'receipt_long', label: 'Summary', color: 'primary' },
                { icon: 'payments', label: 'Payments', color: 'primary' },
                { icon: 'account_balance_wallet', label: 'Add Balance', color: 'primary' },
                { icon: 'move_up', label: 'Latest RTNs', color: 'primary' },
                { icon: 'cancel', label: 'Cancellation', color: 'error' },
                { icon: 'gpp_maybe', label: 'Fraud Check', color: 'primary' },
                { icon: 'confirmation_number', label: 'Tickets', color: 'primary' },
              ].map((item) => (
                <button key={item.label} className="flex flex-col items-center justify-start gap-3 hover:opacity-80 transition-opacity">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    item.color === 'error'
                      ? 'bg-[#ffdad6] text-[#93000a]'
                      : 'bg-[#e5e2e1] text-[#5d5e64]'
                  }`}>
                    <span className="material-symbols-outlined">{item.icon}</span>
                  </div>
                  <span className="text-sm text-center text-[#45474b]">{item.label}</span>
                </button>
              ))}
            </div>
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
            { icon: 'search', active: false, href: '#', isButton: true },
            { icon: 'shopping_cart', active: false, href: '#', isButton: false },
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
              className={`relative h-full md:hidden bg-white/60 backdrop-blur-2xl flex flex-col p-6 overflow-y-auto transition-transform duration-300 ease-out ${searchOpen ? 'translate-y-0' : '-translate-y-full'}`}
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
        <>
          <div className={`fixed inset-0 z-[60] transition-all duration-500 ease-in-out ${drawerOpen ? '' : 'pointer-events-none'}`}>
            <div
              className={`absolute inset-0 bg-black/40 backdrop-blur-sm cursor-pointer transition-opacity duration-500 ${drawerOpen ? 'opacity-100' : 'opacity-0'}`}
              onClick={() => setDrawerOpen(false)}
            ></div>
            <div
              className={`absolute top-0 left-0 h-full w-[320px] bg-white/70 backdrop-blur-3xl border-r border-white/30 flex flex-col transition-transform duration-500 ease-out ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
              <div className="p-6 flex flex-col h-full">
                {/* Drawer Header */}
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-[#5d5e64]">Dreamy Life</span>
                  </div>
                  <button onClick={() => setDrawerOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors">
                    <span className="material-symbols-outlined text-[#45474b]">close</span>
                  </button>
                </div>

                {/* User Info Card */}
                <div
                  className="rounded-2xl p-5 mb-8 relative overflow-hidden shadow-lg"
                  style={{
                    background: `radial-gradient(circle at 10% 20%, rgba(255, 217, 226, 0.4) 0%, transparent 40%),
                                 radial-gradient(circle at 90% 80%, rgba(179, 236, 243, 0.4) 0%, transparent 40%),
                                 radial-gradient(circle at 50% 50%, rgba(248, 248, 255, 1) 0%, transparent 100%)`,
                    backgroundColor: '#f8f8ff',
                  }}
                >
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 rounded-full bg-[#f8f8ff] border-2 border-white shadow-md flex items-center justify-center">
                        <span className="material-symbols-outlined text-[#5d5e64] text-3xl">person</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-[#1c1b1b]">{user?.username}</h3>
                        <div className="flex gap-1.5 mt-1">
                          <span className="px-2 py-0.5 bg-[#f8f8ff] text-[#5d5e64] text-[10px] rounded-full flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                            {user?.memberStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-white/40 p-2.5 rounded-xl border border-white/50">
                      <span className="text-xs font-semibold text-[#45474b]">
                        Refer: <span className="text-[#5d5e64]">{user?.ownRefercode}</span>
                      </span>
                      <button onClick={copyReferCode}>
                        <span className="material-symbols-outlined text-sm cursor-pointer">content_copy</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                  <div>
                    <h4 className="text-xs font-bold text-[#45474b]/50 uppercase tracking-widest px-4 mb-3">Main</h4>
                    <div className="space-y-1">
                      <Link href="/dashboard" className="flex items-center gap-4 px-4 py-3 rounded-xl bg-[#f8f8ff] text-[#5d5e64] transition-all">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
                        <span className="font-semibold">Dashboard</span>
                      </Link>
                      <Link href="/referral" className="flex items-center gap-4 px-4 py-3 rounded-xl text-[#45474b] hover:bg-black/5 transition-all">
                        <span className="material-symbols-outlined">share</span>
                        <span>Referral</span>
                      </Link>
                      <Link href="/membership" className="flex items-center gap-4 px-4 py-3 rounded-xl text-[#45474b] hover:bg-black/5 transition-all">
                        <span className="material-symbols-outlined">card_membership</span>
                        <span>Membership</span>
                      </Link>
                      <Link href="/wallet" className="flex items-center gap-4 px-4 py-3 rounded-xl text-[#45474b] hover:bg-black/5 transition-all">
                        <span className="material-symbols-outlined">account_balance_wallet</span>
                        <span>Wallet</span>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="mt-auto flex items-center justify-center gap-3 w-full py-4 bg-[#ffdad6]/50 text-[#ba1a1a] rounded-2xl font-bold border border-[#ba1a1a]/10 hover:bg-[#ba1a1a] hover:text-white transition-all"
                >
                  <span className="material-symbols-outlined">logout</span>
                  Logout
                </button>
                <div className="text-center mt-4 text-[10px] text-[#45474b]/40">v1.0.0</div>
              </div>
            </div>
          </div>
        </>
      </div>
    </>
  );
}
