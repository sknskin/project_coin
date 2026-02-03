import { create } from 'zustand';
import type { Conversation, Message } from '../types/chat.types';

interface ChatPosition {
  x: number;
  y: number;
}

interface ChatSize {
  width: number;
  height: number;
}

interface ChatState {
  // UI 상태
  isChatOpen: boolean;
  activeConversationId: string | null;

  // 위치 및 크기
  chatPosition: ChatPosition;
  chatSize: ChatSize;

  // 데이터
  conversations: Conversation[];
  messages: Map<string, Message[]>;
  unreadCounts: Record<string, number>;
  onlineUsers: Set<string>;
  typingUsers: Map<string, string[]>;

  // 로딩 상태
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;

  // UI 액션
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  setActiveConversation: (id: string | null) => void;
  setChatPosition: (position: ChatPosition) => void;
  setChatSize: (size: ChatSize) => void;
  resetChatPositionAndSize: () => void;

  // 데이터 액션
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (conversationId: string, updates: Partial<Conversation>) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (conversationId: string, message: Message) => void;
  prependMessages: (conversationId: string, messages: Message[]) => void;

  // 읽음 상태
  setUnreadCounts: (counts: Record<string, number>) => void;
  markConversationAsRead: (conversationId: string) => void;
  incrementUnreadCount: (conversationId: string) => void;
  getTotalUnreadCount: () => number;
  getConversationsWithUnreadCount: () => number;

  // 온라인 상태
  setUserOnline: (userId: string, isOnline: boolean) => void;

  // 타이핑 상태
  setTyping: (conversationId: string, userId: string, isTyping: boolean) => void;

  // 로딩
  setLoadingConversations: (loading: boolean) => void;
  setLoadingMessages: (loading: boolean) => void;

  // 리셋
  reset: () => void;
}

const DEFAULT_CHAT_POSITION = { x: window.innerWidth - 400, y: 80 };
const DEFAULT_CHAT_SIZE = { width: 380, height: 500 };

