import { create } from 'zustand';
import type { Chat, Message } from '@/types';

interface ChatStore {
  chats: Chat[];
  messages: Record<string, Message[]>;
  activeChatId: string | null;
  searchQuery: string;
  loading: boolean;
  setChats: (chats: Chat[]) => void;
  setMessages: (chatId: string, messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (message: Message) => void;
  setActiveChat: (chatId: string | null) => void;
  setSearchQuery: (q: string) => void;
  setLoading: (loading: boolean) => void;
  updateChat: (chat: Chat) => void;
  upsertChat: (chat: Chat) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  chats: [],
  messages: {},
  activeChatId: null,
  searchQuery: '',
  loading: false,
  setChats: (chats) => set({ chats }),
  setMessages: (chatId, messages) =>
    set((state) => ({ messages: { ...state.messages, [chatId]: messages } })),
  addMessage: (message) =>
    set((state) => {
      const list = state.messages[message.chatId] ?? [];
      if (list.some((m) => m.id === message.id)) return state;
      return { messages: { ...state.messages, [message.chatId]: [...list, message] } };
    }),
  updateMessage: (message) =>
    set((state) => {
      const list = state.messages[message.chatId] ?? [];
      return {
        messages: {
          ...state.messages,
          [message.chatId]: list.map((m) => (m.id === message.id ? message : m)),
        },
      };
    }),
  setActiveChat: (chatId) => set({ activeChatId: chatId }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setLoading: (loading) => set({ loading }),
  updateChat: (chat) =>
    set((state) => ({
      chats: state.chats.map((c) => (c.id === chat.id ? chat : c)),
    })),
  upsertChat: (chat) =>
    set((state) => {
      const exists = state.chats.some((c) => c.id === chat.id);
      return {
        chats: exists ? state.chats.map((c) => (c.id === chat.id ? chat : c)) : [chat, ...state.chats],
      };
    }),
}));
