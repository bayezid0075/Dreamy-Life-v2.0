import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

interface WalletData {
  walletBalance: number;
  fundsBalance: number;
  pointsBalance: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

export default function WalletPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated, clearAuth } = useAuthStore();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      router.replace('/login');
      return;
    }
    fetchData();
  }, [isAuthenticated, accessToken, router, filter]);

  const fetchData = async () => {
    try {
      const [walletRes, txRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/wallet`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/wallet/transactions?type=${filter}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);

      if (walletRes.status === 401 || txRes.status === 401) {
        clearAuth();
        router.replace('/login');
        return;
      }

      if (walletRes.ok) {
        const wData = await walletRes.json();
        setWallet(wData.data.wallet);
      }
      if (txRes.ok) {
        const tData = await txRes.json();
        setTransactions(tData.data.transactions);
      }
    } catch (err) {
      console.error('Failed to fetch wallet data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFunds = async () => {
    const amount = parseFloat(addAmount);
    if (!amount || amount <= 0 || !accessToken) return;
    setAdding(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/wallet/add-funds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ amount }),
      });
      if (res.ok) {
        setAddFundsOpen(false);
        setAddAmount('');
        fetchData();
      }
    } catch (err) {
      console.error('Failed to add funds', err);
    } finally {
      setAdding(false);
    }
  };

  const getTypeInfo = (type: string) => {
    const map: Record<string, { icon: string; color: string; bg: string; label: string; positive: boolean }> = {
      wallet_credit: { icon: 'south_east', color: '#2d666d', bg: '#e9fdff', label: 'Credit', positive: true },
      wallet_debit: { icon: 'north_east', color: '#ba1a1a', bg: '#ffdad6', label: 'Debit', positive: false },
      fund_credit: { icon: 'south_east', color: '#2d666d', bg: '#e9fdff', label: 'Credit', positive: true },
      fund_debit: { icon: 'north_east', color: '#ba1a1a', bg: '#ffdad6', label: 'Debit', positive: false },
      point_earned: { icon: 'south_east', color: '#2d666d', bg: '#e9fdff', label: 'Earned', positive: true },
      point_spent: { icon: 'north_east', color: '#ba1a1a', bg: '#ffdad6', label: 'Spent', positive: false },
    };
    return map[type] || map.wallet_credit;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const walletIncome = transactions.filter(t => t.type === 'wallet_credit').reduce((s, t) => s + t.amount, 0);
  const walletExpense = transactions.filter(t => t.type === 'wallet_debit').reduce((s, t) => s + t.amount, 0);
  const fundsIncome = transactions.filter(t => t.type === 'fund_credit').reduce((s, t) => s + t.amount, 0);
  const fundsExpense = transactions.filter(t => t.type === 'fund_debit').reduce((s, t) => s + t.amount, 0);
  const pointsEarned = transactions.filter(t => t.type === 'point_earned').reduce((s, t) => s + t.amount, 0);
  const pointsSpent = transactions.filter(t => t.type === 'point_spent').reduce((s, t) => s + t.amount, 0);

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
        <title>Dreamy Life - Wallet</title>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        body { min-height: max(884px, 100dvh); }
        .gradient-wallet { background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); }
        .gradient-funds { background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%); }
        .gradient-points { background: linear-gradient(135deg, #f97316 0%, #f43f5e 100%); }
        .grid-overlay {
          background-size: 20px 20px;
          background-image: linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px);
        }
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
          color: '#1c1b1b',
          fontFamily: 'Plus Jakarta Sans, sans-serif',
        }}
      >
        {/* TopAppBar - Desktop */}
        <header className="fixed top-0 left-0 w-full z-50 bg-white/70 backdrop-blur-[30px] border-b border-white/40 shadow-[0_20px_40px_rgba(0,0,0,0.06)] px-6 py-4 hidden md:flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/40 transition-colors text-[#45474b]">
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
          </div>
          <div className="text-lg font-extrabold tracking-tight text-[#1c1b1b]">Wallet</div>
          <div className="w-10"></div>
        </header>

        {/* Mobile Top Bar */}
        <header className="md:hidden flex justify-between items-center px-6 py-5 sticky top-0 z-40 bg-white/60 backdrop-blur-xl border-b border-white/30">
          <Link href="/dashboard" className="w-10 h-10 rounded-full flex items-center justify-center bg-white/50 border border-white/40 shadow-sm text-[#45474b]">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-lg font-extrabold tracking-tight text-[#1c1b1b]">Wallet</h1>
          <div className="w-10"></div>
        </header>

        <main className="max-w-[1280px] mx-auto px-4 md:px-6 pt-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div>
              <h1 className="text-[32px] font-extrabold tracking-tight text-[#1c1b1b]">Wallet</h1>
              <p className="text-[16px] text-[#45474b]">Manage your financial accounts</p>
            </div>
          </div>

          {/* Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Wallet Card */}
            <div className="gradient-wallet text-white rounded-[2rem] p-6 relative overflow-hidden shadow-[0_20px_40px_rgba(236,72,153,0.15)] flex flex-col justify-between min-h-[220px]">
              <div className="grid-overlay absolute inset-0 mix-blend-overlay"></div>
              <div className="relative z-10 flex justify-between items-start">
                <h2 className="text-[24px] font-bold">Wallet</h2>
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <span className="material-symbols-outlined">account_balance_wallet</span>
                </div>
              </div>
              <div className="relative z-10 mt-4">
                <div className="text-[40px] font-extrabold leading-none">৳{wallet?.walletBalance?.toFixed(2) || '0.00'}</div>
                <p className="text-sm opacity-80 mt-1">Commission & referral earnings</p>
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="flex items-center gap-1 opacity-80">
                    <span className="material-symbols-outlined text-[16px]">south_east</span> ৳{walletIncome.toFixed(2)}
                  </span>
                  <span className="flex items-center gap-1 opacity-80">
                    <span className="material-symbols-outlined text-[16px]">north_east</span> ৳{walletExpense.toFixed(2)}
                  </span>
                </div>
              </div>
              <Link href="/wallet/history" className="relative z-10 mt-6 w-full py-3 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 transition-colors text-sm font-semibold flex justify-center items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">history</span> History
              </Link>
            </div>

            {/* Funds Card */}
            <div className="gradient-funds text-white rounded-[2rem] p-6 relative overflow-hidden shadow-[0_20px_40px_rgba(6,182,212,0.15)] flex flex-col justify-between min-h-[220px]">
              <div className="grid-overlay absolute inset-0 mix-blend-overlay"></div>
              <div className="relative z-10 flex justify-between items-start">
                <h2 className="text-[24px] font-bold">Funds</h2>
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <span className="material-symbols-outlined">payments</span>
                </div>
              </div>
              <div className="relative z-10 mt-4">
                <div className="text-[40px] font-extrabold leading-none">৳{wallet?.fundsBalance?.toFixed(2) || '0.00'}</div>
                <p className="text-sm opacity-80 mt-1">Funds account balance</p>
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="flex items-center gap-1 opacity-80">
                    <span className="material-symbols-outlined text-[16px]">south_east</span> ৳{fundsIncome.toFixed(2)}
                  </span>
                  <span className="flex items-center gap-1 opacity-80">
                    <span className="material-symbols-outlined text-[16px]">north_east</span> ৳{fundsExpense.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="relative z-10 mt-6 grid grid-cols-2 gap-3">
                <Link href="/funds/history" className="py-3 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 transition-colors text-sm font-semibold flex justify-center items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">history</span> History
                </Link>
                <button onClick={() => setAddFundsOpen(true)} className="py-3 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 transition-colors text-sm font-semibold flex justify-center items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">add_circle</span> Add Funds
                </button>
              </div>
            </div>

            {/* Points Card */}
            <div className="gradient-points text-white rounded-[2rem] p-6 relative overflow-hidden shadow-[0_20px_40px_rgba(249,115,22,0.15)] flex flex-col justify-between min-h-[220px]">
              <div className="grid-overlay absolute inset-0 mix-blend-overlay"></div>
              <div className="relative z-10 flex justify-between items-start">
                <h2 className="text-[24px] font-bold">Points</h2>
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <span className="material-symbols-outlined">star</span>
                </div>
              </div>
              <div className="relative z-10 mt-4">
                <div className="text-[40px] font-extrabold leading-none">৳{wallet?.pointsBalance?.toFixed(2) || '0.00'}</div>
                <p className="text-sm opacity-80 mt-1">Reward points balance</p>
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="flex items-center gap-1 opacity-80">
                    <span className="material-symbols-outlined text-[16px]">south_east</span> ৳{pointsEarned.toFixed(2)}
                  </span>
                  <span className="flex items-center gap-1 opacity-80">
                    <span className="material-symbols-outlined text-[16px]">north_east</span> ৳{pointsSpent.toFixed(2)}
                  </span>
                </div>
              </div>
              <Link href="/points/history" className="relative z-10 mt-6 w-full py-3 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 transition-colors text-sm font-semibold flex justify-center items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">history</span> History
              </Link>
            </div>
          </div>

          {/* Withdraw & Transactions */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Withdraw Section */}
            <div className="lg:col-span-5">
              <div className="bg-white/50 backdrop-blur-[20px] rounded-[2rem] p-6 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
                <h3 className="text-[24px] font-bold text-[#1c1b1b] mb-1">Withdraw</h3>
                <p className="text-sm text-[#45474b] mb-6">Transfer funds to your bank account</p>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-[#45474b] uppercase tracking-wider mb-2 block">Amount</label>
                    <div className="bg-white/40 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/30 flex items-center">
                      <span className="text-[#5d5e64] font-bold mr-2">৳</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        className="bg-transparent border-none focus:ring-0 flex-1 text-[18px] font-bold text-[#1c1b1b] outline-none placeholder:text-[#45474b]/40"
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[100, 500, 1000].map(amt => (
                      <button key={amt} className="py-2 rounded-full bg-white/40 hover:bg-white/60 border border-white/30 text-sm font-semibold text-[#45474b] transition-colors" disabled>
                        ৳{amt}
                      </button>
                    ))}
                  </div>
                  <button className="w-full py-3 rounded-full bg-[#1c1b1b]/10 text-[#45474b]/50 font-semibold text-sm cursor-not-allowed" disabled>
                    Withdraw Coming Soon
                  </button>
                </div>
              </div>
            </div>

            {/* Transactions Section */}
            <div className="lg:col-span-7">
              <div className="bg-white/50 backdrop-blur-[20px] rounded-[2rem] p-6 lg:p-8 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
                <h3 className="text-[24px] font-bold text-[#1c1b1b] mb-1">Transactions</h3>
                <p className="text-sm text-[#45474b] mb-6">View your transaction history</p>

                {/* Filter Tabs */}
                <div className="flex p-1 bg-[#eae7e7] rounded-full mb-6 overflow-x-auto hide-scrollbar gap-1">
                  {[
                    { key: 'all', icon: 'grid_view', label: 'All' },
                    { key: 'wallet', icon: 'account_balance_wallet', label: 'Wallet' },
                    { key: 'funds', icon: 'payments', label: 'Funds' },
                    { key: 'points', icon: 'star', label: 'Points' },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => { setFilter(tab.key); }}
                      className={`flex-none min-w-[90px] py-2 px-4 rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                        filter === tab.key
                          ? 'bg-[#a855f7] text-white shadow-sm'
                          : 'text-[#45474b] hover:text-[#1c1b1b] hover:bg-white/50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">{tab.icon}</span> {tab.label}
                    </button>
                  ))}
                </div>

                {/* Transaction List */}
                <div className="space-y-3">
                  {transactions.length === 0 ? (
                    <div className="text-center py-10 text-[#45474b]">No transactions found</div>
                  ) : (
                    transactions.map(tx => {
                      const info = getTypeInfo(tx.type);
                      return (
                        <div key={tx.id} className="bg-white/40 backdrop-blur-md hover:bg-white/60 border border-white/40 rounded-2xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 transition-all cursor-pointer group">
                          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: info.bg, color: info.color }}>
                            <span className="material-symbols-outlined text-[20px]">{info.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-0.5">
                              <h4 className="text-sm font-semibold text-[#1c1b1b] truncate max-w-[120px] sm:max-w-none">{tx.description}</h4>
                              <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: info.bg, color: info.color }}>
                                {info.label}
                              </span>
                            </div>
                            <p className="text-xs text-[#45474b]">{formatDate(tx.createdAt)}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-[16px] font-bold whitespace-nowrap" style={{ color: info.color }}>
                              {info.positive ? '+' : '-'}৳{tx.amount.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Add Funds Modal */}
        {addFundsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setAddFundsOpen(false)}></div>
            <div className="relative bg-white/80 backdrop-blur-3xl rounded-[2rem] p-6 w-full max-w-md border border-white/40 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-[#1c1b1b]">Add Funds</h3>
                <button onClick={() => setAddFundsOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors">
                  <span className="material-symbols-outlined text-[#45474b]">close</span>
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#45474b] uppercase tracking-wider mb-2 block">Amount</label>
                  <div className="bg-white/60 backdrop-blur-md rounded-2xl px-4 py-4 border border-white/40 flex items-center">
                    <span className="text-[#5d5e64] font-bold text-xl mr-2">৳</span>
                    <input
                      type="number"
                      value={addAmount}
                      onChange={e => setAddAmount(e.target.value)}
                      placeholder="0.00"
                      className="bg-transparent border-none focus:ring-0 flex-1 text-2xl font-bold text-[#1c1b1b] outline-none placeholder:text-[#45474b]/40"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[100, 500, 1000].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setAddAmount(String(amt))}
                      className="py-2.5 rounded-full bg-white/60 hover:bg-white/80 border border-white/40 text-sm font-semibold text-[#1c1b1b] transition-colors"
                    >
                      ৳{amt}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleAddFunds}
                  disabled={!addAmount || parseFloat(addAmount) <= 0 || adding}
                  className="w-full py-3.5 rounded-full bg-[#14b8a6] text-white font-semibold text-sm hover:bg-[#0d9488] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {adding ? 'Processing...' : 'Add Funds'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
