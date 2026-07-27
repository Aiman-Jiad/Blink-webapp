import { useState, useMemo } from 'react';
import { Search, Forward, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export interface ForwardTarget {
  id: string;
  label: string;
  photo?: string | null;
  subtitle?: string;
}

interface ForwardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targets: ForwardTarget[];
  onForward: (targetId: string) => void;
  messageCount: number;
}

export function ForwardDialog({ open, onOpenChange, targets, onForward, messageCount }: ForwardDialogProps) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return targets;
    const q = query.toLowerCase();
    return targets.filter(
      (t) => t.label.toLowerCase().includes(q) || (t.subtitle ?? '').toLowerCase().includes(q),
    );
  }, [targets, query]);

  function handleConfirm() {
    if (!selected) return;
    onForward(selected);
    setSelected(null);
    setQuery('');
  }

  function handleOpenChange(open: boolean) {
    onOpenChange(open);
    if (!open) {
      setSelected(null);
      setQuery('');
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Forward className="h-4 w-4" />
            Forward {messageCount > 1 ? `${messageCount} messages` : 'message'}
          </DialogTitle>
        </DialogHeader>
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats"
            className="h-9 rounded-full bg-muted pl-10"
            aria-label="Search chats to forward to"
          />
        </div>
        <ScrollArea className="max-h-[300px]">
          <div className="space-y-0.5 pr-2">
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No chats found</p>
            ) : (
              filtered.map((target) => (
                <button
                  key={target.id}
                  onClick={() => setSelected(target.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-colors',
                    selected === target.id ? 'bg-primary/10 ring-1 ring-primary' : 'hover:bg-muted',
                  )}
                >
                  {target.photo ? (
                    <img src={target.photo} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                  ) : (
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                      <Forward className="h-4 w-4" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{target.label}</p>
                    {target.subtitle && (
                      <p className="truncate text-xs text-muted-foreground">{target.subtitle}</p>
                    )}
                  </div>
                  {selected === target.id && (
                    <div className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="ghost" onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={!selected}>
            <Forward className="mr-1.5 h-4 w-4" /> Forward
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
