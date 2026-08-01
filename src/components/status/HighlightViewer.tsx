import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STATUS_DURATION_MS } from '@/components/status/statusConfig';
import type { Highlight } from '@/types';

interface HighlightViewerProps {
  highlight: Highlight;
  onClose: () => void;
}

export function HighlightViewer({ highlight, onClose }: HighlightViewerProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const item = highlight.items[index];

  const next = useCallback(() => {
    if (index < highlight.items.length - 1) setIndex(i => i + 1);
    else onClose();
  }, [index, highlight.items.length, onClose]);

  const prev = useCallback(() => {
    if (index > 0) setIndex(i => i - 1);
  }, [index]);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setTimeout(next, STATUS_DURATION_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [index, paused, next]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === ' ') { e.preventDefault(); setPaused(p => !p); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, onClose]);

  if (!item) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-black select-none"
    >
      {/* Progress bars */}
      <div className="flex gap-1 px-4 pt-4">
        {highlight.items.map((_, i) => (
          <div key={i} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/25">
            <motion.div
              className="h-full bg-white"
              initial={{ width: i < index ? '100%' : '0%' }}
              animate={{ width: i === index ? '100%' : i < index ? '100%' : '0%' }}
              transition={{ duration: i === index && !paused ? STATUS_DURATION_MS / 1000 : 0, ease: 'linear' }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className={cn('grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br', highlight.coverColor)}>
          <Bookmark className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate font-medium text-white">{highlight.title}</p>
          <p className="text-xs text-white/60">{highlight.items.length} memories</p>
        </div>
        <button
          onClick={() => setPaused(p => !p)}
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

      {/* Content */}
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden"
        onPointerDown={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          if (x < rect.width * 0.3) prev();
          else if (x > rect.width * 0.7) next();
          else setPaused(p => !p);
        }}
      >
        {item.type === 'image' ? (
          <img src={item.content} alt={item.caption ?? ''} className="max-h-full max-w-full object-contain" loading="lazy" />
        ) : (
          <div className={cn('flex h-full w-full items-center justify-center bg-gradient-to-br p-8', item.background ?? 'from-emerald-500 to-teal-700')}>
            <p className="text-center text-3xl font-bold text-white">{item.content}</p>
          </div>
        )}

        {item.caption && item.type !== 'text' && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-2 text-sm text-white backdrop-blur-md">
            {item.caption}
          </div>
        )}

        {index > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 md:grid"
            aria-label="Previous"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        {index < highlight.items.length - 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 md:grid"
            aria-label="Next"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
