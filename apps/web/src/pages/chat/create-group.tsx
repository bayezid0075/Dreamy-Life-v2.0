import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface User {
  id: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  level?: number;
}

export default function CreateGroupPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated } = useAuthStore();
  const [groupName, setGroupName] = useState('');
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [downlineUsers, setDownlineUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'downline'>('search');
  const [error, setError] = useState<string | null>(null);
  const [downlineError, setDownlineError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

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
        setDownlineUsers(data.filter((u: User) => !selectedUsers.find((s) => s.id === u.id)));
        setDownlineError(null);
      } else {
        setDownlineError('Failed to load downline members');
      }
    } catch (err) {
      console.error('Failed to fetch downline users', err);
      setDownlineError('Network error. Please try again.');
    }
  }, [accessToken, selectedUsers]);

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
    setError(null);
    try {
      const res = await fetch(`${API_URL}/chat/users/search?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.filter((u: User) => !selectedUsers.find((s) => s.id === u.id)));
      } else {
        setError('Failed to search users');
      }
    } catch (err) {
      console.error('Failed to search users', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [accessToken, selectedUsers]);

  useEffect(() => {
    const timer = setTimeout(() => searchUsers(query), 300);
    return () => clearTimeout(timer);
  }, [query, searchUsers]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10MB');
      return;
    }
    setUploadingAvatar(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_URL}/media/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setAvatarUrl(data.url);
        setAvatarPreview(URL.createObjectURL(file));
      } else {
        setError('Failed to upload image');
      }
    } catch (err) {
      console.error('Failed to upload avatar', err);
      setError('Network error uploading image');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const addMember = (user: User) => {
    setSelectedUsers((prev) => [...prev, user]);
    setQuery('');
    setUsers([]);
    setError(null);
  };

  const removeMember = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const createGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) return;
    setCreating(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        name: groupName.trim(),
        memberIds: selectedUsers.map((u) => u.id),
      };
      if (avatarUrl) body.avatarUrl = avatarUrl;

      const res = await fetch(`${API_URL}/chat/conversations/group`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/chat/${data.id}`);
      } else {
        const errData = await res.json().catch(() => null);
        setError(errData?.message || 'Failed to create group');
      }
    } catch (err) {
      console.error('Failed to create group', err);
      setError('Network error. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const displayUsers = activeTab === 'search' ? users : downlineUsers;

  return (
    <>
      <Head>
        <title>Dreamy Life - Create Group</title>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </Head>

      <body className="bg-aurora text-on-surface min-h-screen font-[\'Plus_Jakarta_Sans\',sans-serif] antialiased">
        <header className="fixed top-0 w-full z-50 bg-white/40 backdrop-blur-xl border-b border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
          <div className="flex justify-between items-center px-6 h-16 w-full max-w-[1280px] mx-auto">
            <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors text-primary active:scale-95">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 className="text-[24px] font-bold text-on-surface tracking-tight">Create Group</h1>
            <button
              onClick={createGroup}
              disabled={!groupName.trim() || selectedUsers.length === 0 || creating}
              className="text-[14px] font-semibold text-tertiary hover:opacity-80 transition-opacity disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </header>

        <main className="pt-24 px-4 md:px-6 max-w-2xl mx-auto">
          {/* Error Toast */}
          {error && (
            <div className="mb-4 flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-600 text-[14px] font-medium">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span className="flex-1">{error}</span>
              <button onClick={() => setError(null)} className="hover:opacity-70 transition-opacity">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          )}

          {/* Group Avatar + Name */}
          <div className="glass-panel rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-5 mb-4">
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white/60 bg-surface-container flex items-center justify-center flex-shrink-0 hover:ring-2 hover:ring-tertiary/30 transition-all group"
                disabled={uploadingAvatar}
              >
                {avatarPreview ? (
                  <img alt="Group avatar" className="w-full h-full object-cover" src={avatarPreview} />
                ) : (
                  <span className="material-symbols-outlined text-3xl text-primary/60">group</span>
                )}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploadingAvatar ? (
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <span className="material-symbols-outlined text-white text-xl">photo_camera</span>
                  )}
                </div>
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <div className="flex-1">
                <label className="block text-[14px] font-semibold text-on-surface-variant mb-2">Group Name</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name..."
                  className="w-full bg-surface-container-lowest/80 border border-white/40 rounded-xl px-4 py-3 text-[16px] text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-tertiary/30"
                />
              </div>
            </div>
          </div>

          {/* Selected Members */}
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {selectedUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-2 glass-panel rounded-full px-3 py-1.5">
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-surface-container flex items-center justify-center flex-shrink-0">
                    {user.avatarUrl ? (
                      <img alt={user.username} className="w-full h-full object-cover" src={user.avatarUrl} />
                    ) : (
                      <span className="text-primary text-[10px] font-bold">{user.username[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <span className="text-[13px] font-semibold text-on-surface">{user.fullName || user.username}</span>
                  <button onClick={() => removeMember(user.id)} className="text-on-surface-variant hover:text-error transition-colors">
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Search Input */}
          <div className="glass-panel rounded-full px-4 py-3 flex items-center gap-3 focus-within:ring-2 focus-within:ring-tertiary-fixed-dim/50 transition-all mb-4">
            <span className="material-symbols-outlined text-outline">search</span>
            <input
              type="text"
              placeholder="Search users to add..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setError(null);
                if (e.target.value.length >= 2) setActiveTab('search');
              }}
              className="bg-transparent border-none outline-none w-full text-on-surface placeholder:text-outline-variant text-[16px] p-0"
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
            <div className="flex justify-center py-4">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          )}

          <div className="flex flex-col gap-3">
            {displayUsers.map((user) => (
              <div
                key={user.id}
                className="glass-panel rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:bg-white/60 transition-colors"
                onClick={() => addMember(user)}
              >
                <div className="w-12 h-12 rounded-full overflow-hidden border border-white/40 bg-surface-container flex items-center justify-center flex-shrink-0">
                  {user.avatarUrl ? (
                    <img alt={user.username} className="w-full h-full object-cover" src={user.avatarUrl} />
                  ) : (
                    <span className="text-primary font-bold">{user.username[0]?.toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[14px] font-semibold text-on-surface truncate">{user.fullName || user.username}</h3>
                  <p className="text-[13px] text-on-surface-variant truncate">
                    @{user.username}
                    {user.level && <span className="ml-2 text-tertiary text-[11px] font-semibold">Level {user.level}</span>}
                  </p>
                </div>
                <span className="material-symbols-outlined text-tertiary">add_circle</span>
              </div>
            ))}
          </div>

          {/* Empty states */}
          {selectedUsers.length === 0 && query.length < 2 && activeTab === 'search' && (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-5xl text-outline-variant mb-4 block">group_add</span>
              <p className="text-on-surface-variant">Search and add members to your group</p>
            </div>
          )}

          {activeTab === 'downline' && downlineError && (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-5xl text-red-400 mb-4 block">error</span>
              <p className="text-red-500 mb-3">{downlineError}</p>
              <button
                onClick={fetchDownline}
                className="px-4 py-2 rounded-full bg-primary text-on-primary text-[14px] font-semibold hover:opacity-90 transition-opacity"
              >
                Retry
              </button>
            </div>
          )}

          {activeTab === 'downline' && !downlineError && downlineUsers.length === 0 && (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-5xl text-outline-variant mb-4 block">group</span>
              <p className="text-on-surface-variant">No downline members yet.</p>
            </div>
          )}
        </main>
      </body>
    </>
  );
}
