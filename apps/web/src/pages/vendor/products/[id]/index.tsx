import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { VendorProfile } from '@/features/vendor/api';
import DesktopHeader from '@/shared/components/DesktopHeader';
import SideDrawer from '@/shared/components/SideDrawer';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function ProductDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { accessToken, isAuthenticated, clearAuth } = useAuthStore();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { unreadCount: unreadNotifCount, setUnreadCount: setUnreadNotifCount } = useNotificationStore();
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) { router.replace('/login'); return; }
    if (id) loadProduct();
    Promise.all([
      fetch(`${API_URL}/auth/profile`, { headers: { Authorization: `Bearer ${accessToken}` } }).then(r => r.json()).then(d => setUser(d.data?.user)).catch(() => {}),
      fetch(`${API_URL}/notifications/unread-count`, { headers: { Authorization: `Bearer ${accessToken}` } }).then(r => r.json()).then(d => { if (d.count !== undefined) setUnreadNotifCount(d.count); }).catch(() => {}),
      fetch(`${API_URL}/vendor/me`, { headers: { Authorization: `Bearer ${accessToken}` } }).then(r => r.json()).then(d => setVendorProfile(d.data || null)).catch(() => setVendorProfile(null)),
    ]);
  }, [isAuthenticated, accessToken, id]);

  const loadProduct = async () => {
    try {
      const res = await fetch(`${API_URL}/vendor/products/detail/${id}`, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (res.ok) {
        const data = await res.json();
        setProduct(data.data);
      }
    } catch { /* error */ }
    finally { setLoading(false); }
  };

  const handleLogout = () => { clearAuth(); router.replace('/login'); };
  const copyReferCode = () => { if (user?.ownRefercode) navigator.clipboard.writeText(user.ownRefercode); };

  const goToSlide = (index: number) => {
    if (!product?.imageUrls) return;
    const len = product.imageUrls.length;
    if (index < 0) setCurrentSlide(len - 1);
    else if (index >= len) setCurrentSlide(0);
    else setCurrentSlide(index);
  };

  const handleTouchStart = (e: React.TouchEvent) => { setTouchEnd(null); setTouchStart(e.targetTouches[0].clientX); };
  const handleTouchMove = (e: React.TouchEvent) => { setTouchEnd(e.targetTouches[0].clientX); };
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const minSwipe = 50;
    if (distance > minSwipe) goToSlide(currentSlide + 1);
    if (distance < -minSwipe) goToSlide(currentSlide - 1);
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goToSlide(currentSlide - 1);
    if (e.key === 'ArrowRight') goToSlide(currentSlide + 1);
  }, [currentSlide]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f8ff] flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-2 border-[#5d5e64] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!product) {
    return (
      <>
        <Head><title>Product Not Found</title></Head>
        <div className="min-h-screen bg-[#f8f8ff] flex flex-col items-center justify-center gap-4 px-6">
          <span className="material-symbols-outlined text-6xl text-[#5d5e64]/30">inventory_2</span>
          <h2 className="text-xl font-bold text-[#1c1b1b]">Product Not Found</h2>
          <Link href="/vendor/products" className="px-6 py-3 rounded-full bg-[#1A1A1A] text-white text-sm font-semibold hover:opacity-90 transition-all">
            Back to Products
          </Link>
        </div>
      </>
    );
  }

  const images = product.imageUrls || [];
  const hasMultipleImages = images.length > 1;

  return (
    <>
      <Head><title>{product.name} - Vendor Suite</title></Head>
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
          title={product.name}
          onMenuClick={() => setDrawerOpen(true)}
          avatarUrl={user?.info?.avatarUrl || ''}
          unreadNotifCount={unreadNotifCount}
        />

        <SideDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          user={user}
          vendorProfile={vendorProfile}
          handleLogout={handleLogout}
          copyReferCode={copyReferCode}
        />

        <header className="md:hidden flex justify-between items-center px-6 py-5 sticky top-0 z-40 bg-white/60 backdrop-blur-xl border-b border-white/30">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/50 border border-white/40 shadow-sm text-[#45474b]">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-lg font-extrabold tracking-tight text-[#1c1b1b] truncate max-w-[200px]">{product.name}</h1>
          <Link href={`/vendor/products/${id}/edit`} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/50 border border-white/40 shadow-sm text-[#45474b]">
            <span className="material-symbols-outlined">edit</span>
          </Link>
        </header>

        <main className="max-w-[1280px] mx-auto px-6 pt-8 md:pt-32 pb-24 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {/* Image Slider */}
            <div className="space-y-4">
              <div
                ref={sliderRef}
                className="relative bg-white/50 backdrop-blur-[20px] rounded-2xl overflow-hidden border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)] aspect-square"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {images.length > 0 ? (
                  <div className="relative w-full h-full">
                    {images.map((url: string, i: number) => (
                      <div
                        key={i}
                        className={`absolute inset-0 transition-transform duration-500 ease-in-out ${
                          i === currentSlide ? 'translate-x-0' :
                          i < currentSlide ? '-translate-x-full' : 'translate-x-full'
                        }`}
                      >
                        <img src={url} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}

                    {/* Navigation Arrows */}
                    {hasMultipleImages && (
                      <>
                        <button
                          onClick={() => goToSlide(currentSlide - 1)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/50 transition-colors"
                        >
                          <span className="material-symbols-outlined">chevron_left</span>
                        </button>
                        <button
                          onClick={() => goToSlide(currentSlide + 1)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/50 transition-colors"
                        >
                          <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                      </>
                    )}

                    {/* Slide Counter */}
                    {hasMultipleImages && (
                      <div className="absolute bottom-3 right-3 bg-black/40 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                        {currentSlide + 1} / {images.length}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#5d5e64]/30">
                    <span className="material-symbols-outlined text-8xl">image</span>
                  </div>
                )}
              </div>

              {/* Thumbnail Strip */}
              {hasMultipleImages && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((url: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      className={`w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                        i === currentSlide
                          ? 'border-[#1c1b1b] shadow-lg scale-105'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Dot Indicators */}
              {hasMultipleImages && (
                <div className="flex justify-center gap-2 md:hidden">
                  {images.map((_: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        i === currentSlide ? 'bg-[#1c1b1b] w-6' : 'bg-[#5d5e64]/30 w-2'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    product.stock > 0
                      ? 'bg-[#e9fdff] text-[#2d666d]'
                      : 'bg-[#ffdad6] text-[#93000a]'
                  }`}>
                    {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                  {product.sku && (
                    <span className="text-xs text-[#45474b] opacity-50">SKU: #{product.sku}</span>
                  )}
                </div>
                <h1 className="text-[28px] md:text-[36px] font-extrabold text-[#1c1b1b] leading-tight mb-2">
                  {product.name}
                </h1>
                {product.category && (
                  <p className="text-sm text-[#45474b] capitalize mb-4">{product.category.replace('_', ' ')}</p>
                )}
                <div className="flex items-end gap-3">
                  {product.discountPrice ? (
                    <>
                      <span className="text-[20px] font-bold text-[#45474b] line-through leading-none">৳{product.actualPrice}</span>
                      <span className="text-[40px] font-extrabold text-[#1c1b1b] leading-none">৳{product.discountPrice}</span>
                    </>
                  ) : (
                    <span className="text-[40px] font-extrabold text-[#1c1b1b] leading-none">৳{product.actualPrice}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 bg-white/40 p-4 rounded-xl border border-white/30">
                <div className="w-10 h-10 rounded-full bg-[#e9fdff] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#2d666d]">inventory_2</span>
                </div>
                <div>
                  <p className="text-sm text-[#45474b]">Available Stock</p>
                  <p className="text-lg font-bold text-[#1c1b1b]">{product.stock} units</p>
                </div>
              </div>

              {product.description && (
                <div className="bg-white/40 p-6 rounded-xl border border-white/30">
                  <h3 className="text-sm font-semibold text-[#45474b] uppercase tracking-wider mb-3">Description</h3>
                  <p className="text-[#1c1b1b] leading-relaxed">{product.description}</p>
                </div>
              )}

              {product.variantPrices && Object.keys(product.variantPrices).length > 0 && (
                <div className="bg-white/40 p-6 rounded-xl border border-white/30">
                  <h3 className="text-sm font-semibold text-[#45474b] uppercase tracking-wider mb-3">Variant Prices</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(product.variantPrices).map(([key, val]: [string, any]) => (
                      <div key={key} className="flex justify-between items-center bg-white/50 rounded-lg px-3 py-2 border border-white/20">
                        <span className="text-xs font-semibold text-[#45474b]">{key}</span>
                        <span className="text-sm font-bold text-[#1c1b1b]">৳{val.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Link href={`/vendor/products/${id}/edit`}
                  className="flex-1 px-6 py-4 rounded-full bg-[#1A1A1A] text-white text-sm font-semibold hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-black/10">
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                  Edit Product
                </Link>
                <button
                  onClick={() => { router.push('/vendor/products'); }}
                  className="px-6 py-4 rounded-full bg-white/50 backdrop-blur-[24px] text-[#1c1b1b] text-sm font-semibold hover:bg-white/60 transition-all active:scale-95 border border-white/30">
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
