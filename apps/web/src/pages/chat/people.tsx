import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4080';

interface User {
  id: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  level?: number;
  friendshipStatus?: string;
}

export default function PeoplePage() {
  const router = useRouter();
  const { accessToken, isAuthenticated } = useAuthStore();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [downlineUsers, setDownlineUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'search' | 'downline'>('search');
  const [friendActionLoading, setFriendActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      router.replace('/login');
    }
  }, [isAuthenticated, accessToken, router]);

  const fetchDownline = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/chat/downline-users`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDownlineUsers(data);
      }
    } catch (err) {
      console.error('Failed to fetch downline users', err);
    }
  }, [accessToken]);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      fetchDownline();
    }
  }, [isAuthenticated, accessToken, fetchDownline]);

  const searchUsers = useCallback(async (q: string) => {
    if (q.length < 2) {
      setUsers([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/users/search/all?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to search users', err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    const timer = setTimeout(() => searchUsers(query), 300);
    return () => clearTimeout(timer);
  }, [query, searchUsers]);

  const startConversation = async (userId: string) => {
    setCreating(userId);
    try {
      const res = await fetch(`${API_URL}/chat/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ type: 'direct', memberIds: [userId] }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/chat/${data.id}`);
      }
    } catch (err) {
      console.error('Failed to create conversation', err);
    } finally {
      setCreating(null);
    }
  };

  const handleSendFriendRequest = async (userId: string) => {
    setFriendActionLoading(userId);
    try {
      const res = await fetch(`${API_URL}/friends/request/${userId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, friendshipStatus: 'request_sent' } : u)),
        );
        setDownlineUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, friendshipStatus: 'request_sent' } : u)),
        );
      }
    } catch (err) {
      console.error('Failed to send friend request', err);
    } finally {
      setFriendActionLoading(null);
    }
  };

  const renderFriendButton = (user: User) => {
    if (user.id === useAuthStore.getState().user?.id) return null;

    if (user.friendshipStatus === 'friends') {
      return (
        <span className="px-3 py-1.5 rounded-full bg-[#e9fdff] text-[#2d666d] text-[12px] font-semibold flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">check</span>
          Friends
        </span>
      );
    }
    if (user.friendshipStatus === 'request_sent') {
      return (
        <span className="px-3 py-1.5 rounded-full bg-[#e5e2e1]/50 text-[#45474b] text-[12px] font-semibold">
          Sent
        </span>
      );
    }
    if (user.friendshipStatus === 'request_received') {
      return (
        <span className="px-3 py-1.5 rounded-full bg-[#ffd1dc]/50 text-[#78555e] text-[12px] font-semibold">
          Pending
        </span>
      );
    }
    return (
      <button
        onClick={() => handleSendFriendRequest(user.id)}
        disabled={friendActionLoading === user.id}
        className="px-3 py-1.5 rounded-full bg-white/60 text-[#2d666d] text-[12px] font-semibold hover:bg-[#e9fdff] transition-colors disabled:opacity-50 border border-[#2d666d]/20"
      >
        {friendActionLoading === user.id ? '...' : 'Add'}
      </button>
    );
  };

  const displayUsers = activeTab === 'search' ? users : downlineUsers;

  return (
    <>
      <Head>
        <title>Dreamy Life - People</title>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </Head>

      <body className="bg-aurora text-on-surface min-h-screen font-[\'Plus_Jakarta_Sans\',sans-serif] antialiased pb-24">
        <header className="fixed top-0 w-full z-50 bg-white/40 backdrop-blur-xl border-b border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
          <div className="flex justify-between items-center px-6 h-16 w-full max-w-[1280px] mx-auto">
            <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors text-primary active:scale-95">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 className="text-[24px] font-bold text-on-surface tracking-tight">People</h1>
            <Link href="/friends" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors text-primary active:scale-95">
              <span className="material-symbols-outlined">person_add</span>
            </Link>
          </div>
        </header>

        <main className="pt-24 px-4 md:px-6 max-w-2xl mx-auto">
          {/* Search Input */}
          <div className="glass-panel rounded-full px-4 py-3 flex items-center gap-3 focus-within:ring-2 focus-within:ring-tertiary-fixed-dim/50 transition-all mb-4">
            <span className="material-symbols-outlined text-outline">search</span>
            <input
              type="text"
              placeholder="Search by username or name..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value.length >= 2) setActiveTab('search');
              }}
              className="bg-transparent border-none outline-none w-full text-on-surface placeholder:text-outline-variant text-[16px] p-0"
              autoFocus
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('search')}
              className={`px-4 py-2 rounded-full text-[14px] font-semibold transition-all ${
                activeTab === 'search'
                  ? 'bg-primary text-on-primary shadow-[0_8px_16px_rgba(93,94,100,0.2)]'
                  : 'glass-panel text-on-surface-variant hover:bg-white/60'
              }`}
            >
              Search
            </button>
            <button
              onClick={() => { setActiveTab('downline'); setQuery(''); }}
              className={`px-4 py-2 rounded-full text-[14px] font-semibold transition-all ${
                activeTab === 'downline'
                  ? 'bg-primary text-on-primary shadow-[0_8px_16px_rgba(93,94,100,0.2)]'
                  : 'glass-panel text-on-surface-variant hover:bg-white/60'
              }`}
            >
              My Downline ({downlineUsers.length})
            </button>
          </div>

          {loading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          )}

          {/* Downline Empty State */}
          {activeTab === 'downline' && !loading && downlineUsers.length === 0 && (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-5xl text-outline-variant mb-4 block">group</span>
              <p className="text-on-surface-variant">No downline members yet.</p>
              <p className="text-outline text-sm mt-2">Share your referral code to build your network.</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {displayUsers.map((user) => (
              <div key={user.id} className="glass-panel rounded-xl p-4 flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 rounded-full overflow-hidden border border-white/40 bg-surface-container flex items-center justify-center">
                    {user.avatarUrl ? (
                      <img alt={user.username} className="w-full h-full object-cover" src={user.avatarUrl} />
                    ) : (
                      <span className="text-primary font-bold text-lg">{user.username[0]?.toUpperCase()}</span>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[14px] font-semibold text-on-surface truncate">{user.fullName || user.username}</h3>
                  <p className="text-[13px] text-on-surface-variant truncate">
                    @{user.username}
                    {user.level && <span className="ml-2 text-tertiary text-[11px] font-semibold">Level {user.level}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {renderFriendButton(user)}
                  <button
                    onClick={() => startConversation(user.id)}
                    disabled={creating === user.id}
                    className="bg-tertiary text-white px-4 py-2 rounded-full text-[13px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 active:scale-95"
                  >
                    {creating === user.id ? '...' : 'Message'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {query.length >= 2 && !loading && users.length === 0 && activeTab === 'search' && (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-5xl text-outline-variant mb-4 block">person_search</span>
              <p className="text-on-surface-variant">No users found for &quot;{query}&quot;</p>
            </div>
          )}
        </main>
      </body>
    </>
  );
}
