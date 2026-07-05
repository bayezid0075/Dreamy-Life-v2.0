'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  createNotification,
  sendNotification,
  deleteNotification,
  getNotifications,
  getNotificationStats,
  uploadMedia,
  type Notification,
  type NotificationStats,
  type CreateNotificationInput,
} from './api';

type Tab = 'compose' | 'history' | 'stats';

const iconOptions = [
  { value: 'campaign', label: 'Campaign' },
  { value: 'card_giftcard', label: 'Gift' },
  { value: 'local_shipping', label: 'Shipping' },
  { value: 'percent', label: 'Sale' },
  { value: 'notifications', label: 'General' },
  { value: 'star', label: 'Star' },
  { value: 'chat_bubble', label: 'Message' },
  { value: 'account_circle', label: 'Profile' },
];

export default function NotificationCenter() {
  const [activeTab, setActiveTab] = useState<Tab>('history');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sending, setSending] = useState<string | null>(null);

  const [form, setForm] = useState<CreateNotificationInput>({
    title: '',
    body: '',
    icon: 'campaign',
    imageUrl: '',
    link: '',
    type: 'broadcast',
    category: 'app',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getNotifications({ page, limit: 10, status: statusFilter || undefined });
      setNotifications(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  const loadStats = useCallback(async () => {
    try {
      const data = await getNotificationStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'history') loadNotifications();
    if (activeTab === 'stats') loadStats();
  }, [activeTab, loadNotifications, loadStats]);

  const handleCreate = async (andSend: boolean) => {
    if (!form.title.trim() || !form.body.trim()) {
      setFormError('Title and message are required');
      return;
    }
    setFormError('');
    setSubmitting(true);
    try {
      const created = await createNotification(form);
      if (andSend) {
        setSending(created.id);
        await sendNotification(created.id);
        setSending(null);
      }
      setForm({ title: '', body: '', icon: 'campaign', imageUrl: '', link: '', type: 'broadcast', category: 'app' });
      setImagePreview('');
      setActiveTab('history');
      setPage(1);
    } catch (err) {
      setFormError('Failed to create notification');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSend = async (id: string) => {
    setSending(id);
    try {
      await sendNotification(id);
      loadNotifications();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this notification?')) return;
    try {
      await deleteNotification(id);
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setFormError('Image must be under 5MB');
      return;
    }
    setUploadingImage(true);
    setFormError('');
    try {
      const url = await uploadMedia(file);
      setForm((prev) => ({ ...prev, imageUrl: url }));
      setImagePreview(url);
    } catch {
      setFormError('Failed to upload image');
    }
    setUploadingImage(false);
  };

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'compose', label: 'Compose', icon: 'edit' },
    { key: 'history', label: 'History', icon: 'history' },
    { key: 'stats', label: 'Stats', icon: 'monitoring' },
  ];

  return (
    <div className="space-y-lg">
      {/* Tab Bar */}
      <div className="flex gap-sm">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-sm px-md py-sm rounded-lg transition-colors font-body-sm text-body-sm ${
              activeTab === tab.key
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Compose Tab */}
      {activeTab === 'compose' && (
        <div className="glass-panel rounded-xl p-lg space-y-md">
          <h2 className="font-title-lg text-title-lg text-on-surface font-bold">New Notification</h2>
          {formError && (
            <div className="bg-error/10 text-error px-md py-sm rounded-lg text-body-sm">{formError}</div>
          )}
          <div className="space-y-sm">
            <label className="text-on-surface-variant font-body-sm text-body-sm font-medium">Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Notification title"
              className="w-full bg-surface-container-high/50 border border-outline-variant rounded-lg px-md py-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
          <div className="space-y-sm">
            <label className="text-on-surface-variant font-body-sm text-body-sm font-medium">Message</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Notification message..."
              rows={4}
              className="w-full bg-surface-container-high/50 border border-outline-variant rounded-lg px-md py-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
            />
          </div>
           <div className="grid grid-cols-2 gap-md">
            <div className="space-y-sm">
              <label className="text-on-surface-variant font-body-sm text-body-sm font-medium">Icon</label>
              <select
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                className="w-full bg-surface-container-high/50 border border-outline-variant rounded-lg px-md py-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              >
                {iconOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-sm">
              <label className="text-on-surface-variant font-body-sm text-body-sm font-medium">Category</label>
              <select
                value={form.category || 'app'}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-surface-container-high/50 border border-outline-variant rounded-lg px-md py-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              >
                <option value="app">App</option>
                <option value="social">Social</option>
                <option value="marketing">Marketing</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-md">
            <div className="space-y-sm">
              <label className="text-on-surface-variant font-body-sm text-body-sm font-medium">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full bg-surface-container-high/50 border border-outline-variant rounded-lg px-md py-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              >
                <option value="broadcast">Broadcast (All Users)</option>
              </select>
            </div>
            <div className="space-y-sm">
              <label className="text-on-surface-variant font-body-sm text-body-sm font-medium">Link (optional)</label>
              <input
                value={form.link || ''}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
                placeholder="https://example.com"
                className="w-full bg-surface-container-high/50 border border-outline-variant rounded-lg px-md py-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          </div>
          <div className="space-y-sm">
            <label className="text-on-surface-variant font-body-sm text-body-sm font-medium">Image (optional)</label>
            {imagePreview ? (
              <div className="relative rounded-lg overflow-hidden">
                <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover" />
                <button
                  onClick={() => { setImagePreview(''); setForm((prev) => ({ ...prev, imageUrl: '' })); }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-outline-variant rounded-lg cursor-pointer hover:border-primary transition-colors">
                {uploadingImage ? (
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-3xl text-on-surface-variant mb-1">add_photo_alternate</span>
                    <span className="text-body-sm text-on-surface-variant">Click to upload (max 5MB)</span>
                  </>
                )}
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            )}
          </div>
          <div className="flex gap-sm pt-sm">
            <button
              onClick={() => handleCreate(false)}
              disabled={submitting}
              className="flex items-center gap-sm px-md py-sm rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-variant transition-colors font-body-sm text-body-sm font-medium"
            >
              <span className="material-symbols-outlined text-lg">save</span>
              Save as Draft
            </button>
            <button
              onClick={() => handleCreate(true)}
              disabled={submitting}
              className="flex items-center gap-sm px-md py-sm rounded-lg bg-primary text-on-primary hover:bg-primary/90 transition-colors font-body-sm text-body-sm font-medium"
            >
              <span className="material-symbols-outlined text-lg">send</span>
              {submitting ? 'Creating...' : 'Send Now'}
            </button>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-md">
          {/* Filters */}
          <div className="flex gap-sm">
            {['', 'sent', 'draft', 'scheduled'].map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-md py-xs rounded-full text-body-sm font-medium transition-colors ${
                  statusFilter === s
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant'
                }`}
              >
                {s || 'All'}
              </button>
            ))}
          </div>

          {/* List */}
          {loading ? (
            <div className="flex justify-center py-xl">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="glass-panel rounded-xl p-xl text-center">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-sm block">notifications_none</span>
              <p className="text-on-surface-variant">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-sm">
              {notifications.map((n) => (
                <div key={n.id} className="glass-panel rounded-xl p-md flex items-center gap-md">
                  <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {n.imageUrl ? (
                      <img src={n.imageUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-on-primary">{n.icon || 'notifications'}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-sm">
                      <h3 className="font-body-lg text-body-lg text-on-surface font-bold truncate">{n.title}</h3>
                      <span className={`px-sm py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        n.status === 'sent' ? 'bg-green-100 text-green-700'
                          : n.status === 'draft' ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {n.status}
                      </span>
                      {n.link && <span className="material-symbols-outlined text-sm text-primary">link</span>}
                    </div>
                    <p className="text-on-surface-variant text-body-sm truncate">{n.body}</p>
                    <div className="flex items-center gap-md mt-xs text-on-surface-variant text-body-sm">
                      {n.status === 'sent' && (
                        <>
                          <span>{n.totalRecipients} recipients</span>
                          <span>{n.totalRead} read</span>
                        </>
                      )}
                      <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-xs flex-shrink-0">
                    {n.status === 'draft' && (
                      <button
                        onClick={() => handleSend(n.id)}
                        disabled={sending === n.id}
                        className="p-sm rounded-lg hover:bg-primary/10 text-primary transition-colors"
                        title="Send"
                      >
                        <span className="material-symbols-outlined">{sending === n.id ? 'progress_activity' : 'send'}</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(n.id)}
                      className="p-sm rounded-lg hover:bg-error/10 text-error transition-colors"
                      title="Delete"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {total > 10 && (
            <div className="flex justify-center gap-sm">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-md py-sm rounded-lg bg-surface-container-high text-on-surface-variant hover:bg-surface-variant disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <span className="px-md py-sm text-on-surface-variant text-body-sm">Page {page} of {Math.ceil(total / 10)}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.ceil(total / 10)}
                className="px-md py-sm rounded-lg bg-surface-container-high text-on-surface-variant hover:bg-surface-variant disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div className="space-y-md">
          {stats ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
                {[
                  { label: 'Total Sent', value: stats.sentNotifications, icon: 'send', color: 'bg-green-100 text-green-700' },
                  { label: 'Drafts', value: stats.draftNotifications, icon: 'draft', color: 'bg-yellow-100 text-yellow-700' },
                  { label: 'Scheduled', value: stats.scheduledNotifications, icon: 'schedule', color: 'bg-blue-100 text-blue-700' },
                  { label: 'Read Rate', value: `${stats.readRate}%`, icon: 'visibility', color: 'bg-purple-100 text-purple-700' },
                ].map((stat) => (
                  <div key={stat.label} className="glass-panel rounded-xl p-md">
                    <div className="flex items-center gap-sm mb-sm">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${stat.color}`}>
                        <span className="material-symbols-outlined text-sm">{stat.icon}</span>
                      </div>
                      <span className="text-on-surface-variant text-body-sm">{stat.label}</span>
                    </div>
                    <div className="font-title-lg text-title-lg text-on-surface font-bold">{stat.value}</div>
                  </div>
                ))}
              </div>
              <div className="glass-panel rounded-xl p-md">
                <h3 className="font-body-lg text-body-lg text-on-surface font-bold mb-md">Delivery Overview</h3>
                <div className="space-y-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-on-surface-variant">Total Recipients</span>
                    <span className="text-on-surface font-bold">{stats.totalRecipients}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-on-surface-variant">Total Read</span>
                    <span className="text-on-surface font-bold">{stats.totalRead}</span>
                  </div>
                  <div className="w-full bg-surface-container-high rounded-full h-2 mt-sm">
                    <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${stats.readRate}%` }}></div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex justify-center py-xl">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
