const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  imageUrl?: string;
  link?: string;
  type: string;
  category?: string;
  status: string;
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
  totalRecipients: number;
  totalRead: number;
}

export interface NotificationListResponse {
  items: Notification[];
  total: number;
  page: number;
  limit: number;
}

export interface NotificationStats {
  totalNotifications: number;
  sentNotifications: number;
  draftNotifications: number;
  scheduledNotifications: number;
  totalRecipients: number;
  totalRead: number;
  readRate: number;
}

export interface CreateNotificationInput {
  title: string;
  body: string;
  icon?: string;
  imageUrl?: string;
  link?: string;
  type?: string;
  category?: string;
  scheduledAt?: string;
}

export async function uploadMedia(file: File): Promise<string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_URL}/media/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to upload media');
  const data = await res.json();
  return data.url || data.data?.url;
}

export async function createNotification(input: CreateNotificationInput): Promise<Notification> {
  const res = await fetch(`${API_URL}/admin/notifications`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('Failed to create notification');
  const data = await res.json();
  return data.notification || data;
}

export async function sendNotification(id: string): Promise<Notification> {
  const res = await fetch(`${API_URL}/admin/notifications/${id}/send`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to send notification');
  return res.json();
}

export async function deleteNotification(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/admin/notifications/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete notification');
}

export async function getNotifications(params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<NotificationListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.status) searchParams.set('status', params.status);

  const res = await fetch(`${API_URL}/admin/notifications?${searchParams.toString()}`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json();
}

export async function getNotificationStats(): Promise<NotificationStats> {
  const res = await fetch(`${API_URL}/admin/notifications/stats`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}
