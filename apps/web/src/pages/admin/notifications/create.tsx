import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import DesktopHeader from '@/shared/components/DesktopHeader';
import SideDrawer from '@/shared/components/SideDrawer';
import { VendorProfile } from '@/features/vendor/api';

export default function AdminNotificationCreatePage() {
  const router = useRouter();
  const { accessToken, isAuthenticated, user: authUser } = useAuthStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const [form, setForm] = useState({
    title: '',
    body: '',
    icon: 'notifications',
    imageUrl: '',
    link: '',
    category: 'app',
    type: 'broadcast',
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      router.replace('/login');
      return;
    }
    fetch(`${API_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.json())
      .then((data) => { if (data.data?.user) setUser(data.data.user); })
      .catch(() => {});
    fetch(`${API_URL}/vendor/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.json())
      .then((data) => setVendorProfile(data.data || null))
      .catch(() => setVendorProfile(null));
  }, [isAuthenticated, accessToken, router]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB');
      return;
    }

    setUploadingImage(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_URL}/media/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok && (data.url || data.data?.url)) {
        const url = data.url || data.data?.url;
        setForm((prev) => ({ ...prev, imageUrl: url }));
        setImagePreview(url);
      } else {
        setError('Failed to upload image');
      }
    } catch {
      setError('Failed to upload image');
    }
    setUploadingImage(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) {
      setError('Title and body are required');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/admin/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: form.title,
          body: form.body,
          icon: form.icon || undefined,
          imageUrl: form.imageUrl || undefined,
          link: form.link || undefined,
          category: form.category,
          type: form.type,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/admin/notifications'), 2000);
      } else {
        setError(data.message || 'Failed to create notification');
      }
    } catch {
      setError('Failed to create notification');
    }
    setSubmitting(false);
  };

  const handleLogout = () => {
    useAuthStore.getState().clearAuth();
    router.replace('/login');
  };

  const copyReferCode = () => {
    if (user?.ownRefercode) navigator.clipboard.writeText(user.ownRefercode);
  };

  const icons = [
    'notifications', 'campaign', 'chat_bubble', 'local_shipping',
    'card_giftcard', 'star', 'percent', 'account_circle', 'info', 'warning',
  ];

  const categories = [
    { value: 'app', label: 'App', color: '#e8eaf6', textColor: '#3949ab' },
    { value: 'social', label: 'Social', color: '#ffd1dc', textColor: '#78555e' },
    { value: 'marketing', label: 'Marketing', color: '#e3f2fd', textColor: '#1565c0' },
    { value: 'system', label: 'System', color: '#fff3e0', textColor: '#e65100' },
  ];

  return (
    <>
      <Head>
        <title>Create Notification - Dreamy Life Admin</title>
      </Head>
      <style>{`
        .aurora-bg {
          background-color: #F8F8FF;
          position: fixed; top: 0; left: 0;
          width: 100vw; height: 100vh;
          z-index: -1; overflow: hidden;
        }
        .aurora-orb {
          position: absolute; border-radius: 50%;
          filter: blur(80px); opacity: 0.4;
          animation: float 20s infinite ease-in-out alternate;
        }
        .orb-1 { width: 600px; height: 600px; background: rgba(226,226,233,0.6); top: -100px; left: -200px; }
        .orb-2 { width: 500px; height: 500px; background: rgba(179,236,243,0.4); bottom: -50px; right: -100px; animation-delay: -5s; }
        .orb-3 { width: 400px; height: 400px; background: rgba(255,217,226,0.5); top: 40%; left: 50%; transform: translate(-50%,-50%); animation-delay: -10s; }
        @keyframes float {
          0% { transform: translate(0,0) scale(1); }
          50% { transform: translate(50px,30px) scale(1.1); }
          100% { transform: translate(-30px,50px) scale(0.9); }
        }
        .glass-panel {
          background: rgba(255,255,255,0.5);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.3);
          box-shadow: 0 20px 40px rgba(0,0,0,0.04);
        }
      `}</style>

      <div className="aurora-bg">
        <div className="aurora-orb orb-1" />
        <div className="aurora-orb orb-2" />
        <div className="aurora-orb orb-3" />
      </div>

      <DesktopHeader
        title="Create Notification"
        onMenuClick={() => setDrawerOpen(true)}
        avatarUrl={user?.info?.avatarUrl || ''}
      />

      <SideDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} user={user} vendorProfile={vendorProfile} handleLogout={handleLogout} copyReferCode={copyReferCode} />

      <header className="md:hidden flex justify-between items-center px-6 py-5 sticky top-0 z-40 bg-white/60 backdrop-blur-xl border-b border-white/30">
        <button onClick={() => router.push('/admin/notifications')} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/50 border border-white/40 shadow-sm text-[#45474b]">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-extrabold tracking-tight text-[#1c1b1b]">Create Notification</h1>
        <div className="w-10" />
      </header>

      <main className="pt-20 md:pt-28 pb-10 md:pb-20 px-6 max-w-[700px] mx-auto min-h-screen">
        {success && (
          <div className="glass-panel rounded-2xl p-8 text-center mb-6">
            <span className="material-symbols-outlined text-5xl text-green-500 mb-3">check_circle</span>
            <p className="text-lg font-bold text-[#1c1b1b]">Notification created and sent!</p>
            <p className="text-sm text-[#76777b] mt-1">Redirecting to notifications list...</p>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 mb-6 flex items-center gap-3">
            <span className="material-symbols-outlined text-red-500">error</span>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="glass-panel rounded-2xl p-6">
            <h2 className="text-lg font-bold text-[#1c1b1b] mb-4">Content</h2>

            <label className="block mb-4">
              <span className="text-sm font-semibold text-[#45474b] mb-1.5 block">Title *</span>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-white/60 border border-white/40 text-[#1c1b1b] placeholder:text-[#aaa] focus:outline-none focus:ring-2 focus:ring-[#2d666d]/30"
                placeholder="Notification title"
                required
                maxLength={255}
              />
            </label>

            <label className="block mb-4">
              <span className="text-sm font-semibold text-[#45474b] mb-1.5 block">Body *</span>
              <textarea
                value={form.body}
                onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-white/60 border border-white/40 text-[#1c1b1b] placeholder:text-[#aaa] focus:outline-none focus:ring-2 focus:ring-[#2d666d]/30 resize-none"
                placeholder="Notification body text"
                required
                rows={4}
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-[#45474b] mb-1.5 block">Link (optional)</span>
              <input
                type="url"
                value={form.link}
                onChange={(e) => setForm((p) => ({ ...p, link: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-white/60 border border-white/40 text-[#1c1b1b] placeholder:text-[#aaa] focus:outline-none focus:ring-2 focus:ring-[#2d666d]/30"
                placeholder="https://example.com"
              />
            </label>
          </div>

          <div className="glass-panel rounded-2xl p-6">
            <h2 className="text-lg font-bold text-[#1c1b1b] mb-4">Image</h2>

            <div className="mb-4">
              {imagePreview ? (
                <div className="relative rounded-xl overflow-hidden">
                  <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
                  <button
                    type="button"
                    onClick={() => { setImagePreview(''); setForm((p) => ({ ...p, imageUrl: '' })); }}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="w-full h-32 rounded-xl border-2 border-dashed border-[#d1d5db] hover:border-[#2d666d] flex flex-col items-center justify-center gap-2 transition-colors"
                >
                  {uploadingImage ? (
                    <div className="animate-spin h-6 w-6 border-2 border-[#2d666d] border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-3xl text-[#9ca3af]">add_photo_alternate</span>
                      <span className="text-sm text-[#9ca3af]">Click to upload image (max 5MB)</span>
                    </>
                  )}
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6">
            <h2 className="text-lg font-bold text-[#1c1b1b] mb-4">Settings</h2>

            <label className="block mb-4">
              <span className="text-sm font-semibold text-[#45474b] mb-2 block">Icon</span>
              <div className="flex flex-wrap gap-2">
                {icons.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, icon: ic }))}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                      form.icon === ic
                        ? 'bg-[#2d666d] text-white shadow-md'
                        : 'bg-white/50 text-[#45474b] hover:bg-white/70 border border-white/30'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">{ic}</span>
                  </button>
                ))}
              </div>
            </label>

            <label className="block mb-4">
              <span className="text-sm font-semibold text-[#45474b] mb-2 block">Category</span>
              <div className="flex gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, category: cat.value }))}
                    className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                    style={{
                      backgroundColor: form.category === cat.value ? cat.textColor : cat.color,
                      color: form.category === cat.value ? '#fff' : cat.textColor,
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-[#45474b] mb-2 block">Type</span>
              <div className="flex gap-2">
                {[
                  { value: 'broadcast', label: 'Broadcast (All Users)' },
                  { value: 'targeted', label: 'Targeted' },
                ].map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, type: t.value }))}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                      form.type === t.value
                        ? 'bg-[#1A1A1A] text-white shadow-lg'
                        : 'bg-white/50 text-[#45474b] hover:bg-white/60 border border-white/30'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting || !form.title.trim() || !form.body.trim()}
            className="w-full py-3.5 rounded-xl bg-[#2d666d] text-white font-bold text-[15px] hover:bg-[#24585d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#2d666d]/20"
          >
            {submitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Creating...
              </div>
            ) : (
              'Create & Send Notification'
            )}
          </button>
        </form>
      </main>
    </>
  );
}
