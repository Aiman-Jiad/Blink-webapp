// ============================================================================
// LocalStorage-backed mock backend.
//
// Implements the same async API the app expects from Firebase, so the UI is
// fully functional in demo mode (no Firebase project required). When real
// Firebase credentials are provided, the real services in `./real` are used
// instead and this module is only kept for seeding demo content.
// ============================================================================

import { nanoid } from 'nanoid';
import type {
  UserProfile,
  Message,
  Chat,
  StatusItem,
  Notification,
} from '@/types';

const KEYS = {
  users: 'blink:users',
  chats: 'blink:chats',
  messages: 'blink:messages',
  statuses: 'blink:statuses',
  notifications: 'blink:notifications',
  session: 'blink:session',
  seeded: 'blink:seeded',
} as const;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('localStorage write failed', e);
  }
}

// ---------------------------------------------------------------------------
// Demo seed data — gives the app a lived-in feel on first run.
// ---------------------------------------------------------------------------

const SEED_USERS: UserProfile[] = [
  {
    id: 'u_alice',
    name: 'Alice Chen',
    username: 'alice',
    email: 'alice@blink.app',
    about: 'Designing things that feel alive ✦',
    photoURL: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    status: 'online',
    lastSeen: Date.now(),
    online: true,
    createdAt: Date.now() - 86400000 * 30,
    readReceiptsEnabled: true,
  },
  {
    id: 'u_marcus',
    name: 'Marcus Reid',
    username: 'marcus',
    email: 'marcus@blink.app',
    about: 'Coffee. Code. Repeat.',
    photoURL: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    status: 'offline',
    lastSeen: Date.now() - 1000 * 60 * 12,
    online: false,
    createdAt: Date.now() - 86400000 * 45,
    readReceiptsEnabled: true,
  },
  {
    id: 'u_sofia',
    name: 'Sofia Romano',
    username: 'sofia',
    email: 'sofia@blink.app',
    about: 'Photographer 📷 | Traveler',
    photoURL: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    status: 'online',
    lastSeen: Date.now(),
    online: true,
    createdAt: Date.now() - 86400000 * 20,
    readReceiptsEnabled: false,
  },
  {
    id: 'u_kenji',
    name: 'Kenji Tanaka',
    username: 'kenji',
    email: 'kenji@blink.app',
    about: 'Building the future, one line at a time',
    photoURL: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    status: 'away',
    lastSeen: Date.now() - 1000 * 60 * 60 * 3,
    online: false,
    createdAt: Date.now() - 86400000 * 60,
    readReceiptsEnabled: true,
  },
  {
    id: 'u_priya',
    name: 'Priya Sharma',
    username: 'priya',
    email: 'priya@blink.app',
    about: 'Product @ Blink. Cat parent.',
    photoURL: 'https://images.pexels.com/photos/762020/pexels-photo-762020.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    status: 'offline',
    lastSeen: Date.now() - 1000 * 60 * 60 * 8,
    online: false,
    createdAt: Date.now() - 86400000 * 15,
    readReceiptsEnabled: true,
  },
];

