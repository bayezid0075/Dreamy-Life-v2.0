'use client';

import { useEffect, useState, useCallback } from 'react';
import { getFundPayments, getFundStats, type FundPayment, type FundStats } from './api';

function StatCard({
  title,
  value,
  icon,
  color,
  trend,
}: {
  title: string;
  value: string;
  icon: string;
  color: string;
  trend?: string;
}) {
  const colorMap: Record<string, { text: string; bg: string; blur: string }> = {
    primary: { text: 'text-primary-container', bg: 'bg-primary-container/10', blur: 'bg-primary-container/20' },
    tertiary: { text: 'text-tertiary', bg: 'bg-tertiary/10', blur: 'bg-tertiary/20' },
    secondary: { text: 'text-error', bg: 'bg-error/10', blur: 'bg-secondary-container/20' },
  };
  const c = colorMap[color] || colorMap.tertiary;

  return (
    <div className="glass-panel rounded-xl p-md flex flex-col justify-between relative overflow-hidden group">
      <div className={`absolute -right-4 -top-4 w-24 h-24 ${c.blur} rounded-full blur-xl group-hover:blur-2xl transition-all`} />
      <div className="flex items-center justify-between">
        <div>
          <p className="font-label-caps text-label-caps text-on-surface-variant uppercase font-bold">{title}</p>
          <h2 className={`font-display-lg text-display-lg mt-xs font-bold ${color === 'primary' ? 'neon-text text-primary-container' : 'text-on-surface'}`}>
            {value}
          </h2>
        </div>
        <div className={`w-12 h-12 rounded-full ${c.bg} flex items-center justify-center`}>
          <span className="material-symbols-outlined text-[24px]">{icon}</span>
        </div>
      </div>
      {trend && (
        <div className={`flex items-center ${c.text} font-code-sm text-code-sm ${c.bg} px-2 py-1 rounded mt-md self-start`}>
          {trend}
        </div>
      )}
    </div>
  );
}

export default function FundsTracker() {
  const [stats, setStats] = useState<FundStats | null>(null);
  const [payments, setPayments] = useState<FundPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsData, paymentsData] = await Promise.all([
        getFundStats(),
        getFundPayments(page, 20, filter, search || undefined),
      ]);
      setStats(statsData);
      setPayments(paymentsData.payments);
      setTotalPages(paymentsData.totalPages);
    } catch (err) {
      console.error('Failed to fetch fund data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setPage(1);
    setLoading(true);
    try {
      const paymentsData = await getFundPayments(1, 20, filter, search || undefined);
      setPayments(paymentsData.payments);
      setTotalPages(paymentsData.totalPages);
    } catch (err) {
      console.error('Failed to search', err);
    } finally {
      setLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    completed: 'bg-tertiary-container/20 text-on-tertiary-container',
    pending: 'bg-primary-container/20 text-primary',
    failed: 'bg-error/10 text-error',
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="max-w-container-max mx-auto space-y-lg">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">Fund Tracking</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">Monitor all fund additions and payment activity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-md">
        <StatCard
          title="Total Collected"
          value={`৳${(stats?.totalCollected || 0).toLocaleString()}`}
          icon="account_balance"
          color="primary"
          trend="All time"
        />
        <StatCard
          title="Today's Collection"
          value={`৳${(stats?.todayCollected || 0).toLocaleString()}`}
          icon="today"
          color="tertiary"
          trend="Current day"
        />
        <StatCard
          title="Unique Payers"
          value={(stats?.uniquePayers || 0).toLocaleString()}
          icon="group"
          color="secondary"
          trend="Total users"
        />
        <StatCard
          title="Recent Payment"
          value={stats?.recentPayments?.[0] ? `৳${stats.recentPayments[0].amount}` : '৳0'}
          icon="payments"
          color="tertiary"
          trend={stats?.recentPayments?.[0] ? formatDate(stats.recentPayments[0].createdAt) : 'No payments'}
        />
      </div>

      <div className="glass-panel rounded-xl p-md">
        <div className="flex flex-col sm:flex-row gap-4 mb-md">
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all', label: 'All Time' },
              { key: 'today', label: 'Today' },
              { key: '7d', label: '7 Days' },
              { key: '30d', label: '30 Days' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => { setFilter(f.key); setPage(1); }}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                  filter === f.key
                    ? 'bg-primary-container text-on-primary-container'
                    : 'border border-outline-variant text-on-surface hover:border-primary-container'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              placeholder="Search by username, invoice, method..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-4 py-2 rounded-full border border-outline-variant bg-surface text-on-surface font-body-sm text-body-sm focus:border-primary-container focus:outline-none"
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 rounded-full bg-primary-container text-on-primary-container font-bold text-sm hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-[18px]">search</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-body-sm text-body-sm">
            <thead>
              <tr className="text-on-surface-variant border-b border-outline-variant/50">
                <th className="py-3 font-bold">User</th>
                <th className="py-3 font-bold">Amount</th>
                <th className="py-3 font-bold">Fee</th>
                <th className="py-3 font-bold">Method</th>
                <th className="py-3 font-bold">Status</th>
                <th className="py-3 font-bold text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => (
                <tr key={payment.id} className="border-b border-outline-variant/30 hover:bg-primary-container/10 transition-colors">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center">
                        <span className="material-symbols-outlined text-[16px]">person</span>
                      </div>
                      <span className="text-on-surface font-bold">{payment.username}</span>
                    </div>
                  </td>
                  <td className="py-3 font-bold text-on-surface">৳{payment.amount.toFixed(2)}</td>
                  <td className="py-3 text-on-surface-variant">৳{payment.fee.toFixed(2)}</td>
                  <td className="py-3">
                    <span className="px-2 py-1 rounded-full text-xs font-bold bg-surface-variant text-on-surface-variant">
                      {payment.paymentMethod || 'N/A'}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusColors[payment.status] || 'bg-surface-variant text-on-surface-variant'}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="py-3 text-right text-on-surface-variant font-bold">
                    {formatDate(payment.createdAt)}
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-on-surface-variant">No fund payments found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-md">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 rounded border border-outline-variant text-on-surface-variant hover:border-primary-container disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <span className="px-3 py-1 text-on-surface-variant font-bold text-sm">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 rounded border border-outline-variant text-on-surface-variant hover:border-primary-container disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
