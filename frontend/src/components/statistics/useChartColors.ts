import { useState, useEffect } from 'react';

export function useChartColors() {
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.classList.contains('dark'),
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

  return {
    grid: isDarkMode ? '#374151' : '#e5e7eb',
    axis: isDarkMode ? '#9ca3af' : '#6b7280',
    tooltipBg: isDarkMode ? '#1f2937' : '#ffffff',
    tooltipBorder: isDarkMode ? '#374151' : '#e5e7eb',
    tooltipText: isDarkMode ? '#f9fafb' : '#1f2937',
  };
}
