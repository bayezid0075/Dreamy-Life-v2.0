import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface FriendUser {
  id: string;
  username: string;
  fullName?: string;
  avatarUrl?: string;
  bio?: string;
  memberStatus?: string;
  createdAt?: string;
}

interface FriendRequest extends FriendUser {
  requestId?: string;
}

export default function FriendsPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated } = useAuthStore();
  const { unreadCount: unreadNotifCount } = useNotificationStore();
  const [activeTab, setActiveTab] = useState<'find' | 'friends' | 'requests' | 'sent'>('find');
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<(FriendUser & { friendshipStatus: string })[]>([]);
  const [friendQuery, setFriendQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      router.replace('/login');
      return;
    }
    fetchAll();
  }, [isAuthenticated, accessToken]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [friendsRes, requestsRes, sentRes] = await Promise.all([
        fetch(`${API_URL}/friends`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${API_URL}/friends/requests`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${API_URL}/friends/requests/sent`, { headers: { Authorization: `Bearer ${accessToken}` } }),
      ]);

      if (friendsRes.ok) {
        const data = await friendsRes.json();
        setFriends(data.friends || []);
      }
      if (requestsRes.ok) {
        const data = await requestsRes.json();
        setReceivedRequests(data.requests || []);
      }
      if (sentRes.ok) {
        const data = await sentRes.json();
        setSentRequests(data.requests || []);
      }
    } catch (err) {
      console.error('Failed to fetch friends data', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = useCallback(async (q?: string) => {
    try {
      const url = q && q.length >= 2
        ? `${API_URL}/users/search/all?q=${encodeURIComponent(q)}`
        : `${API_URL}/users/search/all`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (err) {
      console.error('Failed to search users', err);
    }
  }, [accessToken]);

  useEffect(() => {
    if (activeTab !== 'find') return;
    const timer = setTimeout(() => fetchAllUsers(searchQuery || undefined), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, activeTab, fetchAllUsers]);

  const handleAcceptRequest = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      const res = await fetch(`${API_URL}/friends/accept/${requestId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) fetchAll();
    } catch (err) {
      console.error('Failed to accept request', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      const res = await fetch(`${API_URL}/friends/reject/${requestId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) fetchAll();
    } catch (err) {
      console.error('Failed to reject request', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      const res = await fetch(`${API_URL}/friends/request/${requestId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) fetchAll();
    } catch (err) {
      console.error('Failed to cancel request', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendRequest = async (userId: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`${API_URL}/friends/request/${userId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        setSearchResults((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, friendshipStatus: 'request_sent' } : u)),
        );
      }
    } catch (err) {
      console.error('Failed to send request', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    setActionLoading(friendId);
    try {
      const res = await fetch(`${API_URL}/friends/${friendId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) fetchAll();
    } catch (err) {
      console.error('Failed to remove friend', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartChat = async (userId: string) => {
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
      console.error('Failed to start chat', err);
    }
  };

  const filteredFriends = friends.filter((f) => {
    if (!friendQuery) return true;
    const q = friendQuery.toLowerCase();
    return (
      f.username.toLowerCase().includes(q) ||
      (f.fullName && f.fullName.toLowerCase().includes(q))
    );
  });

  const tabs = [
    { key: 'find' as const, label: 'Discover', icon: 'explore', count: null },
    { key: 'friends' as const, label: 'Friends', icon: 'group', count: friends.length },
    { key: 'requests' as const, label: 'Requests', icon: 'inbox', count: receivedRequests.length },
    { key: 'sent' as const, label: 'Sent', icon: 'send', count: sentRequests.length },
  ];

  const renderFriendButton = (u: FriendUser & { friendshipStatus: string }) => {
    switch (u.friendshipStatus) {
      case 'friends':
        return (
          <span className="px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-600 text-[13px] font-semibold flex items-center gap-1 border border-emerald-200/50">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            Friends
          </span>
        );
      case 'request_sent':
        return (
          <span className="px-4 py-2 rounded-full bg-white/60 text-[#45474b] text-[13px] font-semibold border border-white/40">
            Sent
          </span>
        );
      case 'request_received':
        return (
          <span className="px-4 py-2 rounded-full bg-amber-500/10 text-amber-600 text-[13px] font-semibold border border-amber-200/50">
            Pending
          </span>
        );
      default:
        return (
          <button
            onClick={() => handleSendRequest(u.id)}
            disabled={actionLoading === u.id}
            className="px-4 py-2 rounded-full bg-gradient-to-r from-[#2d666d] to-[#1a4a50] text-white text-[13px] font-semibold hover:shadow-lg hover:shadow-[#2d666d]/20 transition-all duration-300 disabled:opacity-50 active:scale-95"
          >
            {actionLoading === u.id ? '...' : 'Add Friend'}
          </button>
        );
    }
  };

  return (
    <>
      <Head>
        <title>Friends - Dreamy Life</title>
      </Head>
      <div className="min-h-screen bg-[#fcf9f8]">
        {/* Background orbs */}
        <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-[radial-gradient(circle,rgba(45,102,109,0.12),rgba(45,102,109,0)_70%)] blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[50vw] h-[50vw] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.08),rgba(139,92,246,0)_70%)] blur-[100px]" />
          <div className="absolute top-[40%] right-[10%] w-[30vw] h-[30vw] rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.06),rgba(236,72,153,0)_70%)] blur-[80px]" />
        </div>

        {/* Header */}
        <header className="fixed top-0 w-full z-50 bg-white/40 backdrop-blur-xl border-b border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)] h-20 flex items-center px-6">
          <div className="flex items-center gap-4 max-w-[1280px] mx-auto w-full">
            <Link href="/social-feed" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/40 transition-colors active:scale-95 text-[#5d5e64]">
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <h1 className="text-[24px] font-bold text-[#5d5e64] tracking-tight">Friends</h1>
          </div>
        </header>

        {/* Main Content */}
        <main className="pt-28 pb-24 px-4 md:px-6 max-w-[900px] mx-auto w-full">
          {/* Search Bar */}
          {activeTab === 'find' && (
            <div className={`mb-6 rounded-2xl transition-all duration-500 ${
              searchFocused
                ? 'bg-white/80 shadow-xl shadow-[#2d666d]/10 ring-2 ring-[#2d666d]/20'
                : 'bg-white/50 shadow-sm'
            } backdrop-blur-[24px] border border-white/30`}>
              <div className="px-6 py-4 flex items-center gap-3">
                <span className={`material-symbols-outlined transition-colors duration-300 ${
                  searchFocused ? 'text-[#2d666d]' : 'text-[#45474b]/60'
                }`}>search</span>
                <input
                  type="text"
                  placeholder="Search by name or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className="bg-transparent border-none outline-none w-full text-[#1c1b1b] placeholder:text-[#45474b]/40 text-[16px] font-medium"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="w-8 h-8 rounded-full bg-[#e5e2e1]/50 flex items-center justify-center hover:bg-[#e5e2e1] transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm text-[#45474b]">close</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-2.5 rounded-full text-[14px] font-semibold transition-all duration-300 whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tab.key
                    ? tab.key === 'requests'
                      ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/25'
                      : tab.key === 'find'
                      ? 'bg-gradient-to-r from-[#2d666d] to-[#1a4a50] text-white shadow-lg shadow-[#2d666d]/25'
                      : 'bg-gradient-to-r from-[#1A1A1A] to-[#2d2d2d] text-white shadow-lg shadow-black/15'
                    : 'bg-white/50 backdrop-blur-[24px] text-[#45474b] hover:bg-white/70 border border-white/30'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                {tab.label}
                {tab.count !== null && tab.count > 0 && (
                  <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                    activeTab === tab.key ? 'bg-white/25' : 'bg-[#e5e2e1]'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Find People Tab */}
          {activeTab === 'find' && (
            <div className="space-y-3">
              {searchQuery.length >= 2 && searchResults.length === 0 && (
                <div className="bg-white/50 backdrop-blur-[24px] rounded-2xl p-12 text-center border border-white/30">
                  <span className="material-symbols-outlined text-5xl text-[#45474b]/30 mb-4 block">person_search</span>
                  <p className="text-[#45474b] text-lg font-semibold">No users found</p>
                  <p className="text-[#45474b]/50 text-sm mt-2">Try a different search term</p>
                </div>
              )}

              {!searchQuery && searchResults.length === 0 && (
                <div className="bg-white/50 backdrop-blur-[24px] rounded-2xl p-12 text-center border border-white/30">
                  <span className="material-symbols-outlined text-5xl text-[#45474b]/30 mb-4 block">people</span>
                  <p className="text-[#45474b] text-lg font-semibold">No users available</p>
                </div>
              )}

              {searchResults.map((u) => (
                <div key={u.id} className="bg-white/50 backdrop-blur-[24px] rounded-2xl p-4 flex items-center gap-4 border border-white/30 hover:bg-white/70 hover:shadow-lg hover:shadow-black/5 transition-all duration-300 hover:-translate-y-0.5 group">
                  <Link href={`/users/${u.id}`} className="flex-shrink-0">
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt={u.username} className="w-14 h-14 rounded-full object-cover ring-2 ring-white group-hover:ring-[#2d666d]/20 transition-all duration-300" />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#e9fdff] to-[#d4f5f8] flex items-center justify-center ring-2 ring-white group-hover:ring-[#2d666d]/20 transition-all duration-300">
                        <span className="text-[#2d666d] font-bold text-lg">{u.username[0]?.toUpperCase()}</span>
                      </div>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/users/${u.id}`}>
                      <h3 className="text-[15px] font-bold text-[#1c1b1b] truncate hover:underline">{u.fullName || u.username}</h3>
                    </Link>
                    <p className="text-[13px] text-[#45474b] truncate">@{u.username}</p>
                    {u.bio && (
                      <p className="text-[12px] text-[#45474b]/50 truncate mt-0.5">{u.bio}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {renderFriendButton(u)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Friends Tab */}
          {activeTab === 'friends' && (
            <div className="space-y-4">
              <div className="bg-white/50 backdrop-blur-[24px] rounded-2xl px-6 py-3 flex items-center gap-3 border border-white/30">
                <span className="material-symbols-outlined text-[#45474b]/60">search</span>
                <input
                  type="text"
                  placeholder="Search your friends..."
                  value={friendQuery}
                  onChange={(e) => setFriendQuery(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-[#1c1b1b] placeholder:text-[#45474b]/40 text-[15px]"
                />
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin h-10 w-10 border-2 border-[#2d666d] border-t-transparent rounded-full" />
                </div>
              ) : filteredFriends.length === 0 ? (
                <div className="bg-white/50 backdrop-blur-[24px] rounded-2xl p-12 text-center border border-white/30">
                  <span className="material-symbols-outlined text-5xl text-[#45474b]/30 mb-4 block">people</span>
                  <p className="text-[#45474b] text-lg font-semibold">
                    {friendQuery ? 'No friends match your search' : 'No friends yet'}
                  </p>
                  <p className="text-[#45474b]/50 text-sm mt-2">
                    {friendQuery ? 'Try a different search' : 'Discover people and send friend requests'}
                  </p>
                  {!friendQuery && (
                    <button
                      onClick={() => setActiveTab('find')}
                      className="mt-6 px-6 py-3 rounded-full bg-gradient-to-r from-[#2d666d] to-[#1a4a50] text-white text-sm font-semibold hover:shadow-lg hover:shadow-[#2d666d]/20 transition-all duration-300 active:scale-95"
                    >
                      Discover People
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredFriends.map((friend) => (
                    <div key={friend.id} className="bg-white/50 backdrop-blur-[24px] rounded-2xl p-4 flex items-center gap-4 border border-white/30 hover:bg-white/70 hover:shadow-lg hover:shadow-black/5 transition-all duration-300 hover:-translate-y-0.5 group">
                      <Link href={`/users/${friend.id}`} className="flex-shrink-0">
                        {friend.avatarUrl ? (
                          <img src={friend.avatarUrl} alt={friend.username} className="w-14 h-14 rounded-full object-cover ring-2 ring-white group-hover:ring-[#2d666d]/20 transition-all duration-300" />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#e9fdff] to-[#d4f5f8] flex items-center justify-center ring-2 ring-white group-hover:ring-[#2d666d]/20 transition-all duration-300">
                            <span className="text-[#2d666d] font-bold text-lg">{friend.username[0]?.toUpperCase()}</span>
                          </div>
                        )}
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link href={`/users/${friend.id}`}>
                          <h3 className="text-[15px] font-bold text-[#1c1b1b] truncate hover:underline">{friend.fullName || friend.username}</h3>
                        </Link>
                        <p className="text-[13px] text-[#45474b] truncate">@{friend.username}</p>
                        {friend.bio && (
                          <p className="text-[12px] text-[#45474b]/50 truncate mt-0.5">{friend.bio}</p>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleStartChat(friend.id)}
                          className="w-10 h-10 rounded-full bg-gradient-to-br from-[#e9fdff] to-[#d4f5f8] flex items-center justify-center hover:shadow-md hover:shadow-[#2d666d]/10 transition-all duration-300"
                          title="Message"
                        >
                          <span className="material-symbols-outlined text-[#2d666d] text-xl">chat</span>
                        </button>
                        <button
                          onClick={() => handleRemoveFriend(friend.id)}
                          disabled={actionLoading === friend.id}
                          className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center hover:bg-rose-100 hover:shadow-md hover:shadow-rose-500/10 transition-all duration-300 disabled:opacity-50"
                          title="Remove friend"
                        >
                          <span className="material-symbols-outlined text-rose-500 text-xl">person_remove</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Requests Tab */}
          {activeTab === 'requests' && (
            <div className="space-y-3">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin h-10 w-10 border-2 border-[#2d666d] border-t-transparent rounded-full" />
                </div>
              ) : receivedRequests.length === 0 ? (
                <div className="bg-white/50 backdrop-blur-[24px] rounded-2xl p-12 text-center border border-white/30">
                  <span className="material-symbols-outlined text-5xl text-[#45474b]/30 mb-4 block">inbox</span>
                  <p className="text-[#45474b] text-lg font-semibold">No pending requests</p>
                  <p className="text-[#45474b]/50 text-sm mt-2">Friend requests from others will appear here</p>
                </div>
              ) : (
                receivedRequests.map((req) => (
                  <div key={req.id} className="bg-white/50 backdrop-blur-[24px] rounded-2xl p-4 flex items-center gap-4 border border-white/30 hover:bg-white/70 hover:shadow-lg hover:shadow-black/5 transition-all duration-300 hover:-translate-y-0.5 group">
                    <Link href={`/users/${req.userId || req.id}`} className="flex-shrink-0">
                      {req.avatarUrl ? (
                        <img src={req.avatarUrl} alt={req.username} className="w-14 h-14 rounded-full object-cover ring-2 ring-white group-hover:ring-rose-200 transition-all duration-300" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center ring-2 ring-white group-hover:ring-rose-200 transition-all duration-300">
                          <span className="text-rose-400 font-bold text-lg">{req.username[0]?.toUpperCase()}</span>
                        </div>
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/users/${req.userId || req.id}`}>
                        <h3 className="text-[15px] font-bold text-[#1c1b1b] truncate hover:underline">{req.fullName || req.username}</h3>
                      </Link>
                      <p className="text-[13px] text-[#45474b] truncate">@{req.username}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleAcceptRequest(req.id)}
                        disabled={actionLoading === req.id}
                        className="px-4 py-2 rounded-full bg-gradient-to-r from-[#2d666d] to-[#1a4a50] text-white text-[13px] font-semibold hover:shadow-lg hover:shadow-[#2d666d]/20 transition-all duration-300 disabled:opacity-50 active:scale-95"
                      >
                        {actionLoading === req.id ? '...' : 'Accept'}
                      </button>
                      <button
                        onClick={() => handleRejectRequest(req.id)}
                        disabled={actionLoading === req.id}
                        className="px-4 py-2 rounded-full bg-white/60 text-[#45474b] text-[13px] font-semibold hover:bg-white/80 transition-all duration-300 disabled:opacity-50 border border-white/40"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Sent Tab */}
          {activeTab === 'sent' && (
            <div className="space-y-3">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin h-10 w-10 border-2 border-[#2d666d] border-t-transparent rounded-full" />
                </div>
              ) : sentRequests.length === 0 ? (
                <div className="bg-white/50 backdrop-blur-[24px] rounded-2xl p-12 text-center border border-white/30">
                  <span className="material-symbols-outlined text-5xl text-[#45474b]/30 mb-4 block">send</span>
                  <p className="text-[#45474b] text-lg font-semibold">No sent requests</p>
                  <p className="text-[#45474b]/50 text-sm mt-2">Friend requests you send will appear here</p>
                </div>
              ) : (
                sentRequests.map((req) => (
                  <div key={req.id} className="bg-white/50 backdrop-blur-[24px] rounded-2xl p-4 flex items-center gap-4 border border-white/30 hover:bg-white/70 hover:shadow-lg hover:shadow-black/5 transition-all duration-300 hover:-translate-y-0.5 group">
                    <Link href={`/users/${req.userId || req.id}`} className="flex-shrink-0">
                      {req.avatarUrl ? (
                        <img src={req.avatarUrl} alt={req.username} className="w-14 h-14 rounded-full object-cover ring-2 ring-white group-hover:ring-violet-200 transition-all duration-300" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-50 to-purple-50 flex items-center justify-center ring-2 ring-white group-hover:ring-violet-200 transition-all duration-300">
                          <span className="text-violet-400 font-bold text-lg">{req.username[0]?.toUpperCase()}</span>
                        </div>
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/users/${req.userId || req.id}`}>
                        <h3 className="text-[15px] font-bold text-[#1c1b1b] truncate hover:underline">{req.fullName || req.username}</h3>
                      </Link>
                      <p className="text-[13px] text-[#45474b] truncate">@{req.username}</p>
                    </div>
                    <button
                      onClick={() => handleCancelRequest(req.id)}
                      disabled={actionLoading === req.id}
                      className="px-4 py-2 rounded-full bg-white/60 text-rose-500 text-[13px] font-semibold hover:bg-rose-50 hover:text-rose-600 transition-all duration-300 disabled:opacity-50 border border-white/40 active:scale-95"
                    >
                      {actionLoading === req.id ? '...' : 'Cancel'}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </main>
      </div>

      {/* Bottom Nav (Mobile) */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 rounded-t-2xl bg-white/70 backdrop-blur-3xl shadow-[0_-10px_30px_rgba(0,0,0,0.05)] border-t border-white/60">
        <div className="flex justify-around items-center py-2 px-2">
          <Link href="/social-feed" className="flex flex-col items-center justify-center text-[#45474b]/70 hover:bg-[#e5e2e1]/40 transition-colors px-5 py-2 rounded-xl">
            <span className="material-symbols-outlined">home</span>
          </Link>
          <Link href="/friends" className="flex flex-col items-center justify-center text-[#5d5e64] font-bold bg-[#f8f8ff]/60 rounded-xl px-5 py-2 relative">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
          </Link>
          <Link href="/posts/create" className="flex flex-col items-center justify-center text-[#45474b]/70 hover:bg-[#e5e2e1]/40 transition-colors px-5 py-2 rounded-xl">
            <span className="material-symbols-outlined">add_circle</span>
          </Link>
          <Link href="/notifications" className="flex flex-col items-center justify-center text-[#45474b]/70 hover:bg-[#e5e2e1]/40 transition-colors px-5 py-2 rounded-xl relative">
            <span className="material-symbols-outlined">notifications</span>
            {unreadNotifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center px-1">
                {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
              </span>
            )}
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
