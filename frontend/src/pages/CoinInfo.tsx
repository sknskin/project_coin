import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { newsApi } from '../api/news.api';
import Pagination from '../components/common/Pagination';
import type { CryptoNews } from '../types/news.types';

export default function CoinInfo() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data, isLoading, error } = useQuery({
    queryKey: ['news', page, limit],
    queryFn: () => newsApi.getNews(page, limit),
  });

  const newsData = data?.data;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleNewsClick = (news: CryptoNews) => {
    window.open(news.sourceUrl, '_blank', 'noopener,noreferrer');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-600">{t('news.loadError')}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('menu.coinNews')}</h1>
        <div className="flex items-center justify-between mt-1 min-h-[36px]">
          <p className="text-gray-600 dark:text-gray-400">{t('news.description')}</p>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="w-36 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value={10}>{t('common.viewPerPage', { count: 10 })}</option>
            <option value={20}>{t('common.viewPerPage', { count: 20 })}</option>
            <option value={50}>{t('common.viewPerPage', { count: 50 })}</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {(!newsData?.news || newsData.news.length === 0) ? (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">{t('news.noNews')}</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {newsData.news.map((news: CryptoNews) => (
              <article
                key={news.id}
                className="flex gap-4 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                onClick={() => handleNewsClick(news)}
              >
                {news.imageUrl && (
                  <div className="flex-shrink-0 w-[120px] h-[80px] rounded overflow-hidden">
                    <img src={news.imageUrl} alt={news.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 flex flex-col gap-1 min-w-0">
                  <h2 className="font-medium text-gray-900 dark:text-white line-clamp-2">{news.title}</h2>
                  {news.summary && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{news.summary}</p>
                  )}
                  <div className="flex gap-3 text-xs text-gray-400 dark:text-gray-500 mt-auto">
                    <span className="font-medium">{news.sourceName}</span>
                    <span>{formatDate(news.publishedAt)}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {newsData && (
        <Pagination
          currentPage={page}
          totalPages={newsData.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
