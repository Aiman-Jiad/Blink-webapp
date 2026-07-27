import { memo, useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Reply, Forward, Copy, Pin, Star, Trash2, Smile, Download,
  Play, FileText, MoreVertical, CornerUpLeft,
} from 'lucide-react';
import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MessageTicks } from '@/components/shared/MessageTicks';
import { formatMessageTime, formatFileSize, formatDuration } from '@/utils';
import { cn } from '@/lib/utils';
import type { Message } from '@/types';

const QUICK_REACTIONS = ['❤️', '😂', '👍', '😮', '😢', '🔥'];
const ALL_EMOJIS = ['❤️', '😂', '👍', '😮', '😢', '🔥', '🎉', '👏', '🙏', '💯', '✨', '🥰', '😍', '🤔', '😅', '👀', '🙌', '💪', '🚀', '✅'];

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
  isGroup: boolean;
  senderName?: string;
  senderPhoto?: string | null;
  showAvatar: boolean;
  isLastInGroup: boolean;
  onReply: (message: Message) => void;
  onForward: (message: Message) => void;
  onDelete: (message: Message, forEveryone: boolean) => void;
  onCopy: (message: Message) => void;
  onTogglePin: (message: Message) => void;
  onToggleStar: (message: Message) => void;
  onReact: (message: Message, emoji: string) => void;
  replyToMessage?: Message | null;
}

