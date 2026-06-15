'use client';

import { useEffect, useState, useCallback } from 'react';
import { getUsers, updateUserStatus, deleteUser, type AdminUser, type UsersResponse } from './api';

const STATUS_OPTIONS = ['user', 'basic', 'standard', 'smart', 'vvip', 'super_admin'] as const;

const STATUS_COLORS: Record<string, string> = {
  super_admin: 'bg-tertiary-container/20 text-on-tertiary-container',
  vvip: 'bg-secondary-container/20 text-on-secondary-container',
  smart: 'bg-primary-container/20 text-primary',
  standard: 'bg-surface-variant text-on-surface-variant',
  basic: 'bg-outline-variant text-on-surface-variant',
  user: 'bg-error/10 text-error',
};

export default function UsersList() {
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [showStatusModal, setShowStatusModal] = useState<AdminUser | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<AdminUser | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<AdminUser | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getUsers(page, 20, search || undefined, statusFilter || undefined);
      setData(result);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      await updateUserStatus(userId, newStatus);
      setShowStatusModal(null);
      fetchUsers();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      await deleteUser(userId);
      setShowDeleteModal(null);
      fetchUsers();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete user');
    }
  };

  return (
    <div className="max-w-container-max mx-auto space-y-lg">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-md">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">User Management</h2>
          <p className="font-body-sm text-on-surface-variant mt-xs">
            {data?.total ?? 0} total users
          </p>
        </div>
        <div className="flex gap-sm items-center w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input
              className="w-full bg-surface-container-high/50 border border-outline-variant rounded-full py-2 pl-10 pr-4 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-body-sm"
              placeholder="Search users..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select
            className="bg-surface-container-high/50 border border-outline-variant rounded-full py-2 px-4 text-on-surface focus:outline-none focus:border-primary font-body-sm"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="glass-panel rounded-xl p-md text-error flex items-center gap-2">
          <span className="material-symbols-outlined">error</span>
          {error}
        </div>
      )}

      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-body-sm text-body-sm">
            <thead>
              <tr className="text-on-surface-variant border-b border-outline-variant/50">
                <th className="p-md font-bold">User</th>
                <th className="p-md font-bold">Phone</th>
                <th className="p-md font-bold">Status</th>
                <th className="p-md font-bold">Referral Code</th>
                <th className="p-md font-bold">Joined</th>
                <th className="p-md font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-lg text-center">
                    <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                  </td>
                </tr>
              ) : data?.users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-lg text-center text-on-surface-variant">No users found</td>
                </tr>
              ) : (
                data?.users.map((user) => (
                  <tr key={user.id} className="border-b border-outline-variant/30 hover:bg-primary-container/10 transition-colors">
                    <td className="p-md">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-variant overflow-hidden border border-outline-variant">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-on-surface-variant text-sm">person</span>
                          )}
                        </div>
                        <div>
                          <p className="text-on-surface font-bold">{user.username}</p>
                          <p className="text-on-surface-variant text-xs">{user.email || user.fullName || 'No email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-md text-on-surface-variant">{user.phoneNumber}</td>
                    <td className="p-md">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[user.memberStatus] || 'bg-surface-variant text-on-surface-variant'}`}>
                        {user.memberStatus}
                      </span>
                    </td>
                    <td className="p-md font-code-sm text-on-surface-variant">{user.ownRefercode}</td>
                    <td className="p-md text-on-surface-variant">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="p-md">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setShowDetailModal(user)}
                          className="p-2 rounded-lg hover:bg-surface-variant/50 text-on-surface-variant hover:text-primary transition-colors"
                          title="View Details"
                        >
                          <span className="material-symbols-outlined text-[20px]">visibility</span>
                        </button>
                        <button
                          onClick={() => setShowStatusModal(user)}
                          className="p-2 rounded-lg hover:bg-surface-variant/50 text-on-surface-variant hover:text-primary transition-colors"
                          title="Change Status"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button
                          onClick={() => setShowDeleteModal(user)}
                          className="p-2 rounded-lg hover:bg-surface-variant/50 text-on-surface-variant hover:text-error transition-colors"
                          title="Delete User"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data && data.totalPages > 1 && (
          <div className="flex justify-between items-center p-md border-t border-outline-variant/30">
            <p className="text-on-surface-variant font-body-sm">
              Page {data.page} of {data.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded border border-outline-variant text-on-surface hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-label-caps text-label-caps"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="px-3 py-1 rounded border border-outline-variant text-on-surface hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-label-caps text-label-caps"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-margin-mobile">
          <div className="glass-panel rounded-xl p-lg w-full max-w-md">
            <h3 className="font-title-md text-title-md text-on-surface font-bold mb-md">Change Status</h3>
            <p className="text-on-surface-variant mb-md">
              Update <strong>{showStatusModal.username}</strong> membership status
            </p>
            <div className="grid grid-cols-2 gap-sm">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(showStatusModal.id, s)}
                  className={`p-sm rounded-lg border transition-colors font-label-md text-label-md ${
                    showStatusModal.memberStatus === s
                      ? 'border-primary bg-primary/10 text-primary font-bold'
                      : 'border-outline-variant hover:border-primary text-on-surface-variant hover:text-primary'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowStatusModal(null)}
              className="w-full mt-md p-sm rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-variant/50 transition-colors font-label-md"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-margin-mobile">
          <div className="glass-panel rounded-xl p-lg w-full max-w-md">
            <h3 className="font-title-md text-title-md text-error font-bold mb-md">Delete User</h3>
            <p className="text-on-surface-variant mb-md">
              Are you sure you want to delete <strong>{showDeleteModal.username}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-sm">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="flex-1 p-sm rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-variant/50 transition-colors font-label-md"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteModal.id)}
                className="flex-1 p-sm rounded-lg bg-error text-on-error font-bold hover:bg-error/90 transition-colors font-label-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-margin-mobile">
          <div className="glass-panel rounded-xl p-lg w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-md">
              <h3 className="font-title-md text-title-md text-on-surface font-bold">User Details</h3>
              <button onClick={() => setShowDetailModal(null)} className="text-on-surface-variant hover:text-primary">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-md">
              <div className="flex items-center gap-md">
                <div className="w-16 h-16 rounded-full bg-surface-variant overflow-hidden border border-outline-variant">
                  {showDetailModal.avatarUrl ? (
                    <img src={showDetailModal.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-on-surface-variant text-3xl flex items-center justify-center h-full">person</span>
                  )}
                </div>
                <div>
                  <p className="font-headline-md text-headline-md text-on-surface font-bold">{showDetailModal.username}</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[showDetailModal.memberStatus] || 'bg-surface-variant text-on-surface-variant'}`}>
                    {showDetailModal.memberStatus}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-sm">
                <div className="p-sm rounded-lg bg-surface-container-high/30">
                  <p className="font-label-caps text-label-caps text-on-surface-variant uppercase">Phone</p>
                  <p className="text-on-surface font-bold">{showDetailModal.phoneNumber}</p>
                </div>
                <div className="p-sm rounded-lg bg-surface-container-high/30">
                  <p className="font-label-caps text-label-caps text-on-surface-variant uppercase">Email</p>
                  <p className="text-on-surface font-bold">{showDetailModal.email || 'Not set'}</p>
                </div>
                <div className="p-sm rounded-lg bg-surface-container-high/30">
                  <p className="font-label-caps text-label-caps text-on-surface-variant uppercase">Full Name</p>
                  <p className="text-on-surface font-bold">{showDetailModal.fullName || 'Not set'}</p>
                </div>
                <div className="p-sm rounded-lg bg-surface-container-high/30">
                  <p className="font-label-caps text-label-caps text-on-surface-variant uppercase">Referral Code</p>
                  <p className="text-on-surface font-bold font-code-sm">{showDetailModal.ownRefercode}</p>
                </div>
                <div className="p-sm rounded-lg bg-surface-container-high/30">
                  <p className="font-label-caps text-label-caps text-on-surface-variant uppercase">Referred By</p>
                  <p className="text-on-surface font-bold font-code-sm">{showDetailModal.referredBy || 'None'}</p>
                </div>
                <div className="p-sm rounded-lg bg-surface-container-high/30">
                  <p className="font-label-caps text-label-caps text-on-surface-variant uppercase">Total Referrals</p>
                  <p className="text-on-surface font-bold">{showDetailModal.totalReferrals ?? 0}</p>
                </div>
                <div className="p-sm rounded-lg bg-surface-container-high/30">
                  <p className="font-label-caps text-label-caps text-on-surface-variant uppercase">Joined</p>
                  <p className="text-on-surface font-bold">{new Date(showDetailModal.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="p-sm rounded-lg bg-surface-container-high/30">
                  <p className="font-label-caps text-label-caps text-on-surface-variant uppercase">Address</p>
                  <p className="text-on-surface font-bold">{showDetailModal.address || 'Not set'}</p>
                </div>
              </div>
              {showDetailModal.purchaseHistory && showDetailModal.purchaseHistory.length > 0 && (
                <div>
                  <h4 className="font-label-md text-label-md text-on-surface font-bold mb-sm">Purchase History</h4>
                  <div className="space-y-2">
                    {showDetailModal.purchaseHistory.map((p) => (
                      <div key={p.id} className="flex justify-between items-center p-sm rounded-lg bg-surface-container-high/30">
                        <span className="text-on-surface-variant font-body-sm">Plan Purchase</span>
                        <span className="text-on-surface font-bold">${Number(p.amount).toLocaleString()}</span>
                        <span className="text-on-surface-variant font-body-sm">{new Date(p.createdAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
