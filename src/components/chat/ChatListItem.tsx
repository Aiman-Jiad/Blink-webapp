import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Pin, Archive, Star, VolumeX, Check, CheckCheck, Users } from 'lucide-react';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { dataService } from '@/services/dataService';
import { formatChatTime } from '@/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Chat } from '@/types';

interface ChatListItemProps {
  chat: Chat;
  active: boolean;
}

function getOtherParticipantId(chat: Chat, meId: string): string {
  return chat.participantIds.find((id) => id !== meId) ?? chat.participantIds[0];
}

function ChatListItemBase({ chat, active }: ChatListItemProps) {
  const navigate = useNavigate();
  const me = useAuthStore((s) => s.user);
  const updateChat = useChatStore((s) => s.updateChat);

  const isGroup = chat.type === 'group';
  const otherId = me ? getOtherParticipantId(chat, me.id) : '';
  const otherName = isGroup ? (chat.name ?? 'Group') : otherId;
  const meId = me?.id ?? 'me';
  const unread = chat.unreadCount[meId] ?? 0;
  const pinned = chat.pinnedBy.includes(meId);
  const archived = chat.archivedBy.includes(meId);
  const favourite = chat.favouriteBy.includes(meId);
  const muted = chat.mutedBy.includes(meId);

  // For display name, in mock mode the "other" user id maps to a seeded user.
  // We resolve a friendly name via the chat's lastMessage sender or the id.
  const displayName = isGroup
    ? chat.name ?? 'Group chat'
    : resolveDisplayName(otherId);

  function resolveDisplayName(id: string): string {
    const map: Record<string, string> = {
      u_alice: 'Alice Chen',
      u_marcus: 'Marcus Reid',
      u_sofia: 'Sofia Romano',
      u_kenji: 'Kenji Tanaka',
      u_priya: 'Priya Sharma',
    };
    return map[id] ?? 'Unknown';
  }

  function resolvePhoto(id: string): string | null {
    const map: Record<string, string> = {
      u_alice: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
      u_marcus: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
      u_sofia: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
      u_kenji: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
      u_priya: 'https://images.pexels.com/photos/762020/pexels-photo-762020.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    };
    return map[id] ?? null;
  }

  const photo = isGroup ? chat.photoURL : resolvePhoto(otherId);
  const lastMsg = chat.lastMessage;
  const lastMsgIsMine = lastMsg?.senderId === meId;
  const lastMsgPreview = lastMsg
    ? isGroup && !lastMsgIsMine
      ? `${lastMsg.senderId === meId ? 'You' : resolveDisplayName(lastMsg.senderId).split(' ')[0]}: ${lastMsg.text}`
      : lastMsg.type === 'image'
        ? '📷 Photo'
        : lastMsg.type === 'video'
          ? '🎥 Video'
          : lastMsg.type === 'audio'
            ? '🎙️ Voice message'
            : lastMsg.type === 'document'
              ? '📄 Document'
              : lastMsg.text
    : 'No messages yet';

  function togglePin() {
    const updated = {
      ...chat,
      pinnedBy: pinned ? chat.pinnedBy.filter((id) => id !== meId) : [...chat.pinnedBy, meId],
    };
    updateChat(updated);
    dataService.chats.upsert(updated);
    toast.success(pinned ? 'Chat unpinned' : 'Chat pinned');
  }

  function toggleArchive() {
    const updated = {
      ...chat,
      archivedBy: archived ? chat.archivedBy.filter((id) => id !== meId) : [...chat.archivedBy, meId],
    };
    updateChat(updated);
    dataService.chats.upsert(updated);
    toast.success(archived ? 'Chat unarchived' : 'Chat archived');
  }

  function toggleFavourite() {
    const updated = {
      ...chat,
      favouriteBy: favourite ? chat.favouriteBy.filter((id) => id !== meId) : [...chat.favouriteBy, meId],
    };
    updateChat(updated);
    dataService.chats.upsert(updated);
    toast.success(favourite ? 'Removed from favourites' : 'Added to favourites');
  }

  function toggleMute() {
    const updated = {
      ...chat,
      mutedBy: muted ? chat.mutedBy.filter((id) => id !== meId) : [...chat.mutedBy, meId],
    };
    updateChat(updated);
    dataService.chats.upsert(updated);
    toast.success(muted ? 'Unmuted' : 'Muted');
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      onClick={() => navigate(`/chats/${chat.id}`)}
      className={cn(
        'group relative flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors',
        active ? 'bg-primary/10' : 'hover:bg-muted/60',
      )}
    >
      {/* Avatar */}
      {isGroup ? (
        <div className="relative">
          {photo ? (
            <img src={photo} alt={displayName} className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-primary/80 to-teal-700 text-white">
              <Users className="h-5 w-5" />
            </div>
          )}
        </div>
      ) : (
        <UserAvatar
          name={displayName}
          src={photo}
          size="md"
          status={chat.typingUsers.length > 0 ? 'online' : 'offline'}
          showStatus
        />
      )}

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={cn('truncate font-semibold', active ? 'text-primary' : 'text-foreground')}>
              {displayName}
            </span>
            {muted && <VolumeX className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
          </div>
          <span className={cn('shrink-0 text-[11px]', unread > 0 ? 'font-semibold text-primary' : 'text-muted-foreground')}>
            {lastMsg ? formatChatTime(lastMsg.createdAt) : ''}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1 text-sm">
            {lastMsgIsMine && lastMsg && (
              <span className="shrink-0 text-muted-foreground">
                {unread === 0 ? (
                  <CheckCheck className="h-3.5 w-3.5 text-sky-400" />
                ) : (
                  <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </span>
            )}
            {chat.typingUsers.length > 0 && !chat.typingUsers.includes(meId) ? (
              <span className="truncate text-primary">typing…</span>
            ) : (
              <span className="truncate text-muted-foreground">{lastMsgPreview}</span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {pinned && <Pin className="h-3.5 w-3.5 text-muted-foreground" fill="currentColor" />}
            {favourite && <Star className="h-3.5 w-3.5 text-amber-400" fill="currentColor" />}
            {unread > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Hover actions */}
      <div className="absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded-lg bg-panel/95 p-0.5 shadow-soft opacity-0 transition-opacity group-hover:opacity-100 md:flex">
        <ActionBtn label={pinned ? 'Unpin' : 'Pin'} onClick={(e) => { e.stopPropagation(); togglePin(); }} active={pinned}>
          <Pin className="h-3.5 w-3.5" fill={pinned ? 'currentColor' : 'none'} />
        </ActionBtn>
        <ActionBtn label={favourite ? 'Unfavourite' : 'Favourite'} onClick={(e) => { e.stopPropagation(); toggleFavourite(); }} active={favourite}>
          <Star className="h-3.5 w-3.5" fill={favourite ? 'currentColor' : 'none'} />
        </ActionBtn>
        <ActionBtn label={archived ? 'Unarchive' : 'Archive'} onClick={(e) => { e.stopPropagation(); toggleArchive(); }} active={archived}>
          <Archive className="h-3.5 w-3.5" />
        </ActionBtn>
        <ActionBtn label={muted ? 'Unmute' : 'Mute'} onClick={(e) => { e.stopPropagation(); toggleMute(); }} active={muted}>
          <VolumeX className="h-3.5 w-3.5" />
        </ActionBtn>
      </div>
    </motion.div>
  );
}

function ActionBtn({
  children, label, onClick, active,
}: {
  children: React.ReactNode;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        'grid h-7 w-7 place-items-center rounded-md transition-colors hover:bg-muted',
        active ? 'text-primary' : 'text-muted-foreground',
      )}
    >
      {children}
    </button>
  );
}

export const ChatListItem = memo(ChatListItemBase);
