import api from '@dreamy-life/api-client';

export interface Post {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  likesCount: number;
}

export const getFeed = async (): Promise<Post[]> => {
  const response = await api.get('/feed');
  return response.data;
};

export const getPost = async (id: string): Promise<Post> => {
  const response = await api.get(`/posts/${id}`);
  return response.data;
};
