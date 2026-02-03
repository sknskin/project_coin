import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
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
    });

    socket.on('message:new', (message: Message) => {
      const store = useChatStore.getState();
      store.addMessage(message.conversationId, message);

      // 현재 보고 있는 대화가 아니고, 내가 보낸 메시지가 아니면 읽지 않은 카운트 증가
      if (
        message.conversationId !== activeConversationIdRef.current &&
        message.senderId !== user?.id
      ) {
        store.incrementUnreadCount(message.conversationId);
      }
    });

    socket.on('conversation:new', (conversation: Conversation) => {
      useChatStore.getState().addConversation(conversation);
    });

    socket.on(
      'message:read',
      ({
        conversationId,
        userId,
      }: {
        conversationId: string;
        userId: string;
        readAt: string;
      }) => {
        console.log(`User ${userId} read conversation ${conversationId}`);
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
