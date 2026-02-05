import api from './client';
import type {
  RealTimeStats,
  DailyStatistics,
  DateRangeStats,
  StatsPeriod,
  AnnouncementStatsItem,
  AnnouncementTotals,
  ChatStatsItem,
  ChatTotals,
  UserDetailStats,
  NotificationStatsItem,
} from '../types/statistics.types';

export const statisticsApi = {
  getRealTime: () => api.get<RealTimeStats>('/statistics/realtime'),

  getHistorical: (startDate: Date, endDate: Date) =>
    api.get<DailyStatistics[]>('/statistics/historical', {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    }),

  getHistoricalByPeriod: (startDate: Date, endDate: Date, period: StatsPeriod) =>
    api.get<DailyStatistics[]>('/statistics/historical/period', {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        period,
      },
    }),

  getLoginStats: (startDate: Date, endDate: Date) =>
    api.get<DateRangeStats[]>('/statistics/logins', {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    }),

  getRegistrationStats: (startDate: Date, endDate: Date) =>
    api.get<DateRangeStats[]>('/statistics/registrations', {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    }),

  getAnnouncementStats: (startDate: Date, endDate: Date, period: StatsPeriod) =>
    api.get<AnnouncementStatsItem[]>('/statistics/announcements', {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        period,
      },
    }),

  getAnnouncementTotals: () =>
    api.get<AnnouncementTotals>('/statistics/announcements/totals'),

  getChatStats: (startDate: Date, endDate: Date, period: StatsPeriod) =>
    api.get<ChatStatsItem[]>('/statistics/chat', {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        period,
      },
    }),

  getChatTotals: () => api.get<ChatTotals>('/statistics/chat/totals'),

  getUserDetailStats: () =>
    api.get<UserDetailStats>('/statistics/users/detail'),

  getNotificationStats: (startDate: Date, endDate: Date, period: StatsPeriod) =>
    api.get<NotificationStatsItem[]>('/statistics/notifications', {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        period,
      },
    }),

  trackVisitor: (sessionId: string) =>
    api.post('/statistics/track', { sessionId }),
};
