import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import DesktopHeader from '@/shared/components/DesktopHeader';
import SideDrawer from '@/shared/components/SideDrawer';
import AuthGuard from '@/shared/components/AuthGuard';
import RichTextEditor from '@/shared/components/RichTextEditor';
import { VendorProfile } from '@/features/vendor/api';

export default function AdminBlogCreatePage() {
  const router = useRouter();
  const { accessToken, logout } = useAuthStore();
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
    slug: '',
    body: '',
    excerpt: '',
    coverImage: '',
    tags: '',
    status: 'draft',
    metaTitle: '',
    metaDescription: '',
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  useEffect(() => {
    if (!accessToken) return;
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
  }, [accessToken]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleTitleChange = (title: string) => {
    setForm((prev) => ({
      ...prev,
      title,
      slug: generateSlug(title),
    }));
  };

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
        setForm((prev) => ({ ...prev, coverImage: url }));
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
      const payload: Record<string, any> = {
        title: form.title,
        slug: form.slug || generateSlug(form.title),
        body: form.body,
        excerpt: form.excerpt || undefined,
        coverImage: form.coverImage || undefined,
        status: form.status,
        metaTitle: form.metaTitle || undefined,
        metaDescription: form.metaDescription || undefined,
      };

      if (form.tags.trim()) {
        payload.tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean);
      }

      const res = await fetch(`${API_URL}/admin/blog`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/admin/blog'), 2000);
      } else {
        setError(data.message || 'Failed to create blog post');
      }
    } catch {
      setError('Failed to create blog post');
    }
    setSubmitting(false);
  };

  const handleLogout = async () => {
    await logout();
  };

  const copyReferCode = () => {
    if (user?.ownRefercode) navigator.clipboard.writeText(user.ownRefercode);
  };

  return (
    <AuthGuard>
      <Head>
        <title>Create Blog Post - Dreamy Life Admin</title>
      </Head>
      <style>{`
        .aurora-bg { background-color: #fcf9f8; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -1; overflow: hidden; }
        .aurora-orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.4; animation: float 20s infinite ease-in-out alternate; }
        .orb-1 { width: 600px; height: 600px; background: rgba(226,226,233,0.6); top: -100px; left: -200px; }
        .orb-2 { width: 500px; height: 500px; background: rgba(179,236,243,0.4); bottom: -50px; right: -100px; animation-delay: -5s; }
        .orb-3 { width: 400px; height: 400px; background: rgba(255,217,226,0.5); top: 40%; left: 50%; transform: translate(-50%,-50%); animation-delay: -10s; }
        @keyframes float { 0% { transform: translate(0,0) scale(1); } 50% { transform: translate(50px,30px) scale(1.1); } 100% { transform: translate(-30px,50px) scale(0.9); } }
        .glass-panel { background: rgba(255,255,255,0.5); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.3); box-shadow: 0 20px 40px rgba(0,0,0,0.04); }
      `}</style>

      <div className="aurora-bg">
        <div className="aurora-orb orb-1" />
        <div className="aurora-orb orb-2" />
        <div className="aurora-orb orb-3" />
      </div>

      <DesktopHeader title="Create Blog Post" onMenuClick={() => setDrawerOpen(true)} avatarUrl={user?.info?.avatarUrl || ''} />
      <SideDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} user={user} vendorProfile={vendorProfile} handleLogout={handleLogout} copyReferCode={copyReferCode} />

      <header className="md:hidden flex justify-between items-center px-6 py-5 sticky top-0 z-40 bg-white/60 backdrop-blur-xl border-b border-white/30">
        <button onClick={() => router.push('/admin/blog')} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/50 border border-white/40 shadow-sm text-[#45474b]">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-extrabold tracking-tight text-[#1c1b1b]">Create Blog Post</h1>
        <div className="w-10" />
      </header>

      <main className="pt-20 md:pt-28 pb-10 md:pb-20 px-6 max-w-[700px] mx-auto min-h-screen">
        {success && (
          <div className="glass-panel rounded-2xl p-8 text-center mb-6">
            <span className="material-symbols-outlined text-5xl text-green-500 mb-3">check_circle</span>
            <p className="text-lg font-bold text-[#1c1b1b]">Blog post created!</p>
            <p className="text-sm text-[#76777b] mt-1">Redirecting to blog list...</p>
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
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/60 border border-white/40 text-[#1c1b1b] placeholder:text-[#aaa] focus:outline-none focus:ring-2 focus:ring-[#2d666d]/30"
                placeholder="Post title"
                required
                maxLength={255}
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-[#45474b] mb-1.5 block">Slug</span>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-white/60 border border-white/40 text-[#1c1b1b] placeholder:text-[#aaa] focus:outline-none focus:ring-2 focus:ring-[#2d666d]/30"
                placeholder="auto-generated-from-title"
              />
            </label>
          </div>

          <div className="glass-panel rounded-2xl p-6">
            <h2 className="text-lg font-bold text-[#1c1b1b] mb-4">Body</h2>
            <RichTextEditor
              value={form.body}
              onChange={(html) => setForm((p) => ({ ...p, body: html }))}
              placeholder="Write your blog post content here..."
            />
          </div>

          <div className="glass-panel rounded-2xl p-6">
            <h2 className="text-lg font-bold text-[#1c1b1b] mb-4">Excerpt</h2>
            <textarea
              value={form.excerpt}
              onChange={(e) => setForm((p) => ({ ...p, excerpt: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-white/60 border border-white/40 text-[#1c1b1b] placeholder:text-[#aaa] focus:outline-none focus:ring-2 focus:ring-[#2d666d]/30 resize-none"
              placeholder="Short summary for cards and SEO"
              rows={3}
            />
          </div>

          <div className="glass-panel rounded-2xl p-6">
            <h2 className="text-lg font-bold text-[#1c1b1b] mb-4">Media</h2>

            <div className="mb-4">
              {imagePreview ? (
                <div className="relative rounded-xl overflow-hidden">
                  <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
                  <button
                    type="button"
                    onClick={() => { setImagePreview(''); setForm((p) => ({ ...p, coverImage: '' })); }}
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
                      <span className="text-sm text-[#9ca3af]">Click to upload cover image (max 5MB)</span>
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
            <h2 className="text-lg font-bold text-[#1c1b1b] mb-4">Classification</h2>

            <label className="block mb-4">
              <span className="text-sm font-semibold text-[#45474b] mb-1.5 block">Tags (comma-separated)</span>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-white/60 border border-white/40 text-[#1c1b1b] placeholder:text-[#aaa] focus:outline-none focus:ring-2 focus:ring-[#2d666d]/30"
                placeholder="lifestyle, wellness, tips"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-[#45474b] mb-2 block">Status</span>
              <div className="flex gap-2">
                {[
                  { value: 'draft', label: 'Draft', bg: '#fef3c7', color: '#92400e' },
                  { value: 'published', label: 'Published', bg: '#d1fae5', color: '#065f46' },
                  { value: 'archived', label: 'Archived', bg: '#f3f4f6', color: '#6b7280' },
                ].map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, status: s.value }))}
                    className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                    style={{
                      backgroundColor: form.status === s.value ? s.color : s.bg,
                      color: form.status === s.value ? '#fff' : s.color,
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </label>
          </div>

          <div className="glass-panel rounded-2xl p-6">
            <h2 className="text-lg font-bold text-[#1c1b1b] mb-4">SEO</h2>

            <label className="block mb-4">
              <span className="text-sm font-semibold text-[#45474b] mb-1.5 block">Meta Title</span>
              <input
                type="text"
                value={form.metaTitle}
                onChange={(e) => setForm((p) => ({ ...p, metaTitle: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-white/60 border border-white/40 text-[#1c1b1b] placeholder:text-[#aaa] focus:outline-none focus:ring-2 focus:ring-[#2d666d]/30"
                placeholder="SEO title (max 255 chars)"
                maxLength={255}
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-[#45474b] mb-1.5 block">Meta Description</span>
              <textarea
                value={form.metaDescription}
                onChange={(e) => setForm((p) => ({ ...p, metaDescription: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-white/60 border border-white/40 text-[#1c1b1b] placeholder:text-[#aaa] focus:outline-none focus:ring-2 focus:ring-[#2d666d]/30 resize-none"
                placeholder="SEO description (max 320 chars)"
                rows={3}
                maxLength={320}
              />
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
              'Create Blog Post'
            )}
          </button>
        </form>
      </main>
    </AuthGuard>
  );
}
