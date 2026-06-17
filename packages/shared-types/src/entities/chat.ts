export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name: string | null;
  avatarUrl: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationMember {
  id: string;
  conversationId: string;
  userId: string;
  role: 'admin' | 'member';
  lastReadAt: Date | null;
  joinedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
  replyTo: string | null;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageRead {
  id: string;
  messageId: string;
  userId: string;
  readAt: Date;
}

export interface ChatUser {
  id: string;
  username: string;
  avatarUrl: string | null;
  fullName: string | null;
  isOnline: boolean;
}

export interface ConversationWithDetails extends Conversation {
  members: ChatUser[];
  lastMessage: Message | null;
  unreadCount: number;
}

export interface MessageWithSender extends Message {
  senderName: string;
  senderAvatar: string | null;
}
