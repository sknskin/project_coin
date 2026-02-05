import { useTranslation } from 'react-i18next';
import type { StatsTab } from '../../types/statistics.types';

interface StatsTabsProps {
  activeTab: StatsTab;
  onTabChange: (tab: StatsTab) => void;
}

const tabs: { key: StatsTab; labelKey: string }[] = [
  { key: 'overview', labelKey: 'stats.tabs.overview' },
  { key: 'visitors', labelKey: 'stats.tabs.visitors' },
  { key: 'users', labelKey: 'stats.tabs.users' },
  { key: 'announcements', labelKey: 'stats.tabs.announcements' },
  { key: 'chat', labelKey: 'stats.tabs.chat' },
];

export default function StatsTabs({ activeTab, onTabChange }: StatsTabsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === tab.key
              ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          {t(tab.labelKey)}
        </button>
      ))}
    </div>
  );
}
