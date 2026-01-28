import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../common/Modal';
import { chatApi } from '../../api/chat.api';
import { useChatStore } from '../../store/chatStore';
import type { ChatUser } from '../../types/chat.types';
import Loading from '../common/Loading';

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewConversationModal({
  isOpen,
  onClose,
}: NewConversationModalProps) {
  const { t } = useTranslation();
  const { addConversation, setActiveConversation } = useChatStore();
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const response = await chatApi.getAvailableUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectUser = async (userId: string) => {
    setIsCreating(true);
    try {
      const response = await chatApi.createConversation([userId]);
      addConversation(response.data);
      setActiveConversation(response.data.id);
      onClose();
    } catch (error) {
      console.error('Failed to create conversation:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(query) ||
      (user.nickname?.toLowerCase().includes(query) ?? false)
    );
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('chat.newConversation')}>
      <div className="space-y-4">
        {/* Search Input */}
        <div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('chat.searchUsers')}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* User List */}
        <div className="max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loading size="md" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              {searchQuery ? t('chat.noUsersFound') : t('chat.noUsers')}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user.id)}
                  disabled={isCreating}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 text-left ${
                    user.role === 'ADMIN' ? 'bg-amber-50 dark:bg-amber-900/20' : ''
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    user.role === 'ADMIN'
                      ? 'bg-amber-100 dark:bg-amber-900'
                      : 'bg-primary-100 dark:bg-primary-900'
                  }`}>
                    <span className={`font-semibold ${
                      user.role === 'ADMIN'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-primary-600 dark:text-primary-400'
                    }`}>
                      {(user.nickname || user.email).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {user.nickname || user.email}
                      </p>
                      {user.role === 'ADMIN' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                          Admin
                        </span>
                      )}
                    </div>
                    {user.nickname && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {user.email}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
