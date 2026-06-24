import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4080';

interface UserProfile {
  id: string;
  username: string;
  memberStatus: string;
  createdAt: string;
  info: {
    fullName: string;
    avatarUrl: string;
    bio: string;
    coverImage: string;
  } | null;
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

export default function SocialProfilePage() {
  const router = useRouter();
  const { accessToken, isAuthenticated, user: authUser } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  const profileId = authUser?.id;

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      router.replace('/login');
      return;
    }
    if (profileId) {
      fetchAll(profileId);
    }
  }, [isAuthenticated, accessToken, profileId, router]);

  const fetchAll = async (userId: string) => {
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const [profileRes, statsRes, postsRes] = await Promise.all([
        fetch(`${API_URL}/users/${userId}`, { headers }),
        fetch(`${API_URL}/users/${userId}/stats`, { headers }),
        fetch(`${API_URL}/users/${userId}/posts?limit=50`, { headers }),
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data);
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
      if (postsRes.ok) {
        const data = await postsRes.json();
        setPosts(data.items || []);
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!profileId || !accessToken) return;
    try {
      const res = await fetch(`${API_URL}/users/${profileId}/follow`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (res.ok) {
        setIsFollowing(data.following);
        setStats((prev) =>
          prev
            ? { ...prev, followersCount: prev.followersCount + (data.following ? 1 : -1) }
            : prev,
        );
      }
    } catch (err) {
      console.error('Failed to follow', err);
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
            p.id === postId ? { ...p, likesCount: p.likesCount + (data.liked ? 1 : -1) } : p,
          ),
        );
      }
    } catch (err) {
      console.error('Failed to like', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-aurora">
        <div className="animate-spin h-10 w-10 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const displayName = profile?.info?.fullName || profile?.username || 'User';
  const bio = profile?.info?.bio || '';
  const avatarUrl = profile?.info?.avatarUrl;
  const coverImage = profile?.info?.coverImage;
  const isOwnProfile = true;

  return (
    <>
      <Head>
        <title>Dreamy Life - Profile</title>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </Head>

      <body className="bg-aurora text-on-surface min-h-screen font-['Plus_Jakarta_Sans',sans-serif] antialiased pb-24 relative overflow-x-hidden">
        {/* TopAppBar */}
        <header className="fixed top-0 w-full z-50 bg-white/40 backdrop-blur-xl border-b border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
          <div className="flex justify-between items-center px-6 w-full h-16 max-w-[1280px] mx-auto">
            <button
              onClick={() => router.back()}
              className="hover:bg-white/20 transition-colors duration-300 p-2 rounded-full flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-primary">arrow_back</span>
            </button>
            <h1 className="text-[24px] font-bold text-primary tracking-tight">Dreamy Life</h1>
            <Link
              href="/social/edit-profile"
              className="hover:bg-white/20 transition-colors duration-300 p-2 rounded-full flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-primary">settings</span>
            </Link>
          </div>
        </header>

        <main className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-16">
          {/* Hero Section */}
          <section className="relative mt-4 mb-16 rounded-xl">
            <div className="h-48 md:h-64 w-full bg-gradient-to-r from-tertiary-container via-secondary-container to-primary-container relative overflow-hidden rounded-xl">
              {coverImage ? (
                <img alt="Profile Cover" className="w-full h-full object-cover opacity-80 mix-blend-overlay" src={coverImage} />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-[#e9fdff] via-[#ffd1dc] to-[#f8f8ff] opacity-80" />
              )}
            </div>
            <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 flex flex-col items-center z-10">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full p-1 bg-white/60 backdrop-blur-md shadow-[0_20px_40px_rgba(0,0,0,0.08)]">
                {avatarUrl ? (
                  <img alt={displayName} className="w-full h-full rounded-full object-cover" src={avatarUrl} />
                ) : (
                  <div className="w-full h-full rounded-full bg-[#e5e2e1] flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-5xl">person</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* User Info */}
          <section className="text-center mt-12 mb-8 px-4">
            <h2 className="text-[32px] font-bold mb-2 text-on-surface">{displayName}</h2>
            <p className="text-[16px] text-on-surface-variant max-w-lg mx-auto leading-relaxed">
              {bio || 'No bio yet.'}
            </p>
          </section>

          {/* Action Bar */}
          <section className="flex justify-center gap-4 mb-10">
            {isOwnProfile ? (
              <Link
                href="/social/edit-profile"
                className="bg-[#1A1A1A] text-white px-8 py-3 rounded-full text-[14px] font-semibold hover:opacity-90 transition-opacity"
              >
                Edit Profile
              </Link>
            ) : (
              <button
                onClick={handleFollow}
                className={`px-8 py-3 rounded-full text-[14px] font-semibold transition-opacity ${
                  isFollowing
                    ? 'bg-[#1A1A1A] text-white hover:opacity-90'
                    : 'bg-[#2d666d] text-white hover:opacity-90'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
            <Link
              href="/social/analytics"
              className="glass-panel text-on-surface px-8 py-3 rounded-full text-[14px] font-semibold hover:bg-white/50 transition-colors"
            >
              Professional Dashboard
            </Link>
          </section>

          {/* Stats Bar */}
          <section className="glass-panel rounded-xl p-4 mb-12 max-w-md mx-auto flex justify-around items-center">
            <div className="text-center">
              <div className="text-[24px] font-bold text-on-surface">{stats?.followersCount ?? 0}</div>
              <div className="text-[14px] font-semibold text-on-surface-variant">Followers</div>
            </div>
            <div className="w-px h-8 bg-outline-variant/30" />
            <div className="text-center">
              <div className="text-[24px] font-bold text-on-surface">{stats?.followingCount ?? 0}</div>
              <div className="text-[14px] font-semibold text-on-surface-variant">Following</div>
            </div>
            <div className="w-px h-8 bg-outline-variant/30" />
            <div className="text-center">
              <div className="text-[24px] font-bold text-on-surface">{stats?.postsCount ?? 0}</div>
              <div className="text-[14px] font-semibold text-on-surface-variant">Posts</div>
            </div>
          </section>

          {/* Activity Timeline */}
          <section className="max-w-2xl mx-auto space-y-6">
            <h3 className="text-[14px] font-semibold text-on-surface-variant mb-4 px-2">Recent Activity</h3>

            {posts.length === 0 && (
              <div className="glass-panel rounded-2xl p-12 text-center">
                <span className="material-symbols-outlined text-5xl text-primary mb-4 block">post_add</span>
                <p className="text-on-surface-variant text-lg">No posts yet.</p>
              </div>
            )}

            {posts.map((post) => (
              <Link key={post.id} href={`/posts/${post.id}`}>
                <article className="glass-panel rounded-2xl p-6 transition-transform hover:-translate-y-1 duration-300 cursor-pointer">
                  <div className="flex items-center gap-3 mb-4">
                    {post.authorAvatar ? (
                      <img alt="Avatar" className="w-10 h-10 rounded-full object-cover" src={post.authorAvatar} />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#e9fdff] flex items-center justify-center">
                        <span className="text-[#2d666d] font-bold text-sm">{post.authorName?.[0]?.toUpperCase()}</span>
                      </div>
                    )}
                    <div>
                      <div className="text-[14px] font-semibold text-on-surface">{post.authorName}</div>
                      <div className="text-xs text-on-surface-variant">{getTimeAgo(post.createdAt)}</div>
                    </div>
                  </div>

                  {post.mediaUrls && post.mediaUrls.length > 0 && (
                    <div className="rounded-xl overflow-hidden mb-4 aspect-[4/3]">
                      <img
                        alt="Post"
                        className="w-full h-full object-cover"
                        src={post.mediaUrls[0].startsWith('/') ? `${API_URL}${post.mediaUrls[0]}` : post.mediaUrls[0]}
                      />
                    </div>
                  )}

                  <p className="text-[16px] text-on-surface mb-4 leading-relaxed">{post.content}</p>

                  <div className="flex items-center gap-4 text-on-surface-variant">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleLike(post.id);
                      }}
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">favorite</span>
                      <span className="text-[14px] font-semibold">{post.likesCount}</span>
                    </button>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
                      <span className="text-[14px] font-semibold">{post.commentsCount}</span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </section>
        </main>

        {/* BottomNavBar */}
        <nav className="md:hidden fixed bottom-0 w-full z-50 rounded-t-lg bg-white/40 backdrop-blur-xl shadow-[0_-10px_40px_rgba(0,0,0,0.04)] border-t border-white/30">
          <div className="flex justify-around items-center py-3 px-4">
            <Link href="/social-feed" className="flex flex-col items-center justify-center text-on-surface-variant/60 hover:text-primary transition-all duration-300">
              <span className="material-symbols-outlined mb-1">home</span>
              <span className="text-[10px] font-semibold">Home</span>
            </Link>
            <Link href="/social-feed" className="flex flex-col items-center justify-center text-on-surface-variant/60 hover:text-primary transition-all duration-300">
              <span className="material-symbols-outlined mb-1">search</span>
              <span className="text-[10px] font-semibold">Explore</span>
            </Link>
            <Link href="/posts/create" className="flex flex-col items-center justify-center text-on-surface-variant/60 hover:text-primary transition-all duration-300">
              <span className="material-symbols-outlined mb-1">add_circle</span>
              <span className="text-[10px] font-semibold">Create</span>
            </Link>
            <Link href="/notifications" className="flex flex-col items-center justify-center text-on-surface-variant/60 hover:text-primary transition-all duration-300">
              <span className="material-symbols-outlined mb-1">auto_awesome</span>
              <span className="text-[10px] font-semibold">Vibe</span>
            </Link>
            <Link
              href="/social/profile"
              className="flex flex-col items-center justify-center text-primary bg-secondary-container/50 rounded-xl px-4 py-1 scale-90 duration-200"
            >
              <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
              <span className="text-[10px] font-semibold">Profile</span>
            </Link>
          </div>
        </nav>

        {/* Desktop Sidebar */}
        <aside className="hidden md:flex fixed top-16 left-0 h-full w-64 flex-col gap-6 p-6 glass-panel border-l-0 border-t-0 border-b-0 rounded-r-2xl z-40">
          <div className="space-y-4">
            <Link href="/social-feed" className="flex items-center gap-4 text-on-surface-variant/60 hover:text-primary transition-all duration-300 p-2 rounded-lg hover:bg-white/20">
              <span className="material-symbols-outlined">home</span>
              <span className="text-[14px] font-semibold">Home</span>
            </Link>
            <Link href="/social-feed" className="flex items-center gap-4 text-on-surface-variant/60 hover:text-primary transition-all duration-300 p-2 rounded-lg hover:bg-white/20">
              <span className="material-symbols-outlined">search</span>
              <span className="text-[14px] font-semibold">Explore</span>
            </Link>
            <Link href="/notifications" className="flex items-center gap-4 text-on-surface-variant/60 hover:text-primary transition-all duration-300 p-2 rounded-lg hover:bg-white/20">
              <span className="material-symbols-outlined">auto_awesome</span>
              <span className="text-[14px] font-semibold">Vibe</span>
            </Link>
            <Link href="/social/profile" className="flex items-center gap-4 text-primary bg-secondary-container/50 rounded-lg px-2 py-2">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
              <span className="text-[14px] font-semibold">Profile</span>
            </Link>
          </div>
        </aside>
      </body>
    </>
  );
}
