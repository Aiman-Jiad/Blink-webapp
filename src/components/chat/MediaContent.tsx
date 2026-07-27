import { memo, useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, Download, FileText, ImageIcon, Video, AlertCircle,
  Loader2, RotateCw, Volume2, VolumeX, X, Maximize2, File, Mic,
} from 'lucide-react';
import { formatFileSize, formatDuration } from '@/utils';
import { cn } from '@/lib/utils';
import type { Attachment } from '@/types';

// ============================================================================
// Media cache — deduplicates in-flight loads so switching chats doesn't
// re-fetch images already downloaded. Keyed by URL.
// ============================================================================
const mediaCache = new Map<string, 'loaded' | 'error'>();

function useImageLoad(src: string) {
  const [state, setState] = useState<'loading' | 'loaded' | 'error'>(
    mediaCache.get(src) === 'loaded' ? 'loaded' : mediaCache.get(src) === 'error' ? 'error' : 'loading',
  );

  useEffect(() => {
    if (mediaCache.get(src) === 'loaded') { setState('loaded'); return; }
    if (mediaCache.get(src) === 'error') { setState('error'); return; }
    setState('loading');
    const img = new Image();
    img.src = src;
    img.onload = () => { mediaCache.set(src, 'loaded'); setState('loaded'); };
    img.onerror = () => { mediaCache.set(src, 'error'); setState('error'); };
    return () => { img.onload = null; img.onerror = null; };
  }, [src]);

  return state;
}

// ============================================================================
// Fullscreen image viewer with zoom and close
// ============================================================================
function FullscreenImageViewer({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>
      <motion.img
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        src={src}
        alt={alt}
        className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </motion.div>
  );
}

