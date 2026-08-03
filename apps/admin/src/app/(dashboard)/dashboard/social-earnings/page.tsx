'use client';

import { useState, useEffect, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

interface Earning {
  id: string;
  userId: string;
  balance: string;
  totalEarned: string;
  totalWithdrawn: string;
  reactionCount: number;
  isActive: boolean;
  createdAt: string;
  username: string;
  email: string;
}

interface Withdrawal {
  id: string;
  userId: string;
  amount: string;
  method: string;
  phoneNumber: string;
  status: string;
  adminNote: string | null;
  processedAt: string | null;
  createdAt: string;
  username: string;
  email: string;
}

interface Stats {
  pending: number;
  accepted: number;
  finished: number;
  rejected: number;
  totalPaid: string;
}

export default function SocialEarningsAdminPage() {
  const [activeTab, setActiveTab] = useState<'withdrawals' | 'earnings'>('withdrawals');
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [noteModal, setNoteModal] = useState<{ id: string; action: string } | null>(null);
  const [note, setNote] = useState('');
  const [toast, setToast] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (activeTab === 'withdrawals') {
      fetchWithdrawals();
    } else {
      fetchEarnings();
    }
    fetchStats();
  }, [activeTab, statusFilter, page, fetchWithdrawals, fetchEarnings, fetchStats]);

  const fetchWithdrawals = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`${API_URL}/social-earnings/admin/withdrawals?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWithdrawals(data.data.items || []);
        setTotalPages(Math.ceil((data.data.total || 0) / 15));
      }
    } catch {}
    setLoading(false);
  }, [statusFilter, page]);

  const fetchEarnings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/social-earnings/admin/all?page=${page}&limit=15`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEarnings(data.data.items || []);
        setTotalPages(Math.ceil((data.data.total || 0) / 15));
      }
    } catch {}
    setLoading(false);
  }, [page]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/social-earnings/admin/stats`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.data);
      }
    } catch {}
  }, []);

  const handleStatusUpdate = async (id: string, status: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`${API_URL}/social-earnings/admin/withdrawals/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ status, adminNote: note || undefined }),
      });
      if (res.ok) {
        setToast({ success: true, message: `Withdrawal ${status}` });
        fetchWithdrawals();
        fetchStats();
      } else {
        setToast({ success: false, message: 'Failed to update' });
      }
    } catch {
      setToast({ success: false, message: 'Network error' });
    }
    setActionLoading(null);
    setNoteModal(null);
    setNote('');
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggleActive = async (userId: string) => {
    try {
      const res = await fetch(`${API_URL}/social-earnings/admin/earnings/${userId}/toggle`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        setToast({ success: true, message: 'Status updated' });
        fetchEarnings();
      }
    } catch {}
    setTimeout(() => setToast(null), 3000);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending': return { bg: '#fef3c7', color: '#d97706' };
      case 'accepted': return { bg: '#dbeafe', color: '#2563eb' };
      case 'finished': return { bg: '#d1fae5', color: '#059669' };
      case 'rejected': return { bg: '#fee2e2', color: '#dc2626' };
      default: return { bg: '#f3f4f6', color: '#6b7280' };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary" style={{ fontSize: 28 }}>payments</span>
        <h1 className="text-2xl font-bold text-primary">Social Earnings</h1>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Pending', value: stats.pending, bg: '#fef3c7', color: '#d97706' },
            { label: 'Accepted', value: stats.accepted, bg: '#dbeafe', color: '#2563eb' },
            { label: 'Completed', value: stats.finished, bg: '#d1fae5', color: '#059669' },
            { label: 'Rejected', value: stats.rejected, bg: '#fee2e2', color: '#dc2626' },
            { label: 'Total Paid', value: `$${Number(stats.totalPaid).toFixed(2)}`, bg: '#ede9fe', color: '#7c3aed' },
          ].map((s) => (
            <div key={s.label} className="glass-panel rounded-xl p-4 border border-outline-variant">
              <p className="text-xs text-on-surface-variant mb-1">{s.label}</p>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {(['withdrawals', 'earnings'] as const).map(tab => (
          <button key={tab} onClick={() => { setActiveTab(tab); setPage(1); setStatusFilter(''); }}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab ? 'bg-primary text-white shadow-md' : 'bg-white/50 text-on-surface-variant hover:bg-white/80 border border-outline-variant'
            }`}>
            {tab === 'withdrawals' ? 'Withdrawals' : 'All Earnings'}
          </button>
        ))}
      </div>

      {/* Withdrawals Tab */}
      {activeTab === 'withdrawals' && (
        <>
          <div className="flex gap-2 flex-wrap">
            {['', 'pending', 'accepted', 'finished', 'rejected'].map(s => (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                  statusFilter === s ? 'bg-primary text-white' : 'bg-white/50 text-on-surface-variant border border-outline-variant hover:bg-white/80'
                }`}>
                {s || 'All'}
              </button>
            ))}
          </div>

          <div className="glass-panel rounded-xl border border-outline-variant overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant bg-white/30">
                    <th className="text-left p-4 font-semibold text-on-surface-variant">User</th>
                    <th className="text-left p-4 font-semibold text-on-surface-variant">Amount</th>
                    <th className="text-left p-4 font-semibold text-on-surface-variant">Method</th>
                    <th className="text-left p-4 font-semibold text-on-surface-variant">Phone</th>
                    <th className="text-left p-4 font-semibold text-on-surface-variant">Status</th>
                    <th className="text-left p-4 font-semibold text-on-surface-variant">Date</th>
                    <th className="text-right p-4 font-semibold text-on-surface-variant">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="p-8 text-center text-on-surface-variant">Loading...</td></tr>
                  ) : withdrawals.length === 0 ? (
                    <tr><td colSpan={7} className="p-8 text-center text-on-surface-variant">No withdrawals found</td></tr>
                  ) : withdrawals.map(w => (
                    <tr key={w.id} className="border-b border-outline-variant/50 hover:bg-white/20 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-primary">{w.username}</div>
                        <div className="text-xs text-on-surface-variant">{w.email}</div>
                      </td>
                      <td className="p-4 font-bold text-primary">${Number(w.amount).toFixed(2)}</td>
                      <td className="p-4 capitalize">{w.method}</td>
                      <td className="p-4 font-mono text-xs">{w.phoneNumber}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={getStatusStyle(w.status)}>
                          {w.status}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-on-surface-variant">
                        {new Date(w.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        {w.status === 'pending' && (
                          <div className="flex gap-1 justify-end">
                            <button disabled={actionLoading === w.id} onClick={() => handleStatusUpdate(w.id, 'accepted')}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: '#059669' }}>
                              Accept
                            </button>
                            <button disabled={actionLoading === w.id} onClick={() => setNoteModal({ id: w.id, action: 'rejected' })}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: '#dc2626' }}>
                              Reject
                            </button>
                          </div>
                        )}
                        {w.status === 'accepted' && (
                          <button disabled={actionLoading === w.id} onClick={() => handleStatusUpdate(w.id, 'finished')}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: '#2563eb' }}>
                            Mark Paid
                          </button>
                        )}
                        {w.adminNote && (
                          <div className="text-xs text-on-surface-variant mt-1 italic">Note: {w.adminNote}</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Earnings Tab */}
      {activeTab === 'earnings' && (
        <div className="glass-panel rounded-xl border border-outline-variant overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant bg-white/30">
                  <th className="text-left p-4 font-semibold text-on-surface-variant">User</th>
                  <th className="text-left p-4 font-semibold text-on-surface-variant">Balance</th>
                  <th className="text-left p-4 font-semibold text-on-surface-variant">Total Earned</th>
                  <th className="text-left p-4 font-semibold text-on-surface-variant">Withdrawn</th>
                  <th className="text-left p-4 font-semibold text-on-surface-variant">Reactions</th>
                  <th className="text-left p-4 font-semibold text-on-surface-variant">Status</th>
                  <th className="text-right p-4 font-semibold text-on-surface-variant">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="p-8 text-center text-on-surface-variant">Loading...</td></tr>
                ) : earnings.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-on-surface-variant">No earnings found</td></tr>
                ) : earnings.map(e => (
                  <tr key={e.id} className="border-b border-outline-variant/50 hover:bg-white/20 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-primary">{e.username}</div>
                      <div className="text-xs text-on-surface-variant">{e.email}</div>
                    </td>
                    <td className="p-4 font-bold text-primary font-mono">${Number(e.balance).toFixed(5)}</td>
                    <td className="p-4 font-mono text-sm">${Number(e.totalEarned).toFixed(5)}</td>
                    <td className="p-4 font-mono text-sm">${Number(e.totalWithdrawn).toFixed(2)}</td>
                    <td className="p-4">{e.reactionCount}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${e.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {e.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleToggleActive(e.userId)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-white ${e.isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}>
                        {e.isActive ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-white/50 border border-outline-variant disabled:opacity-40">
            Previous
          </button>
          <span className="px-4 py-2 text-sm font-semibold text-on-surface-variant">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-white/50 border border-outline-variant disabled:opacity-40">
            Next
          </button>
        </div>
      )}

      {/* Reject Note Modal */}
      {noteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setNoteModal(null)}>
          <div className="glass-panel rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl border border-outline-variant" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-primary mb-4">Reject Withdrawal</h3>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Reason for rejection (optional)"
              className="w-full border border-outline-variant rounded-xl p-3 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary/30" rows={3} />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setNoteModal(null)} className="px-4 py-2 rounded-lg text-sm font-semibold border border-outline-variant">Cancel</button>
              <button onClick={() => handleStatusUpdate(noteModal.id, 'rejected')}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: '#dc2626' }}>
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className={`px-6 py-3 rounded-xl shadow-lg text-white font-semibold ${toast.success ? 'bg-emerald-500' : 'bg-red-500'}`}>
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
