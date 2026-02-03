import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useChatStore } from '../../store/chatStore';
import { useChatWebSocket } from '../../hooks/useChatWebSocket';
import { chatApi } from '../../api/chat.api';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';

const MIN_WIDTH = 320;
const MAX_WIDTH = 600;
const MIN_HEIGHT = 400;
const MAX_HEIGHT = window.innerHeight - 100;

export default function ChatSidebar() {
  const { t } = useTranslation();
  const {
    isChatOpen,
    closeChat,
    activeConversationId,
    setConversations,
    setUnreadCounts,
    setLoadingConversations,
    chatPosition,
    chatSize,
    setChatPosition,
    setChatSize,
    resetChatPositionAndSize,
  } = useChatStore();

  const { sendMessage, markAsRead, startTyping, stopTyping } = useChatWebSocket();

  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0, posX: 0, posY: 0 });

  useEffect(() => {
    if (isChatOpen) {
      loadConversations();
    }
  }, [isChatOpen]);

  // ESC 키로 채팅창 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isChatOpen) {
        closeChat();
      }
    };

    if (isChatOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isChatOpen, closeChat]);

  const loadConversations = async () => {
    setLoadingConversations(true);
    try {
      const [convRes, unreadRes] = await Promise.all([
        chatApi.getConversations(),
        chatApi.getUnreadCounts(),
      ]);
      setConversations(convRes.data);
      setUnreadCounts(unreadRes.data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoadingConversations(false);
    }
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, textarea')) return;
    e.preventDefault();
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - chatPosition.x,
      y: e.clientY - chatPosition.y,
    };
  }, [chatPosition]);

  const handleResizeStart = useCallback((e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      width: chatSize.width,
      height: chatSize.height,
      posX: chatPosition.x,
      posY: chatPosition.y,
    };
  }, [chatSize, chatPosition]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = Math.max(0, Math.min(e.clientX - dragOffset.current.x, window.innerWidth - chatSize.width));
        const newY = Math.max(0, Math.min(e.clientY - dragOffset.current.y, window.innerHeight - chatSize.height));
        setChatPosition({ x: newX, y: newY });
      }

      if (isResizing && resizeDirection) {
        const deltaX = e.clientX - resizeStart.current.x;
        const deltaY = e.clientY - resizeStart.current.y;
        let newWidth = resizeStart.current.width;
        let newHeight = resizeStart.current.height;
        let newX = resizeStart.current.posX;
        let newY = resizeStart.current.posY;

        if (resizeDirection.includes('w')) {
          newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, resizeStart.current.width - deltaX));
          newX = resizeStart.current.posX + (resizeStart.current.width - newWidth);
        }
        if (resizeDirection.includes('e')) {
          newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, resizeStart.current.width + deltaX));
        }
        if (resizeDirection.includes('n')) {
          newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, resizeStart.current.height - deltaY));
          newY = resizeStart.current.posY + (resizeStart.current.height - newHeight);
        }
        if (resizeDirection.includes('s')) {
          newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, resizeStart.current.height + deltaY));
        }

        setChatSize({ width: newWidth, height: newHeight });
        setChatPosition({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeDirection(null);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging, isResizing, resizeDirection, chatSize, setChatPosition, setChatSize]);

  if (!isChatOpen) return null;

  return (
    <div
      ref={containerRef}
      className="fixed bg-white dark:bg-gray-800 shadow-2xl z-50 flex flex-col rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
      style={{
        left: chatPosition.x,
        top: chatPosition.y,
        width: chatSize.width,
        height: chatSize.height,
      }}
    >
      {/* Resize handles */}
      <div
        className="absolute left-0 top-0 w-2 h-full cursor-ew-resize hover:bg-primary-500/20"
        onMouseDown={(e) => handleResizeStart(e, 'w')}
      />
      <div
        className="absolute right-0 top-0 w-2 h-full cursor-ew-resize hover:bg-primary-500/20"
        onMouseDown={(e) => handleResizeStart(e, 'e')}
      />
      <div
        className="absolute top-0 left-0 w-full h-2 cursor-ns-resize hover:bg-primary-500/20"
        onMouseDown={(e) => handleResizeStart(e, 'n')}
      />
      <div
        className="absolute bottom-0 left-0 w-full h-2 cursor-ns-resize hover:bg-primary-500/20"
        onMouseDown={(e) => handleResizeStart(e, 's')}
      />
      {/* Corner resize handles */}
      <div
        className="absolute left-0 top-0 w-4 h-4 cursor-nwse-resize"
        onMouseDown={(e) => handleResizeStart(e, 'nw')}
      />
      <div
        className="absolute right-0 top-0 w-4 h-4 cursor-nesw-resize"
        onMouseDown={(e) => handleResizeStart(e, 'ne')}
      />
      <div
        className="absolute left-0 bottom-0 w-4 h-4 cursor-nesw-resize"
        onMouseDown={(e) => handleResizeStart(e, 'sw')}
      />
      <div
        className="absolute right-0 bottom-0 w-4 h-4 cursor-nwse-resize"
        onMouseDown={(e) => handleResizeStart(e, 'se')}
      />

      {/* Header - Draggable */}
      <div
        className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 cursor-move bg-gray-50 dark:bg-gray-900 select-none"
        onMouseDown={handleMouseDown}
      >
        <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {t('chat.title')}
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={resetChatPositionAndSize}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Reset position"
          >
            <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={closeChat}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <svg
              className="w-5 h-5 text-gray-500 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeConversationId ? (
          <ChatWindow
            conversationId={activeConversationId}
            onSendMessage={sendMessage}
            onMarkAsRead={markAsRead}
            onStartTyping={startTyping}
            onStopTyping={stopTyping}
          />
        ) : (
          <ConversationList />
        )}
      </div>
    </div>
  );
}
