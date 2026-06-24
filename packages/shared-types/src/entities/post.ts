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

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface FriendRequestWithUser {
  id: string;
  userId: string;
  username: string;
  fullName?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Friend {
  id: string;
  userId: string;
  friendId: string;
  createdAt: string;
}

export interface FriendWithUser {
  id: string;
  friendId: string;
  username: string;
  fullName?: string;
  avatarUrl?: string;
  bio?: string;
  memberStatus?: string;
  createdAt: string;
}

export type FriendshipStatus = 'self' | 'friends' | 'request_sent' | 'request_received' | 'none';
