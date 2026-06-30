import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4080';

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
  const { accessToken, isAuthenticated, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'requests' | 'sent' | 'friends' | 'find'>('friends');
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<(FriendUser & { friendshipStatus: string })[]>([]);
  const [friendQuery, setFriendQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
    { key: 'friends', label: 'Friends', count: friends.length },
    { key: 'requests', label: 'Requests', count: receivedRequests.length },
    { key: 'sent', label: 'Sent', count: sentRequests.length },
    { key: 'find', label: 'Find People', count: null },
  ];

  return (
    <>
      <Head>
        <title>Friends - Dreamy Life</title>
      </Head>
      <div className="min-h-screen bg-[#fcf9f8]">
        {/* Background orbs */}
        <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-[radial-gradient(circle,rgba(255,209,220,0.4),rgba(255,209,220,0)_70%)] blur-[100px] opacity-70" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[50vw] h-[50vw] rounded-full bg-[radial-gradient(circle,rgba(233,253,255,0.6),rgba(233,253,255,0)_70%)] blur-[100px] opacity-80" />
        </div>

        {/* Header */}
        <header className="fixed top-0 w-full z-50 bg-white/40 backdrop-blur-xl border-b border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)] h-20 flex items-center px-6">
          <div className="flex items-center gap-4 max-w-[1280px] mx-auto w-full">
            <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/40 transition-colors active:scale-95 text-[#5d5e64]">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 className="text-[24px] font-bold text-[#5d5e64] tracking-tight">Friends</h1>
          </div>
        </header>

        {/* Main Content */}
        <main className="pt-28 pb-20 px-4 md:px-6 max-w-[900px] mx-auto w-full">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`px-5 py-2.5 rounded-full text-[14px] font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tab.key
                    ? tab.key === 'requests'
                      ? 'bg-[#ba1a1a] text-white shadow-lg shadow-[#ba1a1a]/20'
                      : 'bg-[#1A1A1A] text-white shadow-lg shadow-black/10'
                    : 'bg-white/50 backdrop-blur-[24px] text-[#45474b] hover:bg-white/60 border border-white/30'
                }`}
              >
                {tab.label}
                {tab.count !== null && tab.count > 0 && (
                  <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                    activeTab === tab.key ? 'bg-white/20' : 'bg-[#e5e2e1]'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Friends Tab */}
          {activeTab === 'friends' && (
            <div className="space-y-4">
              {/* Search friends */}
              <div className="bg-white/50 backdrop-blur-[24px] rounded-full px-6 py-3 flex items-center gap-3 border border-white/30">
                <span className="material-symbols-outlined text-[#45474b]">search</span>
                <input
                  type="text"
                  placeholder="Search friends..."
                  value={friendQuery}
                  onChange={(e) => setFriendQuery(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-[#1c1b1b] placeholder:text-[#45474b]/50 text-[15px]"
                />
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin h-10 w-10 border-2 border-[#5d5e64] border-t-transparent rounded-full" />
                </div>
              ) : filteredFriends.length === 0 ? (
                <div className="bg-white/50 backdrop-blur-[24px] rounded-2xl p-12 text-center border border-white/30">
                  <span className="material-symbols-outlined text-5xl text-[#5d5e64] mb-4 block">people</span>
                  <p className="text-[#45474b] text-lg font-semibold">
                    {friendQuery ? 'No friends match your search' : 'No friends yet'}
                  </p>
                  <p className="text-[#45474b]/60 text-sm mt-2">
                    {friendQuery ? 'Try a different search' : 'Send friend requests to connect with people'}
                  </p>
                  {!friendQuery && (
                    <button
                      onClick={() => setActiveTab('find')}
                      className="mt-6 px-6 py-3 rounded-full bg-[#2d666d] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                    >
                      Find People
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredFriends.map((friend) => (
                    <div key={friend.id} className="bg-white/50 backdrop-blur-[24px] rounded-2xl p-4 flex items-center gap-4 border border-white/30 hover:bg-white/60 transition-all">
                      <Link href={`/users/${friend.id}`} className="flex-shrink-0">
                        {friend.avatarUrl ? (
                          <img src={friend.avatarUrl} alt={friend.username} className="w-14 h-14 rounded-full object-cover ring-2 ring-white" />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-[#e9fdff] flex items-center justify-center ring-2 ring-white">
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
                          <p className="text-[12px] text-[#45474b]/60 truncate mt-0.5">{friend.bio}</p>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleStartChat(friend.id)}
                          className="w-10 h-10 rounded-full bg-[#e9fdff] flex items-center justify-center hover:bg-[#d4f5f8] transition-colors"
                          title="Message"
                        >
                          <span className="material-symbols-outlined text-[#2d666d] text-xl">chat</span>
                        </button>
                        <button
                          onClick={() => handleRemoveFriend(friend.id)}
                          disabled={actionLoading === friend.id}
                          className="w-10 h-10 rounded-full bg-[#ffdad6]/50 flex items-center justify-center hover:bg-[#ffdad6] transition-colors disabled:opacity-50"
                          title="Remove friend"
                        >
                          <span className="material-symbols-outlined text-[#ba1a1a] text-xl">person_remove</span>
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
                  <div className="animate-spin h-10 w-10 border-2 border-[#5d5e64] border-t-transparent rounded-full" />
                </div>
              ) : receivedRequests.length === 0 ? (
                <div className="bg-white/50 backdrop-blur-[24px] rounded-2xl p-12 text-center border border-white/30">
                  <span className="material-symbols-outlined text-5xl text-[#5d5e64] mb-4 block">inbox</span>
                  <p className="text-[#45474b] text-lg font-semibold">No pending requests</p>
                  <p className="text-[#45474b]/60 text-sm mt-2">Friend requests from others will appear here</p>
                </div>
              ) : (
                receivedRequests.map((req) => (
                  <div key={req.id} className="bg-white/50 backdrop-blur-[24px] rounded-2xl p-4 flex items-center gap-4 border border-white/30">
                    <Link href={`/users/${req.userId || req.id}`} className="flex-shrink-0">
                      {req.avatarUrl ? (
                        <img src={req.avatarUrl} alt={req.username} className="w-14 h-14 rounded-full object-cover ring-2 ring-white" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-[#ffd1dc]/50 flex items-center justify-center ring-2 ring-white">
                          <span className="text-[#78555e] font-bold text-lg">{req.username[0]?.toUpperCase()}</span>
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
                        className="px-4 py-2 rounded-full bg-[#2d666d] text-white text-[13px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {actionLoading === req.id ? '...' : 'Accept'}
                      </button>
                      <button
                        onClick={() => handleRejectRequest(req.id)}
                        disabled={actionLoading === req.id}
                        className="px-4 py-2 rounded-full bg-white/60 text-[#45474b] text-[13px] font-semibold hover:bg-white/80 transition-colors disabled:opacity-50 border border-white/40"
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
                  <div className="animate-spin h-10 w-10 border-2 border-[#5d5e64] border-t-transparent rounded-full" />
                </div>
              ) : sentRequests.length === 0 ? (
                <div className="bg-white/50 backdrop-blur-[24px] rounded-2xl p-12 text-center border border-white/30">
                  <span className="material-symbols-outlined text-5xl text-[#5d5e64] mb-4 block">send</span>
                  <p className="text-[#45474b] text-lg font-semibold">No sent requests</p>
                  <p className="text-[#45474b]/60 text-sm mt-2">Friend requests you send will appear here</p>
                </div>
              ) : (
                sentRequests.map((req) => (
                  <div key={req.id} className="bg-white/50 backdrop-blur-[24px] rounded-2xl p-4 flex items-center gap-4 border border-white/30">
                    <Link href={`/users/${req.userId || req.id}`} className="flex-shrink-0">
                      {req.avatarUrl ? (
                        <img src={req.avatarUrl} alt={req.username} className="w-14 h-14 rounded-full object-cover ring-2 ring-white" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-[#e5e2e1] flex items-center justify-center ring-2 ring-white">
                          <span className="text-[#5d5e64] font-bold text-lg">{req.username[0]?.toUpperCase()}</span>
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
                      className="px-4 py-2 rounded-full bg-white/60 text-[#ba1a1a] text-[13px] font-semibold hover:bg-[#ffdad6]/50 transition-colors disabled:opacity-50 border border-white/40"
                    >
                      {actionLoading === req.id ? '...' : 'Cancel'}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Find People Tab */}
          {activeTab === 'find' && (
            <div className="space-y-4">
              <div className="bg-white/50 backdrop-blur-[24px] rounded-full px-6 py-3 flex items-center gap-3 border border-white/30">
                <span className="material-symbols-outlined text-[#45474b]">search</span>
                <input
                  type="text"
                  placeholder="Filter by username or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-[#1c1b1b] placeholder:text-[#45474b]/50 text-[15px]"
                />
              </div>

              {searchQuery.length >= 2 && searchResults.length === 0 && (
                <div className="bg-white/50 backdrop-blur-[24px] rounded-2xl p-12 text-center border border-white/30">
                  <span className="material-symbols-outlined text-5xl text-[#5d5e64] mb-4 block">person_search</span>
                  <p className="text-[#45474b] text-lg font-semibold">No users found</p>
                  <p className="text-[#45474b]/60 text-sm mt-2">Try a different search term</p>
                </div>
              )}

              {!searchQuery && searchResults.length === 0 && (
                <div className="bg-white/50 backdrop-blur-[24px] rounded-2xl p-12 text-center border border-white/30">
                  <span className="material-symbols-outlined text-5xl text-[#5d5e64] mb-4 block">people</span>
                  <p className="text-[#45474b] text-lg font-semibold">No users available</p>
                </div>
              )}

              <div className="space-y-3">
                {searchResults.map((u) => (
                  <div key={u.id} className="bg-white/50 backdrop-blur-[24px] rounded-2xl p-4 flex items-center gap-4 border border-white/30 hover:bg-white/60 transition-all">
                    <Link href={`/users/${u.id}`} className="flex-shrink-0">
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt={u.username} className="w-14 h-14 rounded-full object-cover ring-2 ring-white" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-[#e9fdff] flex items-center justify-center ring-2 ring-white">
                          <span className="text-[#2d666d] font-bold text-lg">{u.username[0]?.toUpperCase()}</span>
                        </div>
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/users/${u.id}`}>
                        <h3 className="text-[15px] font-bold text-[#1c1b1b] truncate hover:underline">{u.fullName || u.username}</h3>
                      </Link>
                      <p className="text-[13px] text-[#45474b] truncate">@{u.username}</p>
                    </div>
                    <div className="flex-shrink-0">
                      {u.friendshipStatus === 'friends' ? (
                        <span className="px-4 py-2 rounded-full bg-[#e9fdff] text-[#2d666d] text-[13px] font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">check</span>
                          Friends
                        </span>
                      ) : u.friendshipStatus === 'request_sent' ? (
                        <span className="px-4 py-2 rounded-full bg-[#e5e2e1]/50 text-[#45474b] text-[13px] font-semibold">
                          Request Sent
                        </span>
                      ) : u.friendshipStatus === 'request_received' ? (
                        <span className="px-4 py-2 rounded-full bg-[#ffd1dc]/50 text-[#78555e] text-[13px] font-semibold">
                          Request Received
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSendRequest(u.id)}
                          disabled={actionLoading === u.id}
                          className="px-4 py-2 rounded-full bg-[#2d666d] text-white text-[13px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          {actionLoading === u.id ? '...' : 'Add Friend'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
