import { motion } from 'framer-motion';
import { X, Bell, BellOff, Star, Archive, Trash2, Image as ImageIcon, FileText, Users } from 'lucide-react';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { dataService } from '@/services/dataService';
import { formatRelativeTime } from '@/utils';
import { toast } from 'sonner';
import type { Chat } from '@/types';

const USER_NAMES: Record<string, string> = {
  u_alice: 'Alice Chen', u_marcus: 'Marcus Reid', u_sofia: 'Sofia Romano',
  u_kenji: 'Kenji Tanaka', u_priya: 'Priya Sharma', me: 'You',
};
const USER_PHOTOS: Record<string, string> = {
  u_alice: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
  u_marcus: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
  u_sofia: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
  u_kenji: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
  u_priya: 'https://images.pexels.com/photos/762020/pexels-photo-762020.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
};

interface ChatInfoPanelProps {
  chat: Chat;
  onClose: () => void;
}

export function ChatInfoPanel({ chat, onClose }: ChatInfoPanelProps) {
  const me = useAuthStore((s) => s.user);
  const updateChat = useChatStore((s) => s.updateChat);
  const meId = me?.id ?? 'me';
  const isGroup = chat.type === 'group';
  const otherId = chat.participantIds.find((id) => id !== meId) ?? '';
  const displayName = isGroup ? (chat.name ?? 'Group') : (USER_NAMES[otherId] ?? 'Unknown');
  const displayPhoto = isGroup ? chat.photoURL : USER_PHOTOS[otherId];

  function toggle(field: 'pinnedBy' | 'favouriteBy' | 'archivedBy' | 'mutedBy') {
    const list = chat[field] as string[];
    const isIn = list.includes(meId);
    const updated = {
      ...chat,
      [field]: isIn ? list.filter((id) => id !== meId) : [...list, meId],
    };
    updateChat(updated);
    dataService.chats.upsert(updated);
    toast.success(isIn ? 'Removed' : 'Added');
  }

  return (
    <motion.aside
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="absolute right-0 top-0 z-30 flex h-full w-full max-w-sm flex-col border-l border-border/60 bg-panel shadow-soft-lg md:w-80"
    >
      <header className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <h2 className="font-semibold text-foreground">{isGroup ? 'Group info' : 'Contact info'}</h2>
        <Button size="icon" variant="ghost" onClick={onClose} aria-label="Close">
          <X className="h-5 w-5" />
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Profile section */}
        <div className="flex flex-col items-center px-4 py-6">
          <UserAvatar name={displayName} src={displayPhoto} size="2xl" status="online" showStatus />
          <h3 className="mt-3 font-display text-xl font-bold text-foreground">{displayName}</h3>
          <p className="text-sm text-muted-foreground">
            {isGroup ? `${chat.participantIds.length} members` : `@${otherId.replace('u_', '')}`}
          </p>
          {!isGroup && (
            <p className="mt-1 text-xs text-muted-foreground">
              last seen {formatRelativeTime(Date.now() - 1000 * 60 * 15)}
            </p>
          )}
        </div>

        {/* About */}
        <div className="px-4 py-3">
          <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">About</p>
          <p className="text-sm text-foreground">
            {isGroup ? (chat.description ?? 'No description') : 'Hey there! I am using Blink.'}
          </p>
        </div>

        {/* Media stats */}
        <div className="grid grid-cols-2 gap-2 px-4 py-3">
          <div className="rounded-xl bg-muted/50 p-3">
            <ImageIcon className="mb-1.5 h-5 w-5 text-primary" />
            <p className="text-xs text-muted-foreground">Photos</p>
            <p className="font-bold text-foreground">12</p>
          </div>
          <div className="rounded-xl bg-muted/50 p-3">
            <FileText className="mb-1.5 h-5 w-5 text-primary" />
            <p className="text-xs text-muted-foreground">Documents</p>
            <p className="font-bold text-foreground">3</p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-1 px-2 py-2">
          <ActionRow
            icon={chat.mutedBy.includes(meId) ? BellOff : Bell}
            label={chat.mutedBy.includes(meId) ? 'Unmute notifications' : 'Mute notifications'}
            onClick={() => toggle('mutedBy')}
          />
          <ActionRow
            icon={Star}
            label={chat.favouriteBy.includes(meId) ? 'Remove from favourites' : 'Add to favourites'}
            onClick={() => toggle('favouriteBy')}
          />
          <ActionRow
            icon={Archive}
            label={chat.archivedBy.includes(meId) ? 'Unarchive chat' : 'Archive chat'}
            onClick={() => toggle('archivedBy')}
          />
        </div>

        {/* Group members */}
        {isGroup && (
          <div className="px-4 py-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase text-muted-foreground">
              <Users className="h-3.5 w-3.5" /> Members ({chat.participantIds.length})
            </p>
            <div className="space-y-1">
              {chat.participantIds.map((id) => (
                <div key={id} className="flex items-center gap-3 rounded-lg p-2">
                  <UserAvatar name={USER_NAMES[id] ?? 'Member'} src={USER_PHOTOS[id]} size="sm" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{USER_NAMES[id] ?? id}</p>
                    <p className="text-xs text-muted-foreground">
                      {chat.participants.find((p) => p.userId === id)?.role === 'admin' ? 'Admin' : 'Member'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="px-2 py-3">
          <ActionRow icon={Trash2} label="Delete chat" onClick={() => { dataService.chats.remove(chat.id); toast.success('Chat deleted'); }} danger />
        </div>
      </div>
    </motion.aside>
  );
}

function ActionRow({
  icon: Icon, label, onClick, danger,
}: {
  icon: typeof Bell;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted ${
        danger ? 'text-destructive hover:bg-destructive/10' : 'text-foreground'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
