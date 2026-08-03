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

export default function MarketplacePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
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

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleApprove = async (jobId: string) => {
    const token = getToken();
    setActionLoading(jobId);
    try {
      const res = await fetch(`${API_URL}/admin/marketplace/jobs/${jobId}/approve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchAll();
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
      if (res.ok) fetchAll();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Marketplace Management</h1>
        <p className="text-sm text-gray-500 mt-1">Manage job posts and escrow</p>
      </div>

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
                {job.status === 'pending_approval' && (
                  <div className="flex gap-2 ml-4">
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
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
