export interface Notification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  type: 'broadcast' | 'targeted';
  status: 'draft' | 'scheduled' | 'sent';
  scheduledAt?: string;
  sentAt?: string;
  totalRecipients: number;
  totalSent: number;
  totalRead: number;
  createdBy?: string;
  createdAt: string;
}

export interface NotificationRecipient {
  id: string;
  notificationId: string;
  userId: string;
  sent: boolean;
  read: boolean;
  sentAt?: string;
  readAt?: string;
}

export interface PushToken {
  id: string;
  userId: string;
  token: string;
  platform: 'web' | 'android' | 'ios';
  createdAt: string;
  updatedAt: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  body: string;
  icon?: string;
  createdBy?: string;
  createdAt: string;
}

export interface UserNotification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  type: string;
  sentAt?: string;
  createdAt: string;
  read: boolean;
  readAt?: string;
  recipientId: string;
}

export interface NotificationListResponse {
  items: Notification[];
  total: number;
  page: number;
  limit: number;
}

export interface UserNotificationListResponse {
  items: UserNotification[];
  unreadCount: number;
  page: number;
  limit: number;
}

export interface NotificationStats {
  totalNotifications: number;
  totalSent: number;
  totalRead: number;
}

export interface DeliveryStats {
  sent: number;
  read: number;
}
