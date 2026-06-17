const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function fetchGroupConversations(token: string) {
  const res = await fetch(`${API_URL}/admin/chat/groups`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch groups');
  return res.json();
}

export async function fetchGroupMessages(token: string, groupId: string, page = 1) {
  const res = await fetch(`${API_URL}/admin/chat/groups/${groupId}/messages?page=${page}&limit=50`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch messages');
  return res.json();
}

export async function fetchGroupDetail(token: string, groupId: string) {
  const res = await fetch(`${API_URL}/admin/chat/groups/${groupId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch group detail');
  return res.json();
}
