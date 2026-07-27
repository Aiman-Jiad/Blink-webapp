import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Eye, X, Camera, ChevronLeft, ChevronRight, Type } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
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
};

const TEXT_GRADIENTS = [
  'from-emerald-500 to-teal-700',
  'from-sky-500 to-blue-700',
  'from-rose-500 to-pink-700',
  'from-amber-500 to-orange-700',
  'from-violet-500 to-purple-700',
];

export default function StatusPage() {
  const me = useAuthStore((s) => s.user);
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [groups, setGroups] = useState<StatusGroup[]>([]);
  const [viewing, setViewing] = useState<{ group: StatusGroup; index: number } | null>(null);
  const [textStatusOpen, setTextStatusOpen] = useState(false);
  const [textValue, setTextValue] = useState('');
  const [textGradient, setTextGradient] = useState(0);
  const meId = me?.id ?? 'me';

  useEffect(() => {
    dataService.statuses.all().then((data) => {
      setStatuses(data);
      // Group by user
      const byUser = new Map<string, StatusItem[]>();
      for (const s of data) {
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
        });
      }
      setGroups(gs);
    });
  }, [meId]);

  function viewStatus(group: StatusGroup) {
    const firstUnviewed = group.items.findIndex((i) => !i.viewers.find((v) => v.userId === meId));
    setViewing({ group, index: firstUnviewed >= 0 ? firstUnviewed : 0 });
    dataService.statuses.view(group.items[0].id, meId);
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
      // Refresh
      dataService.statuses.all().then(setStatuses);
    });
  }

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
          {/* My status */}
          <div>
            <h2 className="mb-2 px-1 text-sm font-semibold uppercase text-muted-foreground">My status</h2>
            <button
              onClick={() => setTextStatusOpen(true)}
              className="card-soft flex w-full items-center gap-3 p-3 transition-colors hover:bg-muted/50"
            >
              <div className="relative">
                <UserAvatar name={me?.name ?? 'You'} src={me?.photoURL} size="md" />
                <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-primary text-white ring-2 ring-card">
                  <Plus className="h-3 w-3" />
                </span>
              </div>
              <div className="text-left">
                <p className="font-semibold">Add to my status</p>
                <p className="text-sm text-muted-foreground">Share a photo, video, or text</p>
              </div>
            </button>
          </div>

          {/* Recent updates */}
          {groups.length === 0 ? (
            <EmptyState
              icon={Camera}
              title="No status updates"
              description="Status updates from your contacts will appear here."
            />
          ) : (
            <div>
              <h2 className="mb-2 px-1 text-sm font-semibold uppercase text-muted-foreground">Recent updates</h2>
              <div className="card-soft divide-y divide-border/60">
                {groups.map((group) => (
                  <button
                    key={group.userId}
                    onClick={() => viewStatus(group)}
                    className="flex w-full items-center gap-3 p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className={cn('rounded-full p-[3px]', group.hasUnviewed ? 'status-ring' : 'bg-muted')}>
                      <div className="rounded-full bg-card p-[2px]">
                        <UserAvatar name={group.userName} src={group.userPhoto} size="md" />
                      </div>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold">{group.userName}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatRelativeTime(group.items[group.items.length - 1].createdAt)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
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
          />
        )}
      </AnimatePresence>

      {/* Text status composer */}
      <AnimatePresence>
        {textStatusOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4"
            onClick={() => setTextStatusOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className={cn('relative flex h-80 w-full max-w-md flex-col items-center justify-center rounded-2xl bg-gradient-to-br p-8', TEXT_GRADIENTS[textGradient])}
            >
              <button
                onClick={() => setTextStatusOpen(false)}
                className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/20 text-white"
              >
                <X className="h-4 w-4" />
              </button>
              <textarea
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                placeholder="Type your status…"
                maxLength={120}
                className="w-full bg-transparent text-center text-2xl font-bold text-white outline-none placeholder:text-white/70"
                rows={4}
                autoFocus
              />
              <div className="mt-4 flex gap-2">
                {TEXT_GRADIENTS.map((g, i) => (
                  <button
                    key={g}
                    onClick={() => setTextGradient(i)}
                    className={cn('h-7 w-7 rounded-full bg-gradient-to-br ring-2 transition-all', g, textGradient === i ? 'ring-white scale-110' : 'ring-transparent')}
                  />
                ))}
              </div>
              <Button
                onClick={postTextStatus}
                disabled={!textValue.trim()}
                className="mt-6 bg-white text-black hover:bg-white/90"
              >
                Post status
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusViewer({
  group, startIndex, onClose, onChangeIndex,
}: {
  group: StatusGroup;
  startIndex: number;
  onClose: () => void;
  onChangeIndex: (i: number) => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const [showViewers, setShowViewers] = useState(false);
  const item = group.items[index];

  function next() {
    if (index < group.items.length - 1) {
      setIndex((i) => i + 1);
      onChangeIndex(index + 1);
    } else {
      onClose();
    }
  }
  function prev() {
    if (index > 0) setIndex((i) => i - 1);
  }

  useEffect(() => {
    const t = setTimeout(next, 5000);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-black"
    >
      {/* Progress bars */}
      <div className="flex gap-1 p-4">
        {group.items.map((_, i) => (
          <div key={i} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
            <motion.div
              className="h-full bg-white"
              initial={{ width: i < index ? '100%' : '0%' }}
              animate={{ width: i === index ? '100%' : i < index ? '100%' : '0%' }}
              transition={{ duration: i === index ? 5 : 0, ease: 'linear' }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pb-3">
        <UserAvatar name={group.userName} src={group.userPhoto} size="sm" />
        <div className="flex-1">
          <p className="font-medium text-white">{group.userName}</p>
          <p className="text-xs text-white/70">{formatRelativeTime(item.createdAt)}</p>
        </div>
        <button onClick={() => setShowViewers((v) => !v)} className="grid h-8 w-8 place-items-center rounded-full text-white/70 hover:bg-white/10">
          <Eye className="h-4 w-4" />
        </button>
        <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-white/70 hover:bg-white/10">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden" onClick={next}>
        {item.type === 'image' ? (
          <img src={item.content} alt={item.caption ?? ''} className="max-h-full max-w-full object-contain" />
        ) : item.type === 'video' ? (
          <video src={item.content} className="max-h-full max-w-full" autoPlay controls />
        ) : (
          <div className={cn('flex h-full w-full items-center justify-center bg-gradient-to-br p-8', item.background ?? 'from-emerald-500 to-teal-700')}>
            <p className="text-center text-3xl font-bold text-white">{item.content}</p>
            {item.caption && <p className="absolute bottom-8 text-center text-white/80">{item.caption}</p>}
          </div>
        )}

        {/* Nav arrows */}
        {index > 0 && (
          <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-2 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        {index < group.items.length - 1 && (
          <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-2 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Viewers */}
      <AnimatePresence>
        {showViewers && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="max-h-64 overflow-y-auto rounded-t-2xl bg-panel p-4"
          >
            <h3 className="mb-3 font-semibold">Viewed by {item.viewers.length}</h3>
            {item.viewers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No views yet</p>
            ) : (
              <div className="space-y-2">
                {item.viewers.map((v) => (
                  <div key={v.userId} className="flex items-center gap-3">
                    <UserAvatar name={STATUS_USER_MAP[v.userId]?.name ?? 'Viewer'} src={STATUS_USER_MAP[v.userId]?.photo} size="sm" />
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
