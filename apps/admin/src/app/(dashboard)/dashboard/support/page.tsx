'use client';

import { useState } from 'react';

interface Ticket {
  id: string;
  subject: string;
  user: string;
  status: 'open' | 'pending' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

const sampleTickets: Ticket[] = [
  { id: '1', subject: 'Cannot access wallet balance', user: 'rahim_km', status: 'open', priority: 'high', createdAt: '2026-06-13' },
  { id: '2', subject: 'Referral commission not credited', user: 'tasnia_akter', status: 'pending', priority: 'medium', createdAt: '2026-06-12' },
  { id: '3', subject: 'Payment failed but amount deducted', user: 'imran_hossain', status: 'open', priority: 'high', createdAt: '2026-06-11' },
  { id: '4', subject: 'How to upgrade to PRO?', user: 'fatema_begum', status: 'resolved', priority: 'low', createdAt: '2026-06-10' },
  { id: '5', subject: 'App crashing on Android 14', user: 'kamal_hasan', status: 'open', priority: 'medium', createdAt: '2026-06-09' },
];

const statusColors: Record<string, string> = {
  open: 'bg-error/10 text-error',
  pending: 'bg-tertiary-container/20 text-on-tertiary-container',
  resolved: 'bg-primary-container/20 text-on-primary-container',
};

const priorityColors: Record<string, string> = {
  low: 'bg-surface-variant text-on-surface-variant',
  medium: 'bg-tertiary-container/20 text-on-tertiary-container',
  high: 'bg-error/10 text-error',
};

export default function SupportPage() {
  const [filter, setFilter] = useState<'all' | 'open' | 'pending' | 'resolved'>('all');

  const filtered = filter === 'all' ? sampleTickets : sampleTickets.filter((t) => t.status === filter);

  const counts = {
    all: sampleTickets.length,
    open: sampleTickets.filter((t) => t.status === 'open').length,
    pending: sampleTickets.filter((t) => t.status === 'pending').length,
    resolved: sampleTickets.filter((t) => t.status === 'resolved').length,
  };

  return (
    <div className="max-w-container-max mx-auto space-y-lg">
      <div>
        <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">Support</h2>
        <p className="font-body-md text-on-surface-variant mt-xs">Manage user support tickets</p>
      </div>

      <div className="flex flex-wrap gap-sm">
        {(['all', 'open', 'pending', 'resolved'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl font-label-caps text-label-caps font-bold transition-colors ${
              filter === f
                ? 'bg-primary-container text-on-primary-container'
                : 'glass-panel text-on-surface-variant hover:bg-surface-variant/50'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
          </button>
        ))}
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        <table className="w-full text-left font-body-sm text-body-sm">
          <thead>
            <tr className="text-on-surface-variant border-b border-outline-variant/50">
              <th className="px-md py-3 font-bold">Subject</th>
              <th className="px-md py-3 font-bold hidden sm:table-cell">User</th>
              <th className="px-md py-3 font-bold">Status</th>
              <th className="px-md py-3 font-bold hidden md:table-cell">Priority</th>
              <th className="px-md py-3 font-bold hidden lg:table-cell">Date</th>
              <th className="px-md py-3 font-bold text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((ticket) => (
              <tr key={ticket.id} className="border-b border-outline-variant/30 hover:bg-primary-container/10 transition-colors">
                <td className="px-md py-3">
                  <span className="text-on-surface font-bold">{ticket.subject}</span>
                </td>
                <td className="px-md py-3 text-on-surface-variant hidden sm:table-cell">{ticket.user}</td>
                <td className="px-md py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusColors[ticket.status]}`}>
                    {ticket.status}
                  </span>
                </td>
                <td className="px-md py-3 hidden md:table-cell">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${priorityColors[ticket.priority]}`}>
                    {ticket.priority}
                  </span>
                </td>
                <td className="px-md py-3 text-on-surface-variant hidden lg:table-cell">{ticket.createdAt}</td>
                <td className="px-md py-3 text-right">
                  <button className="text-primary hover:underline font-bold text-xs">View</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-md py-8 text-center text-on-surface-variant">
                  No tickets found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
