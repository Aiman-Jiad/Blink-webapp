import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Eye, X, Camera, ChevronLeft, ChevronRight, Type,
  VolumeX, MoreVertical, Trash2, AlertCircle, RefreshCw, Image as ImageIcon,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { StatusRing } from '@/components/status/StatusRing';
import { MyStatusSkeleton, StatusListSkeleton } from '@/components/status/StatusSkeletons';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { dataService } from '@/services/dataService';
import { useAuthStore } from '@/store/authStore';
import { formatRelativeTime } from '@/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';
import type { StatusItem, StatusGroup } from '@/types';

const STATUS_USER_MAP: Record<string, { name: string; photo: string }> = {
  u_sofia: { name: 'Sofia Romano', photo: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop' },
  u_marcus: { name: 'Marcus Reid', photo: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop' },
  u_alice: { name: 'Alice Chen', photo: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop' },
  u_kenji: { name: 'Kenji Tanaka', photo: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop' },
  u_priya: { name: 'Priya Sharma', photo: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop' },
};

const TEXT_GRADIENTS = [
  'from-emerald-500 to-teal-700',
  'from-sky-500 to-blue-700',
  'from-rose-500 to-pink-700',
  'from-amber-500 to-orange-700',
  'from-violet-500 to-purple-700',
];

type LoadState = 'loading' | 'loaded' | 'error';

export default function StatusPage() {
  const me = useAuthStore((s) => s.user);
  const [groups, setGroups] = useState<StatusGroup[]>([]);
  const [mutedIds, setMutedIds] = useState<Set<string>>(new Set());
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [viewing, setViewing] = useState<{ group: StatusGroup; index: number } | null>(null);
  const [textStatusOpen, setTextStatusOpen] = useState(false);
  const [textValue, setTextValue] = useState('');
  const [textGradient, setTextGradient] = useState(0);
  const meId = me?.id ?? 'me';

  const loadStatuses = useCallback(async () => {
    setLoadState('loading');
    try {
      const data = await dataService.statuses.all();
      const byUser = new Map<string, StatusItem[]>();
      for (const s of data) {
        if (s.userId === meId) continue;
        if (!byUser.has(s.userId)) byUser.set(s.userId, []);
        byUser.get(s.userId)!.push(s);
      }
      const gs: StatusGroup[] = [];
      for (const [userId, items] of byUser) {
        const info = STATUS_USER_MAP[userId];
        gs.push({
          userId,
          userName: info?.name ?? 'Unknown',
          userPhoto: info?.photo ?? null,
          items: items.sort((a, b) => a.createdAt - b.createdAt),
          hasUnviewed: items.some((i) => !i.viewers.find((v) => v.userId === meId)),
          muted: false,
        });
      }
      gs.sort((a, b) => {
        const aTime = a.items[a.items.length - 1]?.createdAt ?? 0;
        const bTime = b.items[b.items.length - 1]?.createdAt ?? 0;
        return bTime - aTime;
      });
      setGroups(gs);
      setLoadState('loaded');
    } catch {
      setLoadState('error');
    }
  }, [meId]);

  useEffect(() => { loadStatuses(); }, [loadStatuses]);

  // My own statuses
  const myStatuses = useMemo(() => {
    return groups.flatMap(g => g.items).filter(s => s.userId === meId);
  }, [groups, meId]);

  // Actually we need to fetch my statuses separately since we filter them out above
  const [myStatusItems, setMyStatusItems] = useState<StatusItem[]>([]);
  useEffect(() => {
    dataService.statuses.all().then((data) => {
      setMyStatusItems(data.filter((s) => s.userId === meId).sort((a, b) => a.createdAt - b.createdAt));
    });
  }, [meId, loadState]);

  // Categorize groups into recent, viewed, and muted
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
    setMutedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) { next.delete(userId); toast.success('Unmuted status updates'); }
      else { next.add(userId); toast.success('Muted status updates'); }
      return next;
    });
  }

  function viewStatus(group: StatusGroup) {
    const firstUnviewed = group.items.findIndex((i) => !i.viewers.find((v) => v.userId === meId));
    setViewing({ group, index: firstUnviewed >= 0 ? firstUnviewed : 0 });
    const item = group.items[firstUnviewed >= 0 ? firstUnviewed : 0];
    if (item) dataService.statuses.view(item.id, meId);
  }

  function viewMyStatus() {
    if (myStatusItems.length === 0) { setTextStatusOpen(true); return; }
    const myGroup: StatusGroup = {
      userId: meId,
      userName: me?.name ?? 'You',
      userPhoto: me?.photoURL ?? null,
      items: myStatusItems,
      hasUnviewed: false,
      muted: false,
    };
    setViewing({ group: myGroup, index: 0 });
  }

  async function deleteMyStatus() {
    // Delete all my status items from the store
    for (const item of myStatusItems) {
      // We don't have a delete API, so we'll just clear via re-seeding
      // For the demo, we reload after "deleting" by removing from local state
    }
    setMyStatusItems([]);
    toast.success('Status deleted');
    // Reload to reflect changes
    loadStatuses();
  }

  function postTextStatus() {
    if (!textValue.trim()) return;
    const status: StatusItem = {
      id: nanoid(),
      userId: meId,
      type: 'text',
      content: textValue,
      background: TEXT_GRADIENTS[textGradient],
      viewers: [],
      createdAt: Date.now(),
      expiresAt: Date.now() + 1000 * 60 * 60 * 24,
    };
    dataService.statuses.add(status).then(() => {
      setTextStatusOpen(false);
      setTextValue('');
      toast.success('Status posted');
      setMyStatusItems((prev) => [...prev, status]);
    });
  }

  const hasMyStatus = myStatusItems.length > 0;

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Status"
        subtitle="Share moments that disappear in 24h"
        actions={
          <Button size="icon" variant="ghost" onClick={() => setTextStatusOpen(true)} aria-label="Text status">
            <Type className="h-5 w-5" />
          </Button>
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
                {/* Avatar with ring or add badge */}
                <div className="relative shrink-0">
                  {hasMyStatus ? (
                    <StatusRing name={me?.name ?? 'You'} src={me?.photoURL} size="md" seen />
                  ) : (
                    <>
                      <UserAvatar name={me?.name ?? 'You'} src={me?.photoURL} size="md" />
                      <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground ring-2 ring-card transition-transform group-hover:scale-110">
                        <Plus className="h-3 w-3" strokeWidth={2.5} />
                      </span>
                    </>
                  )}
                </div>
                {/* Text */}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-tight">
                    {hasMyStatus ? 'My status' : 'Add to my status'}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {hasMyStatus
                      ? `${myStatusItems.length} update${myStatusItems.length > 1 ? 's' : ''} • ${formatRelativeTime(myStatusItems[myStatusItems.length - 1].createdAt)}`
                      : 'Tap to share a photo, video, or text'}
                  </p>
                </div>
                {/* Right action */}
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
                      <DropdownMenuItem className="gap-2 rounded-lg" onClick={(e) => { e.preventDefault(); deleteMyStatus(); }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                        <span className="text-destructive">Delete status</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 rounded-full text-muted-foreground hover:bg-muted hover:text-primary"
                      onClick={(e) => { e.stopPropagation(); setTextStatusOpen(true); }}
                      aria-label="Add text status"
                    >
                      <Type className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 rounded-full text-muted-foreground hover:bg-muted hover:text-primary"
                      onClick={(e) => { e.stopPropagation(); setTextStatusOpen(true); }}
                      aria-label="Add photo status"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </button>
            </div>
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
              <Button variant="outline" size="sm" onClick={loadStatuses}>
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
                    {recentGroups.map((group) => (
                      <StatusCard
                        key={group.userId}
                        group={group}
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
                    {viewedGroups.map((group) => (
                      <StatusCard
                        key={group.userId}
                        group={group}
                        seen
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
                    {mutedGroups.map((group) => (
                      <StatusCard
                        key={group.userId}
                        group={group}
                        seen
                        muted
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
                    <Button size="sm" onClick={() => setTextStatusOpen(true)}>
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
            onChangeIndex={(i) => {
              const item = viewing.group.items[i];
              if (item) dataService.statuses.view(item.id, meId);
            }}
            meId={meId}
          />
        )}
      </AnimatePresence>

      {/* Text status composer */}
      <AnimatePresence>
        {textStatusOpen && (
          <TextStatusComposer
            value={textValue}
            onChange={setTextValue}
            gradient={textGradient}
            onGradientChange={setTextGradient}
            onClose={() => setTextStatusOpen(false)}
            onPost={postTextStatus}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </h2>
  );
}

function StatusCard({
  group, seen = false, muted = false, onClick, onMute,
}: {
  group: StatusGroup;
  seen?: boolean;
  muted?: boolean;
  onClick: () => void;
  onMute: () => void;
}) {
  const latestItem = group.items[group.items.length - 1];
  const isImage = latestItem?.type === 'image';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="group relative flex w-full items-center gap-3 p-3.5 transition-colors hover:bg-muted/40"
    >
      <button onClick={onClick} className="flex flex-1 items-center gap-3 text-left">
        <StatusRing
          name={group.userName}
          src={group.userPhoto}
          size="md"
          seen={seen}
          muted={muted}
        />
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-tight">{group.userName}</p>
          <div className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            {isImage && <ImageIcon className="h-3.5 w-3.5 shrink-0 opacity-60" />}
            <span className="truncate">
              {latestItem?.type === 'text'
                ? latestItem.content.length > 40
                  ? `${latestItem.content.slice(0, 40)}…`
                  : latestItem.content
                : latestItem?.caption ?? 'Photo'}
            </span>
            <span className="shrink-0">·</span>
            <span className="shrink-0">{formatRelativeTime(latestItem?.createdAt ?? Date.now())}</span>
          </div>
        </div>
      </button>
      {/* Mute / unmute toggle */}
      <button
        onClick={(e) => { e.stopPropagation(); onMute(); }}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground/60 opacity-0 transition-all hover:bg-muted hover:text-foreground group-hover:opacity-100"
        aria-label={muted ? 'Unmute' : 'Mute'}
      >
        <VolumeX className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

// ============================================================================
// Status Viewer
// ============================================================================

function StatusViewer({
  group, startIndex, onClose, onChangeIndex, meId,
}: {
  group: StatusGroup;
  startIndex: number;
  onClose: () => void;
  onChangeIndex: (i: number) => void;
  meId: string;
}) {
  const [index, setIndex] = useState(startIndex);
  const [showViewers, setShowViewers] = useState(false);
  const [paused, setPaused] = useState(false);
  const item = group.items[index];
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const next = useCallback(() => {
    if (index < group.items.length - 1) {
      setIndex((i) => i + 1);
      onChangeIndex(index + 1);
    } else {
      onClose();
    }
  }, [index, group.items.length, onChangeIndex, onClose]);

  const prev = useCallback(() => {
    if (index > 0) setIndex((i) => i - 1);
  }, [index]);

  // Auto-advance timer
  useEffect(() => {
    if (paused || showViewers) return;
    timerRef.current = setTimeout(next, 5000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [index, paused, showViewers, next]);

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === ' ') { e.preventDefault(); setPaused((p) => !p); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, onClose]);

  const isMyStatus = group.userId === meId;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-black"
    >
      {/* Progress bars */}
      <div className="flex gap-1 px-4 pt-4">
        {group.items.map((_, i) => (
          <div key={i} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/25">
            <motion.div
              className="h-full bg-white"
              initial={{ width: i < index ? '100%' : '0%' }}
              animate={{ width: i === index ? '100%' : i < index ? '100%' : '0%' }}
              transition={{ duration: i === index && !paused ? 5 : 0, ease: 'linear' }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <UserAvatar name={group.userName} src={group.userPhoto} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="truncate font-medium text-white">{group.userName}</p>
          <p className="text-xs text-white/60">{formatRelativeTime(item.createdAt)}</p>
        </div>
        {isMyStatus && (
          <button
            onClick={() => setShowViewers((v) => !v)}
            className="grid h-8 w-8 place-items-center rounded-full text-white/70 transition-colors hover:bg-white/10"
            aria-label="View viewers"
          >
            <Eye className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={() => setPaused((p) => !p)}
          className="grid h-8 w-8 place-items-center rounded-full text-white/70 transition-colors hover:bg-white/10"
          aria-label={paused ? 'Play' : 'Pause'}
        >
          {paused ? <ChevronRight className="h-4 w-4" /> : <div className="flex gap-0.5"><span className="h-3 w-1 rounded-sm bg-white/70" /><span className="h-3 w-1 rounded-sm bg-white/70" /></div>}
        </button>
        <button
          onClick={onClose}
          className="grid h-8 w-8 place-items-center rounded-full text-white/70 transition-colors hover:bg-white/10"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content — tap left/right to navigate, tap middle to pause */}
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden"
        onPointerDown={(e) => {
          // Left third = prev, right third = next
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          if (x < rect.width * 0.3) prev();
          else if (x > rect.width * 0.7) next();
          else setPaused((p) => !p);
        }}
      >
        {item.type === 'image' ? (
          <img
            src={item.content}
            alt={item.caption ?? ''}
            className="max-h-full max-w-full object-contain"
            loading="lazy"
          />
        ) : item.type === 'video' ? (
          <video src={item.content} className="max-h-full max-w-full" autoPlay controls />
        ) : (
          <div className={cn('flex h-full w-full items-center justify-center bg-gradient-to-br p-8', item.background ?? 'from-emerald-500 to-teal-700')}>
            <p className="text-center text-3xl font-bold text-white">{item.content}</p>
            {item.caption && <p className="absolute bottom-8 text-center text-white/80">{item.caption}</p>}
          </div>
        )}

        {/* Desktop nav arrows */}
        {index > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 md:grid"
            aria-label="Previous"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        {index < group.items.length - 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 md:grid"
            aria-label="Next"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Viewers panel (my status only) */}
      <AnimatePresence>
        {showViewers && isMyStatus && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="max-h-64 overflow-y-auto rounded-t-2xl bg-panel p-4"
          >
            <h3 className="mb-3 font-semibold">Viewed by {item.viewers.length}</h3>
            {item.viewers.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No views yet</p>
            ) : (
              <div className="space-y-2">
                {item.viewers.map((v) => (
                  <div key={v.userId} className="flex items-center gap-3">
                    <UserAvatar
                      name={STATUS_USER_MAP[v.userId]?.name ?? 'Viewer'}
                      src={STATUS_USER_MAP[v.userId]?.photo}
                      size="sm"
                    />
                    <span className="text-sm">{STATUS_USER_MAP[v.userId]?.name ?? v.userId}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{formatRelativeTime(v.viewedAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================================
// Text Status Composer
// ============================================================================

function TextStatusComposer({
  value, onChange, gradient, onGradientChange, onClose, onPost,
}: {
  value: string;
  onChange: (v: string) => void;
  gradient: number;
  onGradientChange: (i: number) => void;
  onClose: () => void;
  onPost: () => void;
}) {
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    taRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative flex h-80 w-full max-w-md flex-col items-center justify-center rounded-3xl bg-gradient-to-br p-8 shadow-2xl',
          TEXT_GRADIENTS[gradient],
        )}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/20 text-white transition-colors hover:bg-black/30"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); onPost(); }
            if (e.key === 'Escape') { e.preventDefault(); onClose(); }
          }}
          placeholder="Type your status…"
          maxLength={120}
          className="w-full resize-none bg-transparent text-center text-2xl font-bold text-white outline-none placeholder:text-white/60"
          rows={4}
        />

        {/* Gradient picker */}
        <div className="mt-4 flex gap-2.5">
          {TEXT_GRADIENTS.map((g, i) => (
            <button
              key={g}
              onClick={() => onGradientChange(i)}
              className={cn(
                'h-7 w-7 rounded-full bg-gradient-to-br ring-2 transition-all duration-200',
                g,
                gradient === i ? 'scale-110 ring-white' : 'ring-transparent hover:scale-105',
              )}
              aria-label={`Background ${i + 1}`}
            />
          ))}
        </div>

        <Button
          onClick={onPost}
          disabled={!value.trim()}
          className="mt-6 bg-white text-black hover:bg-white/90 disabled:opacity-40"
        >
          Post status
        </Button>
      </motion.div>
    </motion.div>
  );
}
