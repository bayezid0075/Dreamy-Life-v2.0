const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4080';

export async function fetchConversations(token: string) {
  const res = await fetch(`${API_URL}/chat/conversations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch conversations');
  return res.json();
}

export async function fetchMessages(token: string, conversationId: string, page = 1) {
  const res = await fetch(`${API_URL}/chat/conversations/${conversationId}/messages?page=${page}&limit=50`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch messages');
  return res.json();
}

export async function createConversation(token: string, data: { type: string; memberIds: string[]; name?: string }) {
  const res = await fetch(`${API_URL}/chat/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create conversation');
  return res.json();
}

export async function createGroupConversation(token: string, data: { name: string; memberIds: string[] }) {
  const res = await fetch(`${API_URL}/chat/conversations/group`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create group');
  return res.json();
}

export async function searchUsers(token: string, query: string) {
  const res = await fetch(`${API_URL}/chat/users/search?q=${encodeURIComponent(query)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to search users');
  return res.json();
}

export async function fetchDownlineUsers(token: string) {
  const res = await fetch(`${API_URL}/chat/downline-users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch downline users');
  return res.json();
}

export async function fetchConversationById(token: string, conversationId: string) {
  const res = await fetch(`${API_URL}/chat/conversations/${conversationId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch conversation');
  return res.json();
}
