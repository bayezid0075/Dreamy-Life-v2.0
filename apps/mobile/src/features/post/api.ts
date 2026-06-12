import api from '@dreamy-life/api-client';

export const createPost = async (data: { content: string; mediaIds?: string[] }) => {
  const response = await api.post('/posts', data);
  return response.data;
};

export const deletePost = async (id: string) => {
  await api.delete(`/posts/${id}`);
};

export const likePost = async (id: string) => {
  const response = await api.post(`/posts/${id}/like`);
  return response.data;
};
