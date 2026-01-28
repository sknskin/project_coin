import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import type { Notification } from '../types/notification.types';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

export function useNotificationWebSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { accessToken, isAuthenticated } = useAuthStore();
  const { addNotification, setUnreadCount } = useNotificationStore();

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socket = io(`${WS_URL}/notification`, {
      transports: ['websocket'],
      auth: { token: accessToken },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Notification WebSocket connected');
    });

    socket.on('notification:new', (notification: Notification) => {
      addNotification(notification);

      // 브라우저 알림 표시
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
        });
      }
    });

    socket.on('notification:unread-count', ({ count }: { count: number }) => {
      setUnreadCount(count);
    });

    socket.on('disconnect', () => {
      console.log('Notification WebSocket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Notification WebSocket error:', error.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, accessToken, addNotification, setUnreadCount]);

  return socketRef.current;
}
