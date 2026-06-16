import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
}

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
  liked: boolean;
  comments: Comment[];
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

export default function PostDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { accessToken, isAuthenticated, user } = useAuthStore();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) { router.replace('/login'); return; }
    if (!id) return;
    fetch(`${API_URL}/posts/${id}`, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => r.json())
      .then((data) => { setPost(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id, isAuthenticated, accessToken, router]);

  const handleLike = async () => {
    if (!post) return;
    try {
      const res = await fetch(`${API_URL}/posts/${post.id}/like`, {
        method: 'POST', headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (res.ok) setPost({ ...post, liked: data.liked, likesCount: post.likesCount + (data.liked ? 1 : -1) });
    } catch (err) { console.error(err); }
  };

  const handleComment = async () => {
    if (!commentText.trim() || !post) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ content: commentText }),
      });
      if (res.ok) {
        const comment = await res.json();
        setPost({ ...post, comments: [comment, ...post.comments], commentsCount: post.commentsCount + 1 });
        setCommentText('');
      }
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#fcf9f8' }}>
        <div className="animate-spin h-10 w-10 border-2 border-[#5d5e64] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#fcf9f8' }}>
        <p className="text-[#45474b]">Post not found</p>
      </div>
    );
  }

  return (
    <>
      <Head><title>Dreamy Life - Post</title></Head>
      <style>{`
        body { background-color: #fcf9f8; min-height: 100vh; }
        .glass-card { background: rgba(255,255,255,0.6); backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.4); box-shadow: 0 8px 32px rgba(0,0,0,0.04); }
      `}</style>

      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm">
        <div className="flex items-center gap-4 w-full max-w-2xl mx-auto px-4 h-16">
          <button onClick={() => router.back()} className="p-2 -ml-2 text-[#45474b] hover:bg-[#e5e2e1]/30 rounded-full transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-lg font-bold text-[#1c1b1b]">Post</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-20 pb-24">
        <article className="glass-card rounded-2xl overflow-hidden p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[#e9fdff] flex items-center justify-center">
              <span className="text-[#2d666d] font-bold text-sm">{post.authorName?.[0]?.toUpperCase()}</span>
            </div>
            <div>
              <h3 className="text-[15px] text-[#1c1b1b] font-bold">{post.authorName}</h3>
              <p className="text-[#45474b] text-[13px]">{getTimeAgo(post.createdAt)}</p>
            </div>
          </div>
          <p className="text-[#1c1b1b] text-[15px] leading-relaxed whitespace-pre-wrap mb-4">{post.content}</p>
          {post.mediaUrls?.length > 0 && (
            <img src={post.mediaUrls[0].startsWith('/') ? `${API_URL}${post.mediaUrls[0]}` : post.mediaUrls[0]} alt="Post" className="w-full rounded-xl max-h-[500px] object-cover mb-4" />
          )}
          <div className="flex items-center gap-4 text-[#45474b] text-sm border-t border-[#e5e2e1]/30 pt-3">
            <button onClick={handleLike} className={`flex items-center gap-1 transition-colors ${post.liked ? 'text-[#78555e]' : 'hover:text-[#78555e]'}`}>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: post.liked ? "'FILL' 1" : "'FILL' 0" }}>thumb_up</span>
              <span>{post.likesCount}</span>
            </button>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined">chat_bubble</span>
              <span>{post.commentsCount}</span>
            </span>
          </div>
        </article>

        {/* Comment Input */}
        <div className="glass-card rounded-2xl p-4 mb-6 flex gap-3 items-center">
          <div className="w-9 h-9 rounded-full bg-[#e9fdff] flex items-center justify-center flex-shrink-0">
            <span className="text-[#2d666d] font-bold text-xs">{user?.username?.[0]?.toUpperCase() || 'U'}</span>
          </div>
          <input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleComment()}
            placeholder="Write a comment..."
            className="flex-1 bg-[#f6f3f2]/60 rounded-full px-4 py-2 text-sm text-[#1c1b1b] placeholder:text-[#45474b]/50 focus:outline-none focus:ring-2 focus:ring-[#2d666d]/30"
          />
          <button onClick={handleComment} disabled={submitting || !commentText.trim()} className="text-[#2d666d] font-bold text-sm disabled:opacity-40">
            {submitting ? '...' : 'Send'}
          </button>
        </div>

        {/* Comments */}
        <div className="space-y-3">
          {post.comments.map((c) => (
            <div key={c.id} className="glass-card rounded-xl p-3 flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#ffd1dc] flex items-center justify-center flex-shrink-0">
                <span className="text-[#7a5761] font-bold text-xs">{c.authorName?.[0]?.toUpperCase()}</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-[#1c1b1b]">{c.authorName}</span>
                  <span className="text-xs text-[#76777b]">{getTimeAgo(c.createdAt)}</span>
                </div>
                <p className="text-sm text-[#45474b]">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
