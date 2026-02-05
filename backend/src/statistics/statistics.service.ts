import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatisticsService {
  private logger = new Logger('StatisticsService');

  constructor(private prisma: PrismaService) {}

  async trackVisitor(
    sessionId: string,
    ipAddress?: string,
    userAgent?: string,
    referrer?: string,
  ) {
    const existing = await this.prisma.visitorSession.findUnique({
      where: { sessionId },
    });

    if (existing) {
      return this.prisma.visitorSession.update({
        where: { sessionId },
        data: {
          lastActiveAt: new Date(),
          pageViews: { increment: 1 },
        },
      });
    }

    return this.prisma.visitorSession.create({
      data: { sessionId, ipAddress, userAgent, referrer },
    });
  }

  async getRealTimeStats() {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const [
      activeVisitors,
      todayVisitors,
      todayLogins,
      todayRegistrations,
      todayPageViewsResult,
      totalUsers,
      todayAnnouncements,
      todayComments,
      todayMessages,
    ] = await Promise.all([
      this.prisma.visitorSession.count({
        where: { lastActiveAt: { gte: fiveMinutesAgo } },
      }),
      this.prisma.visitorSession.count({
        where: { startedAt: { gte: todayStart } },
      }),
      this.prisma.loginHistory.count({
        where: { loginAt: { gte: todayStart }, isSuccess: true },
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: todayStart } },
      }),
      this.prisma.visitorSession.aggregate({
        where: { startedAt: { gte: todayStart } },
        _sum: { pageViews: true },
      }),
      this.prisma.user.count(),
      this.prisma.announcement.count({
        where: { createdAt: { gte: todayStart } },
      }),
      this.prisma.announcementComment.count({
        where: { createdAt: { gte: todayStart } },
      }),
      this.prisma.message.count({
        where: { createdAt: { gte: todayStart }, isDeleted: false },
      }),
    ]);

    return {
      activeVisitors,
      todayVisitors,
      todayLogins,
      todayRegistrations,
      todayPageViews: todayPageViewsResult._sum.pageViews || 0,
      totalUsers,
      todayAnnouncements,
      todayComments,
      todayMessages,
    };
  }

  async getHistoricalStats(startDate: Date, endDate: Date) {
    return this.prisma.dailyStatistics.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'asc' },
    });
  }

  async getHistoricalByPeriod(
    startDate: Date,
    endDate: Date,
    period: 'daily' | 'monthly' | 'yearly',
  ) {
    if (period === 'daily') {
      return this.getHistoricalStats(startDate, endDate);
    }
    return this.aggregateByPeriod(startDate, endDate, period, {
      visitor_count: 'visitorCount',
      login_count: 'loginCount',
      register_count: 'registerCount',
      page_view_count: 'pageViewCount',
      active_user_count: 'activeUserCount',
      new_announcement_count: 'newAnnouncementCount',
      announcement_comment_count: 'announcementCommentCount',
      announcement_like_count: 'announcementLikeCount',
      message_count: 'messageCount',
      active_conversation_count: 'activeConversationCount',
      notification_count: 'notificationCount',
      notification_read_count: 'notificationReadCount',
    });
  }

  async getAnnouncementStats(
    startDate: Date,
    endDate: Date,
    period: 'daily' | 'monthly' | 'yearly',
  ) {
    if (period === 'daily') {
      const rows = await this.prisma.dailyStatistics.findMany({
        where: { date: { gte: startDate, lte: endDate } },
        orderBy: { date: 'asc' },
        select: {
          date: true,
          newAnnouncementCount: true,
          announcementCommentCount: true,
          announcementLikeCount: true,
        },
      });
      return rows.map((r) => ({
        date: r.date.toISOString().split('T')[0],
        announcements: r.newAnnouncementCount,
        comments: r.announcementCommentCount,
        likes: r.announcementLikeCount,
      }));
    }
    const raw = await this.aggregateByPeriod(startDate, endDate, period, {
      new_announcement_count: 'announcements',
      announcement_comment_count: 'comments',
      announcement_like_count: 'likes',
    });
    return raw;
  }

  async getAnnouncementTotals() {
    const [totalAnnouncements, totalComments, totalLikes, totalViews] =
      await Promise.all([
        this.prisma.announcement.count(),
        this.prisma.announcementComment.count(),
        this.prisma.announcementLike.count(),
        this.prisma.announcement.aggregate({ _sum: { viewCount: true } }),
      ]);

    return {
      totalAnnouncements,
      totalComments,
      totalLikes,
      totalViews: totalViews._sum.viewCount || 0,
    };
  }

  async getChatStats(
    startDate: Date,
    endDate: Date,
    period: 'daily' | 'monthly' | 'yearly',
  ) {
    if (period === 'daily') {
      const rows = await this.prisma.dailyStatistics.findMany({
        where: { date: { gte: startDate, lte: endDate } },
        orderBy: { date: 'asc' },
        select: {
          date: true,
          messageCount: true,
          activeConversationCount: true,
        },
      });
      return rows.map((r) => ({
        date: r.date.toISOString().split('T')[0],
        messages: r.messageCount,
        activeConversations: r.activeConversationCount,
      }));
    }
    const raw = await this.aggregateByPeriod(startDate, endDate, period, {
      message_count: 'messages',
      active_conversation_count: 'activeConversations',
    });
    return raw;
  }

  async getChatTotals() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [totalMessages, totalConversations, activeConversations] =
      await Promise.all([
        this.prisma.message.count({ where: { isDeleted: false } }),
        this.prisma.conversation.count(),
        this.prisma.conversation.count({
          where: {
            messages: {
              some: { createdAt: { gte: sevenDaysAgo } },
            },
          },
        }),
      ]);

    return { totalMessages, totalConversations, activeConversations };
  }

  async getUserDetailStats() {
    const [roleDistribution, approvalDistribution, totalUsers] =
      await Promise.all([
        this.prisma.user.groupBy({
          by: ['role'],
          _count: true,
        }),
        this.prisma.user.groupBy({
          by: ['approvalStatus'],
          _count: true,
        }),
        this.prisma.user.count(),
      ]);

    return {
      totalUsers,
      roleDistribution: roleDistribution.map((r) => ({
        role: r.role,
        count: r._count,
      })),
      approvalDistribution: approvalDistribution.map((r) => ({
        status: r.approvalStatus,
        count: r._count,
      })),
    };
  }

  async getNotificationStats(
    startDate: Date,
    endDate: Date,
    period: 'daily' | 'monthly' | 'yearly',
  ) {
    if (period === 'daily') {
      const rows = await this.prisma.dailyStatistics.findMany({
        where: { date: { gte: startDate, lte: endDate } },
        orderBy: { date: 'asc' },
        select: {
          date: true,
          notificationCount: true,
          notificationReadCount: true,
        },
      });
      return rows.map((r) => ({
        date: r.date.toISOString().split('T')[0],
        sent: r.notificationCount,
        read: r.notificationReadCount,
        readRate:
          r.notificationCount > 0
            ? Math.round(
                (r.notificationReadCount / r.notificationCount) * 100,
              )
            : 0,
      }));
    }
    const raw = await this.aggregateByPeriod(startDate, endDate, period, {
      notification_count: 'sent',
      notification_read_count: 'read',
    });
    return (raw as any[]).map((r) => ({
      ...r,
      readRate:
        Number(r.sent) > 0
          ? Math.round((Number(r.read) / Number(r.sent)) * 100)
          : 0,
    }));
  }

  private async aggregateByPeriod(
    startDate: Date,
    endDate: Date,
    period: 'monthly' | 'yearly',
    columnMap: Record<string, string>,
  ) {
    const dateFormat = period === 'monthly' ? 'YYYY-MM' : 'YYYY';
    const columns = Object.keys(columnMap);
    const sumClauses = columns
      .map((c) => `COALESCE(SUM(${c}), 0)::int as "${columnMap[c]}"`)
      .join(', ');

    const results: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT to_char(date, '${dateFormat}') as date, ${sumClauses}
       FROM daily_statistics
       WHERE date >= $1 AND date <= $2
       GROUP BY to_char(date, '${dateFormat}')
       ORDER BY date ASC`,
      startDate,
      endDate,
    );

    return results;
  }

  async getLoginStats(startDate: Date, endDate: Date) {
    const loginHistories = await this.prisma.loginHistory.groupBy({
      by: ['loginAt'],
      where: {
        loginAt: { gte: startDate, lte: endDate },
        isSuccess: true,
      },
      _count: true,
    });

    const dailyLogins = new Map<string, number>();
    loginHistories.forEach((record) => {
      const dateKey = record.loginAt.toISOString().split('T')[0];
      dailyLogins.set(dateKey, (dailyLogins.get(dateKey) || 0) + record._count);
    });

    return Array.from(dailyLogins.entries()).map(([date, count]) => ({
      date,
      count,
    }));
  }

  async getRegistrationStats(startDate: Date, endDate: Date) {
    const users = await this.prisma.user.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
      _count: true,
    });

    const dailyRegistrations = new Map<string, number>();
    users.forEach((record) => {
      const dateKey = record.createdAt.toISOString().split('T')[0];
      dailyRegistrations.set(
        dateKey,
        (dailyRegistrations.get(dateKey) || 0) + record._count,
      );
    });

    return Array.from(dailyRegistrations.entries()).map(([date, count]) => ({
      date,
      count,
    }));
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async aggregateDailyStats() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const dayEnd = new Date(yesterday);
    dayEnd.setHours(23, 59, 59, 999);

    const [
      visitorCount,
      loginCount,
      registerCount,
      pageViewCount,
      activeUserCount,
      newAnnouncementCount,
      announcementCommentCount,
      announcementLikeCount,
      messageCount,
      activeConversationGroups,
      notificationCount,
      notificationReadCount,
    ] = await Promise.all([
      this.prisma.visitorSession.count({
        where: { startedAt: { gte: yesterday, lte: dayEnd } },
      }),
      this.prisma.loginHistory.count({
        where: { loginAt: { gte: yesterday, lte: dayEnd }, isSuccess: true },
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: yesterday, lte: dayEnd } },
      }),
      this.prisma.visitorSession.aggregate({
        where: { startedAt: { gte: yesterday, lte: dayEnd } },
        _sum: { pageViews: true },
      }),
      this.prisma.user.count({
        where: { lastLoginAt: { gte: yesterday, lte: dayEnd } },
      }),
      this.prisma.announcement.count({
        where: { createdAt: { gte: yesterday, lte: dayEnd } },
      }),
      this.prisma.announcementComment.count({
        where: { createdAt: { gte: yesterday, lte: dayEnd } },
      }),
      this.prisma.announcementLike.count({
        where: { createdAt: { gte: yesterday, lte: dayEnd } },
      }),
      this.prisma.message.count({
        where: {
          createdAt: { gte: yesterday, lte: dayEnd },
          isDeleted: false,
        },
      }),
      this.prisma.message.groupBy({
        by: ['conversationId'],
        where: { createdAt: { gte: yesterday, lte: dayEnd } },
      }),
      this.prisma.notification.count({
        where: { createdAt: { gte: yesterday, lte: dayEnd } },
      }),
      this.prisma.notification.count({
        where: {
          createdAt: { gte: yesterday, lte: dayEnd },
          isRead: true,
        },
      }),
    ]);

    const data = {
      visitorCount,
      loginCount,
      registerCount,
      pageViewCount: pageViewCount._sum.pageViews || 0,
      activeUserCount,
      newAnnouncementCount,
      announcementCommentCount,
      announcementLikeCount,
      messageCount,
      activeConversationCount: activeConversationGroups.length,
      notificationCount,
      notificationReadCount,
    };

    await this.prisma.dailyStatistics.upsert({
      where: { date: yesterday },
      update: data,
      create: { date: yesterday, ...data },
    });

    this.logger.log(
      `Aggregated daily statistics for ${yesterday.toISOString().split('T')[0]}`,
    );
  }
}
