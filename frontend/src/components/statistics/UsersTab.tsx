import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { format } from 'date-fns';
import { statisticsApi } from '../../api/statistics.api';
import { useChartColors } from './useChartColors';
import StatCard from './StatCard';
import type { StatsPeriod, DailyStatistics } from '../../types/statistics.types';

interface UsersTabProps {
  dateRange: { startDate: Date; endDate: Date };
  period: StatsPeriod;
}

const ROLE_COLORS: Record<string, string> = {
  USER: '#3498db',
  ADMIN: '#e67e22',
  SYSTEM: '#e74c3c',
};

const APPROVAL_COLORS: Record<string, string> = {
  PENDING: '#f39c12',
  APPROVED: '#2ecc71',
  REJECTED: '#e74c3c',
};

export default function UsersTab({ dateRange, period }: UsersTabProps) {
  const { t } = useTranslation();
  const chartColors = useChartColors();

  const { data: historicalData, isLoading } = useQuery({
    queryKey: ['historical-stats-period', dateRange, period],
    queryFn: () =>
      statisticsApi.getHistoricalByPeriod(dateRange.startDate, dateRange.endDate, period),
  });

  const { data: userDetailData } = useQuery({
    queryKey: ['user-detail-stats'],
    queryFn: () => statisticsApi.getUserDetailStats(),
  });

  const dateFormat = period === 'yearly' ? 'yyyy' : period === 'monthly' ? 'yyyy-MM' : 'MM/dd';
  const chartData = (historicalData?.data || []).map((stat: DailyStatistics) => ({
    date: period === 'daily' ? format(new Date(stat.date), dateFormat) : stat.date,
    logins: stat.loginCount,
    registrations: stat.registerCount,
  }));

  const hasData = chartData.length >= 2;
  const userDetail = userDetailData?.data;

  const roleData = (userDetail?.roleDistribution || []).map((r) => ({
    name: t(`roles.${r.role.toLowerCase()}`),
    value: r.count,
    color: ROLE_COLORS[r.role] || '#95a5a6',
  }));

  const approvalData = (userDetail?.approvalDistribution || []).map((r) => ({
    name: t(`approvalStatus.${r.status.toLowerCase()}`),
    value: r.count,
    color: APPROVAL_COLORS[r.status] || '#95a5a6',
  }));

  const renderLabel = ({ name, percent }: { name?: string; percent?: number }) =>
    `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label={t('stats.totalUsers')} value={userDetail?.totalUsers || 0} color="bg-indigo-500" />
        {roleData.map((r) => (
          <StatCard key={r.name} label={r.name} value={r.value} color="bg-gray-500" />
        ))}
      </div>

      {/* Login/Registration trend */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('stats.usersChart')}
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
              <Bar dataKey="logins" fill="#2ecc71" name={t('stats.logins')} radius={[4, 4, 0, 0]} />
              <Bar dataKey="registrations" fill="#e74c3c" name={t('stats.registrations')} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Pie charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('stats.roleDistribution')}
          </h3>
          {roleData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={roleData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={renderLabel}>
                  {roleData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px]">
              <p className="text-gray-500">{t('stats.insufficientData')}</p>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('stats.approvalDistribution')}
          </h3>
          {approvalData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={approvalData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={renderLabel}>
                  {approvalData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px]">
              <p className="text-gray-500">{t('stats.insufficientData')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
