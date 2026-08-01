import { MessageSquare, Users, Paperclip, Image as ImageIcon, Flame, Pin, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Chat, Message, ActionItem, Poll } from '@/types';

const USER_NAMES: Record<string, string> = {
  u_alice: 'Alice', u_marcus: 'Marcus', u_sofia: 'Sofia',
  u_kenji: 'Kenji', u_priya: 'Priya', me: 'You',
};

interface GroupPulseProps {
  chat: Chat;
  messages: Message[];
  actions: ActionItem[];
  polls: Poll[];
  meId: string;
}

export function GroupPulse({ chat, messages, actions, polls, meId }: GroupPulseProps) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayMessages = messages.filter(
    (m) => !m.deletedForEveryone && !m.deletedFor.includes(meId) && m.createdAt >= todayStart.getTime(),
  );
  const mediaCount = messages.filter(
    (m) => !m.deletedForEveryone && !m.deletedFor.includes(meId) && m.attachments.some((a) => a.type === 'image' || a.type === 'video'),
  ).length;
  const fileCount = messages.filter(
    (m) => !m.deletedForEveryone && !m.deletedFor.includes(meId) && m.attachments.some((a) => a.type === 'document'),
  ).length;
  const pinnedCount = messages.filter((m) => m.pinned && !m.deletedForEveryone).length;
  const activeMembers = new Set(todayMessages.map((m) => m.senderId));

  const senderCounts: Record<string, number> = {};
  todayMessages.forEach((m) => {
    senderCounts[m.senderId] = (senderCounts[m.senderId] ?? 0) + 1;
  });
  const mostActiveId = Object.entries(senderCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const mostActiveName = mostActiveId ? USER_NAMES[mostActiveId] ?? 'Someone' : null;

  const stats = [
    { icon: MessageSquare, label: 'messages today', value: todayMessages.length, color: 'text-sky-500' },
    { icon: Users, label: 'active members', value: activeMembers.size, color: 'text-emerald-500' },
    { icon: ImageIcon, label: 'media items', value: mediaCount, color: 'text-violet-500' },
    { icon: Paperclip, label: 'files shared', value: fileCount, color: 'text-amber-500' },
    { icon: Pin, label: 'pinned messages', value: pinnedCount, color: 'text-rose-500' },
    { icon: BarChart3, label: 'polls', value: polls.length, color: 'text-teal-500' },
  ];

  const pendingActions = actions.filter((a) => !a.completed).length;

  return (
    <div className="card-soft p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
          <Flame className="h-4 w-4" />
        </div>
        <h3 className="font-display text-sm font-bold">Group Pulse</h3>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl bg-muted/40 p-2.5 text-center">
            <stat.icon className={cn('mx-auto mb-1 h-4 w-4', stat.color)} />
            <p className={cn('text-lg font-bold tabular-nums', stat.color)}>{stat.value}</p>
            <p className="text-[10px] leading-tight text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {(mostActiveName || pendingActions > 0) && (
        <div className="mt-3 space-y-1.5 border-t border-border/40 pt-3">
          {mostActiveName && todayMessages.length > 0 && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Flame className="h-3 w-3 text-orange-500" />
              Most active today: <span className="font-semibold text-foreground">{mostActiveName}</span>
            </p>
          )}
          {pendingActions > 0 && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-3 w-3 rounded-sm border border-muted-foreground" />
              {pendingActions} pending action {pendingActions > 1 ? 'items' : 'item'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
