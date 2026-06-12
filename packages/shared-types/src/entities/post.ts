export interface Post {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  mediaUrls?: string[];
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PostCreateInput {
  content: string;
  mediaIds?: string[];
}

export interface PostLike {
  id: string;
  postId: string;
  userId: string;
  createdAt: string;
}
