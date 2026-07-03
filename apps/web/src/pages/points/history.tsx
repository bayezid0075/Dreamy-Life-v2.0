import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

export default function PointsHistoryPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated, clearAuth } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallet, setWallet] = useState<{ pointsBalance: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('all');

  const fetchRef = useRef<{ token: string | null; timeRange: string }>({ token: accessToken, timeRange });
  fetchRef.current = { token: accessToken, timeRange };

  const fetchData = useCallback(async () => {
    const { token, timeRange: currentRange } = fetchRef.current;
    if (!token) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const [walletRes, txRes] = await Promise.all([
        fetch(`${apiUrl}/wallet`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(
          `${apiUrl}/wallet/transactions?type=points&filter=${currentRange}`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
      ]);
      if (walletRes.status === 401 || txRes.status === 401) { clearAuth(); router.replace('/login'); return; }
      if (walletRes.ok) { const d = await walletRes.json(); setWallet(d.data.wallet); }
      if (txRes.ok) { const d = await txRes.json(); setTransactions(d.data.transactions); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [clearAuth, router]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      router.replace('/login');
      return;
    }
    fetchData();
  }, [isAuthenticated, accessToken, filter, timeRange, fetchData]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchData();
    };
    const handleFocus = () => fetchData();
    const handleRouteChange = (url: string) => {
      if (url === '/points/history') fetchData();
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [isAuthenticated, accessToken, fetchData]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getTypeInfo = (type: string) => {
    if (type === 'point_earned') return { icon: 'south_east', color: '#2d666d', bg: '#e9fdff', label: 'Earned', positive: true };
    return { icon: 'north_east', color: '#ba1a1a', bg: '#ffdad6', label: 'Spent', positive: false };
  };

  const filtered = filter === 'all' ? transactions : transactions.filter(t => filter === 'earned' ? t.type.includes('earned') : t.type.includes('spent'));

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
        <title>Points History - Dreamy Life</title>
      </Head>
      <style>{`
        body { min-height: max(884px, 100dvh); }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div
        className="min-h-screen overflow-x-hidden pb-32 selection:bg-[#ffd1dc] selection:text-[#1c1b1b]"
        style={{
          background: `radial-gradient(circle at 10% 20%, rgba(255, 217, 226, 0.4) 0%, transparent 40%),
                       radial-gradient(circle at 90% 80%, rgba(179, 236, 243, 0.4) 0%, transparent 40%),
                       radial-gradient(circle at 50% 50%, rgba(248, 248, 255, 1) 0%, transparent 100%)`,
          backgroundColor: '#f8f8ff',
          fontFamily: 'Plus Jakarta Sans, sans-serif',
        }}
      >
        {/* TopAppBar - Desktop */}
        <header className="fixed top-0 left-0 w-full z-50 bg-white/70 backdrop-blur-[30px] border-b border-white/40 shadow-[0_20px_40px_rgba(0,0,0,0.06)] px-6 py-4 hidden md:flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/wallet" className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/40 transition-colors text-[#45474b]">
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
          </div>
          <div className="text-lg font-extrabold tracking-tight text-[#1c1b1b]">Points History</div>
          <div className="w-10"></div>
        </header>

        {/* Mobile Top Bar */}
        <header className="md:hidden flex justify-between items-center px-6 py-5 sticky top-0 z-40 bg-white/60 backdrop-blur-xl border-b border-white/30">
          <Link href="/wallet" className="w-10 h-10 rounded-full flex items-center justify-center bg-white/50 border border-white/40 shadow-sm text-[#45474b]">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-lg font-extrabold tracking-tight text-[#1c1b1b]">Points History</h1>
          <div className="w-10"></div>
        </header>

        <main className="max-w-[1280px] mx-auto px-4 md:px-6 pt-6 space-y-6">
          {/* Total Points Display */}
          <div className="bg-white/60 backdrop-blur-xl rounded-xl p-8 flex flex-col items-center justify-center text-center border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
            <span className="text-sm font-bold text-[#45474b] mb-3 uppercase tracking-widest">Available Balance</span>
            <div className="flex items-center justify-center gap-3">
              <span className="material-symbols-outlined text-[#2d666d] text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
              <span className="text-[40px] font-extrabold text-[#1c1b1b]">{wallet?.pointsBalance?.toLocaleString() || '0'}</span>
            </div>
          </div>

          {/* Time Range Filters */}
          <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2">
            {['all', 'today', 'yesterday', '7d', '15d', '30d'].map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  timeRange === range
                    ? 'bg-[#1c1b1b] text-white shadow-sm'
                    : 'bg-white/60 backdrop-blur-md text-[#45474b] hover:text-[#1c1b1b] border border-white/30'
                }`}
              >
                {range === 'all' ? 'All Time' : range === '7d' ? '7 Days' : range === '15d' ? '15 Days' : range === '30d' ? '30 Days' : range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>

          {/* Transaction Type Tabs */}
          <div className="bg-white/60 backdrop-blur-md rounded-full p-1 flex border border-white/30">
            {[
              { key: 'all', label: 'All' },
              { key: 'earned', label: 'Earned' },
              { key: 'spent', label: 'Spent' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex-1 py-2 text-center rounded-full text-sm font-semibold transition-all ${
                  filter === tab.key ? 'bg-white shadow-sm text-[#1c1b1b]' : 'text-[#45474b] hover:text-[#1c1b1b]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Transactions */}
          <div className="space-y-4">
            {filtered.length === 0 ? (
              <div className="text-center py-10 text-[#45474b]">No transactions found</div>
            ) : (
              filtered.map(tx => {
                const info = getTypeInfo(tx.type);
                return (
                  <div key={tx.id} className="bg-white/50 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)] hover:bg-white/70 transition-colors cursor-pointer">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: info.bg }}>
                      <span className="material-symbols-outlined" style={{ color: info.color }}>{info.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[16px] font-bold text-[#1c1b1b] truncate">{tx.description}</h3>
                      <p className="text-sm font-semibold text-[#45474b] mt-1">{formatDate(tx.createdAt)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[18px] font-bold" style={{ color: info.color }}>
                        {info.positive ? '+' : '-'}{tx.amount.toFixed(0)}
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: info.bg, color: info.color }}>
                        {info.label}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>
      </div>
    </>
  );
}
