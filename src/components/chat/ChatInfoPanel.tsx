import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  X, Bell, BellOff, Star, Archive, Trash2, Image as ImageIcon, FileText,
  Users, Link2, Crown, Shield, UserPlus, Copy, ChevronRight, BarChart3,
  CheckSquare, Pin, Settings2, Lock,
} from 'lucide-react';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { GroupAvatar } from '@/components/shared/GroupAvatar';
import { GroupPulse } from '@/components/group/GroupPulse';
import { ActionBoard } from '@/components/group/ActionBoard';
import { PollCard } from '@/components/group/PollCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { dataService } from '@/services/dataService';
import { formatRelativeTime, formatFileSize } from '@/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';
import type { Chat, Message, Poll, ActionItem, GroupPermissions } from '@/types';

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

type Tab = 'about' | 'media' | 'files' | 'links';

interface ChatInfoPanelProps {
  chat: Chat;
  onClose: () => void;
}

export function ChatInfoPanel({ chat, onClose }: ChatInfoPanelProps) {
  const me = useAuthStore((s) => s.user);
  const { updateChat, messages: storeMessages } = useChatStore();
  const meId = me?.id ?? 'me';
  const isGroup = chat.type === 'group';
  const otherId = chat.participantIds.find((id) => id !== meId) ?? '';
  const displayName = isGroup ? (chat.name ?? 'Group') : (USER_NAMES[otherId] ?? 'Unknown');
  const displayPhoto = isGroup ? chat.photoURL : USER_PHOTOS[otherId];

  const [tab, setTab] = useState<Tab>('about');
  const [polls, setPolls] = useState<Poll[]>([]);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [editingDesc, setEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState(chat.description ?? '');
  const [showPermissions, setShowPermissions] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  const myRole = chat.participants.find((p) => p.userId === meId)?.role;
  const isAdmin = myRole === 'admin';
  const canEditInfo = isGroup && (isAdmin || chat.permissions?.whoCanEditInfo === 'everyone');

  useEffect(() => {
    if (!isGroup) return;
    dataService.polls.forChat(chat.id).then(setPolls);
    dataService.actions.forChat(chat.id).then(setActions);
    dataService.messages.forChat(chat.id).then(setAllMessages);
  }, [chat.id, isGroup]);

  const mediaItems = useMemo(() => allMessages
    .filter((m) => !m.deletedForEveryone && !m.deletedFor.includes(meId))
    .flatMap((m) => m.attachments.filter((a) => a.type === 'image' || a.type === 'video'))
    .reverse(), [allMessages, meId]);

  const fileItems = useMemo(() => allMessages
    .filter((m) => !m.deletedForEveryone && !m.deletedFor.includes(meId))
    .flatMap((m) => m.attachments.filter((a) => a.type === 'document'))
    .reverse(), [allMessages, meId]);

  const linkItems = useMemo(() => allMessages
    .filter((m) => !m.deletedForEveryone && !m.deletedFor.includes(meId) && m.text)
    .map((m) => ({ id: m.id, text: m.text, senderId: m.senderId, createdAt: m.createdAt, url: extractUrl(m.text) }))
    .filter((m) => m.url)
    .reverse(), [allMessages, meId]);

  const pinnedMessages = useMemo(() => allMessages
    .filter((m) => m.pinned && !m.deletedForEveryone && !m.deletedFor.includes(meId))
    .reverse(), [allMessages, meId]);

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

  function saveDescription() {
    const updated = { ...chat, description: descValue.trim() || undefined };
    updateChat(updated);
    dataService.chats.upsert(updated);
    setEditingDesc(false);
    toast.success('Description updated');
  }

  function updatePermissions(key: keyof GroupPermissions, value: string) {
    const updated = { ...chat, permissions: { ...chat.permissions, [key]: value } as GroupPermissions };
    updateChat(updated);
    dataService.chats.upsert(updated);
    toast.success('Permissions updated');
  }

  async function handleVote(pollId: string, optionId: string) {
    await dataService.polls.vote(pollId, optionId, meId);
    setPolls((prev) => prev.map((p) => {
      if (p.id !== pollId) return p;
      const updated = { ...p, options: p.options.map((opt) => {
        if (!p.multiChoice) {
          return { ...opt, votes: opt.id === optionId ? [...opt.votes.filter((v) => v !== meId), meId] : opt.votes.filter((v) => v !== meId) };
        }
        return opt.id === optionId
          ? { ...opt, votes: opt.votes.includes(meId) ? opt.votes.filter((v) => v !== meId) : [...opt.votes, meId] }
          : opt;
      })};
      return updated;
    }));
  }

  async function handleDeletePoll(pollId: string) {
    await dataService.polls.remove(pollId);
    setPolls((prev) => prev.filter((p) => p.id !== pollId));
    toast.success('Poll deleted');
  }

  async function handleAddAction(item: ActionItem) {
    await dataService.actions.add(item);
    setActions((prev) => [...prev, item]);
  }
  async function handleToggleAction(id: string) {
    await dataService.actions.toggle(id);
    setActions((prev) => prev.map((a) => a.id === id ? { ...a, completed: !a.completed, completedAt: !a.completed ? Date.now() : undefined } : a));
  }
  async function handleRemoveAction(id: string) {
    await dataService.actions.remove(id);
    setActions((prev) => prev.filter((a) => a.id !== id));
  }

  function copyInvite() {
    const link = `https://blink.app/join/${chat.inviteCode ?? chat.id}`;
    navigator.clipboard.writeText(link);
    toast.success('Invite link copied');
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
        <h2 className="font-semibold">{isGroup ? 'Group info' : 'Contact info'}</h2>
        <Button size="icon" variant="ghost" onClick={onClose} aria-label="Close">
          <X className="h-5 w-5" />
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Profile section */}
        <div className="flex flex-col items-center px-4 py-6">
          {isGroup ? (
            <GroupAvatar name={displayName} src={displayPhoto} size="xl" />
          ) : (
            <UserAvatar name={displayName} src={displayPhoto} size="2xl" status="online" showStatus />
          )}
          <h3 className="mt-3 font-display text-xl font-bold">{displayName}</h3>
          <p className="text-sm text-muted-foreground">
            {isGroup ? `${chat.participantIds.length} members` : `@${otherId.replace('u_', '')}`}
          </p>
          {!isGroup && (
            <p className="mt-1 text-xs text-muted-foreground">
              last seen {formatRelativeTime(Date.now() - 1000 * 60 * 15)}
            </p>
          )}
          {isGroup && chat.inviteCode && (
            <Button size="sm" variant="outline" className="mt-3" onClick={() => setShowInvite(true)}>
              <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Invite via link
            </Button>
          )}
        </div>

        {/* Description */}
        <div className="px-4 py-3">
          <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">Description</p>
          {editingDesc ? (
            <div className="space-y-2">
              <Textarea value={descValue} onChange={(e) => setDescValue(e.target.value.slice(0, 200))} rows={2} className="text-sm" maxLength={200} autoFocus />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { setEditingDesc(false); setDescValue(chat.description ?? ''); }}>Cancel</Button>
                <Button size="sm" onClick={saveDescription}>Save</Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => canEditInfo && setEditingDesc(true)}
              className={cn('w-full text-left text-sm', canEditInfo && 'cursor-pointer hover:text-primary')}
            >
              {chat.description ?? 'No description'}
              {canEditInfo && <span className="ml-1 text-xs text-primary">Edit</span>}
            </button>
          )}
        </div>

        {/* Group-specific: Pulse + Action Board + Polls */}
        {isGroup && (
          <div className="space-y-3 px-3 py-2">
            <GroupPulse chat={chat} messages={allMessages} actions={actions} polls={polls} meId={meId} />
            <ActionBoard
              chat={chat}
              actions={actions}
              meId={meId}
              onAdd={handleAddAction}
              onToggle={handleToggleAction}
              onRemove={handleRemoveAction}
            />
            {polls.length > 0 && (
              <div className="space-y-2">
                <h3 className="flex items-center gap-1.5 px-1 text-xs font-medium uppercase text-muted-foreground">
                  <BarChart3 className="h-3.5 w-3.5" /> Polls
                </h3>
                {polls.map((poll) => (
                  <PollCard
                    key={poll.id}
                    poll={poll}
                    meId={meId}
                    onVote={(optId) => handleVote(poll.id, optId)}
                    onDelete={() => handleDeletePoll(poll.id)}
                    canManage={isAdmin || poll.createdBy === meId}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pinned messages */}
        {pinnedMessages.length > 0 && (
          <div className="px-4 py-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase text-muted-foreground">
              <Pin className="h-3.5 w-3.5" /> Pinned ({pinnedMessages.length})
            </p>
            <div className="space-y-1.5">
              {pinnedMessages.slice(0, 3).map((m) => (
                <div key={m.id} className="rounded-xl bg-muted/40 p-2.5">
                  <p className="text-sm font-medium">{USER_NAMES[m.senderId] ?? m.senderId}</p>
                  <p className="truncate text-sm text-muted-foreground">{m.text || `${m.type}`}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shared content tabs */}
        <div className="px-4 py-2">
          <div className="mb-2 flex gap-1 rounded-xl bg-muted/40 p-1">
            {([
              { key: 'about' as const, label: 'About' },
              { key: 'media' as const, label: 'Media', count: mediaItems.length },
              { key: 'files' as const, label: 'Files', count: fileItems.length },
              { key: 'links' as const, label: 'Links', count: linkItems.length },
            ]).map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  'flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-all',
                  tab === t.key ? 'bg-panel text-foreground shadow-soft' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t.label}
                {t.count !== undefined && t.count > 0 && (
                  <span className="ml-1 text-muted-foreground/60">{t.count}</span>
                )}
              </button>
            ))}
          </div>

          {tab === 'about' && (
            <div className="space-y-1 py-1">
              <ActionRow icon={chat.mutedBy.includes(meId) ? BellOff : Bell} label={chat.mutedBy.includes(meId) ? 'Unmute notifications' : 'Mute notifications'} onClick={() => toggle('mutedBy')} />
              <ActionRow icon={Star} label={chat.favouriteBy.includes(meId) ? 'Remove from favourites' : 'Add to favourites'} onClick={() => toggle('favouriteBy')} />
              <ActionRow icon={Archive} label={chat.archivedBy.includes(meId) ? 'Unarchive chat' : 'Archive chat'} onClick={() => toggle('archivedBy')} />
              {isGroup && (
                <ActionRow icon={Settings2} label="Permissions" onClick={() => setShowPermissions(true)} />
              )}
            </div>
          )}

          {tab === 'media' && (
            <div className="py-1">
              {mediaItems.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No media shared yet</p>
              ) : (
                <div className="grid grid-cols-3 gap-1.5">
                  {mediaItems.slice(0, 18).map((att) => (
                    att.type === 'image' ? (
                      <img key={att.id} src={att.url} alt="" loading="lazy" className="aspect-square w-full rounded-lg object-cover" />
                    ) : (
                      <div key={att.id} className="grid aspect-square place-items-center rounded-lg bg-muted/60">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'files' && (
            <div className="py-1 space-y-1">
              {fileItems.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No files shared yet</p>
              ) : (
                fileItems.map((att) => (
                  <div key={att.id} className="flex items-center gap-3 rounded-xl p-2 hover:bg-muted/40">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{att.name}</p>
                      <p className="text-xs text-muted-foreground">{att.size ? formatFileSize(att.size) : ''}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'links' && (
            <div className="py-1 space-y-1">
              {linkItems.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No links shared yet</p>
              ) : (
                linkItems.slice(0, 10).map((link) => (
                  <div key={link.id} className="flex items-center gap-3 rounded-xl p-2 hover:bg-muted/40">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-sky-500/10 text-sky-600">
                      <Link2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-sky-600">{link.url}</p>
                      <p className="truncate text-xs text-muted-foreground">{USER_NAMES[link.senderId] ?? link.senderId}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Group members */}
        {isGroup && (
          <div className="px-4 py-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase text-muted-foreground">
              <Users className="h-3.5 w-3.5" /> Members ({chat.participantIds.length})
            </p>
            <div className="space-y-0.5">
              {chat.participants
                .sort((a, b) => (a.role === 'admin' ? -1 : 1) - (b.role === 'admin' ? -1 : 1))
                .map((p) => (
                <div key={p.userId} className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/40">
                  <UserAvatar name={USER_NAMES[p.userId] ?? 'Member'} src={USER_PHOTOS[p.userId]} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{USER_NAMES[p.userId] ?? p.userId}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.role === 'admin' ? 'Admin' : 'Member'}
                    </p>
                  </div>
                  {p.role === 'admin' && (
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-amber-400/20 text-amber-500">
                      <Crown className="h-3 w-3" />
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="px-2 py-3">
          <ActionRow icon={Trash2} label="Delete chat" onClick={() => { dataService.chats.remove(chat.id); toast.success('Chat deleted'); }} danger />
        </div>
      </div>

      {/* Permissions modal */}
      {showPermissions && isGroup && (
        <PermissionsModal
          chat={chat}
          isAdmin={isAdmin}
          onClose={() => setShowPermissions(false)}
          onUpdate={updatePermissions}
        />
      )}

      {/* Invite modal */}
      {showInvite && (
        <InviteModal chat={chat} onClose={() => setShowInvite(false)} onCopy={copyInvite} />
      )}
    </motion.aside>
  );
}

function extractUrl(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s]+/i);
  return match ? match[0] : null;
}

function ActionRow({ icon: Icon, label, onClick, danger }: {
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

function PermissionsModal({ chat, isAdmin, onClose, onUpdate }: {
  chat: Chat;
  isAdmin: boolean;
  onClose: () => void;
  onUpdate: (key: keyof GroupPermissions, value: string) => void;
}) {
  const perms = chat.permissions ?? { whoCanEditInfo: 'admins', whoCanSendMessages: 'everyone', whoCanAddMembers: 'admins' };
  const settings = [
    { key: 'whoCanEditInfo' as const, label: 'Who can edit group info?', options: ['admins', 'everyone'] as const, labels: ['Admins', 'Everyone'] },
    { key: 'whoCanSendMessages' as const, label: 'Who can send messages?', options: ['everyone', 'admins'] as const, labels: ['Everyone', 'Admins only'] },
    { key: 'whoCanAddMembers' as const, label: 'Who can add members?', options: ['admins', 'everyone'] as const, labels: ['Admins', 'Everyone'] },
  ];

  return (
    <div className="absolute inset-0 z-40 flex items-end bg-black/40 md:items-center md:justify-center" onClick={onClose}>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-t-2xl bg-panel p-4 shadow-soft-lg md:rounded-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-display text-base font-bold">
            <Lock className="h-4 w-4 text-primary" /> Group Permissions
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        {!isAdmin && (
          <p className="mb-3 rounded-xl bg-muted/40 p-2.5 text-xs text-muted-foreground">
            Only admins can change these settings.
          </p>
        )}
        <div className="space-y-4">
          {settings.map((s) => (
            <div key={s.key}>
              <p className="mb-1.5 text-sm font-medium">{s.label}</p>
              <div className="flex gap-2">
                {s.options.map((opt, i) => (
                  <button
                    key={opt}
                    disabled={!isAdmin}
                    onClick={() => onUpdate(s.key, opt)}
                    className={cn(
                      'flex-1 rounded-xl px-3 py-2 text-sm font-medium transition-all disabled:opacity-50',
                      perms[s.key] === opt
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/70',
                    )}
                  >
                    {s.labels[i]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function InviteModal({ chat, onClose, onCopy }: {
  chat: Chat;
  onClose: () => void;
  onCopy: () => void;
}) {
  const link = `https://blink.app/join/${chat.inviteCode ?? chat.id}`;
  return (
    <div className="absolute inset-0 z-40 flex items-end bg-black/40 md:items-center md:justify-center" onClick={onClose}>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-t-2xl bg-panel p-4 shadow-soft-lg md:rounded-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-display text-base font-bold">
            <UserPlus className="h-4 w-4 text-primary" /> Invite to Group
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <p className="mb-3 text-sm text-muted-foreground">
          Share this link with anyone you want to join <span className="font-medium text-foreground">{chat.name}</span>.
        </p>
        <div className="flex items-center gap-2 rounded-xl bg-muted/40 p-2.5">
          <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate text-sm">{link}</span>
          <Button size="sm" variant="ghost" onClick={onCopy} className="shrink-0">
            <Copy className="h-3.5 w-3.5" /> Copy
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