export const useChatStore = create<ChatState>((set, get) => ({
  isChatOpen: false,
  activeConversationId: null,
  chatPosition: DEFAULT_CHAT_POSITION,
  chatSize: DEFAULT_CHAT_SIZE,
  conversations: [],
  messages: new Map(),
  unreadCounts: {},
  onlineUsers: new Set(),
  typingUsers: new Map(),
  isLoadingConversations: false,
  isLoadingMessages: false,

  openChat: () => set({ isChatOpen: true }),
  closeChat: () => set({ isChatOpen: false, activeConversationId: null }),
  toggleChat: () =>
    set((state) => ({
      isChatOpen: !state.isChatOpen,
      activeConversationId: state.isChatOpen ? null : state.activeConversationId,
    })),

  setActiveConversation: (id) => set({ activeConversationId: id }),
  setChatPosition: (position) => set({ chatPosition: position }),
  setChatSize: (size) => set({ chatSize: size }),
  resetChatPositionAndSize: () => set({
    chatPosition: { x: window.innerWidth - 400, y: 80 },
    chatSize: DEFAULT_CHAT_SIZE
  }),

  setConversations: (conversations) => {
    const unreadCounts: Record<string, number> = {};
    conversations.forEach((conv) => {
      if (conv.unreadCount !== undefined) {
        unreadCounts[conv.id] = conv.unreadCount;
      }
    });
    set({ conversations, unreadCounts });
  },

  addConversation: (conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations],
    })),

  updateConversation: (conversationId, updates) =>
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, ...updates } : conv
      ),
    })),

  setMessages: (conversationId, messages) =>
    set((state) => {
      const newMessages = new Map(state.messages);
      newMessages.set(conversationId, messages);
      return { messages: newMessages };
    }),

  addMessage: (conversationId, message) =>
    set((state) => {
      const newMessages = new Map(state.messages);
      const existing = newMessages.get(conversationId) || [];

      // 중복 메시지 체크 - 같은 ID의 메시지가 이미 있으면 추가하지 않음
      if (existing.some((m) => m.id === message.id)) {
        return state;
      }

      // 서버 메시지가 도착하면 같은 내용의 temp 메시지를 교체
      let updated = existing;
      if (!message.id.startsWith('temp-')) {
        const tempIdx = existing.findIndex(
          (m) => m.id.startsWith('temp-') && m.senderId === message.senderId && m.content === message.content
        );
        if (tempIdx !== -1) {
          updated = [...existing];
          updated[tempIdx] = message;
          newMessages.set(conversationId, updated);

          const conversations = [...state.conversations];
          const idx = conversations.findIndex((c) => c.id === conversationId);
          if (idx > -1) {
            const [conv] = conversations.splice(idx, 1);
            conv.messages = [message];
            conv.updatedAt = message.createdAt;
            conversations.unshift(conv);
          }
          return { messages: newMessages, conversations };
        }
      }

      newMessages.set(conversationId, [...existing, message]);

      // 대화 목록에서 해당 대화를 맨 위로 이동
      const conversations = [...state.conversations];
      const idx = conversations.findIndex((c) => c.id === conversationId);
      if (idx > -1) {
        const [conv] = conversations.splice(idx, 1);
        conv.messages = [message];
        conv.updatedAt = message.createdAt;
        conversations.unshift(conv);
      }

      return { messages: newMessages, conversations };
    }),

  prependMessages: (conversationId, messages) =>
    set((state) => {
      const newMessagesMap = new Map(state.messages);
      const existing = newMessagesMap.get(conversationId) || [];
      newMessagesMap.set(conversationId, [...messages, ...existing]);
      return { messages: newMessagesMap };
    }),

  setUnreadCounts: (counts) => set({ unreadCounts: { ...counts } }),

  markConversationAsRead: (conversationId) =>
    set((state) => ({
      unreadCounts: { ...state.unreadCounts, [conversationId]: 0 },
    })),

  incrementUnreadCount: (conversationId) =>
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [conversationId]: (state.unreadCounts[conversationId] || 0) + 1,
      },
    })),

  getTotalUnreadCount: () => {
    const counts = get().unreadCounts;
    return Object.values(counts).reduce((sum, c) => sum + c, 0);
  },

  getConversationsWithUnreadCount: () => {
    const counts = get().unreadCounts;
    return Object.values(counts).filter((c) => c > 0).length;
  },

  setUserOnline: (userId, isOnline) =>
    set((state) => {
      const newOnlineUsers = new Set(state.onlineUsers);
      if (isOnline) {
        newOnlineUsers.add(userId);
      } else {
        newOnlineUsers.delete(userId);
      }
      return { onlineUsers: newOnlineUsers };
    }),

  setTyping: (conversationId, userId, isTyping) =>
    set((state) => {
      const newTypingUsers = new Map(state.typingUsers);
      const current = newTypingUsers.get(conversationId) || [];
      if (isTyping && !current.includes(userId)) {
        newTypingUsers.set(conversationId, [...current, userId]);
      } else if (!isTyping) {
        newTypingUsers.set(
          conversationId,
          current.filter((id) => id !== userId)
        );
      }
      return { typingUsers: newTypingUsers };
    }),

  setLoadingConversations: (loading) => set({ isLoadingConversations: loading }),
  setLoadingMessages: (loading) => set({ isLoadingMessages: loading }),

  reset: () =>
    set({
      isChatOpen: false,
      activeConversationId: null,
      chatPosition: { x: window.innerWidth - 400, y: 80 },
      chatSize: DEFAULT_CHAT_SIZE,
      conversations: [],
      messages: new Map(),
      unreadCounts: {},
      onlineUsers: new Set(),
      typingUsers: new Map(),
      isLoadingConversations: false,
      isLoadingMessages: false,
    }),
}));
