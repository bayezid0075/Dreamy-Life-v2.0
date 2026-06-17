import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Post {
  id: string;
  content: string;
  mediaUrls: string[];
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
}

function getTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default function FeedPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated, user } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fetchPosts = useCallback(
    async (pageNum: number, append = false) => {
      try {
        const res = await fetch(`${API_URL}/feed?page=${pageNum}&limit=20`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();
        if (res.ok) {
          if (append) {
            setPosts((prev) => [...prev, ...data.items]);
          } else {
            setPosts(data.items);
          }
          setHasMore(data.items.length === 20);
        }
      } catch (err) {
        console.error('Failed to fetch feed', err);
      }
    },
    [API_URL, accessToken],
  );

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      router.replace('/login');
      return;
    }
    fetchPosts(1).finally(() => setLoading(false));
  }, [isAuthenticated, accessToken, router, fetchPosts]);

  const handleCreatePost = async () => {
    if (!postContent.trim() && !selectedFile) return;
    setPosting(true);
    try {
      let mediaIds: string[] = [];
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const uploadRes = await fetch(`${API_URL}/media/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok) mediaIds = [uploadData.url];
      }

      const res = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ content: postContent, mediaIds }),
      });
      if (res.ok) {
        setPostContent('');
        setSelectedFile(null);
        setPreviewUrl(null);
        setComposerOpen(false);
        fetchPosts(1);
      }
    } catch (err) {
      console.error('Failed to create post', err);
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const res = await fetch(`${API_URL}/posts/${postId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (res.ok) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, likesCount: p.likesCount + (data.liked ? 1 : -1) }
              : p,
          ),
        );
      }
    } catch (err) {
      console.error('Failed to like', err);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#fcf9f8' }}>
        <div className="animate-spin h-10 w-10 border-2 border-[#5d5e64] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dreamy Life - Feed</title>
      </Head>
      <style>{`
        body { background-color: #fcf9f8; position: relative; min-height: 100vh; overflow-x: hidden; }
        body::before, body::after {
          content: ''; position: fixed; width: 800px; height: 800px; border-radius: 50%;
          filter: blur(120px); opacity: 0.4; z-index: -1;
          animation: float 20s infinite ease-in-out alternate;
        }
        body::before { background: radial-gradient(circle, #b3ecf3 0%, transparent 70%); top: -200px; left: -200px; }
        body::after { background: radial-gradient(circle, #ffd9e2 0%, transparent 70%); bottom: -200px; right: -200px; animation-delay: -10s; }
        @keyframes float { 0% { transform: translate(0,0) scale(1); } 100% { transform: translate(100px,100px) scale(1.2); } }
        .glass-card {
          background: rgba(255,255,255,0.6); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.4); box-shadow: 0 8px 32px rgba(0,0,0,0.04);
        }
      `}</style>

      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm">
        <div className="flex items-center justify-between w-full max-w-[1280px] mx-auto px-4 sm:px-6 h-16 md:h-20">
          <Link href="/dashboard" className="p-2 -ml-2 text-[#45474b] hover:bg-[#e5e2e1]/30 rounded-full transition-colors">
            <span className="material-symbols-outlined">menu</span>
          </Link>
          <h1 className="text-[24px] md:text-[28px] text-[#5d5e64] tracking-tight font-extrabold absolute left-1/2 -translate-x-1/2" style={{ fontFamily: 'Plus Jakarta Sans' }}>
            Dreamy Life
          </h1>
          <div className="flex gap-3">
            <button className="p-2 text-[#45474b] hover:bg-[#e5e2e1]/30 rounded-full transition-colors">
              <span className="material-symbols-outlined">search</span>
            </button>
            <Link href="/chat" className="p-2 text-[#45474b] hover:bg-[#e5e2e1]/30 rounded-full transition-colors">
              <span className="material-symbols-outlined">chat</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-0 sm:px-4 md:px-6 mt-20 sm:mt-24 pb-24 md:pb-8">
        {/* Composer Box */}
        <section className="glass-card bg-white/80 rounded-2xl p-4 mb-6 mx-4 sm:mx-0 shadow-sm border border-white/60">
          <div className="flex gap-3 items-center border-b border-[#e5e2e1]/40 pb-4 mb-3">
            <div className="w-10 h-10 rounded-full bg-[#e5e2e1] flex items-center justify-center flex-shrink-0 ring-2 ring-[#eae7e7]">
              <span className="material-symbols-outlined text-[#5d5e64]">person</span>
            </div>
            <button
              onClick={() => setComposerOpen(true)}
              className="bg-[#f6f3f2]/60 hover:bg-[#f6f3f2] transition-colors rounded-full px-5 py-2.5 flex-grow text-left cursor-pointer text-[#45474b] text-[15px]"
            >
              What&apos;s on your mind?
            </button>
          </div>
          <div className="flex justify-between items-center px-1">
            <button className="flex-1 flex justify-center items-center gap-2 text-[#45474b] hover:text-[#ba1a1a] transition-colors py-2 rounded-lg hover:bg-[#ffdad6]/30">
              <span className="material-symbols-outlined text-[#ba1a1a]" style={{ fontVariationSettings: "'FILL' 1" }}>videocam</span>
              <span className="text-sm font-semibold">Live</span>
            </button>
            <button onClick={() => setComposerOpen(true)} className="flex-1 flex justify-center items-center gap-2 text-[#45474b] hover:text-[#2d666d] transition-colors py-2 rounded-lg hover:bg-[#e9fdff]/40">
              <span className="material-symbols-outlined text-[#2d666d]" style={{ fontVariationSettings: "'FILL' 1" }}>photo_library</span>
              <span className="text-sm font-semibold">Photo</span>
            </button>
            <button className="flex-1 flex justify-center items-center gap-2 text-[#45474b] hover:text-[#78555e] transition-colors py-2 rounded-lg hover:bg-[#ffd1dc]/30">
              <span className="material-symbols-outlined text-[#78555e]" style={{ fontVariationSettings: "'FILL' 1" }}>video_call</span>
              <span className="text-sm font-semibold">Room</span>
            </button>
          </div>
        </section>

        {/* Posts Feed */}
        <div className="flex flex-col gap-6 sm:gap-8">
          {posts.length === 0 && (
            <div className="glass-card rounded-2xl p-12 text-center mx-4 sm:mx-0">
              <span className="material-symbols-outlined text-5xl text-[#5d5e64] mb-4 block">post_add</span>
              <p className="text-[#45474b] text-lg">No posts yet. Be the first to share something!</p>
            </div>
          )}

          {posts.map((post) => (
            <article key={post.id} className="glass-card bg-white/80 sm:rounded-2xl overflow-hidden pt-4 pb-2 border-y sm:border border-white/60 shadow-sm">
              {/* Post Header */}
              <div className="px-4 flex justify-between items-start mb-3">
                <Link href={`/users/${post.authorId}`} className="flex items-center gap-3">
                  {post.authorAvatar ? (
                    <img src={post.authorAvatar} alt={post.authorName} className="w-10 h-10 rounded-full object-cover ring-2 ring-white" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#e9fdff] flex items-center justify-center ring-2 ring-white">
                      <span className="text-[#2d666d] font-bold text-sm">{post.authorName?.[0]?.toUpperCase()}</span>
                    </div>
                  )}
                  <div>
                    <h3 className="text-[15px] text-[#1c1b1b] font-bold hover:underline cursor-pointer">{post.authorName}</h3>
                    <div className="flex items-center gap-1 text-[#45474b] text-[13px]">
                      <p>{getTimeAgo(post.createdAt)}</p>
                      <span className="text-[10px]">&bull;</span>
                      <span className="material-symbols-outlined text-[14px]">public</span>
                    </div>
                  </div>
                </Link>
                <button className="w-8 h-8 flex items-center justify-center rounded-full text-[#45474b] hover:bg-[#e5e2e1]/40 transition-colors">
                  <span className="material-symbols-outlined">more_horiz</span>
                </button>
              </div>

              {/* Post Content */}
              <div className="px-4 mb-3">
                <p className="text-[15px] text-[#1c1b1b] leading-snug whitespace-pre-wrap">{post.content}</p>
              </div>

              {/* Post Image */}
              {post.mediaUrls && post.mediaUrls.length > 0 && (
                <div className="w-full relative group">
                  <img
                    src={post.mediaUrls[0].startsWith('/') ? `${API_URL}${post.mediaUrls[0]}` : post.mediaUrls[0]}
                    alt="Post"
                    className="w-full h-auto object-cover max-h-[600px] border-y sm:border border-white/20"
                  />
                </div>
              )}

              {/* Stats Row */}
              <div className="px-4 py-2.5 flex justify-between items-center text-[13px] text-[#45474b] border-b border-[#e5e2e1]/30 mx-2">
                <div className="flex items-center gap-1">
                  {post.likesCount > 0 && (
                    <>
                      <div className="w-5 h-5 rounded-full bg-[#78555e] flex items-center justify-center ring-2 ring-white">
                        <span className="material-symbols-outlined text-white text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                      </div>
                      <span className="ml-1">{formatCount(post.likesCount)}</span>
                    </>
                  )}
                </div>
                <div className="flex gap-3">
                  {post.commentsCount > 0 && (
                    <Link href={`/posts/${post.id}`} className="hover:underline">{post.commentsCount} comments</Link>
                  )}
                </div>
              </div>

              {/* Interaction Bar */}
              <div className="px-2 pt-1 flex justify-between items-center">
                <button
                  onClick={() => handleLike(post.id)}
                  className="flex-1 flex justify-center items-center gap-2 py-2 rounded-lg text-[#45474b] hover:bg-[#e5e2e1]/30 transition-colors group"
                >
                  <span className="material-symbols-outlined group-hover:scale-110 transition-transform">thumb_up</span>
                  <span className="text-[14px] font-semibold">Like</span>
                </button>
                <Link
                  href={`/posts/${post.id}`}
                  className="flex-1 flex justify-center items-center gap-2 py-2 rounded-lg text-[#45474b] hover:bg-[#e5e2e1]/30 transition-colors group"
                >
                  <span className="material-symbols-outlined group-hover:scale-110 transition-transform">chat_bubble_outline</span>
                  <span className="text-[14px] font-semibold">Comment</span>
                </Link>
                <button className="flex-1 flex justify-center items-center gap-2 py-2 rounded-lg text-[#45474b] hover:bg-[#e5e2e1]/30 transition-colors group">
                  <span className="material-symbols-outlined group-hover:scale-110 transition-transform">share</span>
                  <span className="text-[14px] font-semibold">Share</span>
                </button>
              </div>
            </article>
          ))}

          {hasMore && posts.length > 0 && (
            <button
              onClick={() => { const next = page + 1; setPage(next); fetchPosts(next, true); }}
              className="glass-card rounded-2xl py-3 text-center text-sm font-semibold text-[#2d666d] hover:bg-white/70 transition-colors mx-4 sm:mx-0"
            >
              Load more
            </button>
          )}
        </div>
      </main>

      {/* Composer Modal */}
      {composerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setComposerOpen(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e2e1]/40">
              <button onClick={() => setComposerOpen(false)} className="text-[#45474b] hover:text-[#1c1b1b] font-semibold">Cancel</button>
              <h2 className="font-bold text-[#1c1b1b]">Create Post</h2>
              <button
                onClick={handleCreatePost}
                disabled={posting || (!postContent.trim() && !selectedFile)}
                className="text-[#2d666d] font-bold disabled:opacity-40"
              >
                {posting ? 'Posting...' : 'Post'}
              </button>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#e9fdff] flex items-center justify-center">
                  <span className="text-[#2d666d] font-bold">{user?.username?.[0]?.toUpperCase() || 'U'}</span>
                </div>
                <span className="font-bold text-[#1c1b1b]">{user?.username || 'You'}</span>
              </div>
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full min-h-[120px] bg-transparent border-none focus:ring-0 text-[#1c1b1b] text-[15px] placeholder:text-[#45474b]/50 resize-none outline-none"
                autoFocus
              />
              {previewUrl && (
                <div className="mt-2 relative">
                  <img src={previewUrl} alt="Preview" className="w-full rounded-xl max-h-[300px] object-cover" />
                  <button
                    onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>
              )}
            </div>
            <div className="border-t border-[#e5e2e1]/40 px-4 py-3 flex items-center gap-4">
              <label className="flex items-center gap-2 text-[#2d666d] hover:text-[#1c1b1b] cursor-pointer transition-colors">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>photo_library</span>
                <span className="text-sm font-semibold">Photo</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav (Mobile) */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 rounded-t-2xl bg-white/70 backdrop-blur-3xl shadow-[0_-10px_30px_rgba(0,0,0,0.05)] border-t border-white/60">
        <div className="flex justify-around items-center py-2 px-2">
          <Link href="/feed" className="flex flex-col items-center justify-center text-[#5d5e64] font-bold bg-[#f8f8ff]/60 rounded-xl px-5 py-2 relative">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
          </Link>
          <Link href="/dashboard" className="flex flex-col items-center justify-center text-[#45474b]/70 hover:bg-[#e5e2e1]/40 transition-colors px-5 py-2 rounded-xl">
            <span className="material-symbols-outlined">ondemand_video</span>
          </Link>
          <Link href="/posts/create" className="flex flex-col items-center justify-center text-[#45474b]/70 hover:bg-[#e5e2e1]/40 transition-colors px-5 py-2 rounded-xl">
            <span className="material-symbols-outlined">add_circle</span>
          </Link>
          <Link href="/notifications" className="flex flex-col items-center justify-center text-[#45474b]/70 hover:bg-[#e5e2e1]/40 transition-colors px-5 py-2 rounded-xl">
            <span className="material-symbols-outlined">auto_awesome</span>
          </Link>
          <Link href="/social/profile" className="flex flex-col items-center justify-center hover:opacity-80 transition-opacity px-3 py-2 rounded-xl">
            <div className="w-7 h-7 rounded-full bg-[#e5e2e1] flex items-center justify-center border border-[#c6c6cb]">
              <span className="material-symbols-outlined text-sm text-[#5d5e64]">person</span>
            </div>
          </Link>
        </div>
      </nav>
    </>
  );
}
