import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import AuthGuard from '@/shared/components/AuthGuard';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

const INCOME_CATEGORIES = [
  { keywords: ['recharge commission', 'drive pack commission'], label: 'Recharge', icon: 'phone_iphone', color: '#00a651' },
  { keywords: ['referral commission', 'level'], label: 'Referral', icon: 'group', color: '#6366f1' },
  { keywords: ['membership commission', 'membership'], label: 'Membership', icon: 'workspace_premium', color: '#f7941d' },
  { keywords: ['cashback'], label: 'Cashback', icon: 'redeem', color: '#ec4899' },
  { keywords: ['refund'], label: 'Refund', icon: 'replay', color: '#0ea5e9' },
  { keywords: ['fund', 'added', 'deposit'], label: 'Fund Add', icon: 'account_balance_wallet', color: '#0d9488' },
];

function getCategory(description: string) {
  const lower = description.toLowerCase();
  for (const cat of INCOME_CATEGORIES) {
    if (cat.keywords.some(k => lower.includes(k))) return cat;
  }
  return { label: 'Other', icon: 'payments', color: '#45474b' };
}

export default function WalletHistoryPage() {
  const router = useRouter();
  const { accessToken, logout } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('all');

  const fetchRef = useRef<{ token: string | null; timeRange: string }>({ token: accessToken, timeRange });
  fetchRef.current = { token: accessToken, timeRange };

  const fetchTransactions = useCallback(async () => {
    const { token, timeRange: currentRange } = fetchRef.current;
    if (!token) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/wallet/transactions?type=wallet&filter=${currentRange}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.status === 401) { await logout(); return; }
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.data.transactions);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [logout]);

  useEffect(() => {
    if (accessToken) {
      fetchTransactions();
    }
  }, [accessToken, filter, timeRange, fetchTransactions]);

  useEffect(() => {
    if (!accessToken) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchTransactions();
    };
    const handleFocus = () => fetchTransactions();
    const handleRouteChange = (url: string) => {
      if (url === '/wallet/history') fetchTransactions();
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [accessToken, fetchTransactions]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getTypeInfo = (type: string) => {
    if (type === 'wallet_credit') return { icon: 'south_east', color: '#2d666d', bg: '#e9fdff', label: 'Credit', positive: true };
    return { icon: 'north_east', color: '#ba1a1a', bg: '#ffdad6', label: 'Debit', positive: false };
  };

  const filtered = filter === 'all' ? transactions : transactions.filter(t => filter === 'credit' ? t.type.includes('credit') : t.type.includes('debit'));

  const incomeStats = useMemo(() => {
    const credits = transactions.filter(t => t.type.includes('credit'));
    const totalIncome = credits.reduce((sum, t) => sum + t.amount, 0);

    const categoryMap = new Map<string, { amount: number; count: number; label: string; icon: string; color: string }>();
    for (const tx of credits) {
      const cat = getCategory(tx.description);
      const existing = categoryMap.get(cat.label);
      if (existing) {
        existing.amount += tx.amount;
        existing.count += 1;
      } else {
        categoryMap.set(cat.label, { amount: tx.amount, count: 1, label: cat.label, icon: cat.icon, color: cat.color });
      }
    }

    const categories = Array.from(categoryMap.values()).sort((a, b) => b.amount - a.amount);
    return { totalIncome, totalCredits: credits.length, categories };
  }, [transactions]);

  const timeRangeLabel = useMemo(() => {
    const map: Record<string, string> = { all: 'All Time', today: 'Today', yesterday: 'Yesterday', '7d': 'Last 7 Days', '15d': 'Last 15 Days', '30d': 'Last 30 Days' };
    return map[timeRange] || 'All Time';
  }, [timeRange]);

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
        <title>Wallet History - Dreamy Life</title>
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
          <div className="text-lg font-extrabold tracking-tight text-[#1c1b1b]">Wallet History</div>
          <div className="w-10"></div>
        </header>

        {/* Mobile Top Bar */}
        <header className="md:hidden flex justify-between items-center px-6 py-5 sticky top-0 z-40 bg-white/60 backdrop-blur-xl border-b border-white/30">
          <Link href="/wallet" className="w-10 h-10 rounded-full flex items-center justify-center bg-white/50 border border-white/40 shadow-sm text-[#45474b]">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-lg font-extrabold tracking-tight text-[#1c1b1b]">Wallet History</h1>
          <div className="w-10"></div>
        </header>

        <main className="max-w-[1280px] mx-auto px-4 md:px-6 pt-4 md:pt-24 space-y-6">
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

          {/* Income Summary Card */}
          <div className="relative overflow-hidden rounded-3xl p-6 md:p-8" style={{
            background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 30%, #2dd4bf 60%, #5eead4 100%)',
            boxShadow: '0 20px 60px rgba(13,148,136,0.3), 0 8px 24px rgba(13,148,136,0.2)',
          }}>
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)', transform: 'translate(-20%, 30%)' }} />
            <div className="absolute top-1/2 right-1/4 w-20 h-20 rounded-full opacity-5" style={{ background: 'white', transform: 'translate(50%, -50%)' }} />

            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-xl">trending_up</span>
                  </div>
                  <div>
                    <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">Income Summary</p>
                    <p className="text-white/90 text-sm font-bold">{timeRangeLabel}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white/70 text-xs font-semibold">{incomeStats.totalCredits} transactions</p>
                </div>
              </div>

              {/* Total Income */}
              <div className="mb-6">
                <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1">Total Income</p>
                <p className="text-white text-4xl md:text-5xl font-extrabold tracking-tight" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  ৳{incomeStats.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              {/* Category Breakdown */}
              {incomeStats.categories.length > 0 && (
                <div className="space-y-2">
                  {incomeStats.categories.slice(0, 5).map((cat) => {
                    const percentage = incomeStats.totalIncome > 0 ? (cat.amount / incomeStats.totalIncome) * 100 : 0;
                    return (
                      <div key={cat.label} className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-white text-sm">{cat.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-white/80 text-xs font-semibold truncate">{cat.label}</span>
                            <span className="text-white text-xs font-bold ml-2">৳{cat.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                          <div className="h-1.5 bg-white/15 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-white/60 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {incomeStats.categories.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-white/50 text-sm">No income in this period</p>
                </div>
              )}
            </div>
          </div>

          {/* Transaction Type Tabs */}
          <div className="bg-white/60 backdrop-blur-md rounded-full p-1 flex border border-white/30">
            {[
              { key: 'all', label: 'All' },
              { key: 'credit', label: 'Credits' },
              { key: 'debit', label: 'Debits' },
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
                        {info.positive ? '+' : '-'}৳{tx.amount.toFixed(2)}
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
    </AuthGuard>
  );
}
