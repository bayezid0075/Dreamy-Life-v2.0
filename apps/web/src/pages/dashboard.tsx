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
  const [stats, setStats] = useState({ totalReferrals: 0, directReferrals: 0 });

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
        setStats(data.data.stats);
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
      <div className="min-h-screen bg-[#f8f8ff] flex items-center justify-center">
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
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
      `}</style>

      <div
        className="min-h-screen text-[#1c1b1b] font-['Plus_Jakarta_Sans'] overflow-x-hidden pb-32"
        style={{
          background: `radial-gradient(circle at 10% 20%, rgba(255, 217, 226, 0.4) 0%, transparent 40%),
                       radial-gradient(circle at 90% 80%, rgba(179, 236, 243, 0.4) 0%, transparent 40%),
                       radial-gradient(circle at 50% 50%, rgba(248, 248, 255, 1) 0%, transparent 100%)`,
          backgroundColor: '#f8f8ff',
        }}
      >
        {/* Top Bar - Desktop */}
        <header className="fixed top-0 left-0 w-full z-50 bg-white/70 backdrop-blur-[30px] border-b border-white/40 shadow-[0_20px_40px_rgba(0,0,0,0.06)] px-6 py-4 flex justify-between items-center hidden md:flex">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-[#5d5e64]" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
            <span className="text-lg font-extrabold">Dreamy Life</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#45474b]">{user?.username}</span>
            <span className="px-3 py-1 bg-[#f8f8ff] text-[#5d5e64] text-xs rounded-full flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
              {user?.memberStatus}
            </span>
          </div>
        </header>

        {/* Mobile Top Bar */}
        <header className="md:hidden flex justify-between items-center px-6 py-5 sticky top-0 z-40 bg-white/60 backdrop-blur-xl border-b border-white/30">
          <button onClick={() => setDrawerOpen(true)} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/50 border border-white/40 shadow-sm text-[#45474b]">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="text-lg font-extrabold">Dreamy Life</div>
          <div className="flex gap-2">
            <div className="w-10 h-10 rounded-full bg-white/50 border border-white/40 shadow-sm flex items-center justify-center text-[#45474b]">
              <span className="material-symbols-outlined">notifications</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-[1280px] mx-auto px-6 md:px-6 pt-8 md:pt-32 pb-24 space-y-8 relative z-10">
          {/* Welcome Banner */}
          <section className="bg-white/50 backdrop-blur-[20px] rounded-xl overflow-hidden relative border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
            <div className="aspect-[21/9] md:aspect-[21/6] bg-[#e5e2e1] relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#e9fdff]/80 to-transparent flex items-center p-8">
                <div className="max-w-sm space-y-2">
                  <h2 className="text-[32px] font-bold text-[#1c1b1b] drop-shadow-md">
                    Welcome, {user?.username}!
                  </h2>
                  <p className="text-[16px] text-[#45474b]">
                    Manage your account, referrals, and membership.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* User Profile Card */}
          <section className="bg-white/50 backdrop-blur-[20px] rounded-xl p-6 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
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
                  <span className="px-2 py-0.5 text-[10px] rounded-full flex items-center gap-1 bg-[#e9fdff] text-[#2d666d]">
                    <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    {user?.phoneNumber}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between bg-white/40 p-3 rounded-xl border border-white/50">
              <div>
                <span className="text-xs font-semibold text-[#45474b]">Referral Code: <span className="text-[#5d5e64] font-bold">{user?.ownRefercode}</span></span>
              </div>
              <button onClick={copyReferCode} className="text-[#5d5e64] hover:text-[#2d666d] transition-colors">
                <span className="material-symbols-outlined text-sm">content_copy</span>
              </button>
            </div>
          </section>

          {/* Stats Grid */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/50 backdrop-blur-[20px] rounded-xl p-5 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)] text-center">
              <span className="material-symbols-outlined text-[#5d5e64] text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
              <p className="text-[24px] font-bold text-[#1c1b1b] mt-1">{stats.totalReferrals}</p>
              <p className="text-xs text-[#45474b]">Total Referrals</p>
            </div>
            <div className="bg-white/50 backdrop-blur-[20px] rounded-xl p-5 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)] text-center">
              <span className="material-symbols-outlined text-[#2d666d] text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
              <p className="text-[24px] font-bold text-[#1c1b1b] mt-1">{stats.directReferrals}</p>
              <p className="text-xs text-[#45474b]">Direct</p>
            </div>
            <div className="bg-white/50 backdrop-blur-[20px] rounded-xl p-5 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)] text-center">
              <span className="material-symbols-outlined text-[#78555e] text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>card_membership</span>
              <p className="text-[24px] font-bold text-[#1c1b1b] mt-1 capitalize">{user?.memberStatus}</p>
              <p className="text-xs text-[#45474b]">Membership</p>
            </div>
            <div className="bg-white/50 backdrop-blur-[20px] rounded-xl p-5 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)] text-center">
              <span className="material-symbols-outlined text-[#ba1a1a] text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>share</span>
              <p className="text-[24px] font-bold text-[#1c1b1b] mt-1">{user?.ownRefercode}</p>
              <p className="text-xs text-[#45474b]">Your Refer Code</p>
            </div>
          </section>

          {/* Quick Actions */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/referral" className="bg-white/50 backdrop-blur-[20px] flex flex-col items-center justify-center hover:scale-95 transition-transform duration-200 group rounded-2xl h-28 p-4 gap-2 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
              <div className="w-12 h-12 rounded-full bg-[#e9fdff] text-[#2d666d] flex items-center justify-center group-hover:bg-[#2d666d] group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-2xl">group</span>
              </div>
              <span className="text-xs font-semibold text-center">Referral Team</span>
            </Link>
            <Link href="/membership" className="bg-white/50 backdrop-blur-[20px] flex flex-col items-center justify-center hover:scale-95 transition-transform duration-200 group rounded-2xl h-28 p-4 gap-2 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
              <div className="w-12 h-12 rounded-full bg-[#ffd1dc] text-[#78555e] flex items-center justify-center group-hover:bg-[#78555e] group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-2xl">card_membership</span>
              </div>
              <span className="text-xs font-semibold text-center">Membership</span>
            </Link>
            <div className="bg-white/50 backdrop-blur-[20px] flex flex-col items-center justify-center hover:scale-95 transition-transform duration-200 group rounded-2xl h-28 p-4 gap-2 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
              <div className="w-12 h-12 rounded-full bg-[#f8f8ff] text-[#5d5e64] flex items-center justify-center group-hover:bg-[#5d5e64] group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
              </div>
              <span className="text-xs font-semibold text-center">Wallet</span>
            </div>
            <div className="bg-white/50 backdrop-blur-[20px] flex flex-col items-center justify-center hover:scale-95 transition-transform duration-200 group rounded-2xl h-28 p-4 gap-2 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
              <div className="w-12 h-12 rounded-full bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center group-hover:bg-[#ba1a1a] group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-2xl">support_agent</span>
              </div>
              <span className="text-xs font-semibold text-center">Support</span>
            </div>
          </section>

          {/* Bottom Navigation Grid */}
          <section className="bg-white/50 backdrop-blur-[20px] rounded-xl p-6 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
            <div className="grid grid-cols-4 gap-y-8 gap-x-4">
              {[
                { icon: 'inventory_2', label: 'Parcels' },
                { icon: 'receipt_long', label: 'Summary' },
                { icon: 'payments', label: 'Payments' },
                { icon: 'confirmation_number', label: 'Tickets' },
              ].map((item) => (
                <button key={item.label} className="flex flex-col items-center justify-start gap-3 hover:opacity-80 transition-opacity">
                  <div className="w-10 h-10 rounded-full bg-[#e5e2e1] flex items-center justify-center text-[#5d5e64]">
                    <span className="material-symbols-outlined">{item.icon}</span>
                  </div>
                  <span className="text-sm text-center text-[#45474b]">{item.label}</span>
                </button>
              ))}
            </div>
          </section>
        </main>

        {/* Bottom Navigation - Mobile */}
        <nav className="md:hidden bg-white/60 backdrop-blur-[20px] fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.04)] z-50 flex justify-around items-center py-2 px-4 border border-white/30">
          {[
            { icon: 'home', active: true, href: '/dashboard' },
            { icon: 'search', active: false, href: '#' },
            { icon: 'shopping_cart', active: false, href: '#' },
            { icon: 'person', active: false, href: '#' },
          ].map((item) => (
            <Link key={item.icon} href={item.href} className={`flex flex-col items-center justify-center p-2 group ${item.active ? '' : 'text-[#45474b]'}`}>
              <div className={`flex items-center justify-center rounded-full p-3 ${item.active ? 'bg-[#1c1b1b] text-white' : ''}`}>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: item.active ? "'FILL' 1" : "'FILL' 0" }}>{item.icon}</span>
              </div>
            </Link>
          ))}
        </nav>

        {/* Side Drawer */}
        <>
          {/* Overlay */}
          <div
            className={`fixed inset-0 z-[60] transition-all duration-500 ease-in-out ${drawerOpen ? '' : 'pointer-events-none'}`}
          >
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
                <div className="rounded-2xl p-5 mb-8 relative overflow-hidden shadow-lg" style={{
                  background: `radial-gradient(circle at 10% 20%, rgba(255, 217, 226, 0.4) 0%, transparent 40%),
                               radial-gradient(circle at 90% 80%, rgba(179, 236, 243, 0.4) 0%, transparent 40%),
                               radial-gradient(circle at 50% 50%, rgba(248, 248, 255, 1) 0%, transparent 100%)`,
                  backgroundColor: '#f8f8ff',
                }}>
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
                      <span className="text-xs font-semibold text-[#45474b]">Refer: <span className="text-[#5d5e64]">{user?.ownRefercode}</span></span>
                      <button onClick={copyReferCode}>
                        <span className="material-symbols-outlined text-sm cursor-pointer">content_copy</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
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
                      <div className="flex items-center gap-4 px-4 py-3 rounded-xl text-[#45474b] hover:bg-black/5 transition-all">
                        <span className="material-symbols-outlined">account_balance_wallet</span>
                        <span>Wallet</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Logout */}
                <button onClick={handleLogout} className="mt-auto flex items-center justify-center gap-3 w-full py-4 bg-[#ffdad6]/50 text-[#ba1a1a] rounded-2xl font-bold border border-[#ba1a1a]/10 hover:bg-[#ba1a1a] hover:text-white transition-all">
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
