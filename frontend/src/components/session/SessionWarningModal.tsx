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

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal
      isOpen={isSessionWarningOpen}
      onClose={onDismiss}
      title={t('session.warningTitle')}
    >
      <div className="text-center">
        <div className="mb-4">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {t('session.warningMessage')}
          </p>
          <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 tabular-nums">
            {t('session.remaining')}: {formatTime(remainingSeconds)}
          </div>
        </div>

        <div className="flex space-x-3 justify-center mt-6">
          <button
            onClick={onExtend}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
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
