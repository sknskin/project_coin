import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMarketStore } from '../../store/marketStore';
import { formatPrice, formatPercent, formatVolume, getChangeColor } from '../../utils/format';
import type { Market } from '../../types';

interface MarketTableProps {
  markets: Market[];
}

export default function MarketTable({ markets }: MarketTableProps) {
  const { t } = useTranslation();
  const tickers = useMarketStore((state) => state.tickers);

  const sortedMarkets = useMemo(() => {
    return [...markets].sort((a, b) => {
      const tickerA = tickers.get(a.market);
      const tickerB = tickers.get(b.market);
      const volumeA = tickerA?.accTradePrice24h || 0;
      const volumeB = tickerB?.accTradePrice24h || 0;
      return volumeB - volumeA;
    });
  }, [markets, tickers]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t('market.coin')}
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t('market.currentPrice')}
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t('market.change')}
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t('market.volume')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {sortedMarkets.map((market) => {
            const ticker = tickers.get(market.market);
            const change = ticker?.change || 'EVEN';
            const changeColor = getChangeColor(change);

            return (
              <tr
                key={market.market}
                className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <td className="px-4 py-3">
                  <Link
                    to={`/coin/${market.market}`}
                    className="flex flex-col"
                  >
                    <span className="font-medium text-gray-900 dark:text-white">
                      {market.korean_name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {market.market.replace('KRW-', '')}
                    </span>
                  </Link>
                </td>
                <td className={`px-4 py-3 text-right tabular-nums ${changeColor}`}>
                  {ticker ? formatPrice(ticker.tradePrice) : '-'}
                </td>
                <td className={`px-4 py-3 text-right tabular-nums ${changeColor}`}>
                  {ticker ? (
                    <div className="flex flex-col items-end">
                      <span>{formatPercent(ticker.signedChangeRate)}</span>
                      <span className="text-xs">
                        {ticker.signedChangePrice > 0 ? '+' : ''}
                        {formatPrice(ticker.signedChangePrice)}
                      </span>
                    </div>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400 tabular-nums">
                  {ticker ? formatVolume(ticker.accTradePrice24h) : '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
