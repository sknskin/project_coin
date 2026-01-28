import apiClient from './client';
import type { NotificationResponse } from '../types/notification.types';

export const notificationApi = {
  getNotifications: (page = 1, limit = 20) =>
    apiClient.get<NotificationResponse>('/notifications', {
      params: { page, limit },
    }),

  getUnreadCount: () =>
    apiClient.get<number>('/notifications/unread-count'),

  markAsRead: (id: string) =>
    apiClient.patch(`/notifications/${id}/read`),

  markAllAsRead: () =>
    apiClient.patch('/notifications/read-all'),

  delete: (id: string) =>
    apiClient.delete(`/notifications/${id}`),
};
