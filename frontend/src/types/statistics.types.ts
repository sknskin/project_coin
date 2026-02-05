export interface RealTimeStats {
  activeVisitors: number;
  todayVisitors: number;
  todayLogins: number;
  todayRegistrations: number;
  todayPageViews: number;
  totalUsers: number;
  todayAnnouncements: number;
  todayComments: number;
  todayMessages: number;
}

export interface DailyStatistics {
  id: string;
  date: string;
  visitorCount: number;
  loginCount: number;
  registerCount: number;
  pageViewCount: number;
  activeUserCount: number;
  newAnnouncementCount: number;
  announcementCommentCount: number;
  announcementLikeCount: number;
  messageCount: number;
  activeConversationCount: number;
  notificationCount: number;
  notificationReadCount: number;
}

export interface DateRangeStats {
  date: string;
  count: number;
}

export type StatsPeriod = 'daily' | 'monthly' | 'yearly';
export type StatsTab = 'overview' | 'visitors' | 'users' | 'announcements' | 'chat';

export interface AnnouncementStatsItem {
  date: string;
  announcements: number;
  comments: number;
  likes: number;
}

export interface AnnouncementTotals {
  totalAnnouncements: number;
  totalComments: number;
  totalLikes: number;
  totalViews: number;
}

export interface ChatStatsItem {
  date: string;
  messages: number;
  activeConversations: number;
}

export interface ChatTotals {
  totalMessages: number;
  totalConversations: number;
  activeConversations: number;
}

export interface UserDetailStats {
  totalUsers: number;
  roleDistribution: { role: string; count: number }[];
  approvalDistribution: { status: string; count: number }[];
}

export interface NotificationStatsItem {
  date: string;
  sent: number;
  read: number;
  readRate: number;
}
