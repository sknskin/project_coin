import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { statisticsApi } from '../../api/statistics.api';
import { useChartColors } from './useChartColors';
import StatCard from './StatCard';
import type { StatsPeriod } from '../../types/statistics.types';

interface AnnouncementsTabProps {
  dateRange: { startDate: Date; endDate: Date };
  period: StatsPeriod;
}

export default function AnnouncementsTab({ dateRange, period }: AnnouncementsTabProps) {
  const { t } = useTranslation();
  const chartColors = useChartColors();

  const { data: statsData, isLoading } = useQuery({
    queryKey: ['announcement-stats', dateRange, period],
    queryFn: () =>
      statisticsApi.getAnnouncementStats(dateRange.startDate, dateRange.endDate, period),
  });

  const { data: totalsData } = useQuery({
    queryKey: ['announcement-totals'],
    queryFn: () => statisticsApi.getAnnouncementTotals(),
  });

  const totals = totalsData?.data;
  const chartData = statsData?.data || [];
  const hasData = chartData.length >= 2;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t('stats.totalAnnouncements')} value={totals?.totalAnnouncements || 0} color="bg-orange-500" />
        <StatCard label={t('stats.totalComments')} value={totals?.totalComments || 0} color="bg-blue-500" />
        <StatCard label={t('stats.totalLikes')} value={totals?.totalLikes || 0} color="bg-red-500" />
        <StatCard label={t('stats.totalViews')} value={totals?.totalViews || 0} color="bg-purple-500" />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('stats.announcementChart')}
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
                contentStyle={{ backgroundColor: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: '8px', color: chartColors.tooltipText }}
                labelStyle={{ color: chartColors.tooltipText }}
              />
              <Legend />
              <Line type="monotone" dataKey="announcements" stroke="#e67e22" name={t('stats.newAnnouncements')} strokeWidth={2} dot={{ fill: '#e67e22', strokeWidth: 2 }} />
              <Line type="monotone" dataKey="comments" stroke="#3498db" name={t('stats.commentsCount')} strokeWidth={2} dot={{ fill: '#3498db', strokeWidth: 2 }} />
              <Line type="monotone" dataKey="likes" stroke="#e74c3c" name={t('stats.likesCount')} strokeWidth={2} dot={{ fill: '#e74c3c', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
