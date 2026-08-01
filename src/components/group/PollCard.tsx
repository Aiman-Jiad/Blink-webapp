import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, X, Plus, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import type { Poll, Chat } from '@/types';

const USER_NAMES: Record<string, string> = {
  u_alice: 'Alice', u_marcus: 'Marcus', u_sofia: 'Sofia',
  u_kenji: 'Kenji', u_priya: 'Priya', me: 'You',
};

interface PollCardProps {
  poll: Poll;
  meId: string;
  onVote: (optionId: string) => void;
  onDelete?: () => void;
  canManage: boolean;
}

export function PollCard({ poll, meId, onVote, onDelete, canManage }: PollCardProps) {
  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes.length, 0);
  const myVotes = poll.options.filter((opt) => opt.votes.includes(meId));

  return (
    <div className="card-soft p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-sky-500/10 text-sky-600">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold leading-tight">{poll.question}</h3>
            <p className="text-xs text-muted-foreground">
              {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
              {poll.multiChoice && ' · Multiple choice'}
            </p>
          </div>
        </div>
        {canManage && onDelete && (
          <button
            onClick={onDelete}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            aria-label="Delete poll"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="space-y-2">
        {poll.options.map((opt) => {
          const votes = opt.votes.length;
          const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
          const hasMyVote = opt.votes.includes(meId);
          return (
            <button
              key={opt.id}
              onClick={() => onVote(opt.id)}
              className={cn(
                'relative flex w-full items-center justify-between overflow-hidden rounded-xl border px-3 py-2.5 text-left transition-all',
                hasMyVote
                  ? 'border-primary/40 bg-primary/5'
                  : 'border-border/60 bg-muted/30 hover:bg-muted/50',
              )}
            >
              <div
                className={cn(
                  'absolute inset-y-0 left-0 transition-all duration-500',
                  hasMyVote ? 'bg-primary/10' : 'bg-muted-foreground/5',
                )}
                style={{ width: `${pct}%` }}
              />
              <div className="relative flex items-center gap-2">
                {hasMyVote && (
                  <span className="grid h-4 w-4 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  </span>
                )}
                <span className={cn('text-sm font-medium', hasMyVote && 'text-primary')}>{opt.text}</span>
              </div>
              <div className="relative flex items-center gap-2">
                {votes > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {opt.votes.map((v) => USER_NAMES[v] ?? v).slice(0, 3).join(', ')}
                    {opt.votes.length > 3 && ` +${opt.votes.length - 3}`}
                  </span>
                )}
                <span className="text-sm font-bold tabular-nums">{pct}%</span>
              </div>
            </button>
          );
        })}
      </div>

      {myVotes.length > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          You voted for {myVotes.length} option{myVotes.length > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}

interface CreatePollDialogProps {
  open: boolean;
  onClose: () => void;
  chat: Chat;
  meId: string;
  onCreate: (poll: Poll) => void;
}

export function CreatePollDialog({ open, onClose, chat, meId, onCreate }: CreatePollDialogProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [multiChoice, setMultiChoice] = useState(false);

  if (!open) return null;

  function handleCreate() {
    const validOptions = options.filter((o) => o.trim());
    if (!question.trim() || validOptions.length < 2) return;
    const poll: Poll = {
      id: nanoid(),
      chatId: chat.id,
      messageId: '',
      question: question.trim(),
      options: validOptions.map((text) => ({ id: nanoid(), text: text.trim(), votes: [] })),
      multiChoice,
      createdBy: meId,
      createdAt: Date.now(),
    };
    onCreate(poll);
    toast.success('Poll created');
    setQuestion('');
    setOptions(['', '']);
    setMultiChoice(false);
    onClose();
  }

  function updateOption(idx: number, value: string) {
    setOptions((prev) => prev.map((o, i) => (i === idx ? value : o)));
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="flex w-full max-w-md flex-col overflow-hidden rounded-3xl bg-panel shadow-2xl"
        >
          <div className="flex items-center justify-between px-5 py-3.5">
            <h2 className="font-display text-base font-bold">Create Poll</h2>
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-4 px-5 pb-4">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value.slice(0, 120))}
              placeholder="Ask a question…"
              maxLength={120}
              autoFocus
            />

            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value.slice(0, 80))}
                    placeholder={`Option ${i + 1}`}
                    maxLength={80}
                    className="flex-1"
                  />
                  {options.length > 2 && (
                    <button
                      onClick={() => setOptions((prev) => prev.filter((_, idx) => idx !== i))}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Remove option"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              {options.length < 6 && (
                <button
                  onClick={() => setOptions((prev) => [...prev, ''])}
                  className="flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                >
                  <Plus className="h-4 w-4" /> Add option
                </button>
              )}
            </div>

            <button
              onClick={() => setMultiChoice((m) => !m)}
              className="flex w-full items-center justify-between rounded-xl bg-muted/40 p-3"
            >
              <div>
                <p className="text-sm font-medium">Allow multiple answers</p>
                <p className="text-xs text-muted-foreground">Users can select more than one option</p>
              </div>
              <div className={cn(
                'flex h-6 w-11 items-center rounded-full transition-colors',
                multiChoice ? 'bg-primary' : 'bg-muted-foreground/30',
              )}>
                <div className={cn(
                  'h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
                  multiChoice ? 'translate-x-5' : 'translate-x-0.5',
                )} />
              </div>
            </button>
          </div>

          <div className="flex gap-2 border-t border-border/60 px-5 py-3.5">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button
              className="flex-1"
              disabled={!question.trim() || options.filter((o) => o.trim()).length < 2}
              onClick={handleCreate}
            >
              Create poll
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
