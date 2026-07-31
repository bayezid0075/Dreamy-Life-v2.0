import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import AuthGuard from '@/shared/components/AuthGuard';
import { useSocialEarningsSocket } from '@/hooks/useSocialEarningsSocket';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface UserStats {
  postsCount: number;
  followersCount: number;
  followingCount: number;
}

interface EarningsData {
  balance: number;
  totalEarned: number;
  totalWithdrawn: number;
  reactionCount: number;
  canWithdraw: boolean;
  minimumWithdraw: number;
}

interface Withdrawal {
  id: string;
  amount: string;
  method: string;
  phoneNumber: string;
  status: string;
  createdAt: string;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { accessToken, user: authUser } = useAuthStore();
  const { unreadCount: unreadNotifCount } = useNotificationStore();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('bkash');
  const [withdrawPhone, setWithdrawPhone] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  const handleEarningsUpdate = useCallback((data: { balance: number; totalEarned: number; reactionCount: number }) => {
    setEarnings((prev) => prev ? { ...prev, ...data } : prev);
  }, []);

  useSocialEarningsSocket(handleEarningsUpdate);

  useEffect(() => {
    if (!accessToken || !authUser?.id) return;
    fetchStats(authUser.id);
    fetchEarnings();
    fetchWithdrawals();
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
    }
  };

