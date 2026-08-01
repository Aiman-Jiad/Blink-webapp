import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ChevronLeft, ChevronRight, Eye, Heart, Send, MoreVertical,
  Trash2, BarChart3, ExternalLink, Bell, Pause, Play,
} from 'lucide-react';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { formatRelativeTime } from '@/utils';
import { dataService } from '@/services/dataService';
import {
  STATUS_USER_MAP, REACTION_EMOJIS, STATUS_DURATION_MS,
} from '@/components/status/statusConfig';
import { getContextualActions } from '@/components/status/contextualActions';
import type { StatusGroup, StatusItem } from '@/types';

interface StatusViewerProps {
  group: StatusGroup;
  startIndex: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
  meId: string;
  meName: string;
  onReply: (userId: string, userName: string, text: string) => void;
  onDelete?: (itemId: string) => void;
}

export function StatusViewer({
  group, startIndex, onClose, onIndexChange, meId, meName, onReply, onDelete,
}: StatusViewerProps) {
  const [index, setIndex] = useState(startIndex);
  const [paused, setPaused] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReply, setShowReply] = useState(false);
  const [reactions, setReactions] = useState<StatusItem['reactions']>([]);
  const [replies, setReplies] = useState<StatusItem['replies']>([]);
  const [dragY, setDragY] = useState(0);
  const dragStartY = useRef(0);
  const isDragging = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const item = group.items[index];
  const isMyStatus = group.userId === meId;

  // Sync local state when index changes
  useEffect(() => {
    if (item) {
      setReactions(item.reactions ?? []);
      setReplies(item.replies ?? []);
      onIndexChange(index);
    }
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  const next = useCallback(() => {
    if (index < group.items.length - 1) {
      setIndex(i => i + 1);
    } else {
      onClose();
    }
  }, [index, group.items.length, onClose]);

  const prev = useCallback(() => {
    if (index > 0) setIndex(i => i - 1);
  }, [index]);

  // Auto-advance
  useEffect(() => {
    if (paused || showReactions || showViewers || showInsights || showReply) return;
    timerRef.current = setTimeout(next, STATUS_DURATION_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [index, paused, showReactions, showViewers, showInsights, showReply, next]);

  // Keyboard
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (showReactions) setShowReactions(false);
        else if (showViewers) setShowViewers(false);
        else if (showInsights) setShowInsights(false);
        else if (showReply) setShowReply(false);
        else onClose();
      }
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === ' ' && !showReply) { e.preventDefault(); setPaused(p => !p); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, onClose, showReactions, showViewers, showInsights, showReply]);

  // Swipe down to close
  function onPointerDown(e: React.PointerEvent) {
    isDragging.current = true;
    dragStartY.current = e.clientY;
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!isDragging.current) return;
    const dy = e.clientY - dragStartY.current;
    if (dy > 0) setDragY(dy);
  }
  function onPointerUp() {
    isDragging.current = false;
    if (dragY > 100) onClose();
    else setDragY(0);
  }

  async function handleReact(emoji: string) {
    if (!item) return;
    await dataService.statuses.react(item.id, emoji, meId);
    setReactions(prev => {
      const filtered = prev.filter(r => r.userId !== meId);
      return [...filtered, { emoji, userId: meId, createdAt: Date.now() }];
    });
    setShowReactions(false);
    setPaused(false);
  }

  async function handleReply() {
    if (!replyText.trim() || !item) return;
    const reply = { id: `${Date.now()}`, userId: meId, text: replyText.trim(), createdAt: Date.now() };
    await dataService.statuses.reply(item.id, reply);
    setReplies(prev => [...prev, { ...reply, statusId: item.id }]);
    onReply(group.userId, group.userName, replyText.trim());
    setReplyText('');
    setShowReply(false);
    toast.success(`Reply sent to ${group.userName}`);
  }

  async function handleDelete() {
    if (!item || !onDelete) return;
    await dataService.statuses.remove(item.id);
    onDelete(item.id);
    toast.success('Status deleted');
    if (group.items.length <= 1) onClose();
    else if (index > 0) setIndex(i => i - 1);
  }

  if (!item) return null;

  const contextualActions = getContextualActions(item);
  const myReaction = reactions.find(r => r.userId === meId);
  const totalViews = item.viewers.length;
  const totalReactions = reactions.length;
  const totalReplies = replies.length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-black select-none"
      style={{ transform: dragY ? `translateY(${dragY}px)` : undefined, opacity: dragY ? Math.max(0.3, 1 - dragY / 400) : undefined }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* Progress bars */}
      <div className="flex gap-1 px-4 pt-4">
        {group.items.map((_, i) => (
          <div key={i} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/25">
            <motion.div
              className="h-full bg-white"
              initial={{ width: i < index ? '100%' : '0%' }}
              animate={{ width: i === index ? '100%' : i < index ? '100%' : '0%' }}
              transition={{ duration: i === index && !paused && !showReactions && !showViewers && !showInsights && !showReply ? STATUS_DURATION_MS / 1000 : 0, ease: 'linear' }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3" onPointerDown={(e) => e.stopPropagation()}>
        <UserAvatar name={group.userName} src={group.userPhoto} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="truncate font-medium text-white">{group.userName}</p>
          <p className="text-xs text-white/60">{formatRelativeTime(item.createdAt)}</p>
        </div>
        {isMyStatus && totalViews > 0 && (
          <button
            onClick={() => { setShowViewers(true); setPaused(true); }}
            className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/80 transition-colors hover:bg-white/20"
          >
            <Eye className="h-3.5 w-3.5" /> {totalViews}
          </button>
        )}
        {isMyStatus && (
          <button
            onClick={() => { setShowInsights(true); setPaused(true); }}
            className="grid h-8 w-8 place-items-center rounded-full text-white/70 transition-colors hover:bg-white/10"
            aria-label="Insights"
          >
            <BarChart3 className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={() => setPaused(p => !p)}
          className="grid h-8 w-8 place-items-center rounded-full text-white/70 transition-colors hover:bg-white/10"
          aria-label={paused ? 'Play' : 'Pause'}
        >
          {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="grid h-8 w-8 place-items-center rounded-full text-white/70 transition-colors hover:bg-white/10"
              aria-label="More options"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={4} className="w-48 rounded-xl">
            {isMyStatus && onDelete && (
              <DropdownMenuItem className="gap-2 rounded-lg" onClick={(e) => { e.preventDefault(); handleDelete(); }}>
                <Trash2 className="h-4 w-4 text-destructive" />
                <span className="text-destructive">Delete status</span>
              </DropdownMenuItem>
            )}
            {!isMyStatus && (
              <DropdownMenuItem className="gap-2 rounded-lg" onClick={(e) => { e.preventDefault(); setShowReply(true); setPaused(true); }}>
                <Send className="h-4 w-4" />
                Reply to status
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <button
          onClick={onClose}
          className="grid h-8 w-8 place-items-center rounded-full text-white/70 transition-colors hover:bg-white/10"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden"
        onPointerDown={(e) => {
          // Don't interfere with drag-to-close
          if (isDragging.current) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          if (x < rect.width * 0.3) prev();
          else if (x > rect.width * 0.7) next();
          else setPaused(p => !p);
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
            <p
              className="text-center font-bold text-white"
              style={{
                fontFamily: item.fontFamily ?? "'Plus Jakarta Sans', sans-serif",
                textAlign: item.textAlign ?? 'center',
              }}
            >
              {item.content}
            </p>
          </div>
        )}

        {/* Caption */}
        {item.caption && item.type !== 'text' && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-2 text-sm text-white backdrop-blur-md">
            {item.caption}
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

        {/* Contextual actions */}
        {contextualActions.length > 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2" onPointerDown={(e) => e.stopPropagation()}>
            {contextualActions.map((action) => (
              <button
                key={action.type}
                onClick={() => {
                  if (action.type === 'url') {
                    window.open(action.payload, '_blank', 'noopener,noreferrer');
                  } else {
                    toast.success('Reminder saved', { description: action.payload });
                  }
                }}
                className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/25"
              >
                {action.type === 'url' ? <ExternalLink className="h-3 w-3" /> : <Bell className="h-3 w-3" />}
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom interaction bar */}
      <div className="px-4 pb-6 pt-2" onPointerDown={(e) => e.stopPropagation()}>
        {/* Reply input (for others' statuses) */}
        {!isMyStatus && !showReply && (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onFocus={() => setPaused(true)}
              onBlur={() => setPaused(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && replyText.trim()) handleReply();
              }}
              placeholder={`Reply to ${group.userName}…`}
              className="flex-1 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/50 focus:border-white/40"
            />
            <button
              onClick={() => { setShowReactions(true); setPaused(true); }}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="React"
            >
              <Heart className={cn('h-5 w-5', myReaction && 'fill-rose-500 text-rose-500')} />
            </button>
          </div>
        )}

        {/* My status actions */}
        {isMyStatus && !showViewers && !showInsights && (
          <div className="flex items-center justify-center gap-4 text-white/70">
            <button
              onClick={() => { setShowViewers(true); setPaused(true); }}
              className="flex items-center gap-1.5 text-sm transition-colors hover:text-white"
            >
              <Eye className="h-4 w-4" /> {totalViews} views
            </button>
            {totalReactions > 0 && (
              <span className="flex items-center gap-1.5 text-sm">
                <Heart className="h-4 w-4 fill-rose-500 text-rose-500" /> {totalReactions}
              </span>
            )}
            {totalReplies > 0 && (
              <span className="flex items-center gap-1.5 text-sm">
                <Send className="h-4 w-4" /> {totalReplies} replies
              </span>
            )}
          </div>
        )}
      </div>

      {/* Reaction picker overlay */}
      <AnimatePresence>
        {showReactions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-1.5 rounded-full bg-panel px-3 py-2 shadow-soft-lg">
              {REACTION_EMOJIS.map((emoji) => (
                <motion.button
                  key={emoji}
                  whileHover={{ scale: 1.25 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleReact(emoji)}
                  className="grid h-10 w-10 place-items-center rounded-full text-2xl transition-colors hover:bg-muted"
                  aria-label={`React with ${emoji}`}
                >
                  {emoji}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Viewers panel */}
      <AnimatePresence>
        {showViewers && isMyStatus && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 max-h-[60%] overflow-y-auto rounded-t-2xl bg-panel p-4 shadow-soft-lg"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-base font-bold">Viewed by {totalViews}</h3>
              <button onClick={() => { setShowViewers(false); setPaused(false); }} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            {item.viewers.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No views yet</p>
            ) : (
              <div className="space-y-1">
                {item.viewers.map((v) => {
                  const info = STATUS_USER_MAP[v.userId];
                  return (
                    <div key={v.userId} className="flex items-center gap-3 rounded-xl p-2">
                      <UserAvatar name={info?.name ?? v.userId} src={info?.photo} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium">{info?.name ?? v.userId}</p>
                        <p className="text-xs text-muted-foreground">{formatRelativeTime(v.viewedAt)}</p>
                      </div>
                      {reactions.find(r => r.userId === v.userId) && (
                        <span className="text-lg">{reactions.find(r => r.userId === v.userId)!.emoji}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Insights panel */}
      <AnimatePresence>
        {showInsights && isMyStatus && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 max-h-[70%] overflow-y-auto rounded-t-2xl bg-panel p-5 shadow-soft-lg"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-base font-bold">Status Insights</h3>
              <button onClick={() => { setShowInsights(false); setPaused(false); }} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-3">
              <InsightCard label="Views" value={totalViews} color="text-sky-500" />
              <InsightCard label="Reactions" value={totalReactions} color="text-rose-500" />
              <InsightCard label="Replies" value={totalReplies} color="text-emerald-500" />
            </div>

            {/* Expiry */}
            <div className="mt-4 rounded-xl bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">Expires in</p>
              <p className="mt-0.5 text-sm font-semibold">
                {Math.max(0, Math.floor((item.expiresAt - Date.now()) / (1000 * 60 * 60)))}h {Math.max(0, Math.floor(((item.expiresAt - Date.now()) % (1000 * 60 * 60)) / (1000 * 60)))}m
              </p>
            </div>

            {/* Reaction breakdown */}
            {reactions.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reactions</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(
                    reactions.reduce<Record<string, number>>((acc, r) => {
                      acc[r.emoji] = (acc[r.emoji] ?? 0) + 1;
                      return acc;
                    }, {})
                  ).map(([emoji, count]) => (
                    <div key={emoji} className="flex items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1.5 text-sm">
                      <span className="text-base">{emoji}</span>
                      <span className="font-medium tabular-nums">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Replies list */}
            {replies.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Replies</p>
                <div className="space-y-2">
                  {replies.map((r) => {
                    const info = STATUS_USER_MAP[r.userId];
                    return (
                      <div key={r.id} className="flex items-start gap-2.5 rounded-xl bg-muted/50 p-2.5">
                        <UserAvatar name={info?.name ?? r.userId} src={info?.photo} size="xs" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{info?.name ?? r.userId}</span>
                            <span className="text-xs text-muted-foreground">{formatRelativeTime(r.createdAt)}</span>
                          </div>
                          <p className="mt-0.5 text-sm text-muted-foreground">{r.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function InsightCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl bg-muted/50 p-3 text-center">
      <p className={cn('text-2xl font-bold tabular-nums', color)}>{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
