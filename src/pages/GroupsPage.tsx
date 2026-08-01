import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, UserPlus, Search, Crown, Pin, BellOff, Star,
  X, Camera, Loader2, Check, ChevronRight,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { GroupAvatar } from '@/components/shared/GroupAvatar';
import { Skeleton } from '@/components/shared/Skeletons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { dataService } from '@/services/dataService';
import { formatChatTime } from '@/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';
import type { Chat, UserProfile } from '@/types';

export default function GroupsPage() {
  const navigate = useNavigate();
  const me = useAuthStore((s) => s.user);
  const { chats, setChats } = useChatStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const meId = me?.id ?? 'me';

  useEffect(() => {
    dataService.chats.all().then((all) => {
      setChats(all);
      setLoading(false);
    });
  }, [setChats]);

  const allGroups = useMemo(
    () => chats.filter((c) => c.type === 'group' && c.participantIds.includes(meId)),
    [chats, meId],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return allGroups;
    const q = search.toLowerCase();
    return allGroups.filter(
      (g) =>
        g.name?.toLowerCase().includes(q) ||
        g.description?.toLowerCase().includes(q) ||
        g.lastMessage?.text.toLowerCase().includes(q),
    );
  }, [allGroups, search]);

  const pinned = filtered.filter((g) => g.favouriteBy.includes(meId));
  const muted = filtered.filter((g) => g.mutedBy.includes(meId));
  const recent = filtered.filter((g) => !g.favouriteBy.includes(meId) && !g.mutedBy.includes(meId));

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Groups"
        subtitle={`${allGroups.length} groups`}
        actions={
          <Button size="icon" variant="ghost" onClick={() => setCreateOpen(true)} aria-label="Create group">
            <UserPlus className="h-5 w-5" />
          </Button>
        }
      />

      {/* Search bar */}
      <div className="px-4 pb-2">
        <div className="relative mx-auto max-w-2xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search groups…"
            className="pl-9"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 pb-mobile-nav md:p-4 md:pb-4">
        <div className="mx-auto max-w-2xl">
          {loading ? (
            <div className="space-y-1.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="card-soft flex items-center gap-3 p-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3 rounded-full" />
                    <Skeleton className="h-3 w-2/3 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 && !search ? (
            <EmptyState
              icon={Users}
              title="No groups yet"
              description="Create a group to chat with multiple people at once. Share messages, polls, files, and more."
              action={
                <Button onClick={() => setCreateOpen(true)} size="sm">
                  <UserPlus className="mr-1.5 h-4 w-4" /> Create group
                </Button>
              }
            />
          ) : filtered.length === 0 && search ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Search className="h-10 w-10 text-muted-foreground/40" />
              <div>
                <p className="font-semibold">No groups found</p>
                <p className="mt-1 text-sm text-muted-foreground">Try a different search term</p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {pinned.length > 0 && (
                <GroupSection title="Pinned" icon={<Star className="h-3.5 w-3.5" />}>
                  {pinned.map((g, i) => (
                    <GroupCard key={g.id} group={g} meId={meId} index={i} onClick={() => navigate(`/chats/${g.id}`)} />
                  ))}
                </GroupSection>
              )}

              {recent.length > 0 && (
                <GroupSection title="Recent" icon={null}>
                  {recent.map((g, i) => (
                    <GroupCard key={g.id} group={g} meId={meId} index={i} onClick={() => navigate(`/chats/${g.id}`)} />
                  ))}
                </GroupSection>
              )}

              {muted.length > 0 && (
                <GroupSection title="Muted" icon={<BellOff className="h-3.5 w-3.5" />}>
                  {muted.map((g, i) => (
                    <GroupCard key={g.id} group={g} meId={meId} index={i} muted onClick={() => navigate(`/chats/${g.id}`)} />
                  ))}
                </GroupSection>
              )}
            </div>
          )}
        </div>
      </div>

      <CreateGroupDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

function GroupSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h2 className="flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {icon && <span className="inline-flex">{icon}</span>}
        {title}
      </h2>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function GroupCard({ group, meId, index, muted, onClick }: {
  group: Chat;
  meId: string;
  index: number;
  muted?: boolean;
  onClick: () => void;
}) {
  const isAdmin = group.participants.find((p) => p.userId === meId)?.role === 'admin';
  const unread = group.unreadCount[meId] ?? 0;
  const isPinned = group.favouriteBy.includes(meId);

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.2) }}
      onClick={onClick}
      className="card-soft group flex w-full items-center gap-3 p-3 text-left transition-all duration-200 hover:shadow-soft-lg active:scale-[0.99]"
    >
      <GroupAvatar name={group.name ?? 'Group'} src={group.photoURL} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate font-semibold">{group.name}</p>
          {isAdmin && <Crown className="h-3.5 w-3.5 shrink-0 text-amber-400" />}
          {isPinned && <Pin className="h-3 w-3 shrink-0 text-muted-foreground/50" fill="currentColor" />}
        </div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <span className="shrink-0">{group.participantIds.length} members</span>
          {group.lastMessage && (
            <>
              <span className="shrink-0">·</span>
              <span className="truncate">{group.lastMessage.text}</span>
            </>
          )}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {group.lastMessage && (
          <span className="text-xs text-muted-foreground">{formatChatTime(group.lastMessage.createdAt)}</span>
        )}
        {unread > 0 && (
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
            {unread}
          </span>
        )}
        {muted && !unread && <BellOff className="h-3.5 w-3.5 text-muted-foreground/40" />}
      </div>
    </motion.button>
  );
}

// ============================================================================
// Create Group Dialog — multi-step flow
// ============================================================================

function CreateGroupDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const navigate = useNavigate();
  const me = useAuthStore((s) => s.user);
  const { upsertChat } = useChatStore();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const meId = me?.id ?? 'me';

  useEffect(() => {
    if (open) {
      dataService.users.all().then((u) => setUsers(u.filter((x) => x.id !== meId)));
      setStep(1);
    } else {
      setName(''); setDescription(''); setPhoto(null); setSelected([]); setSearchQuery(''); setStep(1);
    }
  }, [open, meId]);

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function create() {
    if (!name.trim() || selected.length === 0) return;
    setCreating(true);
    const chat: Chat = {
      id: `c_group_${nanoid(8)}`,
      type: 'group',
      name: name.trim(),
      description: description.trim() || undefined,
      photoURL: photo,
      participants: [
        { userId: meId, role: 'admin', joinedAt: Date.now() },
        ...selected.map((id) => ({ userId: id, role: 'member' as const, joinedAt: Date.now() })),
      ],
      participantIds: [meId, ...selected],
      lastMessage: null,
      unreadCount: {},
      pinnedBy: [],
      archivedBy: [],
      favouriteBy: [],
      mutedBy: [],
      createdBy: meId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      typingUsers: [],
      permissions: { whoCanEditInfo: 'admins', whoCanSendMessages: 'everyone', whoCanAddMembers: 'admins' },
      inviteCode: `blink-${nanoid(6)}`,
    };
    dataService.chats.upsert(chat).then(() => {
      upsertChat(chat);
      setCreating(false);
      onOpenChange(false);
      toast.success(`Group "${name}" created`);
      navigate(`/chats/${chat.id}`);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 p-0">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle>
            {step === 1 ? 'Add Members' : step === 2 ? 'Group Details' : 'Review & Create'}
          </DialogTitle>
          <DialogDescription>
            {step === 1 ? `Select people to add to your group (${selected.length} selected)` : step === 2 ? 'Name your group and add details' : 'Confirm your group settings'}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 px-4 py-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors',
                s <= step ? 'bg-primary' : 'bg-muted',
              )}
            />
          ))}
        </div>

        <div className="max-h-[55vh] overflow-y-auto">
          {step === 1 && (
            <>
              {selected.length > 0 && (
                <div className="flex flex-wrap gap-1.5 border-b border-border/40 px-4 py-2">
                  {selected.map((id) => {
                    const user = users.find((u) => u.id === id);
                    return (
                      <span key={id} className="flex items-center gap-1 rounded-full bg-primary/10 py-1 pl-2 pr-1 text-xs font-medium text-primary">
                        {user?.name.split(' ')[0] ?? id}
                        <button onClick={() => toggle(id)} className="grid h-4 w-4 place-items-center rounded-full hover:bg-primary/20" aria-label="Remove">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
              <div className="px-4 py-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search contacts…"
                  className="h-9"
                />
              </div>
              <div className="space-y-0.5 px-2 pb-4">
                {filteredUsers.map((user) => {
                  const isSelected = selected.includes(user.id);
                  return (
                    <button
                      key={user.id}
                      onClick={() => toggle(user.id)}
                      className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-muted"
                    >
                      <div className="h-9 w-9 overflow-hidden rounded-full bg-gradient-to-br from-primary/80 to-teal-700">
                        {user.photoURL && <img src={user.photoURL} alt={user.name} className="h-full w-full object-cover" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{user.name}</p>
                        <p className="truncate text-sm text-muted-foreground">@{user.username}</p>
                      </div>
                      <div className={cn(
                        'grid h-5 w-5 place-items-center rounded-full border-2 transition-colors',
                        isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30',
                      )}>
                        {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === 2 && (
            <div className="px-4 py-4">
              <div className="mb-4 flex items-center gap-3">
                <label className="cursor-pointer">
                  <div className="relative">
                    {photo ? (
                      <img src={photo} alt="" className="h-16 w-16 rounded-full object-cover" />
                    ) : (
                      <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/15 text-primary">
                        <Camera className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) setPhoto(URL.createObjectURL(f)); }} />
                </label>
                <div className="flex-1 space-y-2">
                  <Input value={name} onChange={(e) => setName(e.target.value.slice(0, 50))} placeholder="Group name" maxLength={50} />
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value.slice(0, 200))} placeholder="Group description (optional)" rows={2} className="text-sm" maxLength={200} />
                </div>
              </div>
              <div className="rounded-xl bg-muted/40 p-3 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{selected.length + 1} members</p>
                <p className="mt-0.5 text-xs">Including you as the group admin</p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="px-4 py-4">
              <div className="flex flex-col items-center gap-3 pb-4">
                <GroupAvatar name={name || 'Group'} src={photo} size="xl" />
                <div className="text-center">
                  <p className="font-display text-lg font-bold">{name || 'Untitled Group'}</p>
                  {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
                </div>
              </div>
              <div className="space-y-2 rounded-xl bg-muted/40 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Members</span>
                  <span className="font-medium">{selected.length + 1}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Your role</span>
                  <span className="flex items-center gap-1 font-medium text-amber-500"><Crown className="h-3.5 w-3.5" /> Admin</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Description</span>
                  <span className="font-medium">{description ? 'Yes' : 'None'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 border-t border-border/60 p-3">
          {step > 1 ? (
            <Button variant="outline" className="flex-1" onClick={() => setStep(step - 1)}>Back</Button>
          ) : (
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
          )}
          {step < 3 ? (
            <Button
              className="flex-1"
              disabled={(step === 1 && selected.length === 0) || (step === 2 && !name.trim())}
              onClick={() => setStep(step + 1)}
            >
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button className="flex-1" disabled={creating} onClick={create}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create group'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
