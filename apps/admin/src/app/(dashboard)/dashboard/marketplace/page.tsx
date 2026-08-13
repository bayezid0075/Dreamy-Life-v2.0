'use client';

import { useState, useEffect, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('accessToken');
  }
  return null;
};

interface Job {
  id: string;
  posterId: string;
  title: string;
  description: string;
  type: 'single' | 'multiple';
  amount: string;
  unitPay: string;
  totalUnits: number;
  filledUnits: number;
  status: string;
  adminApproved: boolean;
  createdAt: string;
  posterUsername: string;
  posterFullName?: string;
}

interface Stats {
  totalJobs: number;
  pendingJobs: number;
  activeJobs: number;
  completedJobs: number;
  totalEscrow: number;
}

interface MarketplaceSettings {
  id: string;
  platformFeePercent: string;
  maxSubmissionsPerUser: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function MarketplacePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [settings, setSettings] = useState<MarketplaceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'jobs' | 'settings'>('jobs');

  const [feePercent, setFeePercent] = useState('5');
  const [maxSubmissions, setMaxSubmissions] = useState('3');
  const [marketplaceActive, setMarketplaceActive] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupSuccess, setPopupSuccess] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    const token = getToken();
    try {
      const [jobsRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/admin/marketplace/jobs${statusFilter ? `?status=${statusFilter}` : ''}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/admin/marketplace/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (jobsRes.ok) {
        const data = await jobsRes.json();
        setJobs(data.jobs || []);
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch marketplace data', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/admin/marketplace/settings`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        setFeePercent(data.platformFeePercent || '5');
        setMaxSubmissions(String(data.maxSubmissionsPerUser || 3));
        setMarketplaceActive(data.isActive ?? true);
      }
    } catch (err) {
      console.error('Failed to fetch settings', err);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    fetchSettings();
  }, [fetchJobs, fetchSettings]);

  const handleApprove = async (jobId: string) => {
    const token = getToken();
    setActionLoading(jobId);
    try {
      const res = await fetch(`${API_URL}/admin/marketplace/jobs/${jobId}/approve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchJobs();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (jobId: string) => {
    const token = getToken();
    if (!confirm('Reject this job? Funds will be refunded to poster.')) return;
    setActionLoading(jobId);
    try {
      const res = await fetch(`${API_URL}/admin/marketplace/jobs/${jobId}/reject`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchJobs();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (jobId: string) => {
    const token = getToken();
    const job = jobs.find((j) => j.id === jobId);
    if (!confirm(`Delete this job${job ? ` "${job.title}"` : ''}? Held escrow will be refunded to the poster. This cannot be undone.`)) return;
    setActionLoading(jobId);
    try {
      const res = await fetch(`${API_URL}/admin/marketplace/jobs/${jobId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchJobs();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || 'Failed to delete job');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete job');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    try {
      const res = await fetch(`${API_URL}/admin/marketplace/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          platformFeePercent: parseFloat(feePercent),
          maxSubmissionsPerUser: parseInt(maxSubmissions),
          isActive: marketplaceActive,
        }),
      });
      if (res.ok) {
        setPopupSuccess(true);
        setPopupMessage('Marketplace settings saved successfully');
        fetchSettings();
      } else {
        const data = await res.json().catch(() => ({}));
        setPopupSuccess(false);
        setPopupMessage(data.message || 'Failed to save settings');
      }
    } catch {
      setPopupSuccess(false);
      setPopupMessage('Network error');
    }
    setPopupVisible(true);
    setSettingsSaving(false);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Marketplace Management</h1>
        <p className="text-sm text-gray-500 mt-1">Manage job posts, escrow, and marketplace settings</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab('jobs')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'jobs'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Jobs & Stats
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'settings'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Settings
        </button>
      </div>

      {/* ─── Settings Tab ──────────────────────────────────────────────────── */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>settings</span>
              Marketplace Configuration
            </h2>
            <p className="text-sm text-gray-500 mb-5">Control platform fees, submission limits, and marketplace availability</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Platform Fee (%)</label>
                <p className="text-xs text-gray-400 mb-2">Percentage cut from each job total amount</p>
                <div className="relative">
                  <input
                    type="number"
                    value={feePercent}
                    onChange={(e) => setFeePercent(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    min="0"
                    max="100"
                    step="0.5"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Max Submissions Per User</label>
                <p className="text-xs text-gray-400 mb-2">How many times a user can submit to the same job</p>
                <input
                  type="number"
                  value={maxSubmissions}
                  onChange={(e) => setMaxSubmissions(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  min="1"
                  max="100"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1.5">Marketplace Status</label>
                <p className="text-xs text-gray-400 mb-2">Enable or disable the marketplace for all users</p>
                <div className="flex items-center gap-3 mt-auto">
                  <button
                    onClick={() => setMarketplaceActive(!marketplaceActive)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      marketplaceActive ? 'bg-teal-600' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        marketplaceActive ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className="text-sm font-medium" style={{ color: marketplaceActive ? '#059669' : '#9ca3af' }}>
                    {marketplaceActive ? 'Active' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveSettings}
              disabled={settingsSaving}
              className="px-6 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 transition-all"
            >
              {settingsSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>

          {/* Preview Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">How it works</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-teal-50 border border-teal-100">
                <div className="text-2xl font-bold text-teal-700">{feePercent}%</div>
                <div className="text-sm text-teal-600 mt-1">Platform Fee</div>
                <p className="text-xs text-teal-500 mt-1">
                  Charged on top of each job&apos;s total amount when a poster creates a job
                </p>
              </div>
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
                <div className="text-2xl font-bold text-blue-700">{maxSubmissions}</div>
                <div className="text-sm text-blue-600 mt-1">Submissions Limit</div>
                <p className="text-xs text-blue-500 mt-1">
                  Each user can submit up to {maxSubmissions} times per job
                </p>
              </div>
              <div className="p-4 rounded-lg border" style={{ background: marketplaceActive ? '#f0fdf4' : '#fef2f2', borderColor: marketplaceActive ? '#bbf7d0' : '#fecaca' }}>
                <div className="text-2xl font-bold" style={{ color: marketplaceActive ? '#15803d' : '#dc2626' }}>
                  {marketplaceActive ? 'ON' : 'OFF'}
                </div>
                <div className="text-sm mt-1" style={{ color: marketplaceActive ? '#16a34a' : '#ef4444' }}>Marketplace</div>
                <p className="text-xs mt-1" style={{ color: marketplaceActive ? '#22c55e' : '#f87171' }}>
                  {marketplaceActive ? 'Users can post and browse jobs' : 'Marketplace is closed to all users'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Jobs Tab ──────────────────────────────────────────────────────── */}
      {activeTab === 'jobs' && (
        <>
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500">Total Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalJobs}</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500">Pending Approval</p>
                <p className="text-2xl font-bold text-amber-600">{stats.pendingJobs}</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeJobs}</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-blue-600">{stats.completedJobs}</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500">In Escrow</p>
                <p className="text-2xl font-bold text-purple-600">৳{stats.totalEscrow.toFixed(0)}</p>
              </div>
            </div>
          )}

          <div className="flex gap-2 mb-4 overflow-x-auto">
            {['', 'pending_approval', 'active', 'in_progress', 'completed', 'cancelled', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                  statusFilter === status
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status ? status.replace('_', ' ') : 'All'}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-gray-400 border-t-transparent rounded-full" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
              <p className="text-gray-500 text-lg">No jobs found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div key={job.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          job.status === 'active' ? 'bg-green-100 text-green-700' :
                          job.status === 'pending_approval' ? 'bg-amber-100 text-amber-700' :
                          job.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                          job.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {job.status.replace('_', ' ')}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                          {job.type}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900">{job.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{job.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>by @{job.posterUsername}</span>
                        <span className="font-semibold text-gray-900">৳{Number(job.amount).toFixed(0)}</span>
                        <span>{job.totalUnits} units</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {job.status === 'pending_approval' && (
                        <>
                          <button
                            onClick={() => handleApprove(job.id)}
                            disabled={actionLoading === job.id}
                            className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                          >
                            {actionLoading === job.id ? '...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleReject(job.id)}
                            disabled={actionLoading === job.id}
                            className="px-4 py-2 rounded-lg bg-red-100 text-red-700 text-sm font-medium hover:bg-red-200 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(job.id)}
                        disabled={actionLoading === job.id}
                        className="px-4 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 disabled:opacity-50"
                      >
                        {actionLoading === job.id ? '...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Status Popup */}
      {popupVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setPopupVisible(false)}>
          <div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full mx-4 shadow-2xl border border-gray-100" onClick={(e) => e.stopPropagation()}>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: popupSuccess ? '#d1fae5' : '#fee2e2' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 32, color: popupSuccess ? '#059669' : '#dc2626' }}>
                {popupSuccess ? 'check_circle' : 'error'}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{popupSuccess ? 'Success' : 'Error'}</h3>
            <p className="text-gray-500 mb-4">{popupMessage}</p>
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
