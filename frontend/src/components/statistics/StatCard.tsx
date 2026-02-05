interface StatCardProps {
  label: string;
  description?: string;
  value: number | string;
  color: string;
}

export default function StatCard({ label, description, value, color }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex items-start gap-3">
        <div className={`w-3 h-3 rounded-full ${color} mt-2 flex-shrink-0`} />
        <div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</div>
          {description && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</div>
          )}
        </div>
      </div>
    </div>
  );
}