// ============================================================================
// Image media — skeleton, spinner, retry, fullscreen
// ============================================================================
const ImageMedia = memo(function ImageMedia({ attachment }: { attachment: Attachment }) {
  const [showFullscreen, setShowFullscreen] = useState(false);
  const loadState = useImageLoad(attachment.url);

  return (
    <>
      <div
        className="relative cursor-pointer overflow-hidden rounded-xl bg-muted/50"
        onClick={() => loadState === 'loaded' && setShowFullscreen(true)}
        role="button"
        tabIndex={0}
      >
        {/* Skeleton shimmer while loading */}
        {loadState === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="shimmer h-48 w-64 rounded-xl" />
            <div className="absolute flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-xs">Loading image…</span>
            </div>
          </div>
        )}

        {/* Error state with retry */}
        {loadState === 'error' && (
          <ErrorCard
            label="Image failed to load"
            onRetry={() => {
              mediaCache.delete(attachment.url);
              window.dispatchEvent(new CustomEvent('media-retry', { detail: attachment.url }));
            }}
          />
        )}

        {/* Loaded image */}
        {loadState === 'loaded' && (
          <motion.img
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            src={attachment.url}
            alt={attachment.name}
            className="max-h-72 w-full object-cover"
          />
        )}

        {/* Expand hint on hover */}
        {loadState === 'loaded' && (
          <div className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-lg bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100">
            <Maximize2 className="h-3.5 w-3.5" />
          </div>
        )}
      </div>

      <AnimatePresence>
        {showFullscreen && (
          <FullscreenImageViewer
            src={attachment.url}
            alt={attachment.name}
            onClose={() => setShowFullscreen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
});

// ============================================================================
// Video media — thumbnail, play button, duration, fullscreen playback
// ============================================================================
const VideoMedia = memo(function VideoMedia({ attachment }: { attachment: Attachment }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [thumbnailReady, setThumbnailReady] = useState(false);
  const [loadError, setLoadError] = useState(false);

  function handlePlay() {
    const v = videoRef.current;
    if (!v) { setShowPlayer(true); return; }
    if (v.paused) { v.play(); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
  }

  return (
    <div className="relative overflow-hidden rounded-xl bg-black">
      {!showPlayer && !loadError && (
        <>
          {/* Thumbnail */}
          <video
            ref={videoRef}
            src={attachment.url}
            preload="metadata"
            onLoadedData={() => setThumbnailReady(true)}
            onError={() => setLoadError(true)}
            className={cn('max-h-72 w-full object-cover transition-opacity duration-300', thumbnailReady ? 'opacity-100' : 'opacity-0')}
            muted
            playsInline
          />

          {/* Loading state */}
          {!thumbnailReady && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="shimmer h-48 w-64 rounded-xl" />
              <div className="absolute flex flex-col items-center gap-2 text-white/70">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-xs">Loading video…</span>
              </div>
            </div>
          )}

          {/* Play button overlay */}
          {thumbnailReady && (
            <div className="absolute inset-0 flex items-center justify-center" onClick={handlePlay}>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="grid h-14 w-14 place-items-center rounded-full bg-white/20 backdrop-blur-md ring-2 ring-white/40"
                aria-label="Play video"
              >
                <Play className="ml-0.5 h-6 w-6 text-white" fill="currentColor" />
              </motion.button>
            </div>
          )}

          {/* Duration badge */}
          {attachment.duration && thumbnailReady && (
            <div className="absolute bottom-2 right-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-white">
              {formatDuration(attachment.duration)}
            </div>
          )}
        </>
      )}

      {/* Full inline player after play click */}
      {showPlayer && !loadError && (
        <video
          src={attachment.url}
          controls
          autoPlay
          playsInline
          className="max-h-72 w-full"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
      )}

      {loadError && (
        <ErrorCard
          label="Video failed to load"
          onRetry={() => { setLoadError(false); setThumbnailReady(false); }}
        />
      )}
    </div>
  );
});

// ============================================================================
// Voice note — WhatsApp-style waveform with play/pause, seek, speed, duration
// ============================================================================
const VOICE_BAR_COUNT = 36;
const VOICE_BARS = Array.from({ length: VOICE_BAR_COUNT }, (_, i) =>
  0.3 + Math.abs(Math.sin(i * 0.45) * Math.cos(i * 0.27)) * 0.65,
);

const VoiceNoteMedia = memo(function VoiceNoteMedia({ attachment }: { attachment: Attachment }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(attachment.duration ?? 0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onLoaded = () => {
      setLoading(false);
      setDuration(audio.duration || attachment.duration || 0);
    };
    const onTime = () => {
      const d = audio.duration || duration || 1;
      setProgress((audio.currentTime / d) * 100);
      setElapsed(audio.currentTime);
    };
    const onEnd = () => { setPlaying(false); setProgress(0); setElapsed(0); };
    const onError = () => { setLoading(false); setError(true); };
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnd);
    audio.addEventListener('error', onError);
    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnd);
      audio.removeEventListener('error', onError);
    };
  }, [attachment.duration, duration]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || error) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else { audio.play().catch(() => setError(true)); setPlaying(true); }
  }, [playing, error]);

  const seek = useCallback((barIndex: number) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    audio.currentTime = (barIndex / VOICE_BAR_COUNT) * duration;
    setProgress((barIndex / VOICE_BAR_COUNT) * 100);
  }, [duration]);

  const cycleSpeed = useCallback(() => {
    const speeds = [1, 1.5, 2];
    const next = speeds[(speeds.indexOf(speed) + 1) % speeds.length];
    setSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  }, [speed]);

  if (error) {
    return (
      <div className="rounded-xl bg-black/5 p-3">
        <ErrorCard
          label="Voice note failed to load"
          onRetry={() => { setError(false); setLoading(true); }}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl bg-black/5 p-3">
      <audio ref={audioRef} src={attachment.url} preload="metadata" />

      {/* Play / Pause button */}
      <button
        onClick={toggle}
        disabled={loading}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
        aria-label={playing ? 'Pause' : 'Play'}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : playing ? (
          <Pause className="h-4 w-4" fill="currentColor" />
        ) : (
          <Play className="ml-0.5 h-4 w-4" fill="currentColor" />
        )}
      </button>

      {/* Waveform + info */}
      <div className="min-w-0 flex-1">
        {/* Waveform bars */}
        <div className="flex h-8 items-center gap-[2px]">
          {VOICE_BARS.map((height, i) => {
            const filled = (i / VOICE_BAR_COUNT) * 100 < progress;
            return (
              <button
                key={i}
                onClick={() => seek(i)}
                className="flex-1 cursor-pointer rounded-full transition-colors"
                style={{
                  height: `${height * 100}%`,
                  backgroundColor: filled ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.35)',
                }}
                aria-label={`Seek to ${Math.round((i / VOICE_BAR_COUNT) * duration)}s`}
              />
            );
          })}
        </div>

        {/* Duration + speed controls */}
        <div className="mt-1.5 flex items-center gap-2">
          <Mic className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] tabular-nums text-muted-foreground">
            {formatDuration(Math.floor(playing ? elapsed : duration))}
          </span>
          {!loading && (
            <button
              onClick={cycleSpeed}
              className="ml-auto rounded px-1.5 py-0.5 text-[10px] font-medium text-primary transition-colors hover:bg-primary/10"
            >
              {speed}x
            </button>
          )}
          <button
            onClick={() => {
              setMuted(!muted);
              if (audioRef.current) audioRef.current.muted = !muted;
            }}
            className="text-muted-foreground transition-colors hover:text-foreground"
            aria-label={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
          </button>
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// Document — attractive file card with icon by type, size, download
// ============================================================================
const DocumentMedia = memo(function DocumentMedia({ attachment }: { attachment: Attachment }) {
  const isPDF = attachment.mimeType === 'application/pdf' || attachment.name.endsWith('.pdf');
  const isImage = attachment.mimeType.startsWith('image/');

  const icon = isPDF ? FileText : isImage ? ImageIcon : File;
  const color = isPDF ? 'bg-red-500/15 text-red-500' : isImage ? 'bg-blue-500/15 text-blue-500' : 'bg-emerald-500/15 text-emerald-500';
  const Icon = icon;

  return (
    <a
      href={attachment.url}
      download={attachment.name}
      className="flex items-center gap-3 rounded-xl bg-black/5 p-3 transition-colors hover:bg-black/10"
    >
      <div className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl', color)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{attachment.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(attachment.size)}
          {attachment.duration ? ` · ${formatDuration(attachment.duration)}` : ''}
        </p>
      </div>
      <Download className="h-4 w-4 shrink-0 text-muted-foreground transition-colors hover:text-foreground" />
    </a>
  );
});

// ============================================================================
// Error card — professional retry UI for failed media
// ============================================================================
function ErrorCard({ label, onRetry }: { label: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl bg-muted/40 p-6 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="h-6 w-6" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-transform active:scale-95"
      >
        <RotateCw className="h-3.5 w-3.5" /> Retry
      </button>
    </div>
  );
}

// ============================================================================
// Main MediaContent dispatcher
// ============================================================================
export const MediaContent = memo(function MediaContent({ attachment }: { attachment: Attachment }) {
  switch (attachment.type) {
    case 'image':
      return <ImageMedia attachment={attachment} />;
    case 'video':
      return <VideoMedia attachment={attachment} />;
    case 'audio':
      return <VoiceNoteMedia attachment={attachment} />;
    default:
      return <DocumentMedia attachment={attachment} />;
  }
});
