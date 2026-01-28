import { useRef, useEffect } from 'react';
import { useNotificationStore } from '../../store/notificationStore';
import { useChatStore } from '../../store/chatStore';
import NotificationDropdown from './NotificationDropdown';

export default function NotificationIcon() {
  const { unreadCount: systemUnreadCount, isDropdownOpen, setDropdownOpen } = useNotificationStore();
  const { getConversationsWithUnreadCount } = useChatStore();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 시스템 알림 + 읽지 않은 채팅 대화 수
  const chatConversationsWithUnread = getConversationsWithUnreadCount();
  const totalUnreadCount = systemUnreadCount + chatConversationsWithUnread;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen, setDropdownOpen]);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setDropdownOpen(!isDropdownOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        aria-label="Notifications"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {totalUnreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
            {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
          </span>
        )}
      </button>
      {isDropdownOpen && (
        <NotificationDropdown onClose={() => setDropdownOpen(false)} />
      )}
    </div>
  );
}
