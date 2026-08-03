'use client';

import { useState, useEffect, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const getToken = () => localStorage.getItem('accessToken');

interface Withdrawal {
  id: string;
  userId: string;
  amount: string;
  chargePercent: string;
  chargeAmount: string;
  totalAmount: string;
  method: string;
  phoneNumber: string;
  status: string;
  adminNote: string | null;
  processedAt: string | null;
  createdAt: string;
}

interface WithdrawConfig {
  id: string;
  minimumBalance: string;
  chargePercent: string;
  isActive: boolean;
}

interface WithdrawStats {
  pending: number;
  accepted: number;
  finished: number;
  rejected: number;
  totalAmount: string;
}

const STATUS_INFO: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending: { label: 'Pending', color: '#d97706', bg: '#fef3c7', icon: 'schedule' },
  accepted: { label: 'Accepted', color: '#2563eb', bg: '#dbeafe', icon: 'thumb_up' },
  finished: { label: 'Completed', color: '#059669', bg: '#d1fae5', icon: 'check_circle' },
  rejected: { label: 'Rejected', color: '#dc2626', bg: '#fee2e2', icon: 'cancel' },
};

const METHOD_ICONS: Record<string, { label: string; color: string; bg: string }> = {
  bkash: { label: 'bKash', color: '#e2136e', bg: '#fde8f0' },
  nagad: { label: 'Nagad', color: '#f58220', bg: '#fef3e2' },
  rocket: { label: 'Rocket', color: '#ec1c24', bg: '#fde8e9' },
};

