'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Product {
  id: string;
  name: string;
  actualPrice: string;
  discountPrice: string;
  stock: number;
  imageUrls: string[];
  status: string;
  category: string;
  vendorShopName: string;
  vendorId: string;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const LIMIT = 15;

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupSuccess, setPopupSuccess] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounce(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
    fetchProducts(1);
  }, [searchDebounce, categoryFilter, fetchProducts]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const getToken = () => localStorage.getItem('accessToken');

  const fetchProducts = useCallback(async (pageNum: number) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(pageNum), limit: String(LIMIT) });
    if (searchDebounce) params.set('search', searchDebounce);
    if (categoryFilter) params.set('category', categoryFilter);
    try {
      const res = await fetch(`${API_URL}/admin/products?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data.data?.products) ? data.data.products
          : Array.isArray(data.products) ? data.products
          : Array.isArray(data.data) ? data.data
          : Array.isArray(data) ? data
          : [];
        if (pageNum === 1) {
          setProducts(items);
        } else {
          setProducts((prev) => [...prev, ...items]);
        }
        setHasMore(items.length === LIMIT);
      }
    } catch {}
    setLoading(false);
  }, [searchDebounce, categoryFilter]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/categories/all`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data.data) ? data.data : Array.isArray(data.categories) ? data.categories : Array.isArray(data) ? data : [];
        setCategories(items);
      }
    } catch {}
  }, []);

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product? This action can be undone later.')) return;
    setActionLoading(productId);
    try {
      const res = await fetch(`${API_URL}/admin/products/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        setPopupSuccess(true);
        setPopupMessage('Product deleted successfully');
        fetchProducts(page);
      } else {
        const data = await res.json();
        setPopupSuccess(false);
        setPopupMessage(data.message || 'Failed to delete product');
      }
    } catch {
      setPopupSuccess(false);
      setPopupMessage('Network error');
    }
    setPopupVisible(true);
    setActionLoading(null);
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProducts(nextPage);
  };

  const formatAmount = (val: number) =>
    new Intl.NumberFormat('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Product Management</h1>
          <p className="text-on-surface-variant font-body-sm mt-1">Manage all products across vendors</p>
        </div>
      </div>

      <div className="glass-panel rounded-xl p-4 border border-outline-variant">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
          <div className="flex items-center gap-3 flex-1">
            <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 20 }}>search</span>
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent outline-none text-primary placeholder-on-surface-variant text-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-on-surface-variant hover:text-primary">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
              </button>
            )}
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-outline bg-surface text-primary text-sm"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && products.length === 0 ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : products.length === 0 ? (
        <div className="glass-panel rounded-xl p-12 text-center border border-outline-variant">
          <span className="material-symbols-outlined text-on-surface-variant mb-3 block" style={{ fontSize: 48 }}>inventory_2</span>
          <p className="text-on-surface-variant">No products found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <div key={product.id} className="glass-panel rounded-xl p-4 border border-outline-variant hover:shadow-md transition-all">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 relative">
                  {product.imageUrls?.[0] ? (
                    <Image src={product.imageUrls[0]} alt={product.name} fill className="object-cover" sizes="64px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-gray-400">image</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-primary">{product.name}</h3>
                      <p className="text-body-sm text-on-surface-variant">by {product.vendorShopName}</p>
                    </div>
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium flex-shrink-0"
                      style={{
                        background: product.status === 'active' ? '#d1fae5' : product.status === 'deleted' ? '#fee2e2' : '#fef3c7',
                        color: product.status === 'active' ? '#059669' : product.status === 'deleted' ? '#dc2626' : '#d97706',
                      }}
                    >
                      {product.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mt-2">
                    <div>
                      {product.discountPrice && Number(product.discountPrice) > 0 ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-primary">৳{formatAmount(Number(product.discountPrice))}</span>
                          <span className="text-xs text-on-surface-variant line-through">৳{formatAmount(Number(product.actualPrice))}</span>
                        </div>
                      ) : (
                        <span className="text-sm font-bold text-primary">৳{formatAmount(Number(product.actualPrice))}</span>
                      )}
                    </div>
                    <span className="text-body-sm text-on-surface-variant">Stock: {product.stock}</span>
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => router.push(`/dashboard/products/${product.id}`)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white transition-all"
                    style={{ background: 'linear-gradient(135deg, #2d666d, #0d9488)' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>visibility</span>
                    View
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    disabled={actionLoading === product.id || product.status === 'deleted'}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #dc2626, #f87171)' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                      {actionLoading === product.id ? 'progress_activity' : 'delete'}
                    </span>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold glass-panel border border-outline-variant transition-all hover:shadow-md"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          )}
        </div>
      )}

      {popupVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setPopupVisible(false)}>
          <div className="glass-panel rounded-2xl p-8 text-center max-w-sm w-full mx-4 shadow-2xl border border-outline-variant" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: popupSuccess ? '#d1fae5' : '#fee2e2' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 32, color: popupSuccess ? '#059669' : '#dc2626' }}>
                {popupSuccess ? 'check_circle' : 'error'}
              </span>
            </div>
            <h3 className="text-title-lg font-semibold text-primary mb-2">{popupSuccess ? 'Success' : 'Error'}</h3>
            <p className="text-on-surface-variant mb-4">{popupMessage}</p>
            <button
              onClick={() => setPopupVisible(false)}
              className="px-6 py-2 rounded-lg text-white font-semibold"
              style={{ background: popupSuccess ? '#059669' : '#dc2626' }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
