import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import DesktopHeader from '@/shared/components/DesktopHeader';
import SideDrawer from '@/shared/components/SideDrawer';
import AuthGuard from '@/shared/components/AuthGuard';
import { VendorProfile } from '@/features/vendor/api';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  body: string;
  coverImage?: string;
  status: string;
  author: string;
  tags?: string[];
  views: number;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminBlogPage() {
  const router = useRouter();
  const { accessToken, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const fetchPosts = useCallback(
    async (pageNum: number, append = false) => {
      try {
        const params = new URLSearchParams({ page: String(pageNum), limit: '20', status: filter || 'all' });
        const res = await fetch(`${API_URL}/admin/blog?${params}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();
        if (res.ok) {
          if (append) {
            setPosts((prev) => [...prev, ...data.items]);
          } else {
            setPosts(data.items || []);
          }
          setHasMore(data.items?.length === 20);
        }
      } catch (err) {
        console.error('Failed to fetch blog posts', err);
      }
    },
    [API_URL, accessToken, filter],
  );

  useEffect(() => {
    if (!accessToken) return;
    fetchPosts(1).finally(() => setLoading(false));
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

  useEffect(() => {
    setPage(1);
    fetchPosts(1);
  }, [filter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this blog post?')) return;
    try {
      await fetch(`${API_URL}/admin/blog/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch {}
  };

  const handleStatusToggle = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    try {
      const res = await fetch(`${API_URL}/admin/blog/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p)));
      }
    } catch {}
  };

  const handleLogout = async () => {
    await logout();
  };

  const copyReferCode = () => {
    if (user?.ownRefercode) navigator.clipboard.writeText(user.ownRefercode);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const statusColors: Record<string, { bg: string; text: string }> = {
    draft: { bg: '#fef3c7', text: '#92400e' },
    published: { bg: '#d1fae5', text: '#065f46' },
    archived: { bg: '#f3f4f6', text: '#6b7280' },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#fcf9f8' }}>
        <div className="animate-spin h-10 w-10 border-2 border-[#5d5e64] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <AuthGuard>
      <Head>
        <title>Blog Management - Dreamy Life Admin</title>
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

      <DesktopHeader title="Blog Management" onMenuClick={() => setDrawerOpen(true)} avatarUrl={user?.info?.avatarUrl || ''} />
      <SideDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} user={user} vendorProfile={vendorProfile} handleLogout={handleLogout} copyReferCode={copyReferCode} />

      <main className="pt-20 md:pt-28 pb-10 md:pb-20 px-6 max-w-[1280px] mx-auto min-h-screen">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-[#1c1b1b]">Blog Management</h1>
            <p className="text-sm text-[#76777b] mt-1">Create and manage blog posts</p>
          </div>
          <button
            onClick={() => router.push('/admin/blog/create')}
            className="px-6 py-3 rounded-xl bg-[#2d666d] text-white font-bold text-sm hover:bg-[#24585d] transition-colors shadow-lg shadow-[#2d666d]/20 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Create Post
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          {[
            { value: 'all', label: 'All' },
            { value: 'draft', label: 'Draft' },
            { value: 'published', label: 'Published' },
            { value: 'archived', label: 'Archived' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                filter === f.value
                  ? 'bg-[#1c1b1b] text-white shadow-lg'
                  : 'bg-white/50 backdrop-blur-[24px] text-[#45474b] hover:bg-white/60 border border-white/30'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {posts.length === 0 && (
            <div className="glass-panel rounded-xl p-12 text-center">
              <span className="material-symbols-outlined text-5xl text-[#5d5e64] mb-4">article</span>
              <p className="text-[#45474b]">No blog posts yet</p>
            </div>
          )}

          {posts.map((post) => {
            const sc = statusColors[post.status] || statusColors.draft;
            return (
              <div key={post.id} className="glass-panel rounded-xl p-4 flex items-center gap-4 hover:bg-white/20 transition-all">
                <div className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-white/30">
                  {post.coverImage ? (
                    <img src={post.coverImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#5d5e64]">
                      <span className="material-symbols-outlined text-2xl">image</span>
                    </div>
                  )}
                </div>

                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-[#1c1b1b] truncate">{post.title}</h3>
                    <button
                      onClick={() => handleStatusToggle(post.id, post.status)}
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: sc.bg, color: sc.text }}
                      title={`Click to toggle to ${post.status === 'published' ? 'draft' : 'published'}`}
                    >
                      {post.status}
                    </button>
                  </div>
                  <p className="line-clamp-1 text-sm text-[#45474b]">{post.excerpt || post.body?.replace(/<[^>]*>/g, '').slice(0, 100)}</p>
                  <p className="text-xs text-[#76777b] mt-1">
                    {post.author} &middot; {formatDate(post.updatedAt)}
                    {post.views !== undefined && ` \u00b7 ${post.views} views`}
                  </p>
                </div>

                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => router.push(`/admin/blog/${post.id}/edit`)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/30 text-[#45474b]"
                    title="Edit"
                  >
                    <span className="material-symbols-outlined text-lg">edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-red-50 text-red-500"
                    title="Delete"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>
            );
          })}

          {hasMore && posts.length > 0 && (
            <button
              onClick={() => { setPage((p) => p + 1); fetchPosts(page + 1, true); }}
              className="glass-panel rounded-xl py-3 w-full text-center text-sm font-semibold text-[#2d666d] hover:bg-white/30 transition-colors"
            >
              Load more
            </button>
          )}
        </div>
      </main>
    </AuthGuard>
  );
}
