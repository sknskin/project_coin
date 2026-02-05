import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format, subDays, subMonths, subYears } from 'date-fns';
import { io, Socket } from 'socket.io-client';
import { statisticsApi } from '../../api/statistics.api';
import StatsTabs from '../../components/statistics/StatsTabs';
import PeriodSelector from '../../components/statistics/PeriodSelector';
import OverviewTab from '../../components/statistics/OverviewTab';
import VisitorsTab from '../../components/statistics/VisitorsTab';
import UsersTab from '../../components/statistics/UsersTab';
import AnnouncementsTab from '../../components/statistics/AnnouncementsTab';
import ChatTab from '../../components/statistics/ChatTab';
import type { RealTimeStats, StatsTab, StatsPeriod } from '../../types/statistics.types';

function getDefaultDateRange(period: StatsPeriod) {
  const endDate = new Date();
  switch (period) {
    case 'monthly':
      return { startDate: subMonths(endDate, 12), endDate };
    case 'yearly':
      return { startDate: subYears(endDate, 5), endDate };
    default:
      return { startDate: subDays(endDate, 30), endDate };
  }
}

export default function Statistics() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<StatsTab>('overview');
  const [period, setPeriod] = useState<StatsPeriod>('daily');
  const [dateRange, setDateRange] = useState(getDefaultDateRange('daily'));
  const [realTimeStats, setRealTimeStats] = useState<RealTimeStats | null>(null);

  const { data: initialRealTimeData } = useQuery({
    queryKey: ['realtime-stats'],
    queryFn: () => statisticsApi.getRealTime(),
  });

  useEffect(() => {
    if (initialRealTimeData?.data) {
      setRealTimeStats(initialRealTimeData.data);
    }
  }, [initialRealTimeData]);

  // WebSocket for real-time updates
  useEffect(() => {
    const socket: Socket = io(
      `${import.meta.env.VITE_WS_URL || 'http://localhost:3000'}/statistics`,
      {
        path: '/socket.io',
        transports: ['websocket'],
      },
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

  // Auto-adjust date range when period changes
  const handlePeriodChange = (newPeriod: StatsPeriod) => {
    setPeriod(newPeriod);
    setDateRange(getDefaultDateRange(newPeriod));
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('admin.statistics')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {t('admin.statisticsSubtitle')}
        </p>
      </div>

      <StatsTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Period selector + date range (hidden on overview since it has its own real-time cards) */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <PeriodSelector value={period} onChange={handlePeriodChange} />
        <div className="flex items-center gap-2">
          <input
            type="date"
            className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            value={format(dateRange.startDate, 'yyyy-MM-dd')}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, startDate: new Date(e.target.value) }))
            }
          />
          <span className="text-gray-500 dark:text-gray-400">~</span>
          <input
            type="date"
            className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            value={format(dateRange.endDate, 'yyyy-MM-dd')}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, endDate: new Date(e.target.value) }))
            }
          />
        </div>
      </div>

      {activeTab === 'overview' && (
        <OverviewTab realTimeStats={realTimeStats} dateRange={dateRange} period={period} />
      )}
      {activeTab === 'visitors' && (
        <VisitorsTab dateRange={dateRange} period={period} />
      )}
      {activeTab === 'users' && (
        <UsersTab dateRange={dateRange} period={period} />
      )}
      {activeTab === 'announcements' && (
        <AnnouncementsTab dateRange={dateRange} period={period} />
      )}
      {activeTab === 'chat' && (
        <ChatTab dateRange={dateRange} period={period} />
      )}
    </div>
  );
}
