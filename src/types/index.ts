// ============================================================================
// Blink — Core domain types
// Central type definitions shared across the app. Keeping them in one place
// makes the data model easy to reason about and extend.
// ============================================================================

export type UserStatus = 'online' | 'offline' | 'away';

export type PrivacyScope = 'everyone' | 'contacts' | 'nobody';

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  about: string;
  phone?: string;
  photoURL: string | null;
  status: UserStatus;
  lastSeen: number;
  online: boolean;
  createdAt: number;
  /** Has the user enabled read receipts? */
  readReceiptsEnabled: boolean;
  /** Privacy controls — enforced via the settings store + message rendering layer. */
  photoVisibility: PrivacyScope;
  aboutVisibility: PrivacyScope;
  lastSeenVisibility: PrivacyScope;
  onlineStatusVisibility: PrivacyScope;
  readReceiptsVisibility: PrivacyScope;
}

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'document' | 'system';

export interface Reaction {
  emoji: string;
  userId: string;
  createdAt: number;
}

export interface Attachment {
  id: string;
  type: MessageType;
  url: string;
  name: string;
  size: number;
  mimeType: string;
  /** Optional preview/thumbnail for media */
  thumbnail?: string;
  duration?: number; // seconds, for audio/video
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  type: MessageType;
  text: string;
  attachments: Attachment[];
  replyTo?: {
    id: string;
    senderId: string;
    text: string;
    type: MessageType;
  } | null;
  forwardedFrom?: {
    id: string;
    name: string;
  } | null;
  status: MessageStatus;
  reactions: Reaction[];
  starred: boolean;
  pinned: boolean;
  deletedForEveryone: boolean;
  deletedFor: string[]; // user ids who deleted for-themselves
  readBy: string[]; // user ids who have read
  createdAt: number;
  editedAt?: number;
}

export type ChatType = 'direct' | 'group';

export interface ChatParticipant {
  userId: string;
  role: 'admin' | 'member';
  joinedAt: number;
}

export interface Chat {
  id: string;
  type: ChatType;
  name?: string; // group name
  description?: string; // group description
  photoURL?: string | null; // group icon
  participants: ChatParticipant[];
  participantIds: string[];
  lastMessage?: {
    text: string;
    senderId: string;
    type: MessageType;
    createdAt: number;
  } | null;
  unreadCount: Record<string, number>; // userId -> unread count
  pinnedBy: string[];
  archivedBy: string[];
  favouriteBy: string[];
  mutedBy: string[];
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  typingUsers: string[];
}

export interface StatusReaction {
  emoji: string;
  userId: string;
  createdAt: number;
}

export interface StatusReply {
  id: string;
  statusId: string;
  userId: string;
  text: string;
  createdAt: number;
}

export interface StatusItem {
  id: string;
  userId: string;
  type: 'image' | 'video' | 'text';
  content: string; // url or text
  caption?: string;
  background?: string; // for text statuses
  fontFamily?: string;
  fontSize?: 'sm' | 'md' | 'lg';
  textAlign?: 'left' | 'center' | 'right';
  viewers: { userId: string; viewedAt: number }[];
  reactions: StatusReaction[];
  replies: StatusReply[];
  createdAt: number;
  expiresAt: number;
}

export interface Highlight {
  id: string;
  userId: string;
  title: string;
  coverColor: string;
  items: { type: 'image' | 'text'; content: string; caption?: string; background?: string; createdAt: number }[];
  createdAt: number;
}

export interface StatusGroup {
  userId: string;
  userName: string;
  userPhoto: string | null;
  items: StatusItem[];
  hasUnviewed: boolean;
  muted: boolean;
  totalReactions: number;
  totalReplies: number;
}

export type CallType = 'audio' | 'video';
export type CallState = 'outgoing' | 'incoming' | 'connected' | 'ended' | 'missed';

export interface Call {
  id: string;
  type: CallType;
  state: CallState;
  participants: string[];
  startedBy: string;
  startedAt: number;
  endedAt?: number;
  duration?: number;
}

export interface Notification {
  id: string;
  type: 'message' | 'call' | 'status' | 'system';
  title: string;
  body: string;
  chatId?: string;
  read: boolean;
  createdAt: number;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface AppSettings {
  theme: ThemeMode;
  chatWallpaper: string;
  enterToSend: boolean;
  readReceipts: boolean;
  notifications: boolean;
  sound: boolean;
  mediaAutoDownload: boolean;
  fontSize: 'small' | 'medium' | 'large';
  highContrast: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  chatWallpaper: 'doodle',
  enterToSend: true,
  readReceipts: true,
  notifications: true,
  sound: true,
  mediaAutoDownload: true,
  fontSize: 'medium',
  highContrast: false,
};
