import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { VendorProfile } from '@/features/vendor/api';
import DesktopHeader from '@/shared/components/DesktopHeader';
import SideDrawer from '@/shared/components/SideDrawer';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4080';

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  pending: { bg: 'bg-[#fffde7]', text: 'text-[#f9a825]', icon: 'schedule' },
  confirmed: { bg: 'bg-[#e9fdff]', text: 'text-[#2d666d]', icon: 'check_circle' },
  shipped: { bg: 'bg-[#e3f2fd]', text: 'text-[#1565c0]', icon: 'local_shipping' },
  delivered: { bg: 'bg-[#e8f5e9]', text: 'text-[#2e7d32]', icon: 'inventory_2' },
  cancelled: { bg: 'bg-[#ffdad6]', text: 'text-[#93000a]', icon: 'cancel' },
};

export default function ResellerOrdersPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated, clearAuth } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { unreadCount: unreadNotifCount, setUnreadCount: setUnreadNotifCount } = useNotificationStore();
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!isAuthenticated || !accessToken) { router.replace('/login'); return; }
    loadOrders();
    Promise.all([
      fetch(`${API_URL}/auth/profile`, { headers: { Authorization: `Bearer ${accessToken}` } }).then(r => r.json()).then(d => setUser(d.data?.user)).catch(() => {}),
      fetch(`${API_URL}/notifications/unread-count`, { headers: { Authorization: `Bearer ${accessToken}` } }).then(r => r.json()).then(d => { if (d.count !== undefined) setUnreadNotifCount(d.count); }).catch(() => {}),
      fetch(`${API_URL}/vendor/me`, { headers: { Authorization: `Bearer ${accessToken}` } }).then(r => r.json()).then(d => setVendorProfile(d.data || null)).catch(() => setVendorProfile(null)),
    ]);
  }, [isAuthenticated, accessToken]);

  const loadOrders = async () => {
    try {
      const res = await fetch(`${API_URL}/reselling/orders`, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (res.status === 401) { router.replace('/login'); return; }
      if (res.ok) { const data = await res.json(); setOrders(data.data || []); }
    } catch { /* error */ }
    finally { setLoading(false); }
  };

  const handleLogout = () => { clearAuth(); router.replace('/login'); };
  const copyReferCode = () => { if (user?.ownRefercode) navigator.clipboard.writeText(user.ownRefercode); };

  // Analytics
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((s, o) => s + (o.resellerPrice || 0), 0);
  const totalCost = orders.reduce((s, o) => s + (o.vendorPrice || 0), 0);
  const totalProfit = orders.reduce((s, o) => s + (o.profit || 0), 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const statusCounts = orders.reduce((acc: Record<string, number>, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f8ff] flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-2 border-[#5d5e64] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      <Head><title>My Orders - Dreamy Life</title></Head>
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
        <DesktopHeader title="My Orders" onMenuClick={() => setDrawerOpen(true)} avatarUrl={user?.info?.avatarUrl || ''} unreadNotifCount={unreadNotifCount} />
        <SideDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} user={user} vendorProfile={vendorProfile} handleLogout={handleLogout} copyReferCode={copyReferCode} />

        <header className="md:hidden flex justify-between items-center px-6 py-5 sticky top-0 z-40 bg-white/60 backdrop-blur-xl border-b border-white/30">
          <button onClick={() => setDrawerOpen(true)} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/50 border border-white/40 shadow-sm text-[#45474b]">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h1 className="text-lg font-extrabold tracking-tight text-[#1c1b1b]">My Orders</h1>
          <div className="w-10" />
        </header>

        <main className="max-w-[1280px] mx-auto px-6 pt-8 md:pt-32 pb-24 space-y-6 relative z-10">
          {orders.length === 0 ? (
            <div className="text-center py-20">
              <span className="material-symbols-outlined text-6xl text-[#5d5e64]/20 mb-4">shopping_bag</span>
              <p className="text-[#45474b] mb-2 font-semibold">No orders yet</p>
              <p className="text-sm text-[#45474b]/60 mb-6">Start selling by browsing products</p>
              <Link href="/reseller-shop" className="inline-flex px-8 py-3 bg-[#1A1A1A] text-white text-sm font-semibold rounded-full hover:opacity-90 transition-all">
                Browse Products
              </Link>
            </div>
          ) : (
            <>
              {/* Analytics Cards */}
              <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/50 backdrop-blur-[20px] rounded-2xl p-5 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
                  <div className="w-10 h-10 rounded-full bg-[#e9fdff] flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-[#2d666d]">shopping_bag</span>
                  </div>
                  <p className="text-2xl font-bold text-[#1c1b1b]">{totalOrders}</p>
                  <p className="text-xs text-[#45474b] font-semibold">Total Orders</p>
                </div>
                <div className="bg-white/50 backdrop-blur-[20px] rounded-2xl p-5 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
                  <div className="w-10 h-10 rounded-full bg-[#e0f7fa] flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-[#00838f]">payments</span>
                  </div>
                  <p className="text-2xl font-bold text-[#1c1b1b]">${totalRevenue.toFixed(2)}</p>
                  <p className="text-xs text-[#45474b] font-semibold">Total Revenue</p>
                </div>
                <div className="bg-white/50 backdrop-blur-[20px] rounded-2xl p-5 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
                  <div className="w-10 h-10 rounded-full bg-[#e8f5e9] flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-[#2e7d32]">trending_up</span>
                  </div>
                  <p className="text-2xl font-bold text-[#2d666d]">${totalProfit.toFixed(2)}</p>
                  <p className="text-xs text-[#45474b] font-semibold">Total Profit</p>
                </div>
                <div className="bg-white/50 backdrop-blur-[20px] rounded-2xl p-5 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
                  <div className="w-10 h-10 rounded-full bg-[#ffd1dc] flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-[#78555e]">receipt_long</span>
                  </div>
                  <p className="text-2xl font-bold text-[#1c1b1b]">${avgOrderValue.toFixed(2)}</p>
                  <p className="text-xs text-[#45474b] font-semibold">Avg. Order Value</p>
                </div>
              </section>

              {/* Status Breakdown */}
              <section className="bg-white/50 backdrop-blur-[20px] rounded-2xl p-6 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
                <h3 className="text-sm font-bold text-[#45474b] uppercase tracking-wider mb-4">Order Status</h3>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {Object.entries(STATUS_COLORS).map(([status, colors]) => {
                    const count = statusCounts[status] || 0;
                    if (count === 0) return null;
                    return (
                      <div key={status} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${colors.bg} border border-white/30 shrink-0`}>
                        <span className={`material-symbols-outlined text-sm ${colors.text}`}>{colors.icon}</span>
                        <span className={`text-sm font-bold ${colors.text}`}>{count}</span>
                        <span className="text-xs text-[#45474b] capitalize">{status}</span>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Filter */}
              <div className="flex gap-3 overflow-x-auto pb-2">
                {[{ key: 'all', label: 'All' }, ...Object.keys(STATUS_COLORS).map(s => ({ key: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))].map(f => (
                  <button key={f.key} onClick={() => setFilter(f.key)}
                    className={`shrink-0 font-semibold text-sm px-5 py-2.5 rounded-full border transition-all ${
                      filter === f.key
                        ? 'bg-[#1c1b1b] text-white border-[#1c1b1b]'
                        : 'bg-white/50 text-[#1c1b1b] border-white/40 hover:bg-white/60'
                    }`}>
                    {f.label} ({f.key === 'all' ? orders.length : statusCounts[f.key] || 0})
                  </button>
                ))}
              </div>

              {/* Orders List */}
              <div className="flex flex-col gap-3">
                {filteredOrders.map((order: any) => {
                  const sc = STATUS_COLORS[order.status] || { bg: 'bg-[#eae7e7]', text: 'text-[#45474b]', icon: 'help' };
                  return (
                    <Link key={order.id} href={`/reselling/order/${order.id}`}
                      className="bg-white/50 backdrop-blur-[20px] rounded-2xl p-4 flex items-center gap-4 hover:bg-white/60 transition-colors border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-white flex-shrink-0">
                        {order.productImage?.[0] ? (
                          <img src={order.productImage[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#5d5e64]/20">
                            <span className="material-symbols-outlined">image</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-[#1c1b1b] truncate">{order.productName || 'Product'}</h3>
                        <p className="text-xs text-[#45474b]">{order.customerName} · {order.shopName}</p>
                        <p className="text-xs text-[#45474b]/60 mt-0.5">{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-[#1c1b1b]">${order.resellerPrice?.toFixed(2)}</p>
                        <p className="text-xs text-[#2d666d] font-semibold">+${order.profit?.toFixed(2)}</p>
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full mt-1 ${sc.bg} ${sc.text}`}>
                          <span className="material-symbols-outlined text-[10px]">{sc.icon}</span>
                          {order.status}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
}
