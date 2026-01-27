import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCandles, useMarkets } from '../hooks/useMarketData';
import { useMarketWebSocket } from '../hooks/useWebSocket';
import { useMarketStore } from '../store/marketStore';
import CoinChart from '../components/chart/CoinChart';
import TimeframeSelector from '../components/chart/TimeframeSelector';
import Loading from '../components/common/Loading';
import { formatPrice, formatPercent, formatVolume, getChangeColor } from '../utils/format';
import type { TimeframeType } from '../utils/constants';

export default function CoinDetail() {
  const { t, i18n } = useTranslation();
  const { marketCode } = useParams<{ marketCode: string }>();
  const [timeframeType, setTimeframeType] = useState<TimeframeType>('minutes');
  const [timeframeUnit, setTimeframeUnit] = useState(15);

  const { data: markets } = useMarkets();
  const market = useMemo(() => {
    return markets?.find((m) => m.market === marketCode);
  }, [markets, marketCode]);

  const { data: candles, isLoading: isCandlesLoading } = useCandles(marketCode || '', {
    type: timeframeType,
    unit: timeframeUnit,
    count: 200,
  });

  const marketCodes = useMemo(() => (marketCode ? [marketCode] : []), [marketCode]);
  useMarketWebSocket(marketCodes);

  const ticker = useMarketStore((state) =>
    marketCode ? state.tickers.get(marketCode) : undefined,
  );

  const handleTimeframeChange = (type: TimeframeType, unit: number) => {
    setTimeframeType(type);
    setTimeframeUnit(unit);
  };

  if (!marketCode) {
    return <div>{t('coinDetail.invalidAccess')}</div>;
  }

  const change = ticker?.change || 'EVEN';
  const changeColor = getChangeColor(change);

  return (
    <div>
      <div className="mb-6">
        <Link
          to="/coins"
          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm mb-2 inline-block"
        >
          &larr; {t('coinDetail.backToList')}
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {market ? (i18n.language === 'ko' ? market.korean_name : market.english_name) : marketCode.replace('KRW-', '')}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">{marketCode}</p>
          </div>

          {ticker && (
            <div className="text-right">
              <p className={`text-3xl font-bold tabular-nums ${changeColor}`}>
                {formatPrice(ticker.tradePrice)}
              </p>
              <p className={`text-lg tabular-nums ${changeColor}`}>
                {formatPercent(ticker.signedChangeRate)} ({ticker.signedChangePrice > 0 ? '+' : ''}
                {formatPrice(ticker.signedChangePrice)})
              </p>
            </div>
          )}
        </div>
      </div>

      {ticker && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('coinDetail.high')}</p>
            <p className="text-lg font-semibold tabular-nums text-rise">
              {formatPrice(ticker.highPrice)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('coinDetail.low')}</p>
            <p className="text-lg font-semibold tabular-nums text-fall">
              {formatPrice(ticker.lowPrice)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('coinDetail.volume24h')}</p>
            <p className="text-lg font-semibold tabular-nums dark:text-white">
              {formatVolume(ticker.accTradePrice24h)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('coinDetail.tradeVolume24h')}</p>
            <p className="text-lg font-semibold tabular-nums dark:text-white">
              {formatVolume(ticker.accTradeVolume24h)}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="mb-4">
          <TimeframeSelector
            selectedType={timeframeType}
            selectedUnit={timeframeUnit}
            onChange={handleTimeframeChange}
          />
        </div>

        {isCandlesLoading ? (
          <div className="flex items-center justify-center h-96">
            <Loading size="lg" />
          </div>
        ) : candles && candles.length > 0 ? (
          <CoinChart candles={candles} height={400} />
        ) : (
          <div className="flex items-center justify-center h-96 text-gray-500 dark:text-gray-400">
            {t('coinDetail.noChartData')}
          </div>
        )}
      </div>

      {ticker && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">{t('coinDetail.weekInfo')}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('coinDetail.high52Week')}</p>
              <p className="text-lg font-semibold tabular-nums text-rise">
                {formatPrice(ticker.highest52WeekPrice)}
              </p>
              <p className="text-xs text-gray-400">{ticker.highest52WeekDate}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('coinDetail.low52Week')}</p>
              <p className="text-lg font-semibold tabular-nums text-fall">
                {formatPrice(ticker.lowest52WeekPrice)}
              </p>
              <p className="text-xs text-gray-400">{ticker.lowest52WeekDate}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
