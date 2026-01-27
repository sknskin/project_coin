import { TIMEFRAMES, TimeframeType } from '../../utils/constants';

interface TimeframeSelectorProps {
  selectedType: TimeframeType;
  selectedUnit: number;
  onChange: (type: TimeframeType, unit: number) => void;
}

export default function TimeframeSelector({
  selectedType,
  selectedUnit,
  onChange,
}: TimeframeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {TIMEFRAMES.map((tf) => {
        const isSelected = tf.type === selectedType && tf.value === selectedUnit;
        return (
          <button
            key={`${tf.type}-${tf.value}`}
            onClick={() => onChange(tf.type, tf.value)}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              isSelected
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {tf.label}
          </button>
        );
      })}
    </div>
  );
}
