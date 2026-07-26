import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2, MessageCircle } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { dataService } from '@/services/dataService';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import type { UserProfile, Chat } from '@/types';

interface NewChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewChatDialog({ open, onOpenChange }: NewChatDialogProps) {
  const navigate = useNavigate();
  const me = useAuthStore((s) => s.user);
  const { chats, upsertChat } = useChatStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      return;
    }
    // Load all users initially
    setLoading(true);
    dataService.users.all().then((users) => {
      setResults(users.filter((u) => u.id !== (me?.id ?? 'me')));
      setLoading(false);
    });
  }, [open, me]);

  useEffect(() => {
    if (!query.trim()) {
      dataService.users.all().then((users) => {
        setResults(users.filter((u) => u.id !== (me?.id ?? 'me')));
      });
      return;
    }
    const t = setTimeout(() => {
      setLoading(true);
      dataService.users.search(query).then((r) => {
        setResults(r.filter((u) => u.id !== (me?.id ?? 'me')));
        setLoading(false);
      });
    }, 250);
    return () => clearTimeout(t);
  }, [query, me]);

  function startChat(user: UserProfile) {
    const meId = me?.id ?? 'me';
    // Check if a direct chat already exists
    const existing = chats.find(
      (c) =>
        c.type === 'direct' &&
        c.participantIds.includes(user.id) &&
        c.participantIds.includes(meId),
    );
    if (existing) {
      onOpenChange(false);
      navigate(`/chats/${existing.id}`);
      return;
    }
    const newChat: Chat = {
      id: `c_${nanoid(8)}`,
      type: 'direct',
      participants: [
        { userId: meId, role: 'member', joinedAt: Date.now() },
        { userId: user.id, role: 'member', joinedAt: Date.now() },
      ],
      participantIds: [meId, user.id],
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
    upsertChat(newChat);
    dataService.chats.upsert(newChat);
    onOpenChange(false);
    toast.success(`Started a chat with ${user.name}`);
    navigate(`/chats/${newChat.id}`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 p-0">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle>New chat</DialogTitle>
          <DialogDescription>Search for people to start a conversation.</DialogDescription>
        </DialogHeader>

        <div className="px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, username, or email"
              className="rounded-full bg-muted pl-10 pr-9"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="max-h-[360px] overflow-y-auto px-2 pb-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <MessageCircle className="mb-2 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No people found</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {results.map((user) => (
                <button
                  key={user.id}
                  onClick={() => startChat(user)}
                  className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-muted"
                >
                  <UserAvatar name={user.name} src={user.photoURL} size="md" status={user.status} showStatus />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{user.name}</p>
                    <p className="truncate text-sm text-muted-foreground">@{user.username} · {user.about}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
