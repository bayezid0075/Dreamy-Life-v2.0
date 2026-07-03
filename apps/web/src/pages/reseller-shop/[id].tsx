import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function ShopProductDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { accessToken } = useAuthStore();
  const { addItem, items } = useCartStore();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [resellerPrice, setResellerPrice] = useState('');
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderForm, setOrderForm] = useState({ customerName: '', customerPhone: '', customerAltPhone: '', customerAddress: '', paymentMethod: 'bkash' });
  const [ordering, setOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const images: string[] = product?.imageUrls || [];
  const inCart = items.some(i => i.productId === product?.id);

  useEffect(() => { if (id) loadProduct(); }, [id]);

  const loadProduct = async () => {
    try {
      const res = await fetch(`${API_URL}/vendor/products/detail/${id}`);
      if (res.ok) { const data = await res.json(); setProduct(data.data); }
    } catch { /* error */ }
    finally { setLoading(false); }
  };

  const profit = product && resellerPrice ? Math.max(0, parseFloat(resellerPrice) - product.price) : 0;

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      vendorPrice: product.price,
      image: images[0],
      shopName: product.shopName || '',
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 1500);
  };

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) { router.push('/login'); return; }
    setOrdering(true);
    try {
      const res = await fetch(`${API_URL}/reselling/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ productId: product.id, resellerPrice: parseFloat(resellerPrice), ...orderForm }),
      });
      if (!res.ok) { const data = await res.json(); alert(data.error?.message || 'Order failed'); return; }
      setOrderSuccess(true);
    } catch { alert('Connection failed'); }
    finally { setOrdering(false); }
  };

  const prevImage = () => setActiveImage(i => i > 0 ? i - 1 : images.length - 1);
  const nextImage = () => setActiveImage(i => i < images.length - 1 ? i + 1 : 0);

  if (loading) return <div className="min-h-screen bg-[#f8f8ff] flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-[#5d5e64] border-t-transparent rounded-full" /></div>;
  if (!product) return <div className="min-h-screen bg-[#f8f8ff] flex flex-col items-center justify-center gap-4"><span className="material-symbols-outlined text-6xl text-[#5d5e64]/30">error</span><h2 className="text-xl font-bold text-[#1c1b1b]">Product Not Found</h2></div>;

  return (
    <>
      <Head><title>{product.name} - Dreamy Life</title></Head>
      <div className="min-h-screen bg-[#f8f8ff]">
        <div className="fixed inset-0 z-[-1] pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_50%,rgba(184,236,243,0.4),transparent_50%),radial-gradient(circle_at_85%_30%,rgba(255,217,226,0.4),transparent_50%)] bg-[#f8f8ff]" />
        </div>
        <header className="fixed top-0 w-full z-50 bg-white/40 backdrop-blur-xl border-b border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)] px-6 py-4 flex justify-between items-center">
          <button onClick={() => router.back()} className="flex items-center justify-center w-10 h-10 rounded-full bg-white/40 hover:opacity-80 transition-opacity">
            <span className="material-symbols-outlined text-[#1c1b1b]">arrow_back</span>
          </button>
          <span className="text-lg font-bold text-[#1c1b1b] truncate max-w-[50%]">{product.name}</span>
          <Link href="/cart" className="flex items-center justify-center w-10 h-10 rounded-full bg-white/40 hover:opacity-80 transition-opacity relative">
            <span className="material-symbols-outlined text-[#1c1b1b]">shopping_cart</span>
            {items.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#1c1b1b] text-white text-[10px] font-bold flex items-center justify-center">
                {items.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </Link>
        </header>

        <main className="pt-24 max-w-[1280px] mx-auto px-6 pb-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
            {/* Image Slider */}
            <div className="space-y-4">
              <div className="relative w-full aspect-square bg-white/40 backdrop-blur-[20px] rounded-2xl border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)] overflow-hidden">
                {images.length > 0 ? (
                  <>
                    <img src={images[activeImage]} alt={product.name}
                      className="w-full h-full object-contain p-4 transition-opacity duration-300" />
                    {images.length > 1 && (
                      <>
                        <button onClick={prevImage}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/70 backdrop-blur-md flex items-center justify-center hover:bg-white/90 transition-colors shadow-sm">
                          <span className="material-symbols-outlined text-[#1c1b1b]">chevron_left</span>
                        </button>
                        <button onClick={nextImage}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/70 backdrop-blur-md flex items-center justify-center hover:bg-white/90 transition-colors shadow-sm">
                          <span className="material-symbols-outlined text-[#1c1b1b]">chevron_right</span>
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-8xl text-[#5d5e64]/20">image</span>
                  </div>
                )}
              </div>
              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((img, i) => (
                    <button key={i} onClick={() => setActiveImage(i)}
                      className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                        i === activeImage ? 'border-[#1c1b1b] scale-105' : 'border-white/30 opacity-60 hover:opacity-100'
                      }`}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
              {/* Dots */}
              {images.length > 1 && (
                <div className="flex justify-center gap-2">
                  {images.map((_, i) => (
                    <button key={i} onClick={() => setActiveImage(i)}
                      className={`w-2 h-2 rounded-full transition-all ${i === activeImage ? 'bg-[#1c1b1b] w-6' : 'bg-[#5d5e64]/30'}`} />
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex flex-col justify-center space-y-6 md:space-y-8 py-4">
              <div className="space-y-2">
                <h1 className="text-[32px] md:text-[48px] font-extrabold text-[#1c1b1b] leading-tight">{product.name}</h1>
                <div className="flex items-center space-x-4">
                  <span className="text-[28px] font-bold text-[#5d5e64]">${product.price}</span>
                  <span className="text-sm text-[#45474b] bg-[#eae7e7] px-3 py-1 rounded-full">{product.category?.replace('_', ' ')}</span>
                </div>
                <p className="text-sm text-[#45474b]">by {product.shopName}</p>
              </div>
              <p className="text-base text-[#45474b] leading-relaxed">{product.description || 'No description available.'}</p>
              <div className="flex items-center gap-2 text-sm text-[#45474b]">
                <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                <span>{product.stock} units in stock</span>
              </div>

              {accessToken && (
                <div className="space-y-4 pt-4">
                  <h3 className="text-sm font-semibold text-[#5d5e64] uppercase tracking-wider">Reseller Pricing</h3>
                  <div className="bg-white/40 backdrop-blur-[20px] rounded-2xl p-4 space-y-4 border border-white/30">
                    <div className="flex flex-col space-y-2">
                      <label className="text-sm font-semibold text-[#45474b]">Your Resale Price ($)</label>
                      <input type="number" step="0.01" value={resellerPrice} onChange={e => setResellerPrice(e.target.value)} placeholder="Enter your selling price"
                        className="w-full bg-white/50 border border-white/30 rounded-full px-4 py-2 text-[#1c1b1b] focus:outline-none focus:ring-2 focus:ring-[#5d5e64]/50 transition-all" />
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-white/20">
                      <span className="text-base text-[#45474b]">Potential Profit</span>
                      <span className="text-lg font-bold text-[#2d666d]">${profit.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-6 space-y-3">
                <button onClick={handleAddToCart}
                  className={`w-full py-4 px-8 rounded-full text-lg font-bold transition-all duration-300 shadow-[0_10px_20px_rgba(0,0,0,0.1)] flex items-center justify-center gap-2 ${
                    addedToCart
                      ? 'bg-[#2d666d] text-white'
                      : inCart
                        ? 'bg-white/60 text-[#1c1b1b] border border-white/50 hover:bg-white/80'
                        : 'bg-[#1c1b1b] text-white hover:opacity-90 hover:-translate-y-1'
                  }`}>
                  <span className="material-symbols-outlined text-[20px]">{addedToCart ? 'check' : inCart ? 'shopping_bag' : 'add_shopping_cart'}</span>
                  {addedToCart ? 'Added!' : inCart ? 'Add Another' : 'Add to Cart'}
                </button>
                {accessToken && resellerPrice && parseFloat(resellerPrice) > product.price && (
                  <button onClick={() => setShowOrderForm(true)}
                    className="w-full bg-[#2d666d] text-white py-4 px-8 rounded-full text-lg font-bold hover:opacity-90 hover:-translate-y-1 transition-all duration-300 shadow-[0_10px_20px_rgba(0,0,0,0.1)]">
                    Place Direct Order
                  </button>
                )}
                {!accessToken && (
                  <button onClick={() => router.push('/login')}
                    className="w-full bg-[#1A1A1A] text-white py-4 px-8 rounded-full text-lg font-bold hover:opacity-90 hover:-translate-y-1 transition-all duration-300 shadow-[0_10px_20px_rgba(0,0,0,0.1)]">
                    Login to Resell
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Order Form Modal */}
        {showOrderForm && (
          <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
              {orderSuccess ? (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-6xl text-[#2d666d] mb-4">check_circle</span>
                  <h2 className="text-xl font-bold text-[#1c1b1b] mb-2">Order Placed!</h2>
                  <p className="text-[#45474b] mb-6">Your reseller order has been placed successfully.</p>
                  <button onClick={() => { setShowOrderForm(false); setOrderSuccess(false); router.push('/reseller-shop'); }} className="bg-[#2d666d] text-white py-3 px-8 rounded-full font-bold hover:opacity-90 transition-all">Back to Shop</button>
                </div>
              ) : (
                <form onSubmit={handleOrder} className="space-y-4">
                  <h2 className="text-xl font-bold text-[#1c1b1b]">Reseller Order</h2>
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-semibold text-[#45474b]">Customer Name</label>
                    <input type="text" required value={orderForm.customerName} onChange={e => setOrderForm({ ...orderForm, customerName: e.target.value })} className="w-full bg-white/50 border border-white/30 rounded-full px-4 py-2 text-[#1c1b1b] focus:outline-none focus:ring-2 focus:ring-[#5d5e64]/50 transition-all" />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-semibold text-[#45474b]">Customer Phone</label>
                    <input type="text" required value={orderForm.customerPhone} onChange={e => setOrderForm({ ...orderForm, customerPhone: e.target.value })} className="w-full bg-white/50 border border-white/30 rounded-full px-4 py-2 text-[#1c1b1b] focus:outline-none focus:ring-2 focus:ring-[#5d5e64]/50 transition-all" />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-semibold text-[#45474b]">Alternative Phone</label>
                    <input type="text" value={orderForm.customerAltPhone} onChange={e => setOrderForm({ ...orderForm, customerAltPhone: e.target.value })} className="w-full bg-white/50 border border-white/30 rounded-full px-4 py-2 text-[#1c1b1b] focus:outline-none focus:ring-2 focus:ring-[#5d5e64]/50 transition-all" />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-semibold text-[#45474b]">Delivery Address</label>
                    <textarea required value={orderForm.customerAddress} onChange={e => setOrderForm({ ...orderForm, customerAddress: e.target.value })} rows={3} className="w-full bg-white/50 border border-white/30 rounded-2xl px-4 py-2 text-[#1c1b1b] focus:outline-none focus:ring-2 focus:ring-[#5d5e64]/50 transition-all resize-none" />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-semibold text-[#45474b]">Payment Method</label>
                    <select value={orderForm.paymentMethod} onChange={e => setOrderForm({ ...orderForm, paymentMethod: e.target.value })} className="w-full bg-white/50 border border-white/30 rounded-full px-4 py-2 text-[#1c1b1b] focus:outline-none focus:ring-2 focus:ring-[#5d5e64]/50 transition-all">
                      <option value="bkash">bKash</option>
                      <option value="nagad">Nagad</option>
                      <option value="cash">Cash on Delivery</option>
                    </select>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowOrderForm(false)} className="flex-1 bg-[#eae7e7] text-[#1c1b1b] py-3 px-6 rounded-full font-bold hover:opacity-90 transition-all">Cancel</button>
                    <button type="submit" disabled={ordering} className="flex-1 bg-[#2d666d] text-white py-3 px-6 rounded-full font-bold hover:opacity-90 transition-all disabled:opacity-50">{ordering ? 'Placing...' : 'Confirm Order'}</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
