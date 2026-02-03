import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMarkets } from '../hooks/useMarketData';
import { useMarketWebSocket } from '../hooks/useWebSocket';
import MarketTable from '../components/market/MarketTable';
import Loading from '../components/common/Loading';
import Pagination from '../components/common/Pagination';

export default function Dashboard() {
  const { t } = useTranslation();
  const { data: markets, isLoading, error } = useMarkets();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

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

  const totalItems = markets?.length || 0;
  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('dashboard.title')}</h1>
        <div className="flex items-center justify-between mt-1 min-h-[36px]">
          <p className="text-gray-600 dark:text-gray-400">{t('dashboard.subtitle')}</p>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="w-36 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value={20}>{t('common.viewPerPage', { count: 20 })}</option>
            <option value={50}>{t('common.viewPerPage', { count: 50 })}</option>
            <option value={100}>{t('common.viewPerPage', { count: 100 })}</option>
          </select>
        </div>
      </div>

      {markets && <MarketTable markets={markets} page={page} pageSize={pageSize} />}

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
