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

export default function VendorDashboardPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated, clearAuth } = useAuthStore();
  const [vendor, setVendor] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { unreadCount: unreadNotifCount, setUnreadCount: setUnreadNotifCount } = useNotificationStore();
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      router.replace('/login');
      return;
    }
    loadData();
  }, [isAuthenticated, accessToken]);

  const loadData = async () => {
    try {
      const [vendorRes, ordersRes, userRes, notifRes, vendorMeRes] = await Promise.all([
        fetch(`${API_URL}/vendor/me`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${API_URL}/reselling/orders`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${API_URL}/auth/profile`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${API_URL}/notifications/unread-count`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${API_URL}/vendor/me`, { headers: { Authorization: `Bearer ${accessToken}` } }),
      ]);

      if (vendorRes.status === 401 || ordersRes.status === 401) {
        router.replace('/login');
        return;
      }

      if (vendorRes.ok) {
        const data = await vendorRes.json();
        setVendor(data.data);
      }
      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setOrders(data.data || data.orders || []);
      }
      if (userRes.ok) {
        const data = await userRes.json();
        setUser(data.data?.user);
      }
      if (notifRes.ok) {
        const data = await notifRes.json();
        if (data.count !== undefined) setUnreadNotifCount(data.count);
      }
      if (vendorMeRes.ok) {
        const data = await vendorMeRes.json();
        setVendorProfile(data.data || null);
      }
    } catch {
      // handle error
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
        <div className="animate-spin h-10 w-10 border-2 border-[#5d5e64] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <>
        <Head><title>No Vendor Profile - Dreamy Life</title></Head>
        <div className="min-h-screen bg-[#f8f8ff] flex flex-col items-center justify-center gap-4 px-6">
          <span className="material-symbols-outlined text-6xl text-[#5d5e64]/30">storefront</span>
          <h2 className="text-xl font-bold text-[#1c1b1b]">No Vendor Profile</h2>
          <p className="text-[#45474b] text-center">Apply to become a vendor first</p>
          <Link href="/vendor/apply" className="px-8 py-3 rounded-full bg-[#1A1A1A] text-white text-sm font-semibold hover:opacity-90 transition-all">
            Become a Vendor
          </Link>
        </div>
      </>
    );
  }

  const pendingOrders = orders.filter((o: any) => o.status === 'pending');
  const completedOrders = orders.filter((o: any) => o.status === 'completed' || o.status === 'delivered');
  const recentOrders = orders.slice(0, 5);

  return (
    <>
      <Head>
        <title>Vendor Dashboard - Dreamy Life</title>
      </Head>
      <style>{`
        body { min-height: max(884px, 100dvh); }
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
        {/* Desktop Header */}
        <DesktopHeader
          title="Vendor Dashboard"
          onMenuClick={() => setDrawerOpen(true)}
          avatarUrl={user?.info?.avatarUrl || ''}
          unreadNotifCount={unreadNotifCount}
        />

        {/* Side Drawer */}
        <SideDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          user={user}
          vendorProfile={vendorProfile}
          handleLogout={handleLogout}
          copyReferCode={copyReferCode}
        />

        {/* Mobile Header */}
        <header className="md:hidden flex justify-between items-center px-6 py-5 sticky top-0 z-40 bg-white/60 backdrop-blur-xl border-b border-white/30">
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/50 border border-white/40 shadow-sm text-[#45474b]"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h1 className="text-lg font-extrabold tracking-tight text-[#1c1b1b]">Vendor Dashboard</h1>
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
        </header>

        <main className="max-w-[1280px] mx-auto px-6 pt-8 md:pt-32 pb-24 space-y-8 relative z-10">
          {/* Banner / Shop Profile Card */}
          <section className="bg-white/50 backdrop-blur-[20px] rounded-2xl overflow-hidden relative border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
            {vendor.bannerUrl ? (
              <div className="h-48 md:h-64 w-full relative">
                <img src={vendor.bannerUrl} alt={vendor.shopName} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              </div>
            ) : (
              <div className="h-48 md:h-64 w-full bg-gradient-to-r from-[#e9fdff] via-[#ffd1dc] to-[#b3ecf3] relative flex items-center justify-center">
                <span className="material-symbols-outlined text-white/30 text-8xl">storefront</span>
              </div>
            )}
            <div className={`p-6 md:p-8 ${vendor.bannerUrl ? '-mt-16 relative z-10' : ''}`}>
              <div className="flex flex-col md:flex-row md:items-end gap-4">
                <div className="w-20 h-20 rounded-2xl bg-white/80 backdrop-blur-md border-4 border-white shadow-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#5d5e64] text-3xl">storefront</span>
                </div>
                <div className="flex-1">
                  <h1 className="text-[28px] md:text-[36px] font-extrabold text-[#1c1b1b] leading-tight">{vendor.shopName}</h1>
                  <p className="text-[#45474b] mt-1 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    {vendor.address || 'No address set'}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Link href="/vendor/products/create"
                    className="px-6 py-3 bg-[#1A1A1A] text-white text-sm font-semibold rounded-full hover:opacity-90 transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-black/10">
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Add Product
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Revenue Overview Card */}
          <section className="bg-white/50 backdrop-blur-[20px] rounded-2xl p-6 md:p-8 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#45474b] uppercase tracking-wider mb-1">Total Revenue</p>
                <div className="flex items-end gap-3">
                  <span className="text-[40px] md:text-[56px] font-extrabold text-[#1c1b1b] leading-none">
                    ${vendor.totalRevenue?.toFixed(2) || '0.00'}
                  </span>
                  <div className="flex items-center bg-[#e9fdff]/80 backdrop-blur-md px-3 py-1.5 rounded-full mb-2">
                    <span className="material-symbols-outlined text-[#2d666d] text-sm mr-1" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
                    <span className="text-sm font-semibold text-[#2d666d]">+12%</span>
                  </div>
                </div>
                <p className="text-sm text-[#45474b] mt-2">Last 30 days overview</p>
              </div>
              <div className="flex gap-3">
                <Link href="/vendor/products"
                  className="bg-white/50 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/40 text-sm font-semibold text-[#1c1b1b] hover:bg-white/70 transition-colors flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                  View Products
                </Link>
                <Link href="/reselling/orders"
                  className="bg-white/50 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/40 text-sm font-semibold text-[#1c1b1b] hover:bg-white/70 transition-colors flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                  View Orders
                </Link>
              </div>
            </div>
          </section>

          {/* Stat Cards */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/vendor/products"
              className="bg-white/50 backdrop-blur-[20px] rounded-2xl p-6 flex flex-col gap-4 hover:-translate-y-1 transition-transform duration-300 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)] group">
              <div className="w-12 h-12 rounded-full bg-[#e9fdff] text-[#2d666d] flex items-center justify-center group-hover:bg-[#2d666d] group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-2xl">inventory_2</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#45474b] mb-1">Active Products</h3>
                <p className="text-[32px] font-bold text-[#1c1b1b]">{vendor.totalProducts || 0}</p>
              </div>
              <span className="text-xs font-semibold text-[#2d666d] flex items-center gap-1 mt-auto">
                View all <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </span>
            </Link>

            <Link href="/reselling/orders"
              className="bg-white/50 backdrop-blur-[20px] rounded-2xl p-6 flex flex-col gap-4 hover:-translate-y-1 transition-transform duration-300 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)] group">
              <div className="w-12 h-12 rounded-full bg-[#ffd1dc] text-[#78555e] flex items-center justify-center group-hover:bg-[#78555e] group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-2xl">pending_actions</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#45474b] mb-1">Pending Orders</h3>
                <p className="text-[32px] font-bold text-[#1c1b1b]">{pendingOrders.length}</p>
              </div>
              <span className="text-xs font-semibold text-[#78555e] flex items-center gap-1 mt-auto">
                View all <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </span>
            </Link>

            <Link href="/reselling/orders"
              className="bg-white/50 backdrop-blur-[20px] rounded-2xl p-6 flex flex-col gap-4 hover:-translate-y-1 transition-transform duration-300 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)] group">
              <div className="w-12 h-12 rounded-full bg-[#e0f7fa] text-[#00838f] flex items-center justify-center group-hover:bg-[#00838f] group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-2xl">shopping_bag</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#45474b] mb-1">Completed Orders</h3>
                <p className="text-[32px] font-bold text-[#1c1b1b]">{completedOrders.length}</p>
              </div>
              <span className="text-xs font-semibold text-[#00838f] flex items-center gap-1 mt-auto">
                View all <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </span>
            </Link>
          </section>

          {/* Quick Actions */}
          <section className="bg-white/50 backdrop-blur-[20px] rounded-2xl p-6 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
            <h2 className="text-lg font-bold text-[#1c1b1b] mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/vendor/products/create"
                className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white/40 hover:bg-white/60 transition-colors border border-white/30">
                <div className="w-12 h-12 rounded-full bg-[#e9fdff] text-[#2d666d] flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">add_box</span>
                </div>
                <span className="text-sm font-semibold text-[#1c1b1b]">Add Product</span>
              </Link>
              <Link href="/vendor/products"
                className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white/40 hover:bg-white/60 transition-colors border border-white/30">
                <div className="w-12 h-12 rounded-full bg-[#e2e2e9] text-[#45474c] flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">inventory_2</span>
                </div>
                <span className="text-sm font-semibold text-[#1c1b1b]">Inventory</span>
              </Link>
              <Link href="/reselling/orders"
                className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white/40 hover:bg-white/60 transition-colors border border-white/30">
                <div className="w-12 h-12 rounded-full bg-[#ffd1dc] text-[#78555e] flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">local_shipping</span>
                </div>
                <span className="text-sm font-semibold text-[#1c1b1b]">Orders</span>
              </Link>
              <Link href="/reselling/orders"
                className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white/40 hover:bg-white/60 transition-colors border border-white/30">
                <div className="w-12 h-12 rounded-full bg-[#e0f7fa] text-[#00838f] flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">analytics</span>
                </div>
                <span className="text-sm font-semibold text-[#1c1b1b]">Order Analytics</span>
              </Link>
            </div>
          </section>

          {/* Recent Activity */}
          <section className="bg-white/50 backdrop-blur-[20px] rounded-2xl p-6 md:p-8 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-[#1c1b1b]">Recent Orders</h2>
              <Link href="/reselling/orders" className="text-sm font-semibold text-[#2d666d] hover:opacity-80 transition-opacity flex items-center gap-1">
                View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              {recentOrders.length === 0 ? (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-4xl text-[#5d5e64]/30 mb-3">receipt_long</span>
                  <p className="text-[#45474b]">No orders yet</p>
                </div>
              ) : (
                recentOrders.map((order: any) => (
                  <Link
                    key={order.id}
                    href={`/reselling/order/${order.id}`}
                    className="flex items-center gap-4 p-4 rounded-xl bg-white/30 hover:bg-white/50 transition-colors border border-white/20 hover:border-white/40"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#e9fdff] flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-[#2d666d] text-sm">shopping_bag</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1c1b1b] truncate">{order.productName || 'Product'}</p>
                      <p className="text-xs text-[#45474b]">{order.customerName} · {order.status}</p>
                    </div>
                    <p className="text-sm font-bold text-[#1c1b1b] whitespace-nowrap">+${order.vendorPrice?.toFixed(2) || '0.00'}</p>
                  </Link>
                ))
              )}
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
