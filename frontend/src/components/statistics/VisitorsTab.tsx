import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { statisticsApi } from '../../api/statistics.api';
import { useChartColors } from './useChartColors';
import type { StatsPeriod, DailyStatistics } from '../../types/statistics.types';

interface VisitorsTabProps {
  dateRange: { startDate: Date; endDate: Date };
  period: StatsPeriod;
}

export default function VisitorsTab({ dateRange, period }: VisitorsTabProps) {
  const { t } = useTranslation();
  const chartColors = useChartColors();

  const { data: historicalData, isLoading } = useQuery({
    queryKey: ['historical-stats-period', dateRange, period],
    queryFn: () =>
      statisticsApi.getHistoricalByPeriod(dateRange.startDate, dateRange.endDate, period),
  });

  const dateFormat = period === 'yearly' ? 'yyyy' : period === 'monthly' ? 'yyyy-MM' : 'MM/dd';
  const chartData = (historicalData?.data || []).map((stat: DailyStatistics) => ({
    date: period === 'daily' ? format(new Date(stat.date), dateFormat) : stat.date,
    visitors: stat.visitorCount,
    pageViews: stat.pageViewCount,
    activeUsers: stat.activeUserCount,
  }));

  const hasData = chartData.length >= 2;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-lg font-medium text-gray-600 dark:text-gray-400">{t('stats.insufficientData')}</p>
        <p className="text-sm text-gray-500 mt-1">{t('stats.needMoreDays')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('stats.visitorsChart')}
        </h3>
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
            <Line type="monotone" dataKey="visitors" stroke="#3498db" name={t('stats.visitors')} strokeWidth={2} dot={{ fill: '#3498db', strokeWidth: 2 }} />
            <Line type="monotone" dataKey="activeUsers" stroke="#2ecc71" name={t('stats.activeUsers')} strokeWidth={2} dot={{ fill: '#2ecc71', strokeWidth: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('stats.pageViews')}
        </h3>
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
            <Bar dataKey="pageViews" fill="#9b59b6" name={t('stats.pageViews')} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
