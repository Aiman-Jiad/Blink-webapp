import { motion } from 'framer-motion';
import { Image as ImageIcon, VolumeX, Heart, MessageCircle } from 'lucide-react';
import { StatusRing } from '@/components/status/StatusRing';
import { formatRelativeTime } from '@/utils';
import { cn } from '@/lib/utils';
import type { StatusGroup } from '@/types';

interface StatusCardProps {
  group: StatusGroup;
  seen?: boolean;
  muted?: boolean;
  onClick: () => void;
  onMute: () => void;
  index?: number;
}

export function StatusCard({ group, seen = false, muted = false, onClick, onMute, index = 0 }: StatusCardProps) {
  const latestItem = group.items[group.items.length - 1];
  const isImage = latestItem?.type === 'image';
  const itemCount = group.items.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.2) }}
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
          {/* Reaction / reply indicators */}
          {(group.totalReactions > 0 || group.totalReplies > 0) && (
            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground/70">
              {group.totalReactions > 0 && (
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3 fill-current text-rose-500/60" />
                  {group.totalReactions}
                </span>
              )}
              {group.totalReplies > 0 && (
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" />
                  {group.totalReplies}
                </span>
              )}
              {itemCount > 1 && (
                <span className="ml-auto text-muted-foreground/50">
                  {itemCount} updates
                </span>
              )}
            </div>
          )}
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
