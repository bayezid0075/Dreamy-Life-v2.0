import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import AuthGuard from '@/shared/components/AuthGuard';

interface RechargeOrder {
  id: string;
  phoneNumber: string;
  operator: string;
  connectionType: string;
  amount: number;
  status: string;
  createdAt: string;
}

const operatorMap: Record<string, { name: string; shortName: string; color: string; bg: string }> = {
  gp: { name: 'GrameenPhone', shortName: 'GP', color: '#ffffff', bg: '#00a651' },
  bl: { name: 'Banglalink', shortName: 'BL', color: '#ffffff', bg: '#f7941d' },
  rb: { name: 'Robi', shortName: 'RB', color: '#ffffff', bg: '#e40000' },
  al: { name: 'Airtel', shortName: 'AL', color: '#ffffff', bg: '#e4002b' },
  tt: { name: 'Teletalk', shortName: 'TT', color: '#ffffff', bg: '#0057b8' },
  st: { name: 'Skitto', shortName: 'ST', color: '#ffffff', bg: '#ff5c26' },
};

const statusStyles: Record<string, { bg: string; color: string; label: string }> = {
  success: { bg: '#e9fdff', color: '#2d666d', label: 'Success' },
  completed: { bg: '#e9fdff', color: '#2d666d', label: 'Success' },
  pending: { bg: '#fffde7', color: '#f9a825', label: 'Pending' },
  processing: { bg: '#fffde7', color: '#f9a825', label: 'Pending' },
  failed: { bg: '#ffdad6', color: '#93000a', label: 'Failed' },
  error: { bg: '#ffdad6', color: '#93000a', label: 'Failed' },
};

export default function RechargeHistoryPage() {
  const router = useRouter();
  const { accessToken, logout } = useAuthStore();
  const [orders, setOrders] = useState<RechargeOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRef = useRef<{ token: string | null }>({ token: accessToken });
  fetchRef.current = { token: accessToken };

  const fetchOrders = useCallback(async (showRefresh = false) => {
    const { token } = fetchRef.current;
    if (!token) return;
    if (showRefresh) setRefreshing(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/recharge/orders?page=1&limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { await logout(); return; }
      if (res.ok) {
        const data = await res.json();
        setOrders(data.data?.orders || data.data || []);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); }
  }, [logout]);

  useEffect(() => {
    if (accessToken) fetchOrders();
  }, [accessToken, fetchOrders]);

  useEffect(() => {
    if (!accessToken) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchOrders();
    };
    const handleFocus = () => fetchOrders();
    const handleRouteChange = (url: string) => {
      if (url === '/recharge/history') fetchOrders();
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [accessToken, fetchOrders]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getOperatorInfo = (opId: string) => operatorMap[opId] || { name: opId, shortName: opId.slice(0, 2).toUpperCase(), color: '#ffffff', bg: '#5d5e64' };

  const getStatusInfo = (status: string) => statusStyles[status] || { bg: '#e2e2e9', color: '#45474b', label: status };

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
        <title>Recharge History - Dreamy Life</title>
      </Head>
      <style>{`
        body { min-height: max(884px, 100dvh); }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-custom { animation: spin 1s linear infinite; }
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
        {/* Mobile Top Bar */}
        <header className="md:hidden flex justify-between items-center px-6 py-5 sticky top-0 z-40 bg-white/60 backdrop-blur-xl border-b border-white/30">
          <Link href="/recharge" className="w-10 h-10 rounded-full flex items-center justify-center bg-white/50 border border-white/40 shadow-sm text-[#45474b]">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-lg font-extrabold tracking-tight text-[#1c1b1b]">Recharge History</h1>
          <button
            onClick={() => fetchOrders(true)}
            disabled={refreshing}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/50 border border-white/40 shadow-sm text-[#45474b] disabled:opacity-50"
          >
            <span className={`material-symbols-outlined ${refreshing ? 'animate-spin-custom' : ''}`}>refresh</span>
          </button>
        </header>

        {/* Desktop Header */}
        <header className="hidden md:flex fixed top-0 left-0 w-full z-50 bg-white/70 backdrop-blur-[30px] border-b border-white/40 shadow-[0_20px_40px_rgba(0,0,0,0.06)] px-6 py-4 justify-between items-center">
          <Link href="/recharge" className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/40 transition-colors text-[#45474b]">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div className="text-lg font-extrabold tracking-tight text-[#1c1b1b]">Recharge History</div>
          <button
            onClick={() => fetchOrders(true)}
            disabled={refreshing}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/40 transition-colors text-[#45474b] disabled:opacity-50"
          >
            <span className={`material-symbols-outlined ${refreshing ? 'animate-spin-custom' : ''}`}>refresh</span>
          </button>
        </header>

        <main className="max-w-[640px] mx-auto px-4 md:px-6 pt-20 space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-20 animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-white/50 backdrop-blur-md flex items-center justify-center mx-auto mb-6 border border-white/30">
                <span className="material-symbols-outlined text-[#45474b] text-3xl">phone_in_talk</span>
              </div>
              <h3 className="text-xl font-bold text-[#1c1b1b] mb-2">No Recharges Yet</h3>
              <p className="text-sm text-[#45474b] mb-6">Your recharge history will appear here</p>
              <Link
                href="/recharge"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#ff5c26] text-white font-bold text-sm hover:bg-[#e8521e] transition-all shadow-[0_8px_24px_rgba(255,92,38,0.25)]"
              >
                <span className="material-symbols-outlined text-[18px]">phone_iphone</span>
                Make a Recharge
              </Link>
            </div>
          ) : (
            orders.map((order, idx) => {
              const op = getOperatorInfo(order.operator);
              const status = getStatusInfo(order.status);
              return (
                <div
                  key={order.id}
                  className="bg-white/50 backdrop-blur-[20px] rounded-2xl p-4 flex items-center gap-4 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)] hover:bg-white/70 transition-colors animate-fade-in"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-sm font-extrabold shadow-md"
                    style={{ backgroundColor: op.bg, color: op.color }}
                  >
                    {op.shortName}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-[16px] font-bold text-[#1c1b1b] truncate">{order.phoneNumber}</h3>
                      <span className="text-[10px] font-bold text-[#45474b] uppercase">{order.connectionType}</span>
                    </div>
                    <p className="text-sm text-[#45474b]">{op.name}</p>
                    <p className="text-xs text-[#45474b]/70 mt-0.5">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[18px] font-bold text-[#1c1b1b]">৳{Number(order.amount).toFixed(2)}</p>
                    <span
                      className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                      style={{ backgroundColor: status.bg, color: status.color }}
                    >
                      {status.label}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
