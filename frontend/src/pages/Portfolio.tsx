import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { usePortfolio, usePortfolioStatus, useConnectUpbit } from '../hooks/usePortfolio';
import PortfolioSummary from '../components/portfolio/PortfolioSummary';
import HoldingsList from '../components/portfolio/HoldingsList';
import Modal from '../components/common/Modal';
import Loading from '../components/common/Loading';

export default function Portfolio() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthStore();
  const { isUpbitConnectModalOpen, openUpbitConnectModal, closeUpbitConnectModal } = useUIStore();
  const { data: status, isLoading: isStatusLoading } = usePortfolioStatus();
  const { data: portfolio, isLoading: isPortfolioLoading, error } = usePortfolio();
  const connectMutation = useConnectUpbit();

  const [accessKey, setAccessKey] = useState('');
  const [secretKey, setSecretKey] = useState('');

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    connectMutation.mutate({ accessKey, secretKey });
  };

  if (isStatusLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading size="lg" />
      </div>
    );
  }

  if (!status?.isConnected) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">{t('portfolio.connectRequired')}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('portfolio.connectDescription')}
          </p>
          <button
            onClick={openUpbitConnectModal}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            {t('portfolio.connect')}
          </button>
        </div>

        <Modal
          isOpen={isUpbitConnectModalOpen}
          onClose={closeUpbitConnectModal}
          title={t('portfolio.apiConnect')}
        >
          <form onSubmit={handleConnect} className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t('portfolio.apiKeyDescription')}
              <br />
              <a
                href="https://upbit.com/mypage/open_api_management"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                {t('portfolio.getApiKey')}
              </a>
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('portfolio.accessKey')}
              </label>
              <input
                type="text"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('portfolio.secretKey')}
              </label>
              <input
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            {connectMutation.error && (
              <p className="text-sm text-red-600">
                {t('portfolio.connectFailed')}
              </p>
            )}

            <button
              type="submit"
              disabled={connectMutation.isPending}
              className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {connectMutation.isPending ? t('portfolio.connecting') : t('portfolio.connectSubmit')}
            </button>
          </form>
        </Modal>
      </div>
    );
  }

  if (isPortfolioLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-600">{t('portfolio.loadError')}</p>
      </div>
    );
  }

  if (!portfolio) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('portfolio.title')}</h1>
      </div>

      <PortfolioSummary portfolio={portfolio} />

      {portfolio.holdings.length > 0 ? (
        <HoldingsList holdings={portfolio.holdings} />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500 dark:text-gray-400">
          {t('portfolio.noHoldings')}
        </div>
      )}
    </div>
  );
}
