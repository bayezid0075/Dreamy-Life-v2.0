'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const getToken = () => localStorage.getItem('accessToken');

interface Product {
  id: string;
  name: string;
  description: string;
  actualPrice: string;
  discountPrice: string;
  stock: number;
  imageUrls: string[];
  status: string;
  category: string;
  categoryName?: string;
  vendorShopName: string;
  vendorId: string;
  createdAt: string;
  colors?: string[];
  sizes?: string[];
  variantPrices?: Record<string, { price: number }>;
}

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupSuccess, setPopupSuccess] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');

  useEffect(() => {
    if (id) fetchProduct();
  }, [id, fetchProduct]);

  const fetchProduct = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/products/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProduct(data.data || data.product || data);
      }
    } catch {}
    setLoading(false);
  }, [id]);

  const handleDelete = async () => {
    if (!product) return;
    if (!confirm('Are you sure you want to delete this product?')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/products/${product.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        setPopupSuccess(true);
        setPopupMessage('Product deleted successfully');
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
    setActionLoading(false);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const formatAmount = (val: number) =>
    new Intl.NumberFormat('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="glass-panel rounded-xl p-12 text-center border border-outline-variant">
        <span className="material-symbols-outlined text-on-surface-variant mb-3 block" style={{ fontSize: 48 }}>error</span>
        <p className="text-on-surface-variant">Product not found</p>
        <button
          onClick={() => router.push('/dashboard/products')}
          className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #2d666d, #0d9488)' }}
        >
          Back to Products
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/dashboard/products')}
          className="flex items-center gap-1 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
          Back to Products
        </button>
      </div>

      <div className="glass-panel rounded-xl p-6 border border-outline-variant">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/3">
            <div className="grid grid-cols-2 gap-2">
              {product.imageUrls && product.imageUrls.length > 0 ? (
                product.imageUrls.map((url, i) => (
                  <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-100 relative">
                    <Image src={url} alt={`${product.name} ${i + 1}`} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
                  </div>
                ))
              ) : (
                <div className="aspect-square rounded-xl bg-gray-100 flex items-center justify-center col-span-2">
                  <span className="material-symbols-outlined text-gray-400" style={{ fontSize: 48 }}>image</span>
                </div>
              )}
            </div>
          </div>

          <div className="md:w-2/3">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-primary">{product.name}</h1>
                <p className="text-on-surface-variant mt-1">
                  by{' '}
                  <button
                    onClick={() => router.push(`/dashboard/vendor/${product.vendorId}`)}
                    className="font-semibold text-primary hover:underline"
                  >
                    {product.vendorShopName}
                  </button>
                </p>
              </div>
              <span
                className="px-3 py-1.5 rounded-lg text-sm font-semibold"
                style={{
                  background: product.status === 'active' ? '#d1fae5' : '#fee2e2',
                  color: product.status === 'active' ? '#059669' : '#dc2626',
                }}
              >
                {product.status}
              </span>
            </div>

            <div className="mb-4">
              {product.discountPrice && Number(product.discountPrice) > 0 ? (
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-primary">৳{formatAmount(Number(product.discountPrice))}</span>
                  <span className="text-lg text-on-surface-variant line-through">৳{formatAmount(Number(product.actualPrice))}</span>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background: '#d1fae5', color: '#059669' }}>
                    {Math.round(((Number(product.actualPrice) - Number(product.discountPrice)) / Number(product.actualPrice)) * 100)}% OFF
                  </span>
                </div>
              ) : (
                <span className="text-2xl font-bold text-primary">৳{formatAmount(Number(product.actualPrice))}</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="glass-panel rounded-xl p-3 border border-outline-variant">
                <p className="text-body-sm text-on-surface-variant">Stock</p>
                <p className="text-title-sm font-semibold text-primary">{product.stock}</p>
              </div>
              <div className="glass-panel rounded-xl p-3 border border-outline-variant">
                <p className="text-body-sm text-on-surface-variant">Category</p>
                <p className="text-title-sm font-semibold text-primary">{product.categoryName || product.category || 'N/A'}</p>
              </div>
              <div className="glass-panel rounded-xl p-3 border border-outline-variant">
                <p className="text-body-sm text-on-surface-variant">Listed</p>
                <p className="text-title-sm font-semibold text-primary">{formatDate(product.createdAt)}</p>
              </div>
              <div className="glass-panel rounded-xl p-3 border border-outline-variant">
                <p className="text-body-sm text-on-surface-variant">Product ID</p>
                <p className="text-title-sm font-semibold text-primary font-mono text-xs">{product.id}</p>
              </div>
            </div>

            {product.description && (
              <div className="mb-4">
                <p className="text-body-sm text-on-surface-variant mb-1">Description</p>
                <p className="text-sm text-primary">{product.description}</p>
              </div>
            )}

            {product.variantPrices && Object.keys(product.variantPrices).length > 0 && (
              <div className="mb-4">
                <p className="text-body-sm text-on-surface-variant mb-2">Variant Prices</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(product.variantPrices).map(([key, val]) => (
                    <div key={key} className="flex justify-between items-center glass-panel rounded-lg px-3 py-2 border border-outline-variant">
                      <span className="text-xs font-semibold text-on-surface-variant">{key}</span>
                      <span className="text-sm font-bold text-primary">৳{val.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-outline-variant">
              <button
                onClick={handleDelete}
                disabled={actionLoading || product.status === 'deleted'}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #dc2626, #f87171)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  {actionLoading ? 'progress_activity' : 'delete'}
                </span>
                Delete Product
              </button>
            </div>
          </div>
        </div>
      </div>

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
              onClick={() => {
                setPopupVisible(false);
                if (popupSuccess) router.push('/dashboard/products');
              }}
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
