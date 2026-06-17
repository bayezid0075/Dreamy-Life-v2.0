'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface GroupConversation {
  id: string;
  name: string;
  avatarUrl: string | null;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
  lastMessage: {
    content: string;
    senderName: string;
    createdAt: string;
  } | null;
}

export default function MessagesPage() {
  const [groups, setGroups] = useState<GroupConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<GroupConversation | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    fetch(`${API_URL}/admin/chat/groups`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setGroups(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const viewGroup = async (group: GroupConversation) => {
    setSelectedGroup(group);
    setMessagesLoading(true);
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`${API_URL}/admin/chat/groups/${group.id}/messages?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Failed to fetch messages', err);
    } finally {
      setMessagesLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-on-surface">Messages</h1>
        <p className="text-on-surface-variant mt-1">View and monitor group conversations</p>
      </div>

      <div className="flex gap-6">
        {/* Group List */}
        <div className={`${selectedGroup ? 'hidden lg:block' : ''} w-full lg:w-1/3`}>
          <div className="bg-white rounded-xl border border-outline-variant overflow-hidden">
            <div className="p-4 border-b border-outline-variant">
              <h2 className="font-semibold text-on-surface">Group Conversations ({groups.length})</h2>
            </div>
            {groups.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant">No group conversations yet.</div>
            ) : (
              <div className="divide-y divide-outline-variant">
                {groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => viewGroup(group)}
                    className={`w-full p-4 text-left hover:bg-surface-variant/30 transition-colors ${
                      selectedGroup?.id === group.id ? 'bg-primary-container/20' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold">
                        {group.name?.[0]?.toUpperCase() || 'G'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-on-surface truncate">{group.name}</h3>
                        <p className="text-xs text-on-surface-variant">{group.memberCount} members</p>
                        {group.lastMessage && (
                          <p className="text-xs text-on-surface-variant truncate mt-1">
                            {group.lastMessage.senderName}: {group.lastMessage.content || '📎 Media'}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Message Detail */}
        <div className={`${selectedGroup ? '' : 'hidden lg:block'} flex-1`}>
          {selectedGroup ? (
            <div className="bg-white rounded-xl border border-outline-variant overflow-hidden h-[calc(100vh-200px)]">
              <div className="p-4 border-b border-outline-variant">
                <h2 className="font-semibold text-on-surface">{selectedGroup.name}</h2>
                <p className="text-xs text-on-surface-variant">{selectedGroup.memberCount} members</p>
              </div>
              <div className="p-4 overflow-y-auto h-[calc(100%-60px)]">
                {messagesLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-on-surface-variant">No messages yet.</div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg: any) => (
                      <div key={msg.id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                          {msg.senderName?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-on-surface">{msg.senderName}</span>
                            <span className="text-xs text-on-surface-variant">
                              {new Date(msg.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-on-surface mt-0.5">{msg.content || '📎 Media'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-outline-variant h-[calc(100vh-200px)] flex items-center justify-center text-center p-8">
              <div>
                <span className="material-symbols-outlined text-6xl text-on-surface-variant block mb-4">chat</span>
                <h2 className="text-xl font-semibold text-on-surface mb-2">Select a group</h2>
                <p className="text-on-surface-variant">Choose a group conversation to view its messages.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
