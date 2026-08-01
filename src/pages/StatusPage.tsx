import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Type, Camera, MoreVertical, Trash2, AlertCircle, RefreshCw,
  VolumeX, Eye, Heart, Send,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { StatusRing } from '@/components/status/StatusRing';
import { StatusCard } from '@/components/status/StatusCard';
import { MyStatusSkeleton, StatusListSkeleton } from '@/components/status/StatusSkeletons';
import { StatusViewer } from '@/components/status/StatusViewer';
import { TextStatusComposer } from '@/components/status/TextStatusComposer';
import { ImageStatusComposer } from '@/components/status/ImageStatusComposer';
import { HighlightsSection } from '@/components/status/HighlightsSection';
import { HighlightViewer } from '@/components/status/HighlightViewer';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { dataService } from '@/services/dataService';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { formatRelativeTime } from '@/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';
import { STATUS_USER_MAP, STATUS_EXPIRY_MS, TEXT_GRADIENTS } from '@/components/status/statusConfig';
import type { StatusItem, StatusGroup, Highlight } from '@/types';

type LoadState = 'loading' | 'loaded' | 'error';
type ComposerType = 'text' | 'image' | null;

export default function StatusPage() {
  const me = useAuthStore(s => s.user);
  const navigate = useNavigate();
  const chats = useChatStore(s => s.chats);
  const upsertChat = useChatStore(s => s.upsertChat);
  const setActiveChat = useChatStore(s => s.setActiveChat);

  const [groups, setGroups] = useState<StatusGroup[]>([]);
  const [mutedIds, setMutedIds] = useState<Set<string>>(new Set());
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [viewing, setViewing] = useState<{ group: StatusGroup; index: number } | null>(null);
  const [composer, setComposer] = useState<ComposerType>(null);
  const [myStatusItems, setMyStatusItems] = useState<StatusItem[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [viewingHighlight, setViewingHighlight] = useState<Highlight | null>(null);

  const meId = me?.id ?? 'me';
  const meName = me?.name ?? 'You';

  const loadAll = useCallback(async () => {
    setLoadState('loading');
    try {
      const [statuses, hls] = await Promise.all([
        dataService.statuses.all(),
        dataService.highlights.all(),
      ]);

      // My statuses
      const mine = statuses
        .filter(s => s.userId === meId)
        .sort((a, b) => a.createdAt - b.createdAt);
      setMyStatusItems(mine);

      // Contact groups
      const byUser = new Map<string, StatusItem[]>();
      for (const s of statuses) {
        if (s.userId === meId) continue;
        if (!byUser.has(s.userId)) byUser.set(s.userId, []);
        byUser.get(s.userId)!.push(s);
      }
      const gs: StatusGroup[] = [];
      for (const [userId, items] of byUser) {
        const info = STATUS_USER_MAP[userId];
        const sorted = items.sort((a, b) => a.createdAt - b.createdAt);
        gs.push({
          userId,
          userName: info?.name ?? 'Unknown',
          userPhoto: info?.photo ?? null,
          items: sorted,
          hasUnviewed: sorted.some(i => !i.viewers.find(v => v.userId === meId)),
          muted: false,
          totalReactions: sorted.reduce((sum, i) => sum + (i.reactions?.length ?? 0), 0),
          totalReplies: sorted.reduce((sum, i) => sum + (i.replies?.length ?? 0), 0),
        });
      }
      gs.sort((a, b) => {
        const aTime = a.items[a.items.length - 1]?.createdAt ?? 0;
        const bTime = b.items[b.items.length - 1]?.createdAt ?? 0;
        return bTime - aTime;
      });
      setGroups(gs);
      setHighlights(hls);
      setLoadState('loaded');
    } catch {
      setLoadState('error');
    }
  }, [meId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const { recentGroups, viewedGroups, mutedGroups } = useMemo(() => {
    const recent: StatusGroup[] = [];
    const viewed: StatusGroup[] = [];
    const muted: StatusGroup[] = [];
    for (const g of groups) {
      if (mutedIds.has(g.userId)) { muted.push(g); continue; }
      if (g.hasUnviewed) recent.push(g);
      else viewed.push(g);
    }
    return { recentGroups: recent, viewedGroups: viewed, mutedGroups: muted };
  }, [groups, mutedIds]);

  function toggleMute(userId: string) {
    setMutedIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) { next.delete(userId); toast.success('Unmuted status updates'); }
      else { next.add(userId); toast.success('Muted status updates'); }
      return next;
    });
  }

  function viewStatus(group: StatusGroup) {
    const firstUnviewed = group.items.findIndex(i => !i.viewers.find(v => v.userId === meId));
    const idx = firstUnviewed >= 0 ? firstUnviewed : 0;
    setViewing({ group, index: idx });
    const item = group.items[idx];
    if (item) dataService.statuses.view(item.id, meId);
  }

  function viewMyStatus() {
    if (myStatusItems.length === 0) { setComposer('text'); return; }
    const myGroup: StatusGroup = {
      userId: meId,
      userName: meName,
      userPhoto: me?.photoURL ?? null,
      items: myStatusItems,
      hasUnviewed: false,
      muted: false,
      totalReactions: myStatusItems.reduce((s, i) => s + (i.reactions?.length ?? 0), 0),
      totalReplies: myStatusItems.reduce((s, i) => s + (i.replies?.length ?? 0), 0),
    };
    setViewing({ group: myGroup, index: 0 });
  }

  async function deleteMyStatusItem(itemId: string) {
    await dataService.statuses.remove(itemId);
    setMyStatusItems(prev => prev.filter(s => s.id !== itemId));
  }

  function handleReply(userId: string, userName: string, text: string) {
    // Find or create a direct chat with this user
    const existing = chats.find(c => c.type === 'direct' && c.participantIds.includes(userId));
    if (existing) {
      navigate(`/chats/${existing.id}`);
    } else {
      // Navigate to chats page — the user can start a new chat
      navigate('/chats');
      toast.info(`Reply "${text.slice(0, 30)}${text.length > 30 ? '…' : ''}" — open a chat with ${userName}`);
    }
  }

  async function postTextStatus(data: {
    content: string;
    background: string;
    fontFamily: string;
    fontSize: string;
    textAlign: 'left' | 'center' | 'right';
  }) {
    const status: StatusItem = {
      id: nanoid(),
      userId: meId,
      type: 'text',
      content: data.content,
      background: data.background,
      fontFamily: data.fontFamily,
      fontSize: 'md',
      textAlign: data.textAlign,
      viewers: [],
      reactions: [],
      replies: [],
      createdAt: Date.now(),
      expiresAt: Date.now() + STATUS_EXPIRY_MS,
    };
    await dataService.statuses.add(status);
    setMyStatusItems(prev => [...prev, status]);
    setComposer(null);
    toast.success('Status posted');
  }

  async function postImageStatus(data: { content: string; caption: string }) {
    const status: StatusItem = {
      id: nanoid(),
      userId: meId,
      type: 'image',
      content: data.content,
      caption: data.caption || undefined,
      viewers: [],
      reactions: [],
      replies: [],
      createdAt: Date.now(),
      expiresAt: Date.now() + STATUS_EXPIRY_MS,
    };
    await dataService.statuses.add(status);
    setMyStatusItems(prev => [...prev, status]);
    setComposer(null);
    toast.success('Status posted');
  }

  async function addHighlight(hl: Highlight) {
    await dataService.highlights.add(hl);
    setHighlights(prev => [...prev, hl]);
  }

  async function deleteHighlight(id: string) {
    await dataService.highlights.remove(id);
    setHighlights(prev => prev.filter(h => h.id !== id));
    toast.success('Highlight deleted');
  }

  const hasMyStatus = myStatusItems.length > 0;
  const myViews = myStatusItems.reduce((s, i) => s + i.viewers.length, 0);
  const myReactions = myStatusItems.reduce((s, i) => s + (i.reactions?.length ?? 0), 0);

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Status"
        subtitle="Share moments that disappear in 24h"
        actions={
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" onClick={() => setComposer('text')} aria-label="Text status">
              <Type className="h-5 w-5" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setComposer('image')} aria-label="Photo status">
              <Camera className="h-5 w-5" />
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 pb-mobile-nav md:pb-4">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* ============ My Status ============ */}
          {loadState === 'loading' ? (
            <div className="space-y-2">
              <SectionLabel>My status</SectionLabel>
              <MyStatusSkeleton />
            </div>
          ) : (
            <div className="space-y-2">
              <SectionLabel>My status</SectionLabel>
              <button
                onClick={viewMyStatus}
                className="card-soft group flex w-full items-center gap-3 p-3.5 text-left transition-all duration-200 hover:shadow-soft-lg active:scale-[0.99]"
              >
                <div className="relative shrink-0">
                  {hasMyStatus ? (
                    <StatusRing name={meName} src={me?.photoURL} size="md" seen />
                  ) : (
                    <>
                      <UserAvatar name={meName} src={me?.photoURL} size="md" />
                      <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground ring-2 ring-card transition-transform group-hover:scale-110">
                        <Plus className="h-3 w-3" strokeWidth={2.5} />
                      </span>
                    </>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-tight">
                    {hasMyStatus ? 'My status' : 'Share a moment'}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {hasMyStatus
                      ? `${myStatusItems.length} update${myStatusItems.length > 1 ? 's' : ''} · ${formatRelativeTime(myStatusItems[myStatusItems.length - 1].createdAt)}`
                      : 'Your status disappears after 24 hours'}
                  </p>
                  {hasMyStatus && (myViews > 0 || myReactions > 0) && (
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground/70">
                      {myViews > 0 && <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {myViews} views</span>}
                      {myReactions > 0 && <span className="flex items-center gap-1"><Heart className="h-3 w-3 fill-rose-500/60 text-rose-500/60" /> {myReactions}</span>}
                    </div>
                  )}
                </div>
                {hasMyStatus ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label="Status options"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" sideOffset={4} className="w-44 rounded-xl">
                      <DropdownMenuItem className="gap-2 rounded-lg" onClick={(e) => { e.preventDefault(); viewMyStatus(); }}>
                        <Eye className="h-4 w-4" /> View status
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2 rounded-lg"
                        onClick={(e) => {
                          e.preventDefault();
                          myStatusItems.forEach(s => deleteMyStatusItem(s.id));
                          toast.success('All statuses deleted');
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                        <span className="text-destructive">Delete all</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      size="icon" variant="ghost"
                      className="h-9 w-9 rounded-full text-muted-foreground hover:bg-muted hover:text-primary"
                      onClick={(e) => { e.stopPropagation(); setComposer('text'); }}
                      aria-label="Add text status"
                    >
                      <Type className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon" variant="ghost"
                      className="h-9 w-9 rounded-full text-muted-foreground hover:bg-muted hover:text-primary"
                      onClick={(e) => { e.stopPropagation(); setComposer('image'); }}
                      aria-label="Add photo status"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </button>
            </div>
          )}

          {/* ============ Highlights ============ */}
          {loadState === 'loaded' && (
            <HighlightsSection
              highlights={highlights}
              myStatusItems={myStatusItems}
              onAdd={addHighlight}
              onDelete={deleteHighlight}
              onView={setViewingHighlight}
            />
          )}

          {/* ============ Error State ============ */}
          {loadState === 'error' && (
            <div className="card-soft flex flex-col items-center gap-3 p-8 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
                <AlertCircle className="h-7 w-7" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-semibold">Could not load statuses</p>
                <p className="mt-1 text-sm text-muted-foreground">Something went wrong. Please try again.</p>
              </div>
              <Button variant="outline" size="sm" onClick={loadAll}>
                <RefreshCw className="mr-1.5 h-4 w-4" /> Retry
              </Button>
            </div>
          )}

          {/* ============ Loading Skeletons ============ */}
          {loadState === 'loading' && (
            <div className="space-y-2">
              <SectionLabel>Recent updates</SectionLabel>
              <StatusListSkeleton count={3} />
            </div>
          )}

          {/* ============ Loaded Content ============ */}
          {loadState === 'loaded' && (
            <>
              {/* Recent Updates */}
              {recentGroups.length > 0 && (
                <div className="space-y-2">
                  <SectionLabel>Recent updates</SectionLabel>
                  <div className="card-soft divide-y divide-border/60">
                    {recentGroups.map((group, i) => (
                      <StatusCard
                        key={group.userId}
                        group={group}
                        index={i}
                        onClick={() => viewStatus(group)}
                        onMute={() => toggleMute(group.userId)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Viewed Updates */}
              {viewedGroups.length > 0 && (
                <div className="space-y-2">
                  <SectionLabel>Viewed updates</SectionLabel>
                  <div className="card-soft divide-y divide-border/60">
                    {viewedGroups.map((group, i) => (
                      <StatusCard
                        key={group.userId}
                        group={group}
                        seen
                        index={i}
                        onClick={() => viewStatus(group)}
                        onMute={() => toggleMute(group.userId)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Muted Updates */}
              {mutedGroups.length > 0 && (
                <div className="space-y-2">
                  <SectionLabel>
                    <span className="flex items-center gap-1.5">
                      <VolumeX className="h-3.5 w-3.5" /> Muted updates
                    </span>
                  </SectionLabel>
                  <div className="card-soft divide-y divide-border/60">
                    {mutedGroups.map((group, i) => (
                      <StatusCard
                        key={group.userId}
                        group={group}
                        seen
                        muted
                        index={i}
                        onClick={() => viewStatus(group)}
                        onMute={() => toggleMute(group.userId)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {recentGroups.length === 0 && viewedGroups.length === 0 && mutedGroups.length === 0 && (
                <EmptyState
                  icon={Camera}
                  title="No status updates"
                  description="Status updates from your contacts will appear here. Share your own moment to get started."
                  action={
                    <Button size="sm" onClick={() => setComposer('text')}>
                      <Plus className="mr-1.5 h-4 w-4" /> Add status
                    </Button>
                  }
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Status viewer */}
      <AnimatePresence>
        {viewing && (
          <StatusViewer
            group={viewing.group}
            startIndex={viewing.index}
            onClose={() => setViewing(null)}
            onIndexChange={(i) => {
              const item = viewing.group.items[i];
              if (item && !item.viewers.find(v => v.userId === meId)) {
                dataService.statuses.view(item.id, meId);
              }
            }}
            meId={meId}
            meName={meName}
            onReply={handleReply}
            onDelete={deleteMyStatusItem}
          />
        )}
      </AnimatePresence>

      {/* Highlight viewer */}
      <AnimatePresence>
        {viewingHighlight && (
          <HighlightViewer
            highlight={viewingHighlight}
            onClose={() => setViewingHighlight(null)}
          />
        )}
      </AnimatePresence>

      {/* Text composer */}
      <AnimatePresence>
        {composer === 'text' && (
          <TextStatusComposer
            onClose={() => setComposer(null)}
            onPost={postTextStatus}
          />
        )}
      </AnimatePresence>

      {/* Image composer */}
      <AnimatePresence>
        {composer === 'image' && (
          <ImageStatusComposer
            onClose={() => setComposer(null)}
            onPost={postImageStatus}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </h2>
  );
}