function MessageBubbleBase({
  message, isMine, isGroup, senderName, senderPhoto, showAvatar, isLastInGroup,
  onReply, onForward, onDelete, onCopy, onTogglePin, onToggleStar, onReact,
  replyToMessage,
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const meId = 'me';

  if (message.deletedForEveryone) {
    return (
      <div className={cn('flex px-3', isMine ? 'justify-end' : 'justify-start')}>
        <div className={cn(
          'max-w-[75%] rounded-2xl px-3 py-2 text-sm italic text-muted-foreground shadow-bubble',
          isMine ? 'bg-chat-bubble-me text-foreground' : 'bg-chat-bubble-them',
          isMine ? 'rounded-br-md' : 'rounded-bl-md',
        )}>
          🚫 This message was deleted
        </div>
      </div>
    );
  }

  if (message.deletedFor.includes(meId)) return null;

  const hasReaction = message.reactions.length > 0;
  const isMedia = message.type !== 'text' && message.type !== 'system' && message.attachments.length > 0;

  function handleCopy() { onCopy(message); }

  const bubble = (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className={cn('group relative flex max-w-[78%] flex-col transition-transform duration-150', isMine ? 'items-end' : 'items-start')}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Sender name for groups */}
      {isGroup && !isMine && isLastInGroup && senderName && (
        <span className="mb-0.5 ml-1 text-xs font-semibold text-primary">{senderName}</span>
      )}

      <div className={cn('relative', isMine ? 'order-2' : 'order-2')}>
        {/* Reply preview */}
        {message.replyTo && (
          <div className={cn(
            'mb-1 flex items-center gap-2 rounded-lg border-l-2 px-2.5 py-1.5 text-xs',
            isMine ? 'bg-black/5 border-primary' : 'bg-black/5 border-primary',
          )}>
            <CornerUpLeft className="h-3 w-3 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="font-semibold text-primary">
                {message.replyTo.senderId === meId ? 'You' : (replyToMessage?.senderId === meId ? 'You' : 'Them')}
              </p>
              <p className="truncate text-muted-foreground">
                {message.replyTo.text || `${message.replyTo.type}`}
              </p>
            </div>
          </div>
        )}

        {/* Forwarded label */}
        {message.forwardedFrom && (
          <div className={cn('mb-1 flex items-center gap-1 text-xs italic text-muted-foreground', isMine ? 'mr-2' : 'ml-2')}>
            <Forward className="h-3 w-3" /> Forwarded from {message.forwardedFrom.name}
          </div>
        )}

        <div
          className={cn(
            'relative rounded-2xl px-3 py-2 shadow-soft transition-shadow duration-150 group-hover:shadow-soft-lg',
            isMine ? 'bg-chat-bubble-me text-foreground' : 'bg-chat-bubble-them text-foreground',
            isMine ? 'rounded-br-md' : 'rounded-bl-md',
            isMedia && 'overflow-hidden p-1',
          )}
        >
          {/* Media content */}
          {isMedia && <MediaContent message={message} />}

          {/* Text content */}
          {message.text && (
            <p className={cn('whitespace-pre-wrap break-words text-sm leading-relaxed', isMedia && 'px-2 py-1')}>
              {message.text}
            </p>
          )}

          {/* Footer: time + ticks */}
          <div className={cn('flex items-center justify-end gap-1', isMedia ? 'px-2 pb-1' : 'mt-0.5')}>
            {message.starred && <Star className="h-3 w-3 text-amber-400" fill="currentColor" />}
            {message.pinned && <Pin className="h-3 w-3 text-muted-foreground" fill="currentColor" />}
            <span className="text-[10px] text-muted-foreground">
              {formatMessageTime(message.createdAt)}
              {message.editedAt && ' · edited'}
            </span>
            {isMine && <MessageTicks status={message.status} />}
          </div>
        </div>

        {/* Reactions */}
        {hasReaction && (
          <div className={cn('absolute -bottom-3 flex gap-0.5', isMine ? 'right-2' : 'left-2')}>
            {message.reactions.slice(0, 3).map((r, i) => (
              <span
                key={i}
                className="grid h-5 w-5 place-items-center rounded-full bg-panel text-[11px] shadow-bubble ring-1 ring-border"
              >
                {r.emoji}
              </span>
            ))}
            {message.reactions.length > 3 && (
              <span className="grid h-5 place-items-center rounded-full bg-panel px-1 text-[10px] font-medium shadow-bubble ring-1 ring-border">
                {message.reactions.length}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Hover actions (desktop) */}
      <div
        className={cn(
          'absolute top-0 flex items-center gap-0.5 rounded-lg bg-panel/95 p-0.5 shadow-soft transition-opacity',
          isMine ? 'left-0 -translate-x-full' : 'right-0 translate-x-full',
          showActions ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
      >
        <BubbleAction label="React" onClick={() => {}}>
          <ReactionPicker onPick={(e) => onReact(message, e)} />
        </BubbleAction>
        <BubbleAction label="Reply" onClick={() => onReply(message)}>
          <Reply className="h-3.5 w-3.5" />
        </BubbleAction>
        <BubbleAction label="More" onClick={() => {}}>
          <MessageMenu
            message={message}
            isMine={isMine}
            onReply={() => onReply(message)}
            onForward={() => onForward(message)}
            onCopy={handleCopy}
            onTogglePin={() => onTogglePin(message)}
            onToggleStar={() => onToggleStar(message)}
            onDelete={(forEveryone) => onDelete(message, forEveryone)}
          />
        </BubbleAction>
      </div>
    </motion.div>
  );

  return (
    <div className={cn('flex items-end gap-2 px-3 py-0.5', isMine ? 'justify-end' : 'justify-start', isLastInGroup && 'mb-2.5')}>
      {!isMine && isGroup && (
        <div className={cn('w-8 shrink-0', showAvatar && isLastInGroup)}>
          {showAvatar && isLastInGroup && senderName && (
            <img src={senderPhoto ?? undefined} alt="" className="h-7 w-7 rounded-full object-cover" />
          )}
        </div>
      )}
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="min-w-0 flex-1">
            <ContextMenuWrapper>{bubble}</ContextMenuWrapper>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => onReact(message, '❤️')}>
            <Smile className="mr-2 h-4 w-4" /> React with ❤️
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => onReply(message)}>
            <Reply className="mr-2 h-4 w-4" /> Reply
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onForward(message)}>
            <Forward className="mr-2 h-4 w-4" /> Forward
          </ContextMenuItem>
          <ContextMenuItem onClick={handleCopy}>
            <Copy className="mr-2 h-4 w-4" /> Copy
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onTogglePin(message)}>
            <Pin className="mr-2 h-4 w-4" /> {message.pinned ? 'Unpin' : 'Pin'}
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onToggleStar(message)}>
            <Star className="mr-2 h-4 w-4" /> {message.starred ? 'Unstar' : 'Star'}
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem className="text-destructive" onClick={() => onDelete(message, false)}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete for me
          </ContextMenuItem>
          {isMine && (
            <ContextMenuItem className="text-destructive" onClick={() => onDelete(message, true)}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete for everyone
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}

function ContextMenuWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function BubbleAction({ children, label, onClick }: { children: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {children}
    </button>
  );
}

function ReactionPicker({ onPick }: { onPick: (emoji: string) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Add reaction">
          <Smile className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" side="top">
        <div className="flex gap-1">
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onPick(emoji)}
              className="grid h-8 w-8 place-items-center rounded-full text-lg transition-transform hover:scale-125 hover:bg-muted"
            >
              {emoji}
            </button>
          ))}
          <Popover>
            <PopoverTrigger asChild>
              <button className="grid h-8 w-8 place-items-center rounded-full text-sm text-muted-foreground transition-transform hover:scale-125 hover:bg-muted">
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" side="top">
              <div className="grid grid-cols-5 gap-1">
                {ALL_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => onPick(emoji)}
                    className="grid h-8 w-8 place-items-center rounded-full text-lg transition-transform hover:scale-125 hover:bg-muted"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function MessageMenu({
  message, isMine, onReply, onForward, onCopy, onTogglePin, onToggleStar, onDelete,
}: {
  message: Message;
  isMine: boolean;
  onReply: () => void;
  onForward: () => void;
  onCopy: () => void;
  onTogglePin: () => void;
  onToggleStar: () => void;
  onDelete: (forEveryone: boolean) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="More options">
          <MoreVertical className="h-3.5 w-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuItem onClick={onReply}>
          <Reply className="mr-2 h-4 w-4" /> Reply
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onForward}>
          <Forward className="mr-2 h-4 w-4" /> Forward
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onCopy}>
          <Copy className="mr-2 h-4 w-4" /> Copy
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onTogglePin}>
          <Pin className="mr-2 h-4 w-4" /> {message.pinned ? 'Unpin' : 'Pin'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onToggleStar}>
          <Star className="mr-2 h-4 w-4" /> {message.starred ? 'Unstar' : 'Star'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive" onClick={() => onDelete(false)}>
          <Trash2 className="mr-2 h-4 w-4" /> Delete for me
        </DropdownMenuItem>
        {isMine && (
          <DropdownMenuItem className="text-destructive" onClick={() => onDelete(true)}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete for everyone
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MediaContent({ message }: { message: Message }) {
  const attachment = message.attachments[0];
  if (!attachment) return null;

  if (attachment.type === 'image') {
    return (
      <div className="relative overflow-hidden rounded-xl">
        <img
          src={attachment.url}
          alt={attachment.name}
          className="max-h-72 w-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  if (attachment.type === 'video') {
    return (
      <div className="relative overflow-hidden rounded-xl bg-black">
        <video src={attachment.url} className="max-h-72 w-full" controls preload="metadata" />
      </div>
    );
  }

  if (attachment.type === 'audio') {
    return <AudioPlayer url={attachment.url} duration={attachment.duration} />;
  }

  // Document
  return (
    <a
      href={attachment.url}
      download={attachment.name}
      className="flex items-center gap-3 rounded-xl bg-black/5 p-3 transition-colors hover:bg-black/10"
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
        <FileText className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{attachment.name}</p>
        <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
      </div>
      <Download className="h-4 w-4 text-muted-foreground" />
    </a>
  );
}

function AudioPlayer({ url, duration }: { url: string; duration?: number }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => {
      setProgress((audio.currentTime / (audio.duration || 1)) * 100);
      setElapsed(audio.currentTime);
    };
    const onEnd = () => { setPlaying(false); setProgress(0); setElapsed(0); };
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnd);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnd);
    };
  }, []);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else { audio.play(); setPlaying(true); }
  }

  return (
    <div className="flex items-center gap-2 rounded-xl bg-black/5 p-2.5">
      <audio ref={audioRef} src={url} preload="metadata" />
      <button
        onClick={toggle}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105"
        aria-label={playing ? 'Pause' : 'Play'}
      >
        {playing ? <span className="text-sm">❚❚</span> : <Play className="h-4 w-4" fill="currentColor" />}
      </button>
      <div className="flex-1">
        <div className="h-1.5 overflow-hidden rounded-full bg-black/10">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>{formatDuration(Math.floor(elapsed))}</span>
          <span>{duration ? formatDuration(duration) : '0:00'}</span>
        </div>
      </div>
    </div>
  );
}

export const MessageBubble = memo(MessageBubbleBase);
