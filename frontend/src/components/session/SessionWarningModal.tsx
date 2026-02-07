import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../common/Modal';
import { useSessionStore } from '../../store/sessionStore';

interface SessionWarningModalProps {
  onExtend: () => void;
  onDismiss: () => void;
}

export default function SessionWarningModal({ onExtend, onDismiss }: SessionWarningModalProps) {
  const { t } = useTranslation();
  const { isSessionWarningOpen, remainingSeconds } = useSessionStore();

  const isExpired = remainingSeconds <= 0;

  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Auto-trigger extend check when expired (the hook will handle logout)
  useEffect(() => {
    if (isExpired && isSessionWarningOpen) {
      // Give a short delay for the user to see 00:00, then the hook will handle logout
      const timer = setTimeout(() => {
        onExtend(); // This will trigger forceLogout in the hook
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isExpired, isSessionWarningOpen, onExtend]);

  return (
    <Modal
      isOpen={isSessionWarningOpen}
      onClose={onDismiss}
      title={t('session.warningTitle')}
    >
      <div className="text-center">
        <div className="mb-4">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {isExpired ? t('session.expired') : t('session.warningMessage')}
          </p>
          <div className={`text-3xl font-bold tabular-nums ${isExpired ? 'text-red-600' : 'text-primary-600 dark:text-primary-400'}`}>
            {t('session.remaining')}: {formatTime(remainingSeconds)}
          </div>
        </div>

        <div className="flex space-x-3 justify-center mt-6">
          <button
            onClick={onExtend}
            disabled={isExpired}
            className={`px-6 py-2 rounded-lg transition-colors ${
              isExpired
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            {t('session.extend')}
          </button>
          <button
            onClick={onDismiss}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {t('session.cancel')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
