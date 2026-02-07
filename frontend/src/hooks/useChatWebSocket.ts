import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { chatApi } from '../api/chat.api';
import type { Message, Conversation } from '../types/chat.types';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

export function useChatWebSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { accessToken, isAuthenticated, user } = useAuthStore();
  const storeRef = useRef(useChatStore.getState());
  const activeConversationIdRef = useRef<string | null>(null);

  useEffect(() => {
    const unsub = useChatStore.subscribe((state) => {
      storeRef.current = state;
      activeConversationIdRef.current = state.activeConversationId;
    });
    storeRef.current = useChatStore.getState();
    activeConversationIdRef.current = useChatStore.getState().activeConversationId;
    return unsub;
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socket = io(`${WS_URL}/chat`, {
      transports: ['websocket'],
      auth: { token: accessToken },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Chat WebSocket connected');
      // 연결 시 읽지 않은 메시지 수 로드
      chatApi.getUnreadCounts().then((res) => {
        useChatStore.getState().setUnreadCounts(res.data);
      }).catch((err) => {
        console.error('Failed to load unread counts:', err);
      });
    });

    socket.on('message:new', (message: Message) => {
      const store = useChatStore.getState();
      let msg = message;

      if (message.senderId !== user?.id) {
        if (message.conversationId === activeConversationIdRef.current) {
          // 현재 보고 있는 대화에 새 메시지가 온 경우
          // 본인은 이미 읽은 상태이므로 unreadCount에서 1 차감
          if (msg.unreadCount !== undefined && msg.unreadCount > 0) {
            msg = { ...msg, unreadCount: msg.unreadCount - 1 };
          }
          store.addMessage(msg.conversationId, msg);
          // 즉시 읽음 처리
          socket.emit('message:read', { conversationId: msg.conversationId });
          store.markConversationAsRead(msg.conversationId);
        } else {
          store.addMessage(msg.conversationId, msg);
          // 다른 대화의 메시지 → 읽지 않은 카운트 증가
          store.incrementUnreadCount(msg.conversationId);
        }
      } else {
        store.addMessage(msg.conversationId, msg);
      }
    });

    socket.on('conversation:new', (conversation: Conversation) => {
      useChatStore.getState().addConversation(conversation);
    });

    socket.on('conversation:updated', (conversation: Conversation) => {
      useChatStore.getState().replaceConversation(conversation);
    });

    socket.on('message:deleted', ({ messageId, conversationId }: { messageId: string; conversationId: string }) => {
      useChatStore.getState().deleteMessage(conversationId, messageId);
    });

    socket.on('conversation:left', ({ conversationId }: { conversationId: string }) => {
      useChatStore.getState().removeConversation(conversationId);
    });

    socket.on('conversation:userLeft', ({ conversationId }: { conversationId: string }) => {
      // 다른 사용자가 나간 경우, 대화 목록을 새로고침하여 참여자 정보 업데이트
      chatApi.getConversations().then((res) => {
        const conversation = res.data.find((c) => c.id === conversationId);
        if (conversation) {
          useChatStore.getState().replaceConversation(conversation);
        }
      }).catch((err) => {
        console.error('Failed to refresh conversations:', err);
      });
    });

    socket.on(
      'message:read',
      ({
        conversationId,
        userId: readUserId,
        readAt,
        readStatus,
      }: {
        conversationId: string;
        userId: string;
        readAt: string;
        readStatus: { userId: string; lastReadAt: string | null }[];
      }) => {
        // 읽음 상태 업데이트 - 메시지의 unreadCount 재계산
        const store = useChatStore.getState();
        store.updateMessageReadStatus(conversationId, readUserId, readAt, readStatus);
      }
    );

    socket.on(
      'user:status',
      ({ userId, isOnline }: { userId: string; isOnline: boolean }) => {
        useChatStore.getState().setUserOnline(userId, isOnline);
      }
    );

    socket.on(
      'typing:start',
      ({
        conversationId,
        userId,
      }: {
        conversationId: string;
        userId: string;
      }) => {
        useChatStore.getState().setTyping(conversationId, userId, true);
      }
    );

    socket.on(
      'typing:stop',
      ({
        conversationId,
        userId,
      }: {
        conversationId: string;
        userId: string;
      }) => {
        useChatStore.getState().setTyping(conversationId, userId, false);
      }
    );

    socket.on('disconnect', () => {
      console.log('Chat WebSocket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Chat WebSocket error:', error.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, accessToken, user?.id]);

  // activeConversationId가 변경될 때 자동으로 읽음 처리
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  useEffect(() => {
    if (activeConversationId && socketRef.current?.connected) {
      socketRef.current.emit('message:read', {
        conversationId: activeConversationId,
      });
      useChatStore.getState().markConversationAsRead(activeConversationId);
    }
  }, [activeConversationId]);

  const sendMessage = useCallback(
    (conversationId: string, content: string) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('message:send', { conversationId, content });
      }
    },
    []
  );

  const markAsRead = useCallback(
    (conversationId: string) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('message:read', { conversationId });
        useChatStore.getState().markConversationAsRead(conversationId);
      }
    },
    []
  );

  const startTyping = useCallback((conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing:start', { conversationId });
    }
  }, []);

  const stopTyping = useCallback((conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing:stop', { conversationId });
    }
  }, []);

  return {
    sendMessage,
    markAsRead,
    startTyping,
    stopTyping,
    socket: socketRef.current,
  };
}
