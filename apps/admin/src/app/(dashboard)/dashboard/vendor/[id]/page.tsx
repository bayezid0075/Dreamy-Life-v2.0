'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface VendorDetail {
  id: string;
  userId: string;
  shopName: string;
  description: string;
  status: 'active' | 'banned';
  bannerUrl?: string;
  address?: string;
  createdAt: string;
  ownerUsername: string;
  ownerFullName?: string;
  ownerEmail?: string;
  productCount: number;
  orderCount: number;
  totalRevenue: string;
  products?: Product[];
}

interface Product {
  id: string;
  name: string;
  actualPrice: string;
  discountPrice: string;
  stock: number;
  imageUrls: string[];
  status: string;
  category?: string;
}

export default function VendorDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [vendor, setVendor] = useState<VendorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupSuccess, setPopupSuccess] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');

  useEffect(() => {
    if (id) fetchVendor();
  }, [id]);

  const getToken = () => localStorage.getItem('accessToken');

  const fetchVendor = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/vendors/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setVendor(data.vendor || data);
      }
    } catch {}
    setLoading(false);
  };

  const handleBanUnban = async () => {
    if (!vendor) return;
    const newStatus = vendor.status === 'active' ? 'banned' : 'active';
    if (!confirm(`Are you sure you want to ${newStatus === 'banned' ? 'ban' : 'unban'} this vendor?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/vendors/${vendor.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setPopupSuccess(true);
        setPopupMessage(`Vendor ${newStatus === 'banned' ? 'banned' : 'unbanned'} successfully`);
        fetchVendor();
      } else {
        const data = await res.json();
        setPopupSuccess(false);
        setPopupMessage(data.message || 'Failed to update status');
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

  if (!vendor) {
    return (
      <div className="glass-panel rounded-xl p-12 text-center border border-outline-variant">
        <span className="material-symbols-outlined text-on-surface-variant mb-3 block" style={{ fontSize: 48 }}>error</span>
        <p className="text-on-surface-variant">Vendor not found</p>
        <button
          onClick={() => router.push('/dashboard/vendor')}
          className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #2d666d, #0d9488)' }}
        >
          Back to Vendors
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/dashboard/vendor')}
          className="flex items-center gap-1 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
          Back to Vendors
        </button>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden border border-outline-variant">
        <div
          className="h-32 w-full"
          style={{
            background: vendor.bannerUrl
              ? `url(${vendor.bannerUrl}) center/cover`
              : 'linear-gradient(135deg, #2d666d, #0d9488)',
          }}
        />
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center text-xl font-bold border-4 border-white shadow-lg" style={{ background: '#e0f2f1', color: '#2d666d', marginTop: '-32px' }}>
                {vendor.shopName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary">{vendor.shopName}</h1>
                <p className="text-on-surface-variant">@{vendor.ownerUsername}</p>
              </div>
            </div>
            <div
              className="px-3 py-1.5 rounded-lg text-sm font-semibold"
              style={{
                background: vendor.status === 'active' ? '#d1fae5' : '#fee2e2',
                color: vendor.status === 'active' ? '#059669' : '#dc2626',
              }}
            >
              {vendor.status === 'active' ? 'Active' : 'Banned'}
            </div>
          </div>

          {vendor.description && (
            <p className="text-on-surface-variant mt-4">{vendor.description}</p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="glass-panel rounded-xl p-4 border border-outline-variant">
              <p className="text-body-sm text-on-surface-variant">Owner</p>
              <p className="text-title-sm font-semibold text-primary">{vendor.ownerFullName || vendor.ownerUsername}</p>
            </div>
            <div className="glass-panel rounded-xl p-4 border border-outline-variant">
              <p className="text-body-sm text-on-surface-variant">Email</p>
              <p className="text-title-sm font-semibold text-primary">{vendor.ownerEmail || 'N/A'}</p>
            </div>
            <div className="glass-panel rounded-xl p-4 border border-outline-variant">
              <p className="text-body-sm text-on-surface-variant">Address</p>
              <p className="text-title-sm font-semibold text-primary">{vendor.address || 'N/A'}</p>
            </div>
            <div className="glass-panel rounded-xl p-4 border border-outline-variant">
              <p className="text-body-sm text-on-surface-variant">Joined</p>
              <p className="text-title-sm font-semibold text-primary">{formatDate(vendor.createdAt)}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="glass-panel rounded-xl p-4 border border-outline-variant text-center">
              <p className="text-body-sm text-on-surface-variant">Products</p>
              <p className="text-headline-md font-bold text-primary">{vendor.productCount || 0}</p>
            </div>
            <div className="glass-panel rounded-xl p-4 border border-outline-variant text-center">
              <p className="text-body-sm text-on-surface-variant">Orders</p>
              <p className="text-headline-md font-bold text-primary">{vendor.orderCount || 0}</p>
            </div>
            <div className="glass-panel rounded-xl p-4 border border-outline-variant text-center">
              <p className="text-body-sm text-on-surface-variant">Revenue</p>
              <p className="text-headline-md font-bold text-primary">৳{formatAmount(Number(vendor.totalRevenue || 0))}</p>
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-6 border-t border-outline-variant">
            <button
              onClick={handleBanUnban}
              disabled={actionLoading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{
                background: vendor.status === 'active'
                  ? 'linear-gradient(135deg, #dc2626, #f87171)'
                  : 'linear-gradient(135deg, #059669, #34d399)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                {vendor.status === 'active' ? 'block' : 'check_circle'}
              </span>
              {vendor.status === 'active' ? 'Ban Vendor' : 'Unban Vendor'}
            </button>
          </div>
        </div>
      </div>

      {vendor.products && vendor.products.length > 0 && (
        <div className="glass-panel rounded-xl p-6 border border-outline-variant">
          <h2 className="text-title-lg font-semibold text-primary mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>inventory_2</span>
            Vendor Products ({vendor.products.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendor.products.map((product) => (
              <div key={product.id} className="glass-panel rounded-xl p-3 border border-outline-variant hover:shadow-md transition-all">
                <div className="flex gap-3">
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                    {product.imageUrls?.[0] ? (
                      <img src={product.imageUrls[0]} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-gray-400">image</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-primary truncate">{product.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {product.discountPrice && Number(product.discountPrice) > 0 ? (
                        <>
                          <span className="text-sm font-bold text-primary">৳{Number(product.discountPrice).toFixed(0)}</span>
                          <span className="text-xs text-on-surface-variant line-through">৳{Number(product.actualPrice).toFixed(0)}</span>
                        </>
                      ) : (
                        <span className="text-sm font-bold text-primary">৳{Number(product.actualPrice).toFixed(0)}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-on-surface-variant">Stock: {product.stock}</span>
                      <span
                        className="px-1.5 py-0.5 rounded text-xs font-medium"
                        style={{
                          background: product.status === 'active' ? '#d1fae5' : '#fee2e2',
                          color: product.status === 'active' ? '#059669' : '#dc2626',
                        }}
                      >
                        {product.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
