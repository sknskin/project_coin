import { useTranslation } from 'react-i18next';
import type { StatsPeriod } from '../../types/statistics.types';

interface PeriodSelectorProps {
  value: StatsPeriod;
  onChange: (period: StatsPeriod) => void;
}

const periods: { value: StatsPeriod; labelKey: string }[] = [
  { value: 'daily', labelKey: 'stats.period.daily' },
  { value: 'monthly', labelKey: 'stats.period.monthly' },
  { value: 'yearly', labelKey: 'stats.period.yearly' },
];

export default function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="inline-flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
      {periods.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            value === p.value
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          {t(p.labelKey)}
        </button>
      ))}
    </div>
  );
}
