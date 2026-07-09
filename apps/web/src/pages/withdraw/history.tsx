import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import AuthGuard from '@/shared/components/AuthGuard';

interface Withdrawal {
  id: string;
  amount: string;
  chargePercent: string;
  chargeAmount: string;
  totalAmount: string;
  method: string;
  phoneNumber: string;
  status: string;
  adminNote: string | null;
  processedAt: string | null;
  createdAt: string;
}

const METHOD_ICONS: Record<string, { label: string; color: string; bg: string }> = {
  bkash: { label: 'bKash', color: '#e2136e', bg: '#fde8f0' },
  nagad: { label: 'Nagad', color: '#f58220', bg: '#fef3e2' },
  rocket: { label: 'Rocket', color: '#ec1c24', bg: '#fde8e9' },
};

const STATUS_INFO: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending: { label: 'Pending', color: '#d97706', bg: '#fef3c7', icon: 'schedule' },
  accepted: { label: 'Accepted', color: '#2563eb', bg: '#dbeafe', icon: 'thumb_up' },
  finished: { label: 'Completed', color: '#059669', bg: '#d1fae5', icon: 'check_circle' },
  rejected: { label: 'Rejected', color: '#dc2626', bg: '#fee2e2', icon: 'cancel' },
};

export default function WithdrawHistoryPage() {
  const router = useRouter();
  const { accessToken, logout } = useAuthStore();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState('all');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  useEffect(() => {
    if (!accessToken) { router.push('/auth/login'); return; }
    fetchWithdrawals(1);
  }, [accessToken]);

  const fetchWithdrawals = async (pageNum: number) => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/withdraw/history?page=${pageNum}&limit=15`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (pageNum === 1) {
          setWithdrawals(data.orders);
        } else {
          setWithdrawals((prev) => [...prev, ...data.orders]);
        }
        setHasMore(data.orders.length === 15);
      } else if (res.status === 401) { logout(); router.push('/auth/login'); }
    } catch { }
    setLoading(false);
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchWithdrawals(nextPage);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatAmount = (val: number) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

  const filtered = filter === 'all' ? withdrawals : withdrawals.filter((w) => w.status === filter);

  const stats = {
    total: withdrawals.length,
    pending: withdrawals.filter((w) => w.status === 'pending').length,
    completed: withdrawals.filter((w) => w.status === 'finished').length,
    totalAmount: withdrawals.reduce((sum, w) => sum + Number(w.totalAmount), 0),
  };

  if (loading && withdrawals.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8f8ff' }}>
        <div className="animate-spin h-10 w-10 border-2 border-[#5d5e64] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <Head><title>Withdrawal History — Dreamy Life</title></Head>

      <div className="min-h-screen" style={{ background: '#f8f8ff' }}>
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-40 border-b px-4 py-3 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', borderColor: '#e5e5ea' }}>
          <Link href="/withdraw" className="p-2 -ml-2 rounded-xl hover:bg-black/5 transition-colors">
            <span className="material-symbols-outlined text-[#1a1a2e]" style={{ fontSize: 22 }}>arrow_back_ios_new</span>
          </Link>
          <h1 className="text-[17px] font-semibold text-[#1a1a2e]">Withdrawal History</h1>
        </header>

        {/* Desktop Header */}
        <header className="hidden md:block sticky top-0 z-40 border-b px-6 py-4" style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', borderColor: '#e5e5ea' }}>
          <div className="max-w-[1280px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/withdraw" className="p-2 -ml-2 rounded-xl hover:bg-black/5 transition-colors">
                <span className="material-symbols-outlined text-[#1a1a2e]" style={{ fontSize: 22 }}>arrow_back_ios_new</span>
              </Link>
              <h1 className="text-xl font-semibold text-[#1a1a2e]">Withdrawal History</h1>
            </div>
            <Link href="/withdraw" className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #2d666d, #0d9488)' }}>
              New Withdrawal
            </Link>
          </div>
        </header>

        <main className="max-w-[800px] mx-auto px-4 md:px-6 py-4 md:py-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <div className="rounded-xl p-3 text-center" style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div className="text-2xl font-bold text-[#1a1a2e]">{stats.total}</div>
              <div className="text-[11px] text-[#888] mt-0.5">Total Requests</div>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div className="text-2xl font-bold" style={{ color: '#d97706' }}>{stats.pending}</div>
              <div className="text-[11px] text-[#888] mt-0.5">Pending</div>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div className="text-2xl font-bold" style={{ color: '#059669' }}>{stats.completed}</div>
              <div className="text-[11px] text-[#888] mt-0.5">Completed</div>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div className="text-2xl font-bold text-[#1a1a2e]">৳{formatAmount(stats.totalAmount)}</div>
              <div className="text-[11px] text-[#888] mt-0.5">Total Amount</div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
            {(['all', 'pending', 'accepted', 'finished', 'rejected'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all"
                style={{
                  background: filter === f ? '#2d666d' : 'white',
                  color: filter === f ? 'white' : '#888',
                  boxShadow: filter === f ? '0 2px 8px rgba(45,102,109,0.3)' : '0 1px 3px rgba(0,0,0,0.06)',
                }}
              >
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* List */}
          {filtered.length === 0 ? (
            <div className="rounded-2xl p-10 text-center" style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <span className="material-symbols-outlined text-[#ccc] mb-3 block" style={{ fontSize: 48 }}>receipt_long</span>
              <p className="text-[#888] text-sm">No withdrawal requests found</p>
              <Link href="/withdraw" className="inline-block mt-3 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #2d666d, #0d9488)' }}>
                Make a Withdrawal
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((w) => {
                const methodInfo = METHOD_ICONS[w.method] || { label: w.method, color: '#888', bg: '#f0f0f0' };
                const statusInfo = STATUS_INFO[w.status] || STATUS_INFO.pending;
                return (
                  <div key={w.id} className="rounded-2xl p-4 transition-all hover:shadow-md" style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold" style={{ background: methodInfo.bg, color: methodInfo.color }}>
                          {w.method === 'bkash' ? 'bK' : w.method === 'nagad' ? 'Ng' : 'Rk'}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-[#1a1a2e]">{methodInfo.label}</div>
                          <div className="text-xs text-[#888]">{w.phoneNumber}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-bold text-[#1a1a2e]">৳{formatAmount(Number(w.totalAmount))}</div>
                        {Number(w.chargeAmount) > 0 && (
                          <div className="text-[11px] text-[#ef4444]">+ ৳{formatAmount(Number(w.chargeAmount))} charge</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[#aaa]">{formatDate(w.createdAt)}</span>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: statusInfo.bg }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 12, color: statusInfo.color }}>{statusInfo.icon}</span>
                        <span className="text-[11px] font-semibold" style={{ color: statusInfo.color }}>{statusInfo.label}</span>
                      </div>
                    </div>
                    {w.adminNote && (
                      <div className="mt-2 p-2 rounded-lg text-xs text-[#666]" style={{ background: '#f8f9fa' }}>
                        <strong>Admin:</strong> {w.adminNote}
                      </div>
                    )}
                  </div>
                );
              })}

              {hasMore && (
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: 'white', color: '#2d666d', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              )}
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