const SEED_CHATS: Chat[] = [
  {
    id: 'c_alice',
    type: 'direct',
    participants: [
      { userId: 'me', role: 'member', joinedAt: Date.now() - 86400000 * 5 },
      { userId: 'u_alice', role: 'member', joinedAt: Date.now() - 86400000 * 5 },
    ],
    participantIds: ['me', 'u_alice'],
    lastMessage: { text: 'Perfect, see you then! 🎉', senderId: 'u_alice', type: 'text', createdAt: Date.now() - 1000 * 60 * 5 },
    unreadCount: { me: 2 },
    pinnedBy: ['me'],
    archivedBy: [],
    favouriteBy: ['me'],
    mutedBy: [],
    createdBy: 'me',
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 1000 * 60 * 5,
    typingUsers: ['u_alice'],
  },
  {
    id: 'c_design_team',
    type: 'group',
    name: 'Design Team',
    description: 'Where pixels become products.',
    photoURL: null,
    participants: [
      { userId: 'me', role: 'admin', joinedAt: Date.now() - 86400000 * 10 },
      { userId: 'u_alice', role: 'admin', joinedAt: Date.now() - 86400000 * 10 },
      { userId: 'u_sofia', role: 'member', joinedAt: Date.now() - 86400000 * 9 },
      { userId: 'u_priya', role: 'member', joinedAt: Date.now() - 86400000 * 8 },
    ],
    participantIds: ['me', 'u_alice', 'u_sofia', 'u_priya'],
    lastMessage: { text: 'Sofia: Just pushed the new mockups to Figma', senderId: 'u_sofia', type: 'text', createdAt: Date.now() - 1000 * 60 * 60 },
    unreadCount: { me: 5 },
    pinnedBy: [],
    archivedBy: [],
    favouriteBy: [],
    mutedBy: [],
    createdBy: 'me',
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now() - 1000 * 60 * 60,
    typingUsers: [],
  },
  {
    id: 'c_marcus',
    type: 'direct',
    participants: [
      { userId: 'me', role: 'member', joinedAt: Date.now() - 86400000 * 3 },
      { userId: 'u_marcus', role: 'member', joinedAt: Date.now() - 86400000 * 3 },
    ],
    participantIds: ['me', 'u_marcus'],
    lastMessage: { text: 'Did you see the new React 19 features?', senderId: 'u_marcus', type: 'text', createdAt: Date.now() - 1000 * 60 * 60 * 2 },
    unreadCount: { me: 0 },
    pinnedBy: [],
    archivedBy: [],
    favouriteBy: ['me'],
    mutedBy: [],
    createdBy: 'me',
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 1000 * 60 * 60 * 2,
    typingUsers: [],
  },
  {
    id: 'c_kenji',
    type: 'direct',
    participants: [
      { userId: 'me', role: 'member', joinedAt: Date.now() - 86400000 * 7 },
      { userId: 'u_kenji', role: 'member', joinedAt: Date.now() - 86400000 * 7 },
    ],
    participantIds: ['me', 'u_kenji'],
    lastMessage: { text: 'You: Sounds good, let me review the PR', senderId: 'me', type: 'text', createdAt: Date.now() - 1000 * 60 * 60 * 8 },
    unreadCount: { me: 0 },
    pinnedBy: [],
    archivedBy: [],
    favouriteBy: [],
    mutedBy: [],
    createdBy: 'me',
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 1000 * 60 * 60 * 8,
    typingUsers: [],
  },
];

function seedMessages(): Record<string, Message[]> {
  const now = Date.now();
  return {
    c_alice: [
      mkMsg('c_alice', 'u_alice', 'text', 'Hey! Are we still on for the design review tomorrow?', now - 1000 * 60 * 30),
      mkMsg('c_alice', 'me', 'text', 'Absolutely! 2pm works for me', now - 1000 * 60 * 28),
      mkMsg('c_alice', 'u_alice', 'text', 'Great. I will share the agenda shortly', now - 1000 * 60 * 25),
      mkMsg('c_alice', 'u_alice', 'image', '', now - 1000 * 60 * 20, [{
        id: nanoid(), type: 'image', url: 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=600',
        name: 'agenda.png', size: 240000, mimeType: 'image/png',
      }]),
      mkMsg('c_alice', 'me', 'text', 'Looks fantastic! Love the new layout', now - 1000 * 60 * 15),
      mkMsg('c_alice', 'u_alice', 'text', 'Perfect, see you then! 🎉', now - 1000 * 60 * 5, [], { id: nanoid(), emoji: '❤️', userId: 'me', createdAt: now - 1000 * 60 * 4 }),
    ],
    c_design_team: [
      mkMsg('c_design_team', 'u_alice', 'text', 'Morning team! Big day today', now - 1000 * 60 * 180),
      mkMsg('c_design_team', 'u_sofia', 'text', 'Morning! Coffee in hand ☕', now - 1000 * 60 * 178),
      mkMsg('c_design_team', 'u_priya', 'text', 'I pushed the user research summary to Notion', now - 1000 * 60 * 120),
      mkMsg('c_design_team', 'u_sofia', 'text', 'Just pushed the new mockups to Figma', now - 1000 * 60 * 60),
    ],
    c_marcus: [
      mkMsg('c_marcus', 'u_marcus', 'text', 'Did you see the new React 19 features?', now - 1000 * 60 * 60 * 2),
      mkMsg('c_marcus', 'me', 'text', 'The Actions API looks wild', now - 1000 * 60 * 60 * 2 + 60000),
    ],
    c_kenji: [
      mkMsg('c_kenji', 'u_kenji', 'text', 'Opened a PR for the auth refactor', now - 1000 * 60 * 60 * 9),
      mkMsg('c_kenji', 'me', 'text', 'Sounds good, let me review the PR', now - 1000 * 60 * 60 * 8),
    ],
  };
}

