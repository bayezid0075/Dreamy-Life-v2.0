import api from '@dreamy-life/api-client';

export interface ModeratedPost {
  id: string;
  content: string;
  authorName: string;
  reportedCount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export const getPendingPosts = async (): Promise<ModeratedPost[]> => {
  const response = await api.get('/admin/moderation/posts');
  return response.data;
};

export const approvePost = async (id: string): Promise<void> => {
  await api.post(`/admin/moderation/posts/${id}/approve`);
};

export const rejectPost = async (id: string): Promise<void> => {
  await api.post(`/admin/moderation/posts/${id}/reject`);
};
