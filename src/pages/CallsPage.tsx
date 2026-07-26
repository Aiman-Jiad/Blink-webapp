import { motion } from 'framer-motion';
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, MoreVertical, UserPlus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/store/uiStore';
import { formatRelativeTime, formatDuration } from '@/utils';
import { cn } from '@/lib/utils';

const CALL_HISTORY = [
  { id: '1', name: 'Alice Chen', photo: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop', type: 'video' as const, direction: 'incoming' as const, missed: false, time: Date.now() - 1000 * 60 * 30, duration: 743 },
  { id: '2', name: 'Marcus Reid', photo: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop', type: 'audio' as const, direction: 'outgoing' as const, missed: false, time: Date.now() - 1000 * 60 * 60 * 5, duration: 182 },
  { id: '3', name: 'Sofia Romano', photo: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop', type: 'audio' as const, direction: 'incoming' as const, missed: true, time: Date.now() - 1000 * 60 * 60 * 12, duration: 0 },
  { id: '4', name: 'Kenji Tanaka', photo: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop', type: 'video' as const, direction: 'outgoing' as const, missed: false, time: Date.now() - 1000 * 60 * 60 * 24, duration: 1456 },
  { id: '5', name: 'Priya Sharma', photo: 'https://images.pexels.com/photos/762020/pexels-photo-762020.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop', type: 'audio' as const, direction: 'outgoing' as const, missed: true, time: Date.now() - 1000 * 60 * 60 * 48, duration: 0 },
];

export default function CallsPage() {
  const openCall = useUIStore((s) => s.openCall);

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Calls"
        subtitle="Your call history"
        actions={
          <Button size="icon" variant="ghost" aria-label="New call">
            <UserPlus className="h-5 w-5" />
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto p-2 pb-24 md:p-4 md:pb-4">
        <div className="mx-auto max-w-2xl">
          {CALL_HISTORY.length === 0 ? (
            <EmptyState
              icon={Phone}
              title="No calls yet"
              description="Your call history will appear here."
            />
          ) : (
            <div className="card-soft divide-y divide-border/60">
              {CALL_HISTORY.map((call, i) => (
                <motion.div
                  key={call.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/50"
                >
                  <UserAvatar name={call.name} src={call.photo} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className={cn('truncate font-semibold', call.missed && 'text-destructive')}>
                      {call.name}
                    </p>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      {call.missed ? (
                        <PhoneMissed className="h-3.5 w-3.5 text-destructive" />
                      ) : call.direction === 'incoming' ? (
                        <PhoneIncoming className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <PhoneOutgoing className="h-3.5 w-3.5 text-sky-500" />
                      )}
                      <span className="truncate">
                        {call.missed ? 'Missed' : call.direction === 'incoming' ? 'Incoming' : 'Outgoing'}
                        {!call.missed && ` · ${formatDuration(call.duration)}`}
                      </span>
                      <span>· {formatRelativeTime(call.time)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-primary"
                      onClick={() => openCall({ type: call.type, peerName: call.name, peerPhoto: call.photo })}
                      aria-label={`Start ${call.type} call`}
                    >
                      {call.type === 'video' ? <Video className="h-5 w-5" /> : <Phone className="h-5 w-5" />}
                    </Button>
                    <Button size="icon" variant="ghost" aria-label="More">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