function mkMsg(
  chatId: string,
  senderId: string,
  type: Message['type'],
  text: string,
  createdAt: number,
  attachments: Message['attachments'] = [],
  reaction?: { id: string; emoji: string; userId: string; createdAt: number },
): Message {
  return {
    id: nanoid(),
    chatId,
    senderId,
    type,
    text,
    attachments,
    status: senderId === 'me' ? 'read' : 'delivered',
    reactions: reaction ? [reaction] : [],
    starred: false,
    pinned: false,
    deletedForEveryone: false,
    deletedFor: [],
    readBy: ['me', senderId],
    replyTo: null,
    forwardedFrom: null,
    createdAt,
  };
}

const SEED_STATUSES: StatusItem[] = [
  {
    id: nanoid(),
    userId: 'u_sofia',
    type: 'image',
    content: 'https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg?auto=compress&cs=tinysrgb&w=600',
    caption: 'Golden hour in Lisbon 🌅',
    viewers: [],
    createdAt: Date.now() - 1000 * 60 * 30,
    expiresAt: Date.now() + 1000 * 60 * 60 * 23,
  },
  {
    id: nanoid(),
    userId: 'u_marcus',
    type: 'text',
    content: 'Shipping is a feature.',
    background: 'gradient-sunset',
    viewers: [{ userId: 'me', viewedAt: Date.now() - 1000 * 60 * 10 }],
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
    expiresAt: Date.now() + 1000 * 60 * 60 * 22,
  },
];

export function ensureSeed(): void {
  if (read(KEYS.seeded, false)) return;
  write(KEYS.users, SEED_USERS);
  write(KEYS.chats, SEED_CHATS);
  write(KEYS.messages, seedMessages());
  write(KEYS.statuses, SEED_STATUSES);
  write(KEYS.notifications, [] as Notification[]);
  write(KEYS.seeded, true);
}

// ---------------------------------------------------------------------------
// Generic async helpers (simulate network latency)
// ---------------------------------------------------------------------------

function delay<T>(value: T, ms = 120): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export const mockUsers = {
  async all(): Promise<UserProfile[]> {
    return delay(read<UserProfile[]>(KEYS.users, []));
  },
  async get(id: string): Promise<UserProfile | undefined> {
    const users = read<UserProfile[]>(KEYS.users, []);
    return delay(users.find((u) => u.id === id));
  },
  async upsert(user: UserProfile): Promise<UserProfile> {
    const users = read<UserProfile[]>(KEYS.users, []);
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx >= 0) users[idx] = { ...users[idx], ...user };
    else users.push(user);
    write(KEYS.users, users);
    return delay(user);
  },
  async search(query: string): Promise<UserProfile[]> {
    const users = read<UserProfile[]>(KEYS.users, []);
    const q = query.trim().toLowerCase();
    if (!q) return delay([]);
    return delay(
      users.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q),
      ),
    );
  },
};

// ---------------------------------------------------------------------------
// Chats
// ---------------------------------------------------------------------------

