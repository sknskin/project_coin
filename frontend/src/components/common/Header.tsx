import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useAuth } from '../../hooks/useAuth';
import { useSessionTimer } from '../../hooks/useSessionTimer';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';
import ConfirmModal from './ConfirmModal';

export default function Header() {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuthStore();
  const { openAuthModal } = useUIStore();
  const { logout } = useAuth();
  const { formattedTime, isExpiringSoon } = useSessionTimer();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  const handleLogoutConfirm = () => {
    logout();
    setIsLogoutModalOpen(false);
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-xl font-bold text-primary-600 dark:text-primary-400">
              Project Coin
            </Link>
            <nav className="hidden md:flex space-x-6">
              <Link
                to="/"
                className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                {t('nav.home')}
              </Link>
              <Link
                to="/coins"
                className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                {t('nav.price')}
              </Link>
              {isAuthenticated && (
                <Link
                  to="/portfolio"
                  className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  {t('nav.portfolio')}
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center space-x-3">
            <ThemeToggle />
            <LanguageToggle />
            {isAuthenticated ? (
              <>
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-gray-600 dark:text-gray-300">
                    {user?.nickname || user?.email}{t('auth.userSuffix')}
                  </span>
                  <span
                    className={`font-mono tabular-nums px-2 py-0.5 rounded ${
                      isExpiringSoon
                        ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {formattedTime}
                  </span>
                </div>
                <button
                  onClick={handleLogoutClick}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  {t('auth.logout')}
                </button>
                <ConfirmModal
                  isOpen={isLogoutModalOpen}
                  onClose={() => setIsLogoutModalOpen(false)}
                  onConfirm={handleLogoutConfirm}
                  title={t('auth.logout')}
                  message={t('auth.logoutConfirm')}
                  confirmText={t('auth.logout')}
                  cancelText={t('common.cancel')}
                  variant="danger"
                />
              </>
            ) : (
              <>
                <button
                  onClick={() => openAuthModal('login')}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  {t('auth.login')}
                </button>
                <button
                  onClick={() => openAuthModal('register')}
                  className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {t('auth.register')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
