export interface CreatePostDto {
  content: string;
  mediaIds?: string[];
}

export interface UpdatePostDto {
  content?: string;
}

export interface PostResponseDto {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  mediaUrls?: string[];
  likesCount: number;
  commentsCount: number;
  createdAt: string;
}

export interface PostListResponseDto {
  posts: PostResponseDto[];
  total: number;
  page: number;
  limit: number;
}

export interface FriendRequestDto {
  userId: string;
}

export interface FriendDto {
  friendId: string;
}

export interface FriendListResponse {
  friends: any[];
  total: number;
}

export interface FriendRequestListResponse {
  requests: any[];
  total: number;
}

export interface FriendshipStatusResponse {
  status: 'self' | 'friends' | 'request_sent' | 'request_received' | 'none';
}
