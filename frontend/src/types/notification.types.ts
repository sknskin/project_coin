export type NotificationType =
  | 'SYSTEM'
  | 'PRICE_ALERT'
  | 'PORTFOLIO'
  | 'CHAT'
  | 'ANNOUNCEMENT';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: {
    marketCode?: string;
    conversationId?: string;
    messageId?: string;
    userId?: string;
    announcementId?: string;
    type?: string;
    [key: string]: unknown;
  };
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
}
