import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import AuthGuard from '@/shared/components/AuthGuard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function ShopPage() {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const { items, addItem } = useCartStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [addedId, setAddedId] = useState<string | null>(null);

  const totalCartItems = items.reduce((s, i) => s + i.quantity, 0);

  useEffect(() => { loadProducts(); }, [category]);

  useEffect(() => {
    if (!accessToken) return;
    fetch(`${API_URL}/auth/profile`, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json())
      .then(d => { if (d.data?.user) setUser(d.data.user); })
      .catch(() => {});
  }, [accessToken]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (search) params.set('search', search);
      const res = await fetch(`${API_URL}/vendor/feed?${params.toString()}`);
      if (res.ok) { const data = await res.json(); setProducts(data.data || []); }
    } catch { /* error */ }
    finally { setLoading(false); }
  };

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); loadProducts(); };

  const handleAddToCart = (e: React.MouseEvent, product: any) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      vendorPrice: product.price,
      image: product.imageUrls?.[0],
      shopName: product.shopName || '',
    });
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1000);
  };

  const categories = [
    { key: '', label: 'All' },
    { key: 'home_decor', label: 'Home Decor' },
    { key: 'furniture', label: 'Furniture' },
    { key: 'lighting', label: 'Lighting' },
    { key: 'textiles', label: 'Textiles' },
    { key: 'seating', label: 'Seating' },
    { key: 'tables', label: 'Tables' },
    { key: 'decor', label: 'Decor' },
  ];

  return (
    <AuthGuard>
      <Head><title>Shop - Dreamy Life</title></Head>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      <div className="min-h-screen pb-24" style={{
        backgroundColor: '#F8F8FF',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
      }}>
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute w-[400px] h-[400px] rounded-full blur-[80px] opacity-60 top-[-100px] left-[-100px]" style={{ background: '#FFE5D9' }} />
          <div className="absolute w-[350px] h-[350px] rounded-full blur-[80px] opacity-60 top-[20%] right-[-50px]" style={{ background: '#FFF3B0' }} />
          <div className="absolute w-[500px] h-[500px] rounded-full blur-[80px] opacity-60 bottom-[-150px] left-[10%]" style={{ background: '#D8F3DC' }} />
        </div>

        <div className="relative z-10 max-w-[1280px] mx-auto md:px-6">
          {/* TopAppBar */}
          <header className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)] w-full" style={{ backgroundColor: 'rgba(255,255,255,0.4)' }}>
            <div className="flex justify-between items-center w-full px-6 py-4">
              <Link href="/dashboard" className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm flex items-center justify-center bg-white/50">
                {user?.avatarUrl ? (
                  <img alt="Avatar" className="w-full h-full object-cover" src={user.avatarUrl} />
                ) : (
                  <span className="material-symbols-outlined text-[#5d5e64]">person</span>
                )}
              </Link>
              <h1 className="text-[24px] font-extrabold text-[#1c1b1b]" style={{ fontFamily: 'Plus Jakarta Sans' }}>Dreamy Life</h1>
              <Link href="/cart" className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/40 transition-opacity text-[#1c1b1b] relative" style={{ background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.3)' }}>
                <span className="material-symbols-outlined">shopping_cart</span>
                {totalCartItems > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#1c1b1b] text-white text-[10px] font-bold flex items-center justify-center">
                    {totalCartItems}
                  </span>
                )}
              </Link>
            </div>
          </header>

          <main className="px-6 pt-8">
            {/* Hero */}
            <section className="mb-8">
              <div className="flex justify-between items-end">
                <h2 className="text-[40px] md:text-[64px] font-extrabold text-[#1c1b1b] max-w-[80%] leading-tight" style={{ fontFamily: 'Plus Jakarta Sans', letterSpacing: '-0.02em' }}>
                  Find the one you prefer.
                </h2>
                <button onClick={() => setSearchOpen(!searchOpen)} className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-white/40 transition-colors mb-2" style={{ background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.3)' }}>
                  <span className="material-symbols-outlined text-[28px]">search</span>
                </button>
              </div>
            </section>

            {/* Search */}
            {searchOpen && (
              <section className="mb-6">
                <form onSubmit={handleSearch} className="flex gap-3">
                  <div className="flex-1 flex items-center rounded-full px-6 py-3" style={{ background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.3)' }}>
                    <span className="material-symbols-outlined text-[#45474b] mr-3 opacity-60">search</span>
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
                      className="bg-transparent border-none outline-none text-base text-[#1c1b1b] w-full placeholder:text-[#45474b]/50" />
                  </div>
                  <button type="submit" className="px-6 py-3 rounded-full bg-[#1c1b1b] text-white text-sm font-semibold hover:opacity-90 transition-opacity">
                    Search
                  </button>
                </form>
              </section>
            )}

            {/* Categories */}
            <section className="mb-8 -mx-6 px-6 overflow-x-auto no-scrollbar">
              <div className="flex gap-3 w-max pb-2">
                {categories.map(c => (
                  <button key={c.key} onClick={() => setCategory(c.key)}
                    className={`px-6 py-3 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                      category === c.key
                        ? 'bg-[#1c1b1b] text-white shadow-sm'
                        : 'text-[#1c1b1b] hover:bg-white/40'
                    }`}
                    style={category !== c.key ? { background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.3)' } : {}}>
                    {c.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Product Grid */}
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin h-8 w-8 border-4 border-[#5d5e64] border-t-transparent rounded-full" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <span className="material-symbols-outlined text-6xl text-[#5d5e64]/20">inventory_2</span>
                <p className="text-[#45474b] mt-4 font-semibold">No products found</p>
              </div>
            ) : (
              <section className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
                {products.map((product: any) => (
                  <Link key={product.id} href={`/reseller-shop/${product.id}`}
                    className="flex flex-col group hover:-translate-y-1 transition-transform duration-300 cursor-pointer h-full"
                    style={{
                      background: 'rgba(255,255,255,0.5)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      borderRadius: '30px',
                      padding: '24px',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.04)',
                    }}>
                    <div className="relative w-full aspect-square overflow-hidden mb-4" style={{ borderRadius: '20px', background: 'rgba(255,255,255,0.3)' }}>
                      {product.imageUrls?.[0] ? (
                        <img src={product.imageUrls[0]} alt={product.name}
                          className="w-full h-full object-cover mix-blend-multiply opacity-90 group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#5d5e64]/20">
                          <span className="material-symbols-outlined text-5xl">image</span>
                        </div>
                      )}
                      {product.stock <= 0 && (
                        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(4px)' }}>
                          <span className="text-xs font-bold text-[#93000a] bg-[#ffdad6] px-3 py-1 rounded-full">Out of Stock</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-auto flex flex-col">
                      <p className="text-xs text-[#45474b] opacity-70 mb-1">{product.shopName}</p>
                      <h3 className="text-sm font-bold text-[#1c1b1b] mb-1 line-clamp-2 leading-tight">{product.name}</h3>
                      <div className="flex justify-between items-end mt-auto">
                        <p className="text-sm font-semibold text-[#5d5e64]">${product.price}</p>
                        <button
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                            addedId === product.id
                              ? 'bg-[#2d666d] text-white scale-110'
                              : product.stock <= 0
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-[#1c1b1b] text-white hover:bg-[#313030]'
                          }`}
                          disabled={product.stock <= 0}
                          onClick={(e) => handleAddToCart(e, product)}>
                          <span className="material-symbols-outlined text-[18px]">
                            {addedId === product.id ? 'check' : 'add_shopping_cart'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </Link>
                ))}
              </section>
            )}
          </main>
        </div>

        {/* BottomNavBar */}
        <nav className="md:hidden fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-md z-50 flex justify-between items-center py-3 px-6 rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.1)]"
          style={{ background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.3)' }}>
          <Link href="/dashboard" className="flex items-center justify-center text-[#45474b] p-3 hover:bg-white/20 transition-colors rounded-full">
            <span className="material-symbols-outlined">home</span>
          </Link>
          <button onClick={() => setSearchOpen(true)} className="flex items-center justify-center text-[#45474b] p-3 hover:bg-white/20 transition-colors rounded-full">
            <span className="material-symbols-outlined">search</span>
          </button>
          <Link href="/cart" className="flex items-center justify-center text-[#45474b] p-3 hover:bg-white/20 transition-colors rounded-full relative">
            <span className="material-symbols-outlined">shopping_cart</span>
            {totalCartItems > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#1c1b1b] text-white text-[10px] font-bold flex items-center justify-center">
                {totalCartItems}
              </span>
            )}
          </Link>
          <Link href="/profile" className="flex items-center justify-center text-[#45474b] p-3 hover:bg-white/20 transition-colors rounded-full">
            <span className="material-symbols-outlined">person</span>
          </Link>
        </nav>
      </div>
    </AuthGuard>
  );
}