export default function WithdrawControlPage() {
  const [loading, setLoading] = useState(true);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [stats, setStats] = useState<WithdrawStats | null>(null);
  const [config, setConfig] = useState<WithdrawConfig | null>(null);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupSuccess, setPopupSuccess] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [noteWithdrawalId, setNoteWithdrawalId] = useState('');
  const [noteText, setNoteText] = useState('');
  const [configSaving, setConfigSaving] = useState(false);

  const [minBalance, setMinBalance] = useState('100');
  const [chargePercent, setChargePercent] = useState('2');
  const [configActive, setConfigActive] = useState(true);

  useEffect(() => {
    fetchWithdrawals(1);
    fetchStats();
    fetchConfig();
  }, [fetchWithdrawals, fetchStats, fetchConfig]);

  const fetchWithdrawals = useCallback(async (pageNum: number) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/withdraw/admin/all?page=${pageNum}&limit=15${filter !== 'all' ? `&status=${filter}` : ''}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (pageNum === 1) {
          setWithdrawals(data.orders);
        } else {
          setWithdrawals((prev) => [...prev, ...data.orders]);
        }
        setHasMore(data.orders.length === 15);
      }
    } catch {}
    setLoading(false);
  }, [filter]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/withdraw/admin/stats`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) setStats(await res.json());
    } catch {}
  }, []);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/withdraw/config`);
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        setMinBalance(data.minimumBalance || '100');
        setChargePercent(data.chargePercent || '2');
        setConfigActive(data.isActive);
      }
    } catch {}
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`${API_URL}/withdraw/admin/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setPopupSuccess(true);
        setPopupMessage(`Withdrawal ${newStatus === 'rejected' ? 'rejected' : 'updated to ' + newStatus}`);
        fetchWithdrawals(1);
        fetchStats();
      } else {
        setPopupSuccess(false);
        setPopupMessage(data.message || 'Failed to update status');
      }
    } catch {
      setPopupSuccess(false);
      setPopupMessage('Network error');
    }
    setPopupVisible(true);
    setUpdatingId(null);
  };

  const handleRejectWithNote = async () => {
    if (!noteWithdrawalId) return;
    setUpdatingId(noteWithdrawalId);
    try {
      const res = await fetch(`${API_URL}/withdraw/admin/${noteWithdrawalId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ status: 'rejected', adminNote: noteText }),
      });
      if (res.ok) {
        setPopupSuccess(true);
        setPopupMessage('Withdrawal rejected with note');
        fetchWithdrawals(1);
        fetchStats();
      } else {
        const data = await res.json();
        setPopupSuccess(false);
        setPopupMessage(data.message || 'Failed to reject');
      }
    } catch {
      setPopupSuccess(false);
      setPopupMessage('Network error');
    }
    setPopupVisible(true);
    setNoteModalVisible(false);
    setNoteWithdrawalId('');
    setNoteText('');
    setUpdatingId(null);
  };

  const handleSaveConfig = async () => {
    setConfigSaving(true);
    try {
      const res = await fetch(`${API_URL}/withdraw/admin/config`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          minimumBalance: minBalance,
          chargePercent: chargePercent,
          isActive: configActive,
        }),
      });
      if (res.ok) {
        setPopupSuccess(true);
        setPopupMessage('Configuration saved successfully');
        fetchConfig();
      } else {
        setPopupSuccess(false);
        setPopupMessage('Failed to save configuration');
      }
    } catch {
      setPopupSuccess(false);
      setPopupMessage('Network error');
    }
    setPopupVisible(true);
    setConfigSaving(false);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatAmount = (val: number) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

  const filtered = filter === 'all' ? withdrawals : withdrawals.filter((w) => w.status === filter);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchWithdrawals(nextPage);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Withdrawal Management</h1>
          <p className="text-on-surface-variant font-body-sm mt-1">Manage user withdrawal requests and configuration</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="glass-panel rounded-xl p-4 border border-outline-variant">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 18 }}>pending</span>
            <span className="text-body-sm text-on-surface-variant">Pending</span>
          </div>
          <div className="text-headline-md font-bold" style={{ color: '#d97706' }}>{stats?.pending || 0}</div>
        </div>
        <div className="glass-panel rounded-xl p-4 border border-outline-variant">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 18 }}>thumb_up</span>
            <span className="text-body-sm text-on-surface-variant">Accepted</span>
          </div>
          <div className="text-headline-md font-bold" style={{ color: '#2563eb' }}>{stats?.accepted || 0}</div>
        </div>
        <div className="glass-panel rounded-xl p-4 border border-outline-variant">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 18 }}>check_circle</span>
            <span className="text-body-sm text-on-surface-variant">Completed</span>
          </div>
          <div className="text-headline-md font-bold" style={{ color: '#059669' }}>{stats?.finished || 0}</div>
        </div>
        <div className="glass-panel rounded-xl p-4 border border-outline-variant">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 18 }}>cancel</span>
            <span className="text-body-sm text-on-surface-variant">Rejected</span>
          </div>
          <div className="text-headline-md font-bold" style={{ color: '#dc2626' }}>{stats?.rejected || 0}</div>
        </div>
        <div className="glass-panel rounded-xl p-4 border border-outline-variant">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 18 }}>payments</span>
            <span className="text-body-sm text-on-surface-variant">Total</span>
          </div>
          <div className="text-headline-md font-bold text-primary">৳{formatAmount(Number(stats?.totalAmount || 0))}</div>
        </div>
      </div>

      {/* Config Section */}
      <div className="glass-panel rounded-xl p-6 border border-outline-variant">
        <h2 className="text-title-lg font-semibold text-primary mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>settings</span>
          Withdrawal Configuration
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-body-sm text-on-surface-variant mb-1 block">Minimum Balance (৳)</label>
            <input
              type="number"
              value={minBalance}
              onChange={(e) => setMinBalance(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-outline bg-surface text-primary"
              min="0"
            />
          </div>
          <div>
            <label className="text-body-sm text-on-surface-variant mb-1 block">Charge Percent (%)</label>
            <input
              type="number"
              value={chargePercent}
              onChange={(e) => setChargePercent(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-outline bg-surface text-primary"
              min="0"
              max="100"
              step="0.5"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                className="relative w-12 h-6 rounded-full transition-colors"
                style={{ background: configActive ? '#0d9488' : '#ccc' }}
                onClick={() => setConfigActive(!configActive)}
              >
                <div
                  className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                  style={{ transform: configActive ? 'translateX(24px)' : 'translateX(0)' }}
                />
              </div>
              <span className="text-body-sm text-on-surface-variant">{configActive ? 'Active' : 'Disabled'}</span>
            </label>
          </div>
        </div>
        <button
          onClick={handleSaveConfig}
          disabled={configSaving}
          className="px-6 py-2 rounded-lg text-white font-semibold transition-all disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #2d666d, #0d9488)' }}
        >
          {configSaving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'accepted', 'finished', 'rejected'] as const).map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1); fetchWithdrawals(1); }}
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

      {/* Withdrawal List */}
      {loading && withdrawals.length === 0 ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel rounded-xl p-12 text-center border border-outline-variant">
          <span className="material-symbols-outlined text-on-surface-variant mb-3 block" style={{ fontSize: 48 }}>inbox</span>
          <p className="text-on-surface-variant">No withdrawal requests found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((w) => {
            const methodInfo = METHOD_ICONS[w.method] || { label: w.method, color: '#888', bg: '#f0f0f0' };
            const statusInfo = STATUS_INFO[w.status] || STATUS_INFO.pending;
            const isUpdating = updatingId === w.id;
            return (
              <div key={w.id} className="glass-panel rounded-xl p-4 border border-outline-variant hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold" style={{ background: methodInfo.bg, color: methodInfo.color }}>
                      {w.method === 'bkash' ? 'bK' : w.method === 'nagad' ? 'Ng' : 'Rk'}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-primary">{methodInfo.label}</div>
                      <div className="text-body-sm text-on-surface-variant">{w.phoneNumber}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-title-md font-bold text-primary">৳{formatAmount(Number(w.totalAmount))}</div>
                    <div className="text-body-sm text-on-surface-variant">Amount: ৳{formatAmount(Number(w.amount))}</div>
                    {Number(w.chargeAmount) > 0 && (
                      <div className="text-body-sm" style={{ color: '#dc2626' }}>Charge: ৳{formatAmount(Number(w.chargeAmount))}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <span className="text-body-sm text-on-surface-variant">{formatDate(w.createdAt)}</span>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: statusInfo.bg }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 12, color: statusInfo.color }}>{statusInfo.icon}</span>
                    <span className="text-body-sm font-semibold" style={{ color: statusInfo.color }}>{statusInfo.label}</span>
                  </div>
                </div>

                {w.adminNote && (
                  <div className="mb-3 p-2 rounded-lg text-body-sm text-on-surface-variant" style={{ background: '#f8f9fa' }}>
                    <strong>Note:</strong> {w.adminNote}
                  </div>
                )}

                {w.status === 'pending' && (
                  <div className="flex gap-2 pt-3 border-t border-outline-variant">
                    <button
                      onClick={() => handleStatusChange(w.id, 'accepted')}
                      disabled={isUpdating}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #2563eb, #60a5fa)' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>thumb_up</span>
                      Accept
                    </button>
                    <button
                      onClick={() => { setNoteWithdrawalId(w.id); setNoteModalVisible(true); }}
                      disabled={isUpdating}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #dc2626, #f87171)' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>cancel</span>
                      Reject
                    </button>
                  </div>
                )}

                {w.status === 'accepted' && (
                  <div className="flex gap-2 pt-3 border-t border-outline-variant">
                    <button
                      onClick={() => handleStatusChange(w.id, 'finished')}
                      disabled={isUpdating}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #059669, #34d399)' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
                      Mark Finished
                    </button>
                  </div>
                )}
              </div>
            );
          })}

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

      {/* Status Popup */}
      {popupVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setPopupVisible(false)}>
          <div className="glass-panel rounded-2xl p-8 text-center max-w-sm w-full mx-4 shadow-2xl border border-outline-variant" onClick={(e) => e.stopPropagation()}>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: popupSuccess ? '#d1fae5' : '#fee2e2' }}
            >
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

      {/* Reject Note Modal */}
      {noteModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setNoteModalVisible(false)}>
          <div className="glass-panel rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl border border-outline-variant" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-title-lg font-semibold text-primary mb-3">Reject Withdrawal</h3>
            <p className="text-body-sm text-on-surface-variant mb-3">Add a note for the user (optional)</p>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Reason for rejection..."
              className="w-full px-3 py-2 rounded-lg border border-outline bg-surface text-primary resize-none"
              rows={3}
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => { setNoteModalVisible(false); setNoteWithdrawalId(''); setNoteText(''); }}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold border border-outline text-on-surface-variant hover:bg-surface-variant/50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectWithNote}
                disabled={updatingId === noteWithdrawalId}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #dc2626, #f87171)' }}
              >
                {updatingId === noteWithdrawalId ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
