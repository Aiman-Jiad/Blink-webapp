import { useEffect, useMemo, useState } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, MessageSquarePlus, Filter, Pin, Archive, Star, X } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ChatListItem } from '@/components/chat/ChatListItem';
import { ChatListSkeleton } from '@/components/shared/Skeletons';
import { EmptyState } from '@/components/shared/EmptyState';
import { NewChatDialog } from '@/components/chat/NewChatDialog';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { dataService } from '@/services/dataService';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Filter = 'all' | 'pinned' | 'favourites' | 'archived' | 'unread';

const FILTERS: { key: Filter; label: string; icon: typeof Pin }[] = [
  { key: 'all', label: 'All', icon: MessageSquarePlus },
  { key: 'unread', label: 'Unread', icon: Filter },
  { key: 'pinned', label: 'Pinned', icon: Pin },
  { key: 'favourites', label: 'Favourites', icon: Star },
  { key: 'archived', label: 'Archived', icon: Archive },
];

export default function ChatsPage() {
  const { chatId } = useParams();
  const me = useAuthStore((s) => s.user);
  const { chats, setChats, searchQuery, setSearchQuery, loading, setLoading } = useChatStore();
  const setMobileView = useUIStore((s) => s.setMobileView);
  const [filter, setFilter] = useState<Filter>('all');
  const [newChatOpen, setNewChatOpen] = useState(false);
  const meId = me?.id ?? 'me';

  // Load chats
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    dataService.chats.all().then((data) => {
      if (mounted) {
        setChats(data);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, [setChats, setLoading]);

  const filtered = useMemo(() => {
    let list = chats.filter((c) => c.participantIds.includes(meId));
    if (filter === 'pinned') list = list.filter((c) => c.pinnedBy.includes(meId));
    else if (filter === 'favourites') list = list.filter((c) => c.favouriteBy.includes(meId));
    else if (filter === 'archived') list = list.filter((c) => c.archivedBy.includes(meId));
    else if (filter === 'unread') list = list.filter((c) => (c.unreadCount[meId] ?? 0) > 0);
    else list = list.filter((c) => !c.archivedBy.includes(meId)); // hide archived in 'all'

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          (c.name ?? '').toLowerCase().includes(q) ||
          c.lastMessage?.text.toLowerCase().includes(q),
      );
    }

    // Sort: pinned first, then by updatedAt
    return list.sort((a, b) => {
      const ap = a.pinnedBy.includes(meId) ? 1 : 0;
      const bp = b.pinnedBy.includes(meId) ? 1 : 0;
      if (ap !== bp) return bp - ap;
      return (b.updatedAt ?? 0) - (a.updatedAt ?? 0);
    });
  }, [chats, filter, searchQuery, meId]);

  const hasActiveChat = Boolean(chatId);

  return (
    <>
      <div className="flex h-full w-full overflow-hidden">
        {/* Chat list panel — full width on mobile when no chat active, side panel on desktop */}
        <div className={cn(
          'flex min-w-0 flex-col md:w-[340px] md:shrink-0 md:border-r md:border-border/60 lg:w-[380px]',
          hasActiveChat ? 'hidden md:flex' : 'flex w-full md:w-[340px]',
        )}>
          <PageHeader
            title="Chats"
            subtitle={`${chats.length} conversations`}
            actions={
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setNewChatOpen(true)}
                aria-label="New chat"
              >
                <MessageSquarePlus className="h-5 w-5" />
              </Button>
            }
          />

          {/* Search */}
          <div className="px-3 py-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chats or messages"
                className="h-9 rounded-full bg-muted pl-10 pr-9"
                aria-label="Search chats"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Filter chips */}
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-3 pb-2">
            {FILTERS.map((f) => {
              const count = f.key === 'unread'
                ? chats.filter((c) => (c.unreadCount[meId] ?? 0) > 0).length
                : undefined;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 active:scale-95',
                    filter === f.key
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                      : 'bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                  )}
                >
                  <f.icon className="h-3.5 w-3.5" />
                  {f.label}
                  {count !== undefined && count > 0 && (
                    <span className="grid h-4 min-w-4 place-items-center rounded-full bg-primary-foreground/25 px-1 text-[10px] font-bold tabular-nums">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Chat list */}
          <div className="no-scrollbar flex-1 overflow-y-auto px-2 pb-mobile-nav md:pb-2">
            {loading ? (
              <ChatListSkeleton />
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={MessageSquarePlus}
                title={searchQuery ? 'No chats found' : 'No chats yet'}
                description={searchQuery ? 'Try a different search term.' : 'Start a new conversation to see it here.'}
                action={
                  !searchQuery && (
                    <Button onClick={() => setNewChatOpen(true)} size="sm">
                      <MessageSquarePlus className="mr-1.5 h-4 w-4" /> New chat
                    </Button>
                  )
                }
              />
            ) : (
              <AnimatePresence mode="popLayout">
                {filtered.map((chat) => (
                  <ChatListItem
                    key={chat.id}
                    chat={chat}
                    active={chat.id === chatId}
                  />
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Chat view slot — hidden on mobile when no chat active, shown when chat is open.
            On mobile, reserve room for the fixed bottom nav so the composer stays visible. */}
        <div className={cn(
          'min-h-0 min-w-0 flex-1 overflow-hidden md:flex',
          hasActiveChat ? 'flex w-full' : 'hidden',
        )}>
          <Outlet />
        </div>
      </div>

      <NewChatDialog open={newChatOpen} onOpenChange={setNewChatOpen} />

      {/* Floating compose button — visible on mobile when no chat is open */}
      <AnimatePresence>
        {!hasActiveChat && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setNewChatOpen(true)}
            className="fixed right-4 z-30 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-soft-lg ring-1 ring-primary/20 transition-[bottom] md:hidden"
            style={{ bottom: 'calc(3.5rem + env(safe-area-inset-bottom) + 1rem)' }}
            aria-label="New chat"
          >
            <MessageSquarePlus className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
