import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore, CartItem } from '@/store/cartStore';
import { VendorProfile } from '@/features/vendor/api';
import DesktopHeader from '@/shared/components/DesktopHeader';
import SideDrawer from '@/shared/components/SideDrawer';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4080';

export default function CartPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated, clearAuth } = useAuthStore();
  const { items, updateQuantity, updateResellerPrice, removeItem, clearCart, getTotalCost, getTotalProfit } = useCartStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [ordering, setOrdering] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [customerInfo, setCustomerInfo] = useState({
    name: '', phone: '', altPhone: '', address: '', paymentMethod: 'cash_on_delivery',
  });

  useEffect(() => {
    if (!isAuthenticated || !accessToken) { router.replace('/login'); return; }
    Promise.all([
      fetch(`${API_URL}/auth/profile`, { headers: { Authorization: `Bearer ${accessToken}` } }).then(r => r.json()).then(d => setUser(d.data?.user)).catch(() => {}),
      fetch(`${API_URL}/notifications/unread-count`, { headers: { Authorization: `Bearer ${accessToken}` } }).then(r => r.json()).then(d => { if (d.count !== undefined) setUnreadNotifCount(d.count); }).catch(() => {}),
      fetch(`${API_URL}/vendor/me`, { headers: { Authorization: `Bearer ${accessToken}` } }).then(r => r.json()).then(d => setVendorProfile(d.data || null)).catch(() => setVendorProfile(null)),
    ]);
  }, [isAuthenticated, accessToken]);

  const handlePlaceOrders = async () => {
    if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
      alert('Please fill in customer name, phone, and delivery address');
      return;
    }
    setOrdering(true);
    try {
      const results = await Promise.allSettled(
        items.map(item =>
          fetch(`${API_URL}/reselling/order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
            body: JSON.stringify({
              productId: item.productId,
              resellerPrice: item.resellerPrice,
              customerName: item.customerName || customerInfo.name,
              customerPhone: item.customerPhone || customerInfo.phone,
              customerAltPhone: item.customerAltPhone || customerInfo.altPhone || undefined,
              customerAddress: item.customerAddress || customerInfo.address,
              paymentMethod: item.paymentMethod || customerInfo.paymentMethod,
            }),
          }).then(r => r.json())
        )
      );
      const succeeded = results.filter(r => r.status === 'fulfilled' && (r as any).value?.data).length;
      const failed = results.length - succeeded;
      if (succeeded > 0) {
        clearCart();
        alert(`${succeeded} order(s) placed successfully!${failed > 0 ? ` ${failed} failed.` : ''}`);
        router.push('/reselling/orders');
      } else {
        alert('Failed to place orders. Please try again.');
      }
    } catch { alert('Connection error'); }
    finally { setOrdering(false); }
  };

  const handleLogout = () => { clearAuth(); router.replace('/login'); };
  const copyReferCode = () => { if (user?.ownRefercode) navigator.clipboard.writeText(user.ownRefercode); };

  return (
    <>
      <Head><title>Cart - Dreamy Life</title></Head>
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
        <DesktopHeader title="Cart" onMenuClick={() => setDrawerOpen(true)} avatarUrl={user?.info?.avatarUrl || ''} unreadNotifCount={unreadNotifCount} />
        <SideDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} user={user} vendorProfile={vendorProfile} handleLogout={handleLogout} copyReferCode={copyReferCode} />

        <header className="md:hidden flex justify-between items-center px-6 py-5 sticky top-0 z-40 bg-white/60 backdrop-blur-xl border-b border-white/30">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/50 border border-white/40 shadow-sm text-[#45474b]">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-lg font-extrabold tracking-tight text-[#1c1b1b]">Cart ({items.length})</h1>
          {items.length > 0 && (
            <button onClick={clearCart} className="text-xs font-semibold text-[#ba1a1a]">Clear</button>
          )}
        </header>

        <main className="max-w-[1280px] mx-auto px-6 pt-8 md:pt-32 pb-24 space-y-6 relative z-10">
          {items.length === 0 ? (
            <div className="text-center py-20">
              <span className="material-symbols-outlined text-6xl text-[#5d5e64]/30 mb-4">shopping_cart</span>
              <h2 className="text-xl font-bold text-[#1c1b1b] mb-2">Your cart is empty</h2>
              <p className="text-[#45474b] mb-6">Browse products and add them to your cart</p>
              <Link href="/reseller-shop" className="inline-flex px-8 py-3 bg-[#1A1A1A] text-white text-sm font-semibold rounded-full hover:opacity-90 transition-all">
                Browse Products
              </Link>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.productId} className="bg-white/50 backdrop-blur-[20px] rounded-2xl p-4 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
                    <div className="flex gap-4">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-white flex-shrink-0">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#5d5e64]/30">
                            <span className="material-symbols-outlined">image</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-sm font-bold text-[#1c1b1b] truncate">{item.name}</h3>
                            <p className="text-xs text-[#45474b]">{item.shopName}</p>
                          </div>
                          <button onClick={() => removeItem(item.productId)} className="text-[#45474b] hover:text-[#ba1a1a] transition-colors">
                            <span className="material-symbols-outlined text-lg">close</span>
                          </button>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2 bg-white/50 rounded-full border border-white/30">
                            <button onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/60 transition-colors">
                              <span className="material-symbols-outlined text-sm">remove</span>
                            </button>
                            <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/60 transition-colors">
                              <span className="material-symbols-outlined text-sm">add</span>
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-[#45474b]">Cost: ${item.vendorPrice}</p>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-[#45474b]">Sell: $</span>
                              <input type="number" step="0.01" value={item.resellerPrice}
                                onChange={(e) => updateResellerPrice(item.productId, parseFloat(e.target.value) || 0)}
                                className="w-16 text-xs font-bold text-[#2d666d] bg-[#e9fdff]/50 border border-[#2d666d]/20 rounded-full px-2 py-1 text-right outline-none focus:ring-2 focus:ring-[#2d666d]/30" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Shared Customer Info */}
              <div className="bg-white/50 backdrop-blur-[20px] rounded-2xl p-6 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
                <h3 className="text-sm font-bold text-[#1c1b1b] mb-4 uppercase tracking-wider">Customer Details</h3>
                <div className="space-y-4">
                  <input type="text" placeholder="Customer Name *" value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                    className="w-full bg-white/50 backdrop-blur-[12px] border border-white/40 rounded-full px-6 py-3 text-sm text-[#1c1b1b] placeholder:text-[#45474b]/50 focus:bg-white/80 focus:border-[#98d0d7] focus:ring-4 focus:ring-[#98d0d7]/20 outline-none transition-all" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input type="tel" placeholder="Phone *" value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                      className="w-full bg-white/50 backdrop-blur-[12px] border border-white/40 rounded-full px-6 py-3 text-sm text-[#1c1b1b] placeholder:text-[#45474b]/50 focus:bg-white/80 focus:border-[#98d0d7] focus:ring-4 focus:ring-[#98d0d7]/20 outline-none transition-all" />
                    <input type="tel" placeholder="Alt Phone" value={customerInfo.altPhone}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, altPhone: e.target.value })}
                      className="w-full bg-white/50 backdrop-blur-[12px] border border-white/40 rounded-full px-6 py-3 text-sm text-[#1c1b1b] placeholder:text-[#45474b]/50 focus:bg-white/80 focus:border-[#98d0d7] focus:ring-4 focus:ring-[#98d0d7]/20 outline-none transition-all" />
                  </div>
                  <textarea placeholder="Delivery Address *" value={customerInfo.address} rows={2}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                    className="w-full bg-white/50 backdrop-blur-[12px] border border-white/40 rounded-2xl px-6 py-3 text-sm text-[#1c1b1b] placeholder:text-[#45474b]/50 resize-none focus:bg-white/80 focus:border-[#98d0d7] focus:ring-4 focus:ring-[#98d0d7]/20 outline-none transition-all" />
                  <select value={customerInfo.paymentMethod}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, paymentMethod: e.target.value })}
                    className="w-full bg-white/50 backdrop-blur-[12px] border border-white/40 rounded-full px-6 py-3 text-sm text-[#1c1b1b] appearance-none focus:bg-white/80 focus:border-[#98d0d7] focus:ring-4 focus:ring-[#98d0d7]/20 outline-none transition-all">
                    <option value="cash_on_delivery">Cash on Delivery</option>
                    <option value="bkash">bKash</option>
                    <option value="nagad">Nagad</option>
                  </select>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-white/50 backdrop-blur-[20px] rounded-2xl p-6 border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
                <h3 className="text-sm font-bold text-[#1c1b1b] mb-4 uppercase tracking-wider">Order Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#45474b]">Items ({items.reduce((s, i) => s + i.quantity, 0)})</span>
                    <span className="font-semibold">${getTotalCost().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#45474b]">Expected Revenue</span>
                    <span className="font-semibold">${items.reduce((s, i) => s + i.resellerPrice * i.quantity, 0).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-white/30 pt-3 flex justify-between">
                    <span className="font-bold text-[#1c1b1b]">Expected Profit</span>
                    <span className="font-bold text-[#2d666d] text-lg">${getTotalProfit().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Place Orders */}
              <button onClick={handlePlaceOrders} disabled={ordering}
                className="w-full py-4 bg-[#1A1A1A] text-white text-sm font-bold rounded-full hover:opacity-90 transition-all active:scale-[0.98] shadow-lg shadow-black/10 disabled:opacity-60 flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
                {ordering ? 'Placing Orders...' : `Place All Orders (${items.length})`}
              </button>
            </>
          )}
        </main>
      </div>
    </>
  );
}
