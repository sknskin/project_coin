export interface ChatUser {
  id: string;
  email: string;
  nickname: string | null;
  role?: 'ADMIN' | 'USER';
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender: ChatUser;
  content: string;
  createdAt: string;
  isDeleted: boolean;
}

export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId: string;
  user: ChatUser;
  joinedAt: string;
  lastReadAt: string | null;
}

export interface Conversation {
  id: string;
  participants: ConversationParticipant[];
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  unreadCount?: number;
}
