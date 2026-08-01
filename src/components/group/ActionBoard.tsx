import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Square, Plus, X, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { cn } from '@/lib/utils';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import type { ActionItem, Chat } from '@/types';

const USER_NAMES: Record<string, string> = {
  u_alice: 'Alice Chen', u_marcus: 'Marcus Reid', u_sofia: 'Sofia Romano',
  u_kenji: 'Kenji Tanaka', u_priya: 'Priya Sharma', me: 'You',
};

const USER_PHOTOS: Record<string, string> = {
  u_alice: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
  u_marcus: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
  u_sofia: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
  u_kenji: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
  u_priya: 'https://images.pexels.com/photos/762020/pexels-photo-762020.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
};

interface ActionBoardProps {
  chat: Chat;
  actions: ActionItem[];
  meId: string;
  onAdd: (item: ActionItem) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}

export function ActionBoard({ chat, actions, meId, onAdd, onToggle, onRemove }: ActionBoardProps) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState('');
  const [assignee, setAssignee] = useState<string | null>(null);

  const sorted = [...actions].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return b.createdAt - a.createdAt;
  });
  const pending = actions.filter((a) => !a.completed).length;
  const done = actions.filter((a) => a.completed).length;

  function handleAdd() {
    if (!text.trim()) return;
    const item: ActionItem = {
      id: nanoid(),
      chatId: chat.id,
      text: text.trim(),
      assigneeId: assignee,
      createdBy: meId,
      completed: false,
      createdAt: Date.now(),
    };
    onAdd(item);
    setText('');
    setAssignee(null);
    setAdding(false);
    toast.success('Action item added');
  }

  return (
    <div className="card-soft p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600">
            <CheckSquare className="h-4 w-4" />
          </div>
          <h3 className="font-display text-sm font-bold">Action Board</h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{pending} pending</span>
          <span className="h-3 w-px bg-border" />
          <span>{done} done</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <AnimatePresence>
          {sorted.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="group flex items-center gap-2.5 rounded-xl p-2 transition-colors hover:bg-muted/40"
            >
              <button
                onClick={() => onToggle(item.id)}
                className={cn(
                  'grid h-5 w-5 shrink-0 place-items-center rounded transition-all',
                  item.completed
                    ? 'bg-emerald-500 text-white'
                    : 'border-2 border-muted-foreground/30 hover:border-emerald-500',
                )}
                aria-label={item.completed ? 'Mark as pending' : 'Mark as complete'}
              >
                {item.completed && <CheckSquare className="h-3 w-3" strokeWidth={3} />}
              </button>
              <div className="min-w-0 flex-1">
                <p className={cn(
                  'text-sm leading-tight',
                  item.completed && 'text-muted-foreground line-through',
                )}>
                  {item.text}
                </p>
                {item.assigneeId && (
                  <div className="mt-1 flex items-center gap-1">
                    <UserAvatar
                      name={USER_NAMES[item.assigneeId] ?? item.assigneeId}
                      src={USER_PHOTOS[item.assigneeId]}
                      size="xs"
                    />
                    <span className="text-xs text-muted-foreground">
                      {USER_NAMES[item.assigneeId] ?? item.assigneeId}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => onRemove(item.id)}
                className="grid h-6 w-6 shrink-0 place-items-center rounded text-muted-foreground/40 opacity-0 transition-all hover:text-destructive group-hover:opacity-100"
                aria-label="Delete action item"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {actions.length === 0 && !adding && (
          <p className="py-3 text-center text-xs text-muted-foreground">
            No action items yet. Keep your team on track!
          </p>
        )}

        {adding ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl bg-muted/40 p-3"
          >
            <Input
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 120))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && text.trim()) handleAdd();
                if (e.key === 'Escape') { setAdding(false); setText(''); }
              }}
              placeholder="What needs to be done?"
              maxLength={120}
              autoFocus
              className="mb-2 h-9 text-sm"
            />
            <div className="mb-2 flex flex-wrap gap-1.5">
              <button
                onClick={() => setAssignee(null)}
                className={cn(
                  'rounded-full px-2.5 py-1 text-xs font-medium transition-all',
                  !assignee ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70',
                )}
              >
                No assignee
              </button>
              {chat.participantIds.filter((id) => id !== meId).map((id) => (
                <button
                  key={id}
                  onClick={() => setAssignee(id)}
                  className={cn(
                    'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all',
                    assignee === id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70',
                  )}
                >
                  <UserAvatar name={USER_NAMES[id] ?? id} src={USER_PHOTOS[id]} size="xs" className="!h-5 !w-5" />
                  {USER_NAMES[id]?.split(' ')[0] ?? id}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => { setAdding(false); setText(''); }}>
                Cancel
              </Button>
              <Button size="sm" className="flex-1" disabled={!text.trim()} onClick={handleAdd}>
                Add
              </Button>
            </div>
          </motion.div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex w-full items-center gap-2 rounded-xl p-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
          >
            <Plus className="h-4 w-4" /> Add action item
          </button>
        )}
      </div>
    </div>
  );
}
