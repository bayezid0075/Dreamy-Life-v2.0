'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const getToken = () => localStorage.getItem('accessToken');

interface Vendor {
  id: string;
  userId: string;
  shopName: string;
  description: string;
  status: 'active' | 'banned';
  productCount: number;
  totalRevenue: string;
  ownerUsername: string;
  ownerFullName?: string;
  createdAt: string;
}

interface VendorStats {
  totalVendors: number;
  activeVendors: number;
  bannedVendors: number;
}

const LIMIT = 15;

export default function VendorPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupSuccess, setPopupSuccess] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');

  const fetchVendors = useCallback(async (pageNum: number) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(pageNum), limit: String(LIMIT) });
    if (filter !== 'all') params.set('status', filter);
    if (searchDebounce) params.set('search', searchDebounce);
    try {
      const res = await fetch(`${API_URL}/admin/vendors?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        const vendorList = Array.isArray(data.vendors) ? data.vendors : Array.isArray(data.data) ? data.data : [];
        if (pageNum === 1) {
          setVendors(vendorList);
        } else {
          setVendors((prev) => [...prev, ...vendorList]);
        }
        setHasMore(vendorList.length === LIMIT);
      }
    } catch {}
    setLoading(false);
  }, [filter, searchDebounce]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/admin/vendors?limit=1`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats({
          totalVendors: data.total || data.vendors?.length || 0,
          activeVendors: data.activeCount || 0,
          bannedVendors: data.bannedCount || 0,
        });
      }
    } catch {}
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounce(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
    fetchVendors(1);
  }, [filter, searchDebounce, fetchVendors]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleBanUnban = async (vendorId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'banned' : 'active';
    if (!confirm(`Are you sure you want to ${newStatus === 'banned' ? 'ban' : 'unban'} this vendor?`)) return;
    setActionLoading(vendorId);
    try {
      const res = await fetch(`${API_URL}/admin/vendors/${vendorId}/status`, {
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
        fetchVendors(page);
        fetchStats();
      } else {
        const data = await res.json();
        setPopupSuccess(false);
        setPopupMessage(data.message || 'Failed to update vendor status');
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
    fetchVendors(nextPage);
  };

  const formatAmount = (val: number) =>
    new Intl.NumberFormat('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Vendor Management</h1>
          <p className="text-on-surface-variant font-body-sm mt-1">Manage vendor shops, ban/unban vendors</p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="glass-panel rounded-xl p-4 border border-outline-variant">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 18 }}>storefront</span>
              <span className="text-body-sm text-on-surface-variant">Total Vendors</span>
            </div>
            <div className="text-headline-md font-bold text-primary">{stats.totalVendors}</div>
          </div>
          <div className="glass-panel rounded-xl p-4 border border-outline-variant">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 18 }}>check_circle</span>
              <span className="text-body-sm text-on-surface-variant">Active</span>
            </div>
            <div className="text-headline-md font-bold" style={{ color: '#059669' }}>{stats.activeVendors}</div>
          </div>
          <div className="glass-panel rounded-xl p-4 border border-outline-variant">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 18 }}>block</span>
              <span className="text-body-sm text-on-surface-variant">Banned</span>
            </div>
            <div className="text-headline-md font-bold" style={{ color: '#dc2626' }}>{stats.bannedVendors}</div>
          </div>
        </div>
      )}

      <div className="glass-panel rounded-xl p-4 border border-outline-variant">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 20 }}>search</span>
          <input
            type="text"
            placeholder="Search vendors by name or username..."
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
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['all', 'active', 'banned'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: filter === f ? '#2d666d' : 'white',
              color: filter === f ? 'white' : '#888',
              boxShadow: filter === f ? '0 2px 8px rgba(45,102,109,0.3)' : '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading && vendors.length === 0 ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : vendors.length === 0 ? (
        <div className="glass-panel rounded-xl p-12 text-center border border-outline-variant">
          <span className="material-symbols-outlined text-on-surface-variant mb-3 block" style={{ fontSize: 48 }}>storefront</span>
          <p className="text-on-surface-variant">No vendors found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {vendors.map((vendor) => (
            <div key={vendor.id} className="glass-panel rounded-xl p-4 border border-outline-variant hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push(`/dashboard/vendor/${vendor.id}`)}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold" style={{ background: '#e0f2f1', color: '#2d666d' }}>
                    {vendor.shopName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-primary hover:underline">{vendor.shopName}</div>
                    <div className="text-body-sm text-on-surface-variant">@{vendor.ownerUsername}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="px-2.5 py-1 rounded-lg text-body-sm font-semibold"
                    style={{
                      background: vendor.status === 'active' ? '#d1fae5' : '#fee2e2',
                      color: vendor.status === 'active' ? '#059669' : '#dc2626',
                    }}
                  >
                    {vendor.status === 'active' ? 'Active' : 'Banned'}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-3 text-body-sm text-on-surface-variant">
                <div className="flex items-center gap-4">
                  <span>{vendor.productCount || 0} products</span>
                  <span>৳{formatAmount(Number(vendor.totalRevenue || 0))}</span>
                </div>
                <span>{formatDate(vendor.createdAt)}</span>
              </div>

              <div className="flex gap-2 pt-3 border-t border-outline-variant">
                <button
                  onClick={() => router.push(`/dashboard/vendor/${vendor.id}`)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white transition-all"
                  style={{ background: 'linear-gradient(135deg, #2d666d, #0d9488)' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>visibility</span>
                  View Details
                </button>
                <button
                  onClick={() => handleBanUnban(vendor.id, vendor.status)}
                  disabled={actionLoading === vendor.id}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50"
                  style={{
                    background: vendor.status === 'active'
                      ? 'linear-gradient(135deg, #dc2626, #f87171)'
                      : 'linear-gradient(135deg, #059669, #34d399)',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    {actionLoading === vendor.id ? 'progress_activity' : vendor.status === 'active' ? 'block' : 'check_circle'}
                  </span>
                  {vendor.status === 'active' ? 'Ban' : 'Unban'}
                </button>
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
