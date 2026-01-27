import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useMarkets } from '../hooks/useMarketData';
import { useMarketWebSocket } from '../hooks/useWebSocket';
import MarketTable from '../components/market/MarketTable';
import Loading from '../components/common/Loading';

export default function Dashboard() {
  const { t } = useTranslation();
  const { data: markets, isLoading, error } = useMarkets();

  const marketCodes = useMemo(() => {
    return markets?.map((m) => m.market) || [];
  }, [markets]);

  useMarketWebSocket(marketCodes);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-600">{t('dashboard.loadError')}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('dashboard.title')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {t('dashboard.subtitle')}
        </p>
      </div>

      {markets && <MarketTable markets={markets} />}
    </div>
  );
}
