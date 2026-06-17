import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@/hooks/useSocket';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
  createdAt: string;
  senderName: string;
  senderAvatar: string | null;
}

interface Conversation {
  id: string;
  type: string;
  name: string | null;
  displayName: string | null;
  members: { id: string; username: string; fullName: string; avatarUrl: string; role: string }[];
}

export default function ChatDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { accessToken, isAuthenticated, user: authUser } = useAuthStore();
  const {
    isConnected,
    onlineUsers,
    joinConversation,
    leaveConversation,
    sendMessage: socketSend,
    startTyping,
    stopTyping,
    markRead,
    onMessage,
    onTypingStart,
    onTypingStop,
  } = useSocket();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const fetchConversation = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`${API_URL}/chat/conversations/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConversation(data);
      }
    } catch (err) {
      console.error('Failed to fetch conversation', err);
    }
  }, [id, accessToken]);

  const fetchMessages = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`${API_URL}/chat/conversations/${id}/messages?limit=100`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Failed to fetch messages', err);
    } finally {
      setLoading(false);
    }
  }, [id, accessToken]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      router.replace('/login');
      return;
    }
    fetchConversation();
    fetchMessages();
  }, [isAuthenticated, accessToken, router, id, fetchConversation, fetchMessages]);

  useEffect(() => {
    if (!id || !isConnected) return;

    joinConversation(id as string);

    const unsubMsg = onMessage((message: Message) => {
      if (message.conversationId === id) {
        setMessages((prev) => {
          if (prev.find((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
        scrollToBottom();
      }
    });

    const unsubTypingStart = onTypingStart((data: { userId: string; conversationId: string }) => {
      if (data.conversationId === id && data.userId !== authUser?.id) {
        setTypingUsers((prev) => new Set(prev).add(data.userId));
      }
    });

    const unsubTypingStop = onTypingStop((data: { userId: string; conversationId: string }) => {
      if (data.conversationId === id) {
        setTypingUsers((prev) => {
          const next = new Set(prev);
          next.delete(data.userId);
          return next;
        });
      }
    });

    return () => {
      leaveConversation(id as string);
      unsubMsg();
      unsubTypingStart();
      unsubTypingStop();
    };
  }, [id, isConnected, joinConversation, leaveConversation, onMessage, onTypingStart, onTypingStop, scrollToBottom, authUser?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async () => {
    if (!inputText.trim() || !id) return;
    setSending(true);
    try {
      socketSend({ conversationId: id as string, content: inputText.trim() });
      setInputText('');
      stopTyping(id as string);
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (id) {
      startTyping(id as string);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (id) stopTyping(id as string);
      }, 2000);
    }
  };

  const otherMember = conversation?.members?.find((m) => m.id !== authUser?.id);
  const displayName = conversation?.displayName || conversation?.name || otherMember?.fullName || otherMember?.username || 'Unknown';
  const isOnline = otherMember ? onlineUsers.has(otherMember.id) : false;
  const typingText = typingUsers.size > 0 ? `${Array.from(typingUsers).length} typing...` : '';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-aurora">
        <div className="animate-spin h-10 w-10 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dreamy Life - Chat with {displayName}</title>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </Head>

      <body className="bg-aurora min-h-screen text-on-surface antialiased overflow-hidden flex flex-col font-[\'Plus_Jakarta_Sans\',sans-serif]">
        {/* Header */}
        <header className="fixed top-0 w-full z-50 bg-surface/40 backdrop-blur-xl border-b border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
          <div className="flex justify-between items-center px-6 py-4 w-full md:max-w-[1280px] mx-auto">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/50 transition-colors text-primary active:scale-95">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>arrow_back</span>
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm bg-surface-container flex items-center justify-center">
                  {otherMember?.avatarUrl ? (
                    <img alt={displayName} className="w-full h-full object-cover" src={otherMember.avatarUrl} />
                  ) : (
                    <span className="text-primary font-bold">{displayName[0]?.toUpperCase()}</span>
                  )}
                </div>
                <div className="flex flex-col">
                  <h1 className="text-[20px] font-bold text-primary leading-tight">{displayName}</h1>
                  <span className="text-[12px] text-tertiary-fixed-dim font-semibold tracking-wide">
                    {typingText || (isOnline ? 'Online' : '')}
                  </span>
                </div>
              </div>
            </div>
            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/50 transition-colors text-primary active:scale-95">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>more_vert</span>
            </button>
          </div>
        </header>

        {/* Messages Area */}
        <main className="flex-1 overflow-y-auto pt-24 pb-[120px] px-4 md:px-6 no-scrollbar flex justify-center">
          <div className="w-full max-w-3xl flex flex-col gap-6 pt-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-20 h-20 rounded-full bg-white/40 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-4xl text-outline-variant">chat</span>
                </div>
                <p className="text-on-surface-variant text-lg">No messages yet. Say hello!</p>
              </div>
            )}

            {messages.map((msg, idx) => {
              const isSent = msg.senderId === authUser?.id;
              const showDateDivider =
                idx === 0 ||
                formatDate(msg.createdAt) !== formatDate(messages[idx - 1].createdAt);

              return (
                <div key={msg.id}>
                  {showDateDivider && (
                    <div className="flex justify-center my-2">
                      <span className="px-4 py-1.5 rounded-full glass-panel text-[12px] font-semibold text-on-surface-variant/70 tracking-widest uppercase shadow-sm">
                        {formatDate(msg.createdAt)}
                      </span>
                    </div>
                  )}
                  <div className={`flex items-end gap-2 max-w-[85%] md:max-w-[70%] ${isSent ? 'self-end' : 'self-start'}`}>
                    {!isSent && (
                      <div className="flex flex-col gap-1">
                        <div className="chat-bubble-received p-4 rounded-2xl rounded-bl-sm shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                          {msg.content && <p className="text-[16px] text-on-surface leading-relaxed">{msg.content}</p>}
                          {msg.mediaUrl && (
                            <div className="mt-2 rounded-xl overflow-hidden">
                              <img alt="Media" className="w-full max-w-[240px] h-auto object-cover" src={msg.mediaUrl} />
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] text-on-surface-variant/50 ml-1 font-semibold tracking-wider">{formatTime(msg.createdAt)}</span>
                      </div>
                    )}
                    {isSent && (
                      <div className="flex flex-col gap-1 items-end">
                        <div className="chat-bubble-sent p-4 rounded-2xl rounded-br-sm">
                          {msg.content && <p className="text-[16px] leading-relaxed">{msg.content}</p>}
                          {msg.mediaUrl && (
                            <div className="mt-2 rounded-xl overflow-hidden">
                              <img alt="Media" className="w-full max-w-[240px] h-auto object-cover" src={msg.mediaUrl} />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mr-1">
                          <span className="text-[11px] text-on-surface-variant/50 font-semibold tracking-wider">{formatTime(msg.createdAt)}</span>
                          <span className="material-symbols-outlined text-[14px] text-tertiary-fixed-dim" style={{ fontVariationSettings: "'FILL' 0" }}>done_all</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* Input Area */}
        <div className="fixed bottom-0 w-full z-50 glass-panel border-t border-white/30 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] rounded-t-xl">
          <div className="max-w-3xl mx-auto px-4 py-3 pb-safe flex items-end gap-3">
            <div className="flex gap-1 mb-1">
              <button className="w-10 h-10 rounded-full flex items-center justify-center text-primary hover:bg-white/50 transition-colors active:scale-95">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>add_circle</span>
              </button>
              <button className="w-10 h-10 rounded-full flex items-center justify-center text-primary hover:bg-white/50 transition-colors active:scale-95 hidden sm:flex">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>photo_camera</span>
              </button>
            </div>
            <div className="flex-1 relative bg-surface-container-lowest/80 rounded-full border border-white/60 shadow-inner overflow-hidden focus-within:ring-2 focus-within:ring-tertiary/20 transition-shadow">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="w-full bg-transparent border-none py-3.5 pl-5 pr-12 text-on-surface text-[16px] focus:ring-0 placeholder:text-on-surface-variant/40 outline-none"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-on-surface-variant/50 hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>sentiment_satisfied</span>
              </button>
            </div>
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || sending}
              className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-[0_8px_16px_rgba(93,94,100,0.2)] hover:bg-surface-tint transition-all active:scale-95 disabled:opacity-50 shrink-0 mb-0.5"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
            </button>
          </div>
        </div>
      </body>
    </>
  );
}