  const fetchEarnings = async () => {
    try {
      const res = await fetch(`${API_URL}/social-earnings/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEarnings(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch earnings', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const res = await fetch(`${API_URL}/social-earnings/withdraw/history`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWithdrawals(data.data || []);
      }
    } catch {}
  };

  const handleWithdraw = async () => {
    setWithdrawError('');
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount < 3) {
      setWithdrawError('Minimum withdrawal is $3.00');
      return;
    }
    if (!withdrawPhone || withdrawPhone.length < 11) {
      setWithdrawError('Enter a valid phone number');
      return;
    }
    setWithdrawLoading(true);
    try {
      const res = await fetch(`${API_URL}/social-earnings/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ amount, method: withdrawMethod, phoneNumber: withdrawPhone }),
      });
      const data = await res.json();
      if (res.ok) {
        setWithdrawSuccess(true);
        setShowWithdraw(false);
        setWithdrawAmount('');
        setWithdrawPhone('');
        fetchEarnings();
        fetchWithdrawals();
        setTimeout(() => setWithdrawSuccess(false), 3000);
      } else {
        setWithdrawError(data.message || 'Withdrawal failed');
      }
    } catch {
      setWithdrawError('Network error');
    } finally {
      setWithdrawLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'accepted': return 'bg-blue-100 text-blue-700';
      case 'finished': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
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
        <title>Social Analytics - Dreamy Life</title>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </Head>

      <body className="bg-aurora text-on-surface min-h-screen font-['Plus_Jakarta_Sans',sans-serif] antialiased">
        <header className="fixed top-0 w-full z-50 bg-white/40 backdrop-blur-xl border-b border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
          <div className="flex justify-between items-center px-6 w-full h-16 max-w-[1280px] mx-auto">
            <button onClick={() => router.back()} className="hover:bg-white/20 transition-colors duration-300 p-2 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">arrow_back</span>
            </button>
            <h1 className="text-[24px] font-bold text-primary tracking-tight">Analytics</h1>
            <div className="w-10" />
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-24 pb-12 space-y-6">

          {/* ─── Fancy Social Earning Card ─── */}
          <div className="relative overflow-hidden rounded-3xl p-[1px] bg-gradient-to-br from-[#0d9488] via-[#2d666d] to-[#1a1a2e]">
            <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-[#0f766e] via-[#134e4a] to-[#0c1222] p-6 sm:p-8">
              {/* Glow Effects */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#2dd4bf] rounded-full opacity-20 blur-3xl" />
              <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-[#5eead4] rounded-full opacity-10 blur-3xl" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#99f6e4] rounded-full opacity-5 blur-3xl" />

              {/* Card Content */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#5eead4] text-xl">trending_up</span>
                    <span className="text-[#99f6e4] text-sm font-semibold tracking-wider uppercase">Social Earning</span>
                  </div>
                  <div className="flex items-center gap-1 bg-white/10 rounded-full px-3 py-1">
                    <div className="w-2 h-2 bg-[#34d399] rounded-full animate-pulse" />
                    <span className="text-[#a7f3d0] text-xs font-semibold">Active</span>
                  </div>
                </div>

                {/* Balance */}
                <div className="mb-2">
                  <span className="text-[#94a3b8] text-sm font-medium">Total Balance</span>
                </div>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-[#e2e8f0] text-lg font-bold">$</span>
                  <span className="text-white text-[48px] sm:text-[56px] font-extrabold leading-none tracking-tight">
                    {earnings?.balance?.toFixed(5) || '0.00000'}
                  </span>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                    <span className="text-[#94a3b8] text-xs font-medium block mb-1">Total Earned</span>
                    <span className="text-white text-sm font-bold">${earnings?.totalEarned?.toFixed(5) || '0.00000'}</span>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                    <span className="text-[#94a3b8] text-xs font-medium block mb-1">Withdrawn</span>
                    <span className="text-white text-sm font-bold">${earnings?.totalWithdrawn?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                    <span className="text-[#94a3b8] text-xs font-medium block mb-1">Reactions</span>
                    <span className="text-white text-sm font-bold">{earnings?.reactionCount || 0}</span>
                  </div>
                </div>

                {/* Per Reaction Info */}
                <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#5eead4] text-lg">favorite</span>
                    <span className="text-[#cbd5e1] text-sm">Earn per reaction</span>
                  </div>
                  <span className="text-[#34d399] text-sm font-bold">$0.00002</span>
                </div>

                {/* Withdraw Button */}
                {earnings?.canWithdraw ? (
                  <button
                    onClick={() => setShowWithdraw(true)}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#10b981] to-[#059669] text-white font-bold text-base shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-xl">account_balance_wallet</span>
                    Withdraw Money
                  </button>
                ) : (
                  <div className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                    <span className="text-[#94a3b8] text-sm">
                      Reach ${earnings?.minimumWithdraw || 3} to withdraw (${((earnings?.minimumWithdraw || 3) - (earnings?.balance || 0)).toFixed(2)} remaining)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Success Toast */}
          {withdrawSuccess && (
            <div className="bg-emerald-500 text-white rounded-2xl p-4 flex items-center gap-3 shadow-lg shadow-emerald-500/25">
              <span className="material-symbols-outlined">check_circle</span>
              <span className="font-semibold">Withdrawal request submitted!</span>
            </div>
          )}

          {/* ─── Stats Cards ─── */}
          <section className="grid grid-cols-3 gap-4">
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

          {/* ─── Withdrawal History ─── */}
          {withdrawals.length > 0 && (
            <section className="glass-panel rounded-2xl p-6">
              <h3 className="text-[16px] font-bold text-on-surface mb-4">Withdrawal History</h3>
              <div className="space-y-3">
                {withdrawals.slice(0, 5).map((w) => (
                  <div key={w.id} className="flex items-center justify-between p-3 rounded-xl bg-white/30 border border-white/20">
                    <div>
                      <span className="text-sm font-semibold text-on-surface">${Number(w.amount).toFixed(2)}</span>
                      <span className="text-xs text-on-surface-variant ml-2">via {w.method}</span>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusStyle(w.status)}`}>
                      {w.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ─── Quick Actions ─── */}
          <section className="glass-panel rounded-2xl p-6">
            <h3 className="text-[16px] font-bold text-on-surface mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link href="/social/edit-profile" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/30 transition-colors">
                <span className="material-symbols-outlined text-primary">edit</span>
                <span className="text-[14px] font-semibold text-on-surface">Edit Profile</span>
                <span className="material-symbols-outlined text-on-surface-variant ml-auto">chevron_right</span>
              </Link>
              <Link href="/posts/create" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/30 transition-colors">
                <span className="material-symbols-outlined text-primary">add_circle</span>
                <span className="text-[14px] font-semibold text-on-surface">Create New Post</span>
                <span className="material-symbols-outlined text-on-surface-variant ml-auto">chevron_right</span>
              </Link>
              <Link href="/social/profile" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/30 transition-colors">
                <span className="material-symbols-outlined text-primary">person</span>
                <span className="text-[14px] font-semibold text-on-surface">View Profile</span>
                <span className="material-symbols-outlined text-on-surface-variant ml-auto">chevron_right</span>
              </Link>
            </div>
          </section>
        </main>

        {/* ─── Withdraw Modal ─── */}
        {showWithdraw && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowWithdraw(false)}>
            <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Withdraw Money</h3>
                <button onClick={() => setShowWithdraw(false)} className="p-2 rounded-full hover:bg-gray-100">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600 mb-1 block">Amount ($)</label>
                  <input type="number" step="0.01" min="3" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)}
                    placeholder="Minimum $3.00"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2d666d]/30 focus:border-[#2d666d]" />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600 mb-2 block">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['bkash', 'nagad', 'rocket'].map(m => (
                      <button key={m} onClick={() => setWithdrawMethod(m)}
                        className={`py-3 rounded-xl text-sm font-semibold capitalize transition-all ${
                          withdrawMethod === m ? 'bg-[#2d666d] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600 mb-1 block">Phone Number</label>
                  <input type="tel" value={withdrawPhone} onChange={e => setWithdrawPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2d666d]/30 focus:border-[#2d666d]" />
                </div>

                {withdrawError && (
                  <div className="bg-red-50 text-red-600 rounded-xl p-3 text-sm font-medium">{withdrawError}</div>
                )}

                <button onClick={handleWithdraw} disabled={withdrawLoading}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-[#10b981] to-[#059669] text-white font-bold text-base shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  {withdrawLoading ? 'Processing...' : 'Submit Withdrawal'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BottomNavBar */}
        <nav className="md:hidden fixed bottom-0 w-full z-40 rounded-t-lg bg-white/40 backdrop-blur-xl shadow-[0_-10px_40px_rgba(0,0,0,0.04)] border-t border-white/30">
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
            <Link href="/social/profile" className="flex flex-col items-center justify-center text-on-surface-variant/60 hover:text-primary transition-all duration-300">
              <span className="material-symbols-outlined mb-1">person</span>
              <span className="text-[10px] font-semibold">Profile</span>
            </Link>
          </div>
        </nav>
      </body>
    </AuthGuard>
  );
}
