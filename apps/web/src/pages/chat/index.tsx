import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@/hooks/useSocket';
import AuthGuard from '@/shared/components/AuthGuard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHr < 24) return `${diffHr}h`;
  if (diffDay < 7) return `${diffDay}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface Conversation {
  id: string;
  type: string;
  name: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  members: { id: string; username: string; fullName: string; avatarUrl: string }[];
  lastMessage: {
    content: string;
    senderName: string;
    createdAt: string;
  } | null;
  unreadCount: number;
  updatedAt: string;
}

interface OnlineUser {
  id: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
}

export default function ChatPage() {
  const router = useRouter();
  const { accessToken, user: authUser } = useAuthStore();
  const { isConnected, onlineUsers, onMessage, onConversationCreated } = useSocket();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlineFriends, setOnlineFriends] = useState<OnlineUser[]>([]);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/chat/conversations`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
        const uniqueOnline = new Map<string, OnlineUser>();
        data.forEach((conv: Conversation) => {
          conv.members?.forEach((m) => {
            if (m.id !== authUser?.id && onlineUsers.has(m.id) && !uniqueOnline.has(m.id)) {
              uniqueOnline.set(m.id, { id: m.id, username: m.username, fullName: m.fullName, avatarUrl: m.avatarUrl });
            }
          });
        });
        setOnlineFriends(Array.from(uniqueOnline.values()));
      }
    } catch (err) {
      console.error('Failed to fetch conversations', err);
    } finally {
      setLoading(false);
    }
  }, [accessToken, authUser?.id, onlineUsers]);

  useEffect(() => {
    if (!accessToken) return;
    fetchConversations();
  }, [accessToken, fetchConversations]);

  useEffect(() => {
    const unsubMessage = onMessage((message: any) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === message.conversationId
            ? {
                ...conv,
                lastMessage: {
                  content: message.content,
                  senderName: message.senderName,
                  createdAt: message.createdAt,
                },
                updatedAt: message.createdAt,
                unreadCount: conv.id === router.query.id ? 0 : conv.unreadCount + 1,
              }
            : conv,
        ),
      );
    });

    const unsubCreated = onConversationCreated((conversation: any) => {
      setConversations((prev) => {
        if (prev.find((c) => c.id === conversation.id)) return prev;
        return [conversation, ...prev];
      });
    });

    return () => {
      unsubMessage();
      unsubCreated();
    };
  }, [onMessage, onConversationCreated, router.query.id]);

  const filteredConversations = conversations.filter((conv) =>
    conv.displayName?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-aurora">
        <div className="animate-spin h-10 w-10 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <AuthGuard>
      <Head>
        <title>Dreamy Life - Messages</title>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </Head>

      <body className="bg-aurora text-on-surface min-h-screen font-[\'Plus_Jakarta_Sans\',sans-serif] antialiased pb-24 md:pb-0 relative overflow-x-hidden">
        {/* TopAppBar */}
        <header className="fixed top-0 w-full z-50 bg-white/40 backdrop-blur-xl border-b border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
          <div className="flex justify-between items-center px-6 h-16 w-full max-w-[1280px] mx-auto">
            <Link href="/social/profile" className="flex items-center hover:bg-white/20 transition-colors rounded-full p-1 cursor-pointer active:scale-95 duration-200">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-white/40 bg-surface-container flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-xl">person</span>
              </div>
            </Link>
            <h1 className="text-[24px] font-bold text-on-surface tracking-tight">Messages</h1>
            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors text-primary active:scale-95 duration-200">
              <span className="material-symbols-outlined">search</span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="pt-[calc(64px+env(safe-area-inset-top))] px-4 md:px-6 max-w-[1280px] mx-auto min-h-screen flex flex-col md:flex-row gap-6">
          {/* Left Sidebar / Mobile Main */}
          <div className="w-full md:w-1/3 lg:w-1/4 flex flex-col gap-6 pt-6">
            {/* Search Input */}
            <div className="glass-panel rounded-full px-4 py-3 flex items-center gap-3 focus-within:ring-2 focus-within:ring-tertiary-fixed-dim/50 transition-all">
              <span className="material-symbols-outlined text-outline">search</span>
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-on-surface placeholder:text-outline-variant text-[16px] p-0"
              />
            </div>

            {/* Active Now / Stories Bar */}
            <div className="w-full overflow-x-auto hide-scrollbar pb-2">
              <div className="flex gap-4 w-max px-2">
                {/* Add Story */}
                <Link href="/chat/create-group" className="flex flex-col items-center gap-2 cursor-pointer group">
                  <div className="w-16 h-16 rounded-full glass-panel flex items-center justify-center text-primary group-hover:bg-white/60 transition-colors">
                    <span className="material-symbols-outlined">add</span>
                  </div>
                  <span className="text-[14px] font-semibold text-on-surface-variant">New Group</span>
                </Link>
                <Link href="/chat/people" className="flex flex-col items-center gap-2 cursor-pointer group">
                  <div className="w-16 h-16 rounded-full glass-panel flex items-center justify-center text-tertiary group-hover:bg-white/60 transition-colors">
                    <span className="material-symbols-outlined">group</span>
                  </div>
                  <span className="text-[14px] font-semibold text-on-surface-variant">People</span>
                </Link>
                {/* Online Users with Aurora Border */}
                {onlineFriends.map((user) => (
                  <Link key={user.id} href={`/chat/people`} className="flex flex-col items-center gap-2 cursor-pointer">
                    <div className="aurora-border rounded-full">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white relative z-10 bg-surface">
                        {user.avatarUrl ? (
                          <img alt={user.fullName || user.username} className="w-full h-full object-cover" src={user.avatarUrl} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-primary font-bold text-lg">
                            {(user.fullName || user.username)?.[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-[14px] font-semibold text-on-surface">{user.fullName || user.username}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Chat List */}
            <div className="flex flex-col gap-3 pb-8">
              {filteredConversations.length === 0 && (
                <div className="glass-panel rounded-2xl p-12 text-center">
                  <span className="material-symbols-outlined text-5xl text-outline-variant mb-4 block">chat</span>
                  <p className="text-on-surface-variant text-lg">No conversations yet.</p>
                  <Link href="/chat/people" className="mt-4 inline-block text-[14px] font-semibold text-tertiary hover:underline">
                    Start a conversation
                  </Link>
                </div>
              )}

              {filteredConversations.map((conv) => {
                const otherMember = conv.members?.find((m) => m.id !== authUser?.id);
                const isOnline = otherMember ? onlineUsers.has(otherMember.id) : false;
                const displayName = conv.displayName || conv.name || 'Unknown';
                const avatarUrl = conv.avatarUrl || otherMember?.avatarUrl;
                const lastMsg = conv.lastMessage;

                return (
                  <Link
                    key={conv.id}
                    href={`/chat/${conv.id}`}
                    className={`glass-panel rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:bg-white/60 transition-colors ${
                      conv.unreadCount === 0 ? 'opacity-90' : ''
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-14 h-14 rounded-full overflow-hidden border border-white/40 bg-surface-container flex items-center justify-center">
                        {avatarUrl ? (
                          <img alt={displayName} className="w-full h-full object-cover" src={avatarUrl} />
                        ) : (
                          <span className="text-primary font-bold text-lg">{displayName[0]?.toUpperCase()}</span>
                        )}
                      </div>
                      {isOnline && (
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-tertiary-fixed rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className="text-[14px] font-semibold text-on-surface truncate">{displayName}</h3>
                        {lastMsg && (
                          <span className={`text-xs font-semibold ${conv.unreadCount > 0 ? 'text-tertiary' : 'text-outline'}`}>
                            {getTimeAgo(lastMsg.createdAt)}
                          </span>
                        )}
                      </div>
                      <p className={`text-[16px] truncate ${conv.unreadCount > 0 ? 'text-on-surface font-semibold' : 'text-outline'}`}>
                        {lastMsg ? (
                          <>
                            {conv.type === 'group' && <span>{lastMsg.senderName}: </span>}
                            {lastMsg.content || '📷 Photo'}
                          </>
                        ) : (
                          'No messages yet'
                        )}
                      </p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <div className="w-3 h-3 bg-tertiary rounded-full flex-shrink-0 shadow-[0_0_8px_rgba(45,102,109,0.5)]" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Desktop Placeholder */}
          <div className="hidden md:flex flex-1 glass-panel rounded-xl my-6 flex-col items-center justify-center text-center p-8">
            <div className="w-32 h-32 rounded-full bg-white/40 flex items-center justify-center mb-6 shadow-inner">
              <span className="material-symbols-outlined text-6xl text-outline-variant" style={{ fontVariationSettings: "'FILL' 0" }}>chat</span>
            </div>
            <h2 className="text-[32px] font-bold text-on-surface mb-2">Select a message</h2>
            <p className="text-[18px] text-outline max-w-md">Choose from your existing conversations, or start a new one to connect with your network.</p>
          </div>
        </main>

        {/* BottomNavBar */}
        <nav className="md:hidden fixed bottom-0 w-full z-50 rounded-t-lg bg-white/40 backdrop-blur-xl border-t border-white/30 shadow-[0_-10px_40px_rgba(0,0,0,0.04)]">
          <div className="flex justify-around items-center h-20 px-4 w-full">
            {/* Chats (Active) */}
            <Link href="/chat" className="flex flex-col items-center justify-center bg-primary text-on-primary rounded-full px-4 py-1 active:scale-90 transition-transform duration-200">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
              <span className="text-[10px] font-semibold mt-1">Chats</span>
            </Link>
            {/* Calls */}
            <Link href="/chat/calls" className="flex flex-col items-center justify-center text-on-surface-variant hover:opacity-80 transition-opacity active:scale-90 transition-transform duration-200">
              <span className="material-symbols-outlined">call</span>
              <span className="text-[10px] font-semibold mt-1">Calls</span>
            </Link>
            {/* People */}
            <Link href="/chat/people" className="flex flex-col items-center justify-center text-on-surface-variant hover:opacity-80 transition-opacity active:scale-90 transition-transform duration-200">
              <span className="material-symbols-outlined">group</span>
              <span className="text-[10px] font-semibold mt-1">People</span>
            </Link>
            {/* Stories */}
            <Link href="/chat/stories" className="flex flex-col items-center justify-center text-on-surface-variant hover:opacity-80 transition-opacity active:scale-90 transition-transform duration-200">
              <span className="material-symbols-outlined">amp_stories</span>
              <span className="text-[10px] font-semibold mt-1">Stories</span>
            </Link>
          </div>
        </nav>
      </body>
    </AuthGuard>
  );
}
