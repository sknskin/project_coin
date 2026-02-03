import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import type { Conversation } from '../../types/chat.types';

interface ConversationItemProps {
  conversation: Conversation;
}

export default function ConversationItem({ conversation }: ConversationItemProps) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { setActiveConversation, unreadCounts, onlineUsers } = useChatStore();

  // 상대방 찾기
  const otherParticipant = conversation.participants.find(
    (p) => p.userId !== user?.id
  );
  const displayName =
    otherParticipant?.user.nickname || otherParticipant?.user.email || t('chat.unknown');

  const lastMessage = conversation.messages[0];
  const unreadCount = unreadCounts[conversation.id] || 0;
  const isOnline = otherParticipant
    ? onlineUsers.has(otherParticipant.userId)
    : false;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <button
      onClick={() => setActiveConversation(conversation.id)}
      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
          <span className="text-primary-600 dark:text-primary-400 font-semibold">
            {displayName.charAt(0).toUpperCase()}
          </span>
        </div>
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-900 dark:text-white truncate">
            {displayName}
          </span>
          {lastMessage && (
            <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 ml-2">
              {formatTime(lastMessage.createdAt)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {lastMessage
              ? lastMessage.senderId === user?.id
                ? `${t('chat.you')}: ${lastMessage.content}`
                : lastMessage.content
              : t('chat.noMessages')}
          </p>
          {unreadCount > 0 && (
            <span className="bg-primary-600 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 flex-shrink-0 ml-2">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
