import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, Settings, X, Camera, Loader2, Crown } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { UserAvatar } from '@/components/shared/UserAvatar';
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
import { toast } from 'sonner';
import { nanoid } from 'nanoid';
import type { Chat, UserProfile } from '@/types';

export default function GroupsPage() {
  const navigate = useNavigate();
  const me = useAuthStore((s) => s.user);
  const { chats, setChats } = useChatStore();
  const [createOpen, setCreateOpen] = useState(false);
  const meId = me?.id ?? 'me';

  useEffect(() => {
    dataService.chats.all().then(setChats);
  }, [setChats]);

  const groups = chats.filter((c) => c.type === 'group' && c.participantIds.includes(meId));

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Groups"
        subtitle={`${groups.length} groups`}
        actions={
          <Button size="icon" variant="ghost" onClick={() => setCreateOpen(true)} aria-label="Create group">
            <UserPlus className="h-5 w-5" />
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto p-2 pb-mobile-nav md:p-4 md:pb-4">
        <div className="mx-auto max-w-2xl">
          {groups.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No groups yet"
              description="Create a group to chat with multiple people at once."
              action={
                <Button onClick={() => setCreateOpen(true)} size="sm">
                  <UserPlus className="mr-1.5 h-4 w-4" /> Create group
                </Button>
              }
            />
          ) : (
            <div className="space-y-1.5">
              {groups.map((group, i) => (
                <motion.button
                  key={group.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/chats/${group.id}`)}
                  className="card-soft flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-muted/50"
                >
                  {group.photoURL ? (
                    <img src={group.photoURL} alt={group.name} loading="lazy" className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-primary/80 to-teal-700 text-white">
                      <Users className="h-5 w-5" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate font-semibold">{group.name}</p>
                      {group.participants.find((p) => p.userId === meId)?.role === 'admin' && (
                        <Crown className="h-3.5 w-3.5 text-amber-400" />
                      )}
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {group.participantIds.length} members
                      {group.lastMessage && ` · ${group.lastMessage.text}`}
                    </p>
                  </div>
                  {group.lastMessage && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatChatTime(group.lastMessage.createdAt)}
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateGroupDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

function CreateGroupDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const navigate = useNavigate();
  const me = useAuthStore((s) => s.user);
  const { upsertChat } = useChatStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [creating, setCreating] = useState(false);
  const meId = me?.id ?? 'me';

  useEffect(() => {
    if (open) {
      dataService.users.all().then((u) => setUsers(u.filter((x) => x.id !== meId)));
    } else {
      setName(''); setDescription(''); setPhoto(null); setSelected([]);
    }
  }, [open, meId]);

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
          <DialogTitle>Create group</DialogTitle>
          <DialogDescription>Name your group and add members.</DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto">
          {/* Group info */}
          <div className="flex items-center gap-3 px-4 py-3">
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
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Group name" />
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Group description (optional)" rows={2} className="text-sm" />
            </div>
          </div>

          {/* Members selection */}
          <div className="px-4 pb-2">
            <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
              Add members {selected.length > 0 && `(${selected.length})`}
            </p>
          </div>
          <div className="space-y-0.5 px-2 pb-4">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => toggle(user.id)}
                className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-muted"
              >
                <UserAvatar name={user.name} src={user.photoURL} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{user.name}</p>
                  <p className="truncate text-sm text-muted-foreground">@{user.username}</p>
                </div>
                <div className={`grid h-5 w-5 place-items-center rounded-full border-2 transition-colors ${
                  selected.includes(user.id) ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30'
                }`}>
                  {selected.includes(user.id) && <span className="text-xs">✓</span>}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 border-t border-border/60 p-3">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="flex-1" disabled={!name.trim() || selected.length === 0 || creating} onClick={create}>
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create group'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
