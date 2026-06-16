const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface SocialStats {
  totalPosts: number;
  totalComments: number;
  totalLikes: number;
  totalFollows: number;
  totalUsers: number;
  activeUsers: number;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  mediaUrls: string[];
  likesCount: number;
  commentsCount: number;
  createdAt: string;
}

export interface PostListResponse {
  items: Post[];
  total: number;
  page: number;
  limit: number;
}

export async function getSocialStats(): Promise<SocialStats> {
  const res = await fetch(`${API_URL}/admin/social/stats`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch social stats');
  return res.json();
}

export async function getAdminPosts(params?: {
  page?: number;
  limit?: number;
}): Promise<PostListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));

  const res = await fetch(`${API_URL}/admin/social/posts?${searchParams.toString()}`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch posts');
  return res.json();
}

export async function deletePost(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/admin/social/posts/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete post');
}
