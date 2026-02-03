import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays } from 'date-fns';
import { statisticsApi } from '../../api/statistics.api';
import { io, Socket } from 'socket.io-client';
import type { RealTimeStats, DailyStatistics } from '../../types/statistics.types';

export default function Statistics() {
  const { t } = useTranslation();
  const [realTimeStats, setRealTimeStats] = useState<RealTimeStats | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
  });
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.classList.contains('dark')
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  const chartColors = {
    grid: isDarkMode ? '#374151' : '#e5e7eb',
    axis: isDarkMode ? '#9ca3af' : '#6b7280',
    tooltipBg: isDarkMode ? '#1f2937' : '#ffffff',
    tooltipBorder: isDarkMode ? '#374151' : '#e5e7eb',
    tooltipText: isDarkMode ? '#f9fafb' : '#1f2937',
  };

  const { data: initialRealTimeData } = useQuery({
    queryKey: ['realtime-stats'],
    queryFn: () => statisticsApi.getRealTime(),
  });

  const { data: historicalData, isLoading } = useQuery({
    queryKey: ['historical-stats', dateRange],
    queryFn: () =>
      statisticsApi.getHistorical(dateRange.startDate, dateRange.endDate),
  });

  useEffect(() => {
    const socket: Socket = io(
      `${import.meta.env.VITE_WS_URL || 'http://localhost:3000'}/statistics`,
      {
        path: '/socket.io',
        transports: ['websocket'],
      }
    );

    socket.on('connect', () => {
      socket.emit('stats:subscribe');
    });

    socket.on('stats:realtime', (data: RealTimeStats) => {
      setRealTimeStats(data);
    });

    socket.on('connect_error', (error) => {
      console.warn('Statistics socket connection error:', error.message);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (initialRealTimeData?.data) {
      setRealTimeStats(initialRealTimeData.data);
    }
  }, [initialRealTimeData]);

  const chartData = historicalData?.data.map((stat: DailyStatistics) => ({
    date: format(new Date(stat.date), 'MM/dd'),
    visitors: stat.visitorCount,
    logins: stat.loginCount,
    registrations: stat.registerCount,
    pageViews: stat.pageViewCount,
  })) || [];

  const hasEnoughData = chartData.length >= 2;

  const statCards = [
    { label: t('stats.activeVisitors'), desc: t('stats.activeVisitorsDesc'), value: realTimeStats?.activeVisitors || 0, color: 'bg-blue-500' },
    { label: t('stats.todayLogins'), desc: t('stats.todayLoginsDesc'), value: realTimeStats?.todayLogins || 0, color: 'bg-green-500' },
    { label: t('stats.todayRegistrations'), desc: t('stats.todayRegistrationsDesc'), value: realTimeStats?.todayRegistrations || 0, color: 'bg-yellow-500' },
    { label: t('stats.todayPageViews'), desc: t('stats.todayPageViewsDesc'), value: realTimeStats?.todayPageViews || 0, color: 'bg-purple-500' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('admin.statistics')}</h1>
        <div className="flex items-center justify-between mt-1 min-h-[36px]">
          <p className="text-gray-600 dark:text-gray-400">{t('admin.statisticsSubtitle')}</p>
        </div>
      </div>

      {/* Real-time Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-start gap-3">
              <div className={`w-3 h-3 rounded-full ${card.color} mt-2 flex-shrink-0`}></div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{card.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{card.desc}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Date Range Selector */}
      <div className="flex items-center gap-3 mb-6">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('stats.dateRange')}</label>
        <input
          type="date"
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          value={format(dateRange.startDate, 'yyyy-MM-dd')}
          onChange={(e) =>
            setDateRange((prev) => ({ ...prev, startDate: new Date(e.target.value) }))
          }
        />
        <span className="text-gray-500 dark:text-gray-400">~</span>
        <input
          type="date"
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          value={format(dateRange.endDate, 'yyyy-MM-dd')}
          onChange={(e) =>
            setDateRange((prev) => ({ ...prev, endDate: new Date(e.target.value) }))
          }
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      ) : !hasEnoughData ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-lg font-medium text-gray-600 dark:text-gray-400">{t('stats.insufficientData')}</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">{t('stats.needMoreDays')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('stats.visitorsChart')}</h3>
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
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('stats.usersChart')}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
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
                <Bar dataKey="logins" fill="#2ecc71" name={t('stats.logins')} radius={[4, 4, 0, 0]} />
                <Bar dataKey="registrations" fill="#e74c3c" name={t('stats.registrations')} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
