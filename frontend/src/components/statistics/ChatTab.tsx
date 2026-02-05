import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { statisticsApi } from '../../api/statistics.api';
import { useChartColors } from './useChartColors';
import StatCard from './StatCard';
import type { StatsPeriod } from '../../types/statistics.types';

interface ChatTabProps {
  dateRange: { startDate: Date; endDate: Date };
  period: StatsPeriod;
}

export default function ChatTab({ dateRange, period }: ChatTabProps) {
  const { t } = useTranslation();
  const chartColors = useChartColors();

  const { data: statsData, isLoading } = useQuery({
    queryKey: ['chat-stats', dateRange, period],
    queryFn: () => statisticsApi.getChatStats(dateRange.startDate, dateRange.endDate, period),
  });

  const { data: totalsData } = useQuery({
    queryKey: ['chat-totals'],
    queryFn: () => statisticsApi.getChatTotals(),
  });

  const totals = totalsData?.data;
  const chartData = statsData?.data || [];
  const hasData = chartData.length >= 2;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label={t('stats.totalMessages')} value={totals?.totalMessages || 0} color="bg-pink-500" />
        <StatCard label={t('stats.totalConversations')} value={totals?.totalConversations || 0} color="bg-indigo-500" />
        <StatCard
          label={t('stats.activeConversations')}
          description={t('stats.activeConversationsDesc')}
          value={totals?.activeConversations || 0}
          color="bg-green-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('stats.messages')}
          </h3>
          {isLoading ? (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
            </div>
          ) : !hasData ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-center">
              <p className="text-gray-600 dark:text-gray-400">{t('stats.insufficientData')}</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis dataKey="date" stroke={chartColors.axis} />
                <YAxis stroke={chartColors.axis} />
                <Tooltip
                  contentStyle={{ backgroundColor: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: '8px', color: chartColors.tooltipText }}
                  labelStyle={{ color: chartColors.tooltipText }}
                />
                <Legend />
                <Bar dataKey="messages" fill="#e91e8b" name={t('stats.messages')} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('stats.activeConversations')}
          </h3>
          {isLoading ? (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
            </div>
          ) : !hasData ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-center">
              <p className="text-gray-600 dark:text-gray-400">{t('stats.insufficientData')}</p>
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
                <Line type="monotone" dataKey="activeConversations" stroke="#6366f1" name={t('stats.activeConversations')} strokeWidth={2} dot={{ fill: '#6366f1', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
