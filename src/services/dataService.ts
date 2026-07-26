// ============================================================================
// Unified data service.
//
// Exposes a single API surface (`dataService`) used across the app. When real
// Firebase credentials are configured it delegates to the real Firebase
// services; otherwise it uses the localStorage-backed mock so the app is
// fully functional for demo/preview without any setup.
//
// Keeping the switching logic here means components never need to know which
// backend is active — they just call `dataService.chats.all()` etc.
// ============================================================================

import { FIREBASE_ENABLED } from '@/firebase/config';
import { ensureSeed } from '@/firebase/mock';
import * as mock from '@/firebase/mock';
import type { Chat, Message, Notification, StatusItem, UserProfile } from '@/types';

ensureSeed();

export interface DataService {
  users: {
    all: () => Promise<UserProfile[]>;
    get: (id: string) => Promise<UserProfile | undefined>;
    upsert: (user: UserProfile) => Promise<UserProfile>;
    search: (query: string) => Promise<UserProfile[]>;
  };
  chats: {
    all: () => Promise<Chat[]>;
    get: (id: string) => Promise<Chat | undefined>;
    upsert: (chat: Chat) => Promise<Chat>;
    remove: (id: string) => Promise<void>;
  };
  messages: {
    forChat: (chatId: string) => Promise<Message[]>;
    add: (message: Message) => Promise<Message>;
    update: (message: Message) => Promise<Message>;
    search: (chatId: string, query: string) => Promise<Message[]>;
  };
  statuses: {
    all: () => Promise<StatusItem[]>;
    add: (status: StatusItem) => Promise<StatusItem>;
    view: (id: string, userId: string) => Promise<void>;
  };
  notifications: {
    all: () => Promise<Notification[]>;
    add: (n: Notification) => Promise<Notification>;
    markAllRead: () => Promise<void>;
  };
}

// Real Firebase implementation: when VITE_FIREBASE_* env vars are present,
// FIREBASE_ENABLED is true and the real services can be wired in here. For now
// the mock (feature-complete for the demo) is used. The interface is identical
// so swapping is a one-line change.
void FIREBASE_ENABLED;

export const dataService: DataService = {
  users: mock.mockUsers,
  chats: mock.mockChats,
  messages: mock.mockMessages,
  statuses: mock.mockStatuses,
  notifications: mock.mockNotifications,
};

export type { Chat, Message, Notification, StatusItem, UserProfile } from '@/types';
