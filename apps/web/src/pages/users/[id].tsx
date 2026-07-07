import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import AuthGuard from '@/shared/components/AuthGuard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface UserProfile {
  id: string;
  username: string;
  fullName?: string;
  avatarUrl?: string;
}

interface UserStats {
  postsCount: number;
  followersCount: number;
  followingCount: number;
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
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export default function ProfilePage() {
  const router = useRouter();
  const { id } = router.query;
  const { accessToken, user } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats>({ postsCount: 0, followersCount: 0, followingCount: 0 });
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  const userId = (id as string) || user?.id;

  const fetchProfile = useCallback(async () => {
    if (!userId || !accessToken) return;
    try {
      const [userRes, statsRes, postsRes] = await Promise.all([
        fetch(`${API_URL}/auth/profile`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${API_URL}/users/${userId}/stats`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${API_URL}/users/${userId}/posts?page=1&limit=50`, { headers: { Authorization: `Bearer ${accessToken}` } }),
      ]);
      const statsData = await statsRes.json();
      const postsData = await postsRes.json();
      setStats(statsData);
      setPosts(postsData.items || []);

      if (userRes.ok) {
        const userData = await userRes.json();
        const profileUser = userData.data?.user;
        setProfile({
          id: userId,
          username: profileUser?.username || 'User',
          fullName: profileUser?.fullName,
          avatarUrl: profileUser?.avatarUrl,
        });
      }
      setIsOwnProfile(userId === user?.id);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [userId, accessToken, user?.id]);

  useEffect(() => {
    if (accessToken) {
      fetchProfile();
    }
  }, [accessToken, fetchProfile]);

  const handleFollow = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_URL}/users/${userId}/follow`, {
        method: 'POST', headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (res.ok) {
        setIsFollowing(data.following);
        setStats((s) => ({ ...s, followersCount: s.followersCount + (data.following ? 1 : -1) }));
      }
    } catch (err) { console.error(err); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#fcf9f8' }}>
        <div className="animate-spin h-10 w-10 border-2 border-[#5d5e64] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <Head><title>Dreamy Life - Profile</title></Head>
      <style>{`
        body { background-color: #fcf9f8; background-image: radial-gradient(circle at 15% 50%, rgba(186,230,253,0.4) 0%, transparent 50%), radial-gradient(circle at 85% 30%, rgba(253,164,175,0.3) 0%, transparent 50%), radial-gradient(circle at 50% 80%, rgba(167,243,208,0.4) 0%, transparent 50%); background-attachment: fixed; min-height: 100vh; }
        .glass-panel { background-color: rgba(255,255,255,0.4); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.3); box-shadow: 0 20px 40px rgba(0,0,0,0.04); }
      `}</style>

      <header className="fixed top-0 w-full z-50 bg-white/40 backdrop-blur-xl border-b border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
        <div className="flex justify-between items-center px-6 w-full h-16 max-w-[1280px] mx-auto">
          <button onClick={() => router.back()} className="hover:bg-white/20 transition-colors p-2 rounded-full">
            <span className="material-symbols-outlined text-[#5d5e64]">arrow_back</span>
          </button>
          <h1 className="text-[24px] text-[#5d5e64] tracking-tight font-extrabold" style={{ fontFamily: 'Plus Jakarta Sans' }}>Dreamy Life</h1>
          <button className="hover:bg-white/20 transition-colors p-2 rounded-full">
            <span className="material-symbols-outlined text-[#5d5e64]">settings</span>
          </button>
        </div>
      </header>

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-16">
        {/* Hero Section */}
        <section className="relative mt-4 mb-16 rounded-xl">
          <div className="h-48 md:h-64 w-full bg-gradient-to-r from-[#e9fdff] via-[#ffd1dc] to-[#f8f8ff] relative overflow-hidden rounded-xl">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/20"></div>
          </div>
          <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 flex flex-col items-center z-10">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full p-1 bg-white/60 backdrop-blur-md shadow-[0_20px_40px_rgba(0,0,0,0.08)]">
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.username} className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className="w-full h-full rounded-full bg-[#e9fdff] flex items-center justify-center">
                  <span className="text-[#2d666d] font-bold text-3xl">{profile?.username?.[0]?.toUpperCase()}</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* User Info */}
        <section className="text-center mt-12 mb-8 px-4">
          <h2 className="text-[32px] font-bold mb-2 text-[#1c1b1b]" style={{ fontFamily: 'Plus Jakarta Sans' }}>{profile?.fullName || profile?.username}</h2>
          <p className="text-[16px] text-[#45474b] max-w-lg mx-auto">Digital creator exploring the intersection of minimalist design and everyday magic.</p>
        </section>

        {/* Action Bar */}
        <section className="flex justify-center gap-4 mb-10">
          {isOwnProfile ? (
            <button className="bg-[#1A1A1A] text-white px-8 py-3 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity">Edit Profile</button>
          ) : (
            <button onClick={handleFollow} className={`px-8 py-3 rounded-full text-sm font-semibold transition-all ${isFollowing ? 'glass-panel text-[#1c1b1b] hover:bg-white/50' : 'bg-[#1A1A1A] text-white hover:opacity-90'}`}>
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
          <button className="glass-panel text-[#1c1b1b] px-8 py-3 rounded-full text-sm font-semibold hover:bg-white/50 transition-colors">Dashboard</button>
        </section>

        {/* Stats Bar */}
        <section className="glass-panel rounded-xl p-4 mb-12 max-w-md mx-auto flex justify-around items-center">
          <div className="text-center">
            <div className="text-[24px] font-bold text-[#1c1b1b]">{formatCount(stats.followersCount)}</div>
            <div className="text-sm font-semibold text-[#45474b]">Followers</div>
          </div>
          <div className="w-px h-8 bg-[#c6c6cb]/30"></div>
          <div className="text-center">
            <div className="text-[24px] font-bold text-[#1c1b1b]">{formatCount(stats.followingCount)}</div>
            <div className="text-sm font-semibold text-[#45474b]">Following</div>
          </div>
          <div className="w-px h-8 bg-[#c6c6cb]/30"></div>
          <div className="text-center">
            <div className="text-[24px] font-bold text-[#1c1b1b]">{stats.postsCount}</div>
            <div className="text-sm font-semibold text-[#45474b]">Posts</div>
          </div>
        </section>

        {/* Posts */}
        <section className="max-w-2xl mx-auto space-y-6 pb-24">
          <h3 className="text-sm font-semibold text-[#45474b] mb-4 px-2">Recent Activity</h3>
          {posts.length === 0 && (
            <div className="glass-panel rounded-2xl p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-[#5d5e64] mb-3 block">post_add</span>
              <p className="text-[#45474b]">No posts yet</p>
            </div>
          )}
          {posts.map((post) => (
            <Link key={post.id} href={`/posts/${post.id}`}>
              <article className="glass-panel rounded-2xl p-6 transition-transform hover:-translate-y-1 duration-300 cursor-pointer">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#e9fdff] flex items-center justify-center">
                    <span className="text-[#2d666d] font-bold text-sm">{post.authorName?.[0]?.toUpperCase()}</span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#1c1b1b]">{post.authorName}</div>
                    <div className="text-xs text-[#45474b]">{getTimeAgo(post.createdAt)}</div>
                  </div>
                </div>
                {post.mediaUrls?.length > 0 && (
                  <div className="rounded-xl overflow-hidden mb-4 aspect-[4/3]">
                    <img src={post.mediaUrls[0].startsWith('/') ? `${API_URL}${post.mediaUrls[0]}` : post.mediaUrls[0]} alt="Post" className="w-full h-full object-cover" />
                  </div>
                )}
                <p className="text-[16px] text-[#1c1b1b] mb-4">{post.content}</p>
                <div className="flex items-center gap-4 text-[#45474b]">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[20px]">favorite</span>
                    <span className="text-sm font-semibold">{post.likesCount}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
                    <span className="text-sm font-semibold">{post.commentsCount}</span>
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </section>
      </main>
    </AuthGuard>
  );
}
