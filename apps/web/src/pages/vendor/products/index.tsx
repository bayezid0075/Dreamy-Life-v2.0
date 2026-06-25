import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { getMyProducts, deleteProduct, Product } from '@/features/products/api';
import { getMyVendorProfile, VendorProfile } from '@/features/vendor/api';
import api from '@dreamy-life/api-client';
import DesktopHeader from '@/shared/components/DesktopHeader';
import SideDrawer from '@/shared/components/SideDrawer';

export default function VendorProductsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { unreadCount: unreadNotifCount, setUnreadCount: setUnreadNotifCount } = useNotificationStore();

  useEffect(() => {
    if (!isAuthenticated) { router.replace('/login'); return; }
    loadData();
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      const [vendorRes, productsRes] = await Promise.all([
        getMyVendorProfile().catch(() => null),
        getMyProducts().catch((err) => { throw err; }),
      ]);

      if (vendorRes?.data) {
        setVendor(vendorRes.data);
      }

      setProducts(productsRes?.data || []);
      setError('');

      api.get('/auth/profile').then(res => setUser(res.data?.data?.user)).catch(() => {});
      api.get('/notifications/unread-count').then(res => { if (res.data?.count !== undefined) setUnreadNotifCount(res.data.count); }).catch(() => {});
    } catch (err: any) {
      const message = err?.response?.data?.error?.message || err?.message || 'Failed to load products';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      await deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      const message = err?.response?.data?.error?.message || 'Failed to delete product';
      alert(message);
    }
  };

  const handleLogout = () => { useAuthStore.getState().clearAuth(); router.replace('/login'); };
  const copyReferCode = () => { if (user?.ownRefercode) navigator.clipboard.writeText(user.ownRefercode); };

  const filtered = products.filter(p => {
    if (filter === 'in_stock') return p.stock > 0;
    if (filter === 'out_of_stock') return p.stock === 0;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f8ff] flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-2 border-[#5d5e64] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      <Head><title>Inventory - Vendor Suite</title></Head>
      <style>{`body { min-height: max(884px, 100dvh); }`}</style>
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
        <DesktopHeader
          title="Inventory"
          onMenuClick={() => setDrawerOpen(true)}
          avatarUrl={user?.info?.avatarUrl || ''}
          unreadNotifCount={unreadNotifCount}
        />

        <SideDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          user={user}
          vendorProfile={vendor}
          handleLogout={handleLogout}
          copyReferCode={copyReferCode}
        />

        <header className="md:hidden flex justify-between items-center px-6 py-5 sticky top-0 z-40 bg-white/60 backdrop-blur-xl border-b border-white/30">
          <button onClick={() => setDrawerOpen(true)} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/50 border border-white/40 shadow-sm text-[#45474b]">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h1 className="text-lg font-extrabold tracking-tight text-[#1c1b1b]">Inventory</h1>
          <Link href="/vendor/products/create" className="w-10 h-10 rounded-full flex items-center justify-center bg-[#1A1A1A] text-white shadow-sm">
            <span className="material-symbols-outlined text-[20px]">add</span>
          </Link>
        </header>

        <main className="max-w-[1280px] mx-auto px-6 pt-8 md:pt-32 pb-24 space-y-8 relative z-10">
          {vendor?.bannerUrl && (
            <section className="bg-white/50 backdrop-blur-[20px] rounded-2xl overflow-hidden border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
              <div className="h-40 md:h-52 w-full relative">
                <img src={vendor.bannerUrl} alt={vendor.shopName} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-4 left-6 text-white">
                  <h2 className="text-xl md:text-2xl font-bold drop-shadow-md">{vendor.shopName}</h2>
                  <p className="text-sm opacity-80">{products.length} products</p>
                </div>
              </div>
            </section>
          )}

          {error && (
            <div className="bg-[#ffdad6]/50 border border-[#ffdad6] rounded-xl p-4 text-sm text-[#93000a] flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => { setError(''); setLoading(true); loadData(); }} className="font-semibold underline ml-4 shrink-0">Retry</button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-[28px] font-extrabold text-[#1c1b1b]">Products</h2>
              <p className="text-sm text-[#45474b]">{filtered.length} of {products.length} products</p>
            </div>
            <Link href="/vendor/products/create"
              className="hidden md:flex px-6 py-3 bg-[#1A1A1A] text-white text-sm font-semibold rounded-full hover:opacity-90 transition-all active:scale-95 items-center gap-2 shadow-lg shadow-black/10">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add Product
            </Link>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {[
              { key: 'all', label: 'All Products', count: products.length },
              { key: 'in_stock', label: 'In Stock', count: products.filter(p => p.stock > 0).length },
              { key: 'out_of_stock', label: 'Out of Stock', count: products.filter(p => p.stock === 0).length },
            ].map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`shrink-0 font-semibold text-sm px-5 py-2.5 rounded-full border transition-all ${
                  filter === f.key
                    ? 'bg-[#1c1b1b] text-white border-[#1c1b1b]'
                    : 'bg-white/50 text-[#1c1b1b] border-white/40 hover:bg-white/60'
                }`}>
                {f.label} ({f.count})
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map(product => (
              <div key={product.id} className="bg-white/50 backdrop-blur-[20px] rounded-2xl p-4 flex flex-col group hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
                <div className="w-full aspect-square rounded-xl mb-4 overflow-hidden bg-white relative shadow-sm border border-black/5">
                  {product.imageUrls?.[0] ? (
                    <img src={product.imageUrls[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#5d5e64]/30">
                      <span className="material-symbols-outlined text-4xl">image</span>
                    </div>
                  )}
                  <div className={`absolute top-3 left-3 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-semibold border shadow-sm ${
                    product.stock > 0
                      ? 'bg-white/80 text-[#1c1b1b] border-white/50'
                      : 'bg-[#ffdad6]/80 text-[#93000a] border-[#ffdad6]/50'
                  }`}>
                    {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-base font-bold text-[#1c1b1b] leading-tight truncate pr-2">{product.name}</h3>
                    <span className="text-sm font-bold text-[#2d666d] whitespace-nowrap">${product.price}</span>
                  </div>
                  <p className="text-xs text-[#45474b] opacity-60 mb-2">SKU: #{product.sku || 'N/A'}</p>
                  <p className="text-xs text-[#45474b] opacity-60 mb-3 capitalize">{product.category?.replace('_', ' ') || 'Uncategorized'}</p>
                  <div className="flex items-center gap-2 text-sm text-[#45474b] bg-white/30 p-2 rounded-lg border border-white/20">
                    <span className="material-symbols-outlined text-[16px] opacity-60">inventory_2</span>
                    <span className="font-medium text-xs">{product.stock} units</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Link href={`/vendor/products/${product.id}/edit`}
                    className="flex-1 bg-white/50 hover:bg-white/70 text-[#1c1b1b] text-sm py-2.5 rounded-xl border border-white/50 transition-colors flex items-center justify-center gap-1.5 shadow-sm font-semibold">
                    <span className="material-symbols-outlined text-[16px]">edit</span> Edit
                  </Link>
                  <button onClick={() => handleDelete(product.id)}
                    className="w-10 bg-white/50 hover:bg-[#ffdad6] hover:text-[#93000a] text-[#45474b] py-2.5 rounded-xl border border-white/50 transition-colors flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            ))}

            <Link href="/vendor/products/create"
              className="bg-white/30 backdrop-blur-[20px] rounded-2xl p-4 flex flex-col justify-center items-center group hover:bg-white/50 transition-colors duration-300 cursor-pointer border-dashed border-2 border-[#5d5e64]/20 min-h-[380px]">
              <div className="w-16 h-16 rounded-full bg-[#5d5e64]/10 flex items-center justify-center mb-4 group-hover:bg-[#5d5e64]/20 transition-colors">
                <span className="material-symbols-outlined text-[32px] text-[#5d5e64]">add</span>
              </div>
              <h3 className="text-base font-bold text-[#5d5e64] mb-1">Create New</h3>
              <p className="text-xs text-[#45474b] text-center opacity-60 px-4">Add a new product to your collection.</p>
            </Link>
          </div>

          {filtered.length === 0 && products.length > 0 && (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-5xl text-[#5d5e64]/30 mb-4">inventory_2</span>
              <p className="text-[#45474b] font-semibold">No products match this filter</p>
            </div>
          )}

          {products.length === 0 && !error && (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-5xl text-[#5d5e64]/30 mb-4">add_box</span>
              <p className="text-[#45474b] font-semibold mb-4">No products yet</p>
              <Link href="/vendor/products/create"
                className="inline-flex px-6 py-3 bg-[#1A1A1A] text-white text-sm font-semibold rounded-full hover:opacity-90 transition-all items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">add</span>
                Create Your First Product
              </Link>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
