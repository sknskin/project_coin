import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { statisticsApi } from '../../api/statistics.api';
import { useChartColors } from './useChartColors';
import StatCard from './StatCard';
import type { RealTimeStats, StatsPeriod, DailyStatistics } from '../../types/statistics.types';

interface OverviewTabProps {
  realTimeStats: RealTimeStats | null;
  dateRange: { startDate: Date; endDate: Date };
  period: StatsPeriod;
}

export default function OverviewTab({ realTimeStats, dateRange, period }: OverviewTabProps) {
  const { t } = useTranslation();
  const chartColors = useChartColors();

  const { data: historicalData, isLoading } = useQuery({
    queryKey: ['historical-stats-period', dateRange, period],
    queryFn: () =>
      statisticsApi.getHistoricalByPeriod(dateRange.startDate, dateRange.endDate, period),
  });

  const { data: announcementTotals } = useQuery({
    queryKey: ['announcement-totals'],
    queryFn: () => statisticsApi.getAnnouncementTotals(),
  });

  const { data: chatTotals } = useQuery({
    queryKey: ['chat-totals'],
    queryFn: () => statisticsApi.getChatTotals(),
  });

  const statCards = [
    { label: t('stats.activeVisitors'), desc: t('stats.activeVisitorsDesc'), value: realTimeStats?.activeVisitors || 0, color: 'bg-blue-500' },
    { label: t('stats.todayLogins'), desc: t('stats.todayLoginsDesc'), value: realTimeStats?.todayLogins || 0, color: 'bg-green-500' },
    { label: t('stats.todayRegistrations'), desc: t('stats.todayRegistrationsDesc'), value: realTimeStats?.todayRegistrations || 0, color: 'bg-yellow-500' },
    { label: t('stats.todayPageViews'), desc: t('stats.todayPageViewsDesc'), value: realTimeStats?.todayPageViews || 0, color: 'bg-purple-500' },
    { label: t('stats.todayAnnouncements'), desc: t('stats.todayAnnouncementsDesc'), value: realTimeStats?.todayAnnouncements || 0, color: 'bg-orange-500' },
    { label: t('stats.todayMessages'), desc: t('stats.todayMessagesDesc'), value: realTimeStats?.todayMessages || 0, color: 'bg-pink-500' },
  ];

  const summaryCards = [
    { label: t('stats.totalUsers'), value: realTimeStats?.totalUsers || 0, color: 'bg-indigo-500' },
    { label: t('stats.totalAnnouncements'), value: announcementTotals?.data?.totalAnnouncements || 0, color: 'bg-orange-500' },
    { label: t('stats.totalMessages'), value: chatTotals?.data?.totalMessages || 0, color: 'bg-pink-500' },
  ];

  const dateFormat = period === 'yearly' ? 'yyyy' : period === 'monthly' ? 'yyyy-MM' : 'MM/dd';
  const chartData = (historicalData?.data || []).map((stat: DailyStatistics) => ({
    date: period === 'daily' ? format(new Date(stat.date), dateFormat) : stat.date,
    visitors: stat.visitorCount,
    pageViews: stat.pageViewCount,
  }));

  const hasData = chartData.length >= 2;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <StatCard key={card.label} label={card.label} description={card.desc} value={card.value} color={card.color} />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {summaryCards.map((card) => (
          <StatCard key={card.label} label={card.label} value={card.value} color={card.color} />
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('stats.visitorsChart')}
        </h3>
        {isLoading ? (
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
          </div>
        ) : !hasData ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-center">
            <p className="text-gray-600 dark:text-gray-400">{t('stats.insufficientData')}</p>
            <p className="text-sm text-gray-500 mt-1">{t('stats.needMoreDays')}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis dataKey="date" stroke={chartColors.axis} />
              <YAxis stroke={chartColors.axis} />
              <Tooltip
                contentStyle={{
                  backgroundColor: chartColors.tooltipBg,
                  border: `1px solid ${chartColors.tooltipBorder}`,
                  borderRadius: '8px',
                  color: chartColors.tooltipText,
                }}
                labelStyle={{ color: chartColors.tooltipText }}
              />
              <Legend />
              <Line type="monotone" dataKey="visitors" stroke="#3498db" name={t('stats.visitors')} strokeWidth={2} dot={{ fill: '#3498db', strokeWidth: 2 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="pageViews" stroke="#9b59b6" name={t('stats.pageViews')} strokeWidth={2} dot={{ fill: '#9b59b6', strokeWidth: 2 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
