import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Bookmark, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';
import { HIGHLIGHT_COVERS } from '@/components/status/statusConfig';
import type { Highlight, StatusItem } from '@/types';

interface HighlightsSectionProps {
  highlights: Highlight[];
  myStatusItems: StatusItem[];
  onAdd: (hl: Highlight) => void;
  onDelete: (id: string) => void;
  onView: (hl: Highlight) => void;
}

export function HighlightsSection({
  highlights, myStatusItems, onAdd, onDelete, onView,
}: HighlightsSectionProps) {
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [coverIdx, setCoverIdx] = useState(0);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  function toggleItem(id: string) {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleCreate() {
    if (!title.trim() || selectedItems.size === 0) return;
    const items = myStatusItems
      .filter(s => selectedItems.has(s.id))
      .map(s => ({
        type: s.type === 'video' ? 'image' : s.type as 'image' | 'text',
        content: s.content,
        caption: s.caption,
        background: s.background,
        createdAt: s.createdAt,
      }));
    const hl: Highlight = {
      id: nanoid(),
      userId: 'me',
      title: title.trim(),
      coverColor: HIGHLIGHT_COVERS[coverIdx],
      items,
      createdAt: Date.now(),
    };
    onAdd(hl);
    toast.success(`Highlight "${title.trim()}" created`);
    setCreating(false);
    setTitle('');
    setCoverIdx(0);
    setSelectedItems(new Set());
  }

  return (
    <div className="space-y-2">
      <h2 className="flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Bookmark className="h-3.5 w-3.5" /> Highlights
      </h2>

      {/* Horizontal scroll of highlight circles */}
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
        {highlights.map((hl) => (
          <HighlightCircle key={hl.id} highlight={hl} onClick={() => onView(hl)} onDelete={() => onDelete(hl.id)} />
        ))}

        {/* Add new highlight */}
        <button
          onClick={() => setCreating(true)}
          className="group flex shrink-0 flex-col items-center gap-1.5"
          aria-label="Create highlight"
        >
          <div className="grid h-16 w-16 place-items-center rounded-full border-2 border-dashed border-border text-muted-foreground transition-all group-hover:border-primary group-hover:text-primary">
            <Plus className="h-5 w-5" />
          </div>
          <span className="text-xs font-medium text-muted-foreground">New</span>
        </button>
      </div>

      {/* Create dialog */}
      <AnimatePresence>
        {creating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setCreating(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-panel shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5">
                <h2 className="font-display text-base font-bold">New Highlight</h2>
                <button
                  onClick={() => setCreating(false)}
                  className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 pb-4">
                {/* Title */}
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 30))}
                  placeholder="Highlight name (e.g. Travel)"
                  maxLength={30}
                  className="mb-4"
                />

                {/* Cover color */}
                <p className="mb-2 text-xs font-medium text-muted-foreground">Cover</p>
                <div className="mb-4 flex gap-2">
                  {HIGHLIGHT_COVERS.map((cover, i) => (
                    <button
                      key={cover}
                      onClick={() => setCoverIdx(i)}
                      className={cn(
                        'h-8 w-8 rounded-full bg-gradient-to-br ring-2 transition-all',
                        cover,
                        coverIdx === i ? 'scale-110 ring-primary' : 'ring-transparent hover:scale-105',
                      )}
                      aria-label={`Cover ${i + 1}`}
                    />
                  ))}
                </div>

                {/* Select statuses */}
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Select statuses ({selectedItems.size} selected)
                </p>
                {myStatusItems.length === 0 ? (
                  <p className="rounded-xl bg-muted/40 p-4 text-center text-sm text-muted-foreground">
                    You don't have any statuses to save. Post a status first!
                  </p>
                ) : (
                  <div className="grid max-h-48 grid-cols-3 gap-2 overflow-y-auto">
                    {myStatusItems.map((s) => {
                      const selected = selectedItems.has(s.id);
                      return (
                        <button
                          key={s.id}
                          onClick={() => toggleItem(s.id)}
                          className={cn(
                            'relative aspect-square overflow-hidden rounded-xl border-2 transition-all',
                            selected ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100',
                          )}
                        >
                          {s.type === 'text' ? (
                            <div className={cn('flex h-full w-full items-center justify-center bg-gradient-to-br p-1', s.background ?? 'from-emerald-500 to-teal-700')}>
                              <span className="line-clamp-3 text-[10px] font-bold text-white">{s.content}</span>
                            </div>
                          ) : (
                            <img src={s.content} alt="" className="h-full w-full object-cover" loading="lazy" />
                          )}
                          {selected && (
                            <div className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground">
                              <Check className="h-3 w-3" strokeWidth={3} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 border-t border-border/60 px-5 py-3.5">
                <Button variant="outline" className="flex-1" onClick={() => setCreating(false)}>Cancel</Button>
                <Button
                  className="flex-1"
                  disabled={!title.trim() || selectedItems.size === 0}
                  onClick={handleCreate}
                >
                  Create
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function HighlightCircle({
  highlight, onClick, onDelete,
}: {
  highlight: Highlight;
  onClick: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group relative flex shrink-0 flex-col items-center gap-1.5">
      <button onClick={onClick} className="relative">
        <div className={cn('rounded-full bg-gradient-to-br p-[2.5px] ring-2 ring-transparent transition-all group-hover:ring-primary/30', highlight.coverColor)}>
          <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-full bg-card">
            {highlight.items[0]?.type === 'image' ? (
              <img src={highlight.items[0].content} alt="" className="h-full w-full object-cover" loading="lazy" />
            ) : highlight.items[0]?.type === 'text' ? (
              <div className={cn('flex h-full w-full items-center justify-center bg-gradient-to-br p-1', highlight.items[0].background ?? 'from-emerald-500 to-teal-700')}>
                <span className="line-clamp-2 text-[9px] font-bold text-white">{highlight.items[0].content}</span>
              </div>
            ) : (
              <Bookmark className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>
        {/* Delete on hover */}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="absolute -right-1 -top-1 hidden h-5 w-5 place-items-center rounded-full bg-destructive text-destructive-foreground shadow-md group-hover:grid"
          aria-label="Delete highlight"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </button>
      <span className="max-w-[64px] truncate text-xs font-medium text-muted-foreground">{highlight.title}</span>
    </div>
  );
}
