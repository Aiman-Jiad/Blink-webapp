import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, MessageSquare, User as UserIcon } from 'lucide-react';
import {
  Dialog, DialogContent,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { useUIStore } from '@/store/uiStore';
import { useChatStore } from '@/store/chatStore';
import { dataService } from '@/services/dataService';
import { formatChatTime } from '@/utils';
import type { UserProfile } from '@/types';
import { cn } from '@/lib/utils';

const USER_NAMES: Record<string, string> = {
  u_alice: 'Alice Chen', u_marcus: 'Marcus Reid', u_sofia: 'Sofia Romano',
  u_kenji: 'Kenji Tanaka', u_priya: 'Priya Sharma',
};

export function GlobalSearch() {
  const open = useUIStore((s) => s.searchOpen);
  const setOpen = useUIStore((s) => s.setSearchOpen);
  const navigate = useNavigate();
  const chats = useChatStore((s) => s.chats);
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }
    const t = setTimeout(() => {
      dataService.users.search(query).then(setUsers);
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  const matchedChats = query.trim()
    ? chats.filter((c) => {
        const q = query.toLowerCase();
        const name = c.type === 'group' ? c.name : USER_NAMES[c.participantIds.find((id) => id !== 'me') ?? ''];
        return (name ?? '').toLowerCase().includes(q) || c.lastMessage?.text.toLowerCase().includes(q);
      })
    : [];

  function go(chatId: string) {
    setOpen(false);
    setQuery('');
    navigate(`/chats/${chatId}`);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md gap-0 p-0 [&_button[aria-label=Close]]:hidden">
        <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people and chats…"
            className="h-9 border-0 bg-transparent px-0 focus-visible:ring-0"
          />
          <button onClick={() => setOpen(false)} className="rounded-md p-1 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[400px] overflow-y-auto p-2">
          {query.trim() === '' ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Start typing to search</p>
          ) : (
            <>
              {/* Chats */}
              {matchedChats.length > 0 && (
                <div className="mb-2">
                  <p className="px-2 py-1.5 text-xs font-medium uppercase text-muted-foreground">Chats</p>
                  {matchedChats.map((chat) => {
                    const name = chat.type === 'group' ? chat.name : USER_NAMES[chat.participantIds.find((id) => id !== 'me') ?? ''] ?? 'Chat';
                    return (
                      <button
                        key={chat.id}
                        onClick={() => go(chat.id)}
                        className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted"
                      >
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary">
                          <MessageSquare className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{name}</p>
                          <p className="truncate text-xs text-muted-foreground">{chat.lastMessage?.text}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {chat.lastMessage && formatChatTime(chat.lastMessage.createdAt)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* People */}
              {users.length > 0 && (
                <div>
                  <p className="px-2 py-1.5 text-xs font-medium uppercase text-muted-foreground">People</p>
                  {users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        // Find or create chat
                        const existing = chats.find((c) => c.type === 'direct' && c.participantIds.includes(user.id));
                        if (existing) go(existing.id);
                        else { setOpen(false); navigate('/chats'); }
                      }}
                      className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted"
                    >
                      <UserAvatar name={user.name} src={user.photoURL} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{user.name}</p>
                        <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {matchedChats.length === 0 && users.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">No results for "{query}"</p>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
