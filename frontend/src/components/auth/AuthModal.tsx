import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../common/Modal';
import ConfirmModal from '../common/ConfirmModal';
import { useUIStore } from '../../store/uiStore';
import { useAuth } from '../../hooks/useAuth';

export default function AuthModal() {
  const { t } = useTranslation();
  const { isAuthModalOpen, authModalMode, closeAuthModal } = useUIStore();
  const { login, register, isLoggingIn, isRegistering, loginError, registerError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authModalMode === 'login') {
      login({ email, password });
    } else {
      // 회원가입인 경우 확인 모달 표시
      setIsConfirmModalOpen(true);
    }
  };

  const handleRegisterConfirm = () => {
    register({ email, password, nickname: nickname || undefined });
    setIsConfirmModalOpen(false);
  };

  const error = authModalMode === 'login' ? loginError : registerError;
  const isLoading = authModalMode === 'login' ? isLoggingIn : isRegistering;

  return (
    <Modal
      isOpen={isAuthModalOpen}
      onClose={closeAuthModal}
      title={authModalMode === 'login' ? t('auth.login') : t('auth.register')}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('auth.email')}
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('auth.password')}
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
            minLength={8}
          />
        </div>

        {authModalMode === 'register' && (
          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('auth.nicknameOptional')}
            </label>
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600">
            {(error as Error).message || t('auth.error')}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading
            ? t('auth.processing')
            : authModalMode === 'login'
              ? t('auth.login')
              : t('auth.register')}
        </button>
      </form>

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleRegisterConfirm}
        title={t('auth.register')}
        message={t('auth.registerConfirm', { email })}
        confirmText={t('auth.register')}
        cancelText={t('common.cancel')}
        isLoading={isRegistering}
      />
    </Modal>
  );
}