export const mockChats = {
  async all(): Promise<Chat[]> {
    return delay(read<Chat[]>(KEYS.chats, []));
  },
  async get(id: string): Promise<Chat | undefined> {
    const chats = read<Chat[]>(KEYS.chats, []);
    return delay(chats.find((c) => c.id === id));
  },
  async upsert(chat: Chat): Promise<Chat> {
    const chats = read<Chat[]>(KEYS.chats, []);
    const idx = chats.findIndex((c) => c.id === chat.id);
    if (idx >= 0) chats[idx] = chat;
    else chats.push(chat);
    write(KEYS.chats, chats);
    return delay(chat);
  },
  async remove(id: string): Promise<void> {
    const chats = read<Chat[]>(KEYS.chats, []);
    write(KEYS.chats, chats.filter((c) => c.id !== id));
    const msgs = read<Record<string, Message[]>>(KEYS.messages, {});
    delete msgs[id];
    write(KEYS.messages, msgs);
    return delay(undefined);
  },
};

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export const mockMessages = {
  async forChat(chatId: string): Promise<Message[]> {
    const all = read<Record<string, Message[]>>(KEYS.messages, {});
    return delay((all[chatId] ?? []).slice());
  },
  async add(message: Message): Promise<Message> {
    const all = read<Record<string, Message[]>>(KEYS.messages, {});
    if (!all[message.chatId]) all[message.chatId] = [];
    all[message.chatId].push(message);
    write(KEYS.messages, all);
    // Update chat lastMessage
    const chats = read<Chat[]>(KEYS.chats, []);
    const chat = chats.find((c) => c.id === message.chatId);
    if (chat) {
      chat.lastMessage = {
        text: message.type === 'text' ? message.text : `${message.type[0].toUpperCase()}${message.type.slice(1)}`,
        senderId: message.senderId,
        type: message.type,
        createdAt: message.createdAt,
      };
      chat.updatedAt = message.createdAt;
      if (message.senderId !== 'me') {
        chat.unreadCount = { ...chat.unreadCount, me: (chat.unreadCount.me ?? 0) + 1 };
      }
      write(KEYS.chats, chats);
    }
    return delay(message, 60);
  },
  async update(message: Message): Promise<Message> {
    const all = read<Record<string, Message[]>>(KEYS.messages, {});
    const list = all[message.chatId] ?? [];
    const idx = list.findIndex((m) => m.id === message.id);
    if (idx >= 0) list[idx] = message;
    write(KEYS.messages, all);
    return delay(message, 40);
  },
  async search(chatId: string, query: string): Promise<Message[]> {
    const all = read<Record<string, Message[]>>(KEYS.messages, {});
    const list = all[chatId] ?? [];
    const q = query.toLowerCase();
    return delay(list.filter((m) => m.text.toLowerCase().includes(q)));
  },
};

// ---------------------------------------------------------------------------
// Statuses
// ---------------------------------------------------------------------------

export const mockStatuses = {
  async all(): Promise<StatusItem[]> {
    return delay(read<StatusItem[]>(KEYS.statuses, []));
  },
  async add(status: StatusItem): Promise<StatusItem> {
    const all = read<StatusItem[]>(KEYS.statuses, []);
    all.push(status);
    write(KEYS.statuses, all);
    return delay(status);
  },
  async view(id: string, userId: string): Promise<void> {
    const all = read<StatusItem[]>(KEYS.statuses, []);
    const s = all.find((x) => x.id === id);
    if (s && !s.viewers.find((v) => v.userId === userId)) {
      s.viewers.push({ userId, viewedAt: Date.now() });
      write(KEYS.statuses, all);
    }
    return delay(undefined);
  },
};

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export const mockNotifications = {
  async all(): Promise<Notification[]> {
    return delay(read<Notification[]>(KEYS.notifications, []));
  },
  async add(n: Notification): Promise<Notification> {
    const all = read<Notification[]>(KEYS.notifications, []);
    all.unshift(n);
    write(KEYS.notifications, all.slice(0, 50));
    return delay(n);
  },
  async markAllRead(): Promise<void> {
    const all = read<Notification[]>(KEYS.notifications, []);
    write(KEYS.notifications, all.map((n) => ({ ...n, read: true })));
    return delay(undefined);
  },
};

// ---------------------------------------------------------------------------
// Session (mock auth)
// ---------------------------------------------------------------------------

export const mockSession = {
  get(): string | null {
    return read<string | null>(KEYS.session, null);
  },
  set(userId: string): void {
    write(KEYS.session, userId);
  },
  clear(): void {
    localStorage.removeItem(KEYS.session);
  },
};
