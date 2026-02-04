import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Modal from '../common/Modal';
import { useChatStore } from '../../store/chatStore';
import type { Notification } from '../../types/notification.types';

interface NotificationDetailModalProps {
  notification: Notification | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationDetailModal({
  notification,
  isOpen,
  onClose,
}: NotificationDetailModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { openChat, setActiveConversation } = useChatStore();

  if (!notification) return null;

  const getIcon = () => {
    switch (notification.type) {
      case 'SYSTEM':
        return (
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'PRICE_ALERT':
        return (
          <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
            <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        );
      case 'CHAT':
        return (
          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        );
      case 'ANNOUNCEMENT':
        return (
          <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
            <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
        );
    }
  };

  const getTypeLabel = () => {
    switch (notification.type) {
      case 'SYSTEM': return t('notification.typeSystem');
      case 'PRICE_ALERT': return t('notification.typePriceAlert');
      case 'CHAT': return t('notification.typeChat');
      case 'ANNOUNCEMENT': return t('notification.typeAnnouncement');
      case 'PORTFOLIO': return t('notification.typePortfolio');
      default: return notification.type;
    }
  };

  const getActionButton = () => {
    if (!notification.data) return null;

    switch (notification.type) {
      case 'SYSTEM':
        if (notification.data.type === 'registration_request' && notification.data.userId) {
          return (
            <button
              onClick={() => {
                navigate(`/admin/members/${notification.data!.userId}`);
                onClose();
              }}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
            >
              {t('notification.viewMember')}
            </button>
          );
        }
        return null;
      case 'CHAT':
        if (notification.data.conversationId) {
          return (
            <button
              onClick={() => {
                openChat();
                setActiveConversation(notification.data!.conversationId!);
                onClose();
              }}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
            >
              {t('notification.openChat')}
            </button>
          );
        }
        return null;
      case 'PRICE_ALERT':
        if (notification.data.marketCode) {
          return (
            <button
              onClick={() => {
                navigate(`/coin/${notification.data!.marketCode}`);
                onClose();
              }}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
            >
              {t('notification.viewCoin')}
            </button>
          );
        }
        return null;
      case 'PORTFOLIO':
        return (
          <button
            onClick={() => {
              navigate('/portfolio');
              onClose();
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
          >
            {t('notification.viewPortfolio')}
          </button>
        );
      case 'ANNOUNCEMENT':
        if (notification.data.announcementId) {
          return (
            <button
              onClick={() => {
                navigate(`/announcements/${notification.data!.announcementId}`);
                onClose();
              }}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
            >
              {t('notification.viewAnnouncement')}
            </button>
          );
        }
        return null;
      default:
        return null;
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // 추가 데이터 표시 (login_blocked 등)
  const getExtraInfo = () => {
    if (!notification.data) return null;

    const items: { label: string; value: string }[] = [];

    if (notification.data.ipAddress) {
      items.push({ label: 'IP', value: String(notification.data.ipAddress) });
    }
    if (notification.data.attemptCount) {
      items.push({
        label: t('notification.attemptCount'),
        value: `${notification.data.attemptCount}${t('notification.times')}`,
      });
    }

    if (items.length === 0) return null;

    return (
      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">{item.label}</span>
            <span className="font-medium text-gray-900 dark:text-white">{item.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center">
        {getIcon()}
        <span className="mt-3 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 rounded-full">
          {getTypeLabel()}
        </span>
        <h3 className="mt-3 text-lg font-semibold text-gray-900 dark:text-white">
          {notification.title}
        </h3>
        <p className="mt-2 text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed">
          {notification.message}
        </p>

        {getExtraInfo()}

        <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
          {formatDateTime(notification.createdAt)}
        </p>

        <div className="mt-5 flex items-center gap-3">
          {getActionButton()}
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
          >
            {t('common.confirm')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
