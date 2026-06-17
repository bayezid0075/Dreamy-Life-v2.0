export interface CreateConversationDto {
  type: 'direct' | 'group';
  name?: string;
  memberIds: string[];
  avatarUrl?: string;
}

export interface SendMessageDto {
  content?: string;
  mediaUrl?: string;
  mediaType?: string;
  replyTo?: string;
}

export interface ConversationListResponse {
  conversations: any[];
  total: number;
}

export interface MessageListResponse {
  messages: any[];
  total: number;
  page: number;
  limit: number;
}
