import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Volume2,
  MoreVertical, ScreenShare, Minimize2, User,
} from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { Button } from '@/components/ui/button';
import { formatDuration } from '@/utils';
import { cn } from '@/lib/utils';

export function CallOverlay() {
  const { callOverlay, closeCall, setCallState } = useUIStore();
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const [minimized, setMinimized] = useState(false);

  // Simulate the call connecting then running a timer
  useEffect(() => {
    if (!callOverlay?.open) return;
    setSeconds(0);
    setMuted(false);
    setVideoOff(false);
    setMinimized(false);
    const connectTimer = setTimeout(() => setCallState('connected'), 1800);
    return () => clearTimeout(connectTimer);
  }, [callOverlay?.open, setCallState]);

  useEffect(() => {
    if (callOverlay?.state !== 'connected') return;
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [callOverlay?.state]);

  if (!callOverlay?.open) return null;

  const { type, peerName, peerPhoto, state } = callOverlay;

  // Minimized call bar
  if (minimized) {
    return (
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-panel px-4 py-2.5 shadow-soft-lg md:bottom-6"
      >
        <UserAvatar name={peerName} src={peerPhoto} size="sm" />
        <div className="text-sm">
          <p className="font-medium">{peerName}</p>
          <p className="text-xs text-muted-foreground">
            {state === 'connected' ? formatDuration(seconds) : state === 'outgoing' ? 'Calling…' : 'Ended'}
          </p>
        </div>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setMinimized(false)}>
          <ScreenShare className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full" onClick={closeCall}>
          <PhoneOff className="h-4 w-4" />
        </Button>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={cn(
          'fixed inset-0 z-50 flex flex-col',
          type === 'video' ? 'bg-black' : 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900',
        )}
      >
        {/* Video background (simulated) */}
        {type === 'video' && !videoOff && (
          <div className="absolute inset-0">
            <img
              src={peerPhoto ?? 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=800'}
              alt=""
              className="h-full w-full object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
          </div>
        )}

        {/* Header */}
        <div className="relative flex items-center justify-between p-4 text-white">
          <Button size="icon" variant="ghost" className="text-white hover:bg-white/10" onClick={() => setMinimized(true)}>
            <Minimize2 className="h-5 w-5" />
          </Button>
          <span className="text-sm font-medium">
            {state === 'connected' ? formatDuration(seconds) : state === 'outgoing' ? 'Calling…' : 'Call ended'}
          </span>
          <Button size="icon" variant="ghost" className="text-white hover:bg-white/10">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>

        {/* Center content */}
        <div className="relative flex flex-1 flex-col items-center justify-center gap-4">
          {type === 'audio' || videoOff ? (
            <>
              <motion.div
                animate={state === 'connected' ? { scale: [1, 1.05, 1] } : {}}
                transition={state === 'connected' ? { duration: 2, repeat: Infinity } : {}}
              >
                <UserAvatar name={peerName} src={peerPhoto} size="2xl" />
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-display text-2xl font-bold text-white"
              >
                {peerName}
              </motion.h2>
              <p className="text-sm text-white/70">
                {state === 'connected'
                  ? type === 'video' ? 'Video call in progress' : 'Voice call in progress'
                  : state === 'outgoing'
                    ? type === 'video' ? 'Video calling…' : 'Voice calling…'
                    : 'Call ended'}
              </p>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute bottom-4 right-4 h-32 w-24 overflow-hidden rounded-2xl border-2 border-white/20 bg-black/40"
            >
              <div className="grid h-full w-full place-items-center text-white/40">
                <Video className="h-6 w-6" />
              </div>
            </motion.div>
          )}

          {/* Ripple for outgoing */}
          {state === 'outgoing' && (
            <div className="absolute">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute h-32 w-32 rounded-full border border-white/20"
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="relative flex items-center justify-center gap-3 p-8">
          <CallButton
            active={!muted}
            onClick={() => setMuted((m) => !m)}
            icon={muted ? MicOff : Mic}
            label={muted ? 'Unmute' : 'Mute'}
          />
          {type === 'video' && (
            <CallButton
              active={!videoOff}
              onClick={() => setVideoOff((v) => !v)}
              icon={videoOff ? VideoOff : Video}
              label={videoOff ? 'Camera on' : 'Camera off'}
            />
          )}
          <CallButton
            active={speaker}
            onClick={() => setSpeaker((s) => !s)}
            icon={Volume2}
            label="Speaker"
          />
          {type === 'video' && (
            <CallButton
              active
              onClick={() => {}}
              icon={ScreenShare}
              label="Share"
            />
          )}
          <button
            onClick={closeCall}
            className="grid h-14 w-14 place-items-center rounded-full bg-destructive text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
            aria-label="End call"
          >
            <PhoneOff className="h-6 w-6" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function CallButton({
  active, onClick, icon: Icon, label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Mic;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        'grid h-14 w-14 place-items-center rounded-full backdrop-blur transition-all hover:scale-105 active:scale-95',
        active ? 'bg-white/15 text-white' : 'bg-white text-slate-900',
      )}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
