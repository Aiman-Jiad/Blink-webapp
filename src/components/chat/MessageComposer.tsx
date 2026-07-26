import { useState, useRef, useCallback, type DragEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker from 'emoji-picker-react';
import {
  Smile, Paperclip, Send, Mic, X, Image as ImageIcon, FileText, Video,
  Camera, CornerUpLeft, Loader2, Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSettingsStore } from '@/store/settingsStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';
import type { Message, Attachment } from '@/types';

interface MessageComposerProps {
  onSend: (text: string, attachments?: Attachment[]) => void;
  onTyping: (typing: boolean) => void;
  replyTo: Message | null;
  onCancelReply: () => void;
  onSendVoice: (attachment: Attachment) => void;
}

export function MessageComposer({
  onSend, onTyping, replyTo, onCancelReply, onSendVoice,
}: MessageComposerProps) {
  const [text, setText] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [sending, setSending] = useState(false);
  const theme = useSettingsStore((s) => s.theme);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const enterToSend = useSettingsStore((s) => s.enterToSend);

  const emojiTheme: 'dark' | 'light' = theme === 'dark' ? 'dark' : 'light';

  function handleTextChange(value: string) {
    setText(value);
    onTyping(value.length > 0);
    // Auto-resize
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSending(true);
    onSend(trimmed);
    setText('');
    onTyping(false);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setTimeout(() => setSending(false), 200);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && enterToSend) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleFiles(files: FileList | null, type?: 'image' | 'camera') {
    if (!files || files.length === 0) return;
    const file = files[0];
    const url = URL.createObjectURL(file);
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const isAudio = file.type.startsWith('audio/');

    const attachment: Attachment = {
      id: nanoid(),
      type: isImage ? 'image' : isVideo ? 'video' : isAudio ? 'audio' : 'document',
      url,
      name: file.name,
      size: file.size,
      mimeType: file.type,
    };
    onSend(type === 'image' || isImage ? '' : `Sent ${file.name}`, [attachment]);
    toast.success(`${isImage ? 'Image' : isVideo ? 'Video' : 'File'} sent`);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  function handlePaste(e: React.ClipboardEvent) {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          const url = URL.createObjectURL(file);
          onSend('', [{
            id: nanoid(), type: 'image', url, name: `pasted-${Date.now()}.png`, size: file.size, mimeType: file.type,
          }]);
          toast.success('Pasted image sent');
          e.preventDefault();
          return;
        }
      }
    }
  }

  const startRecording = useCallback(() => {
    setRecording(true);
    setRecordTime(0);
    recordTimerRef.current = setInterval(() => {
      setRecordTime((t) => t + 1);
    }, 1000);
  }, []);

  const stopRecording = useCallback(() => {
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    setRecording(false);
    // Simulated voice message — in a real app this would record via MediaRecorder
    const duration = recordTime;
    setRecordTime(0);
    if (duration > 0) {
      onSendVoice({
        id: nanoid(),
        type: 'audio',
        url: '', // mock — no real audio file
        name: `voice-${Date.now()}.webm`,
        size: duration * 8000,
        mimeType: 'audio/webm',
        duration,
      });
      toast.success('Voice message sent');
    }
  }, [recordTime, onSendVoice]);

  const cancelRecording = () => {
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    setRecording(false);
    setRecordTime(0);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className="relative"
    >
      {/* Drag overlay */}
      <AnimatePresence>
        {dragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 grid place-items-center rounded-2xl border-2 border-dashed border-primary bg-primary/5"
          >
            <div className="flex flex-col items-center gap-2 text-primary">
              <Paperclip className="h-8 w-8" />
              <p className="font-medium">Drop files to send</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reply preview */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-1 flex items-center gap-2 rounded-t-xl border-l-4 border-primary bg-panel px-3 py-2"
          >
            <CornerUpLeft className="h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-primary">
                Replying to {replyTo.senderId === 'me' ? 'yourself' : 'message'}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {replyTo.text || `${replyTo.type}`}
              </p>
            </div>
            <button onClick={onCancelReply} className="rounded-md p-1 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recording bar */}
      <AnimatePresence>
        {recording && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-1 flex items-center gap-3 rounded-xl bg-destructive/10 px-4 py-2.5"
          >
            <span className="h-3 w-3 animate-pulse rounded-full bg-destructive" />
            <span className="text-sm font-medium text-destructive">
              Recording… {Math.floor(recordTime / 60)}:{(recordTime % 60).toString().padStart(2, '0')}
            </span>
            <div className="flex-1" />
            <Button size="sm" variant="ghost" onClick={cancelRecording}>
              <Trash2 className="mr-1 h-4 w-4" /> Cancel
            </Button>
            <Button size="sm" onClick={stopRecording}>
              <Send className="mr-1 h-4 w-4" /> Send
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Composer */}
      <div className="flex items-end gap-1.5 px-2 py-2 lg:px-4">
        {/* Emoji */}
        <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
          <PopoverTrigger asChild>
            <Button size="icon" variant="ghost" className="shrink-0 text-muted-foreground hover:text-primary" aria-label="Emoji picker">
              <Smile className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto border-0 p-0" side="top" align="start">
            <EmojiPicker
              theme={emojiTheme}
              emojiStyle="native"
              onEmojiClick={(emoji: { emoji: string }) => {
                setText((t) => t + emoji.emoji);
                setEmojiOpen(false);
                textareaRef.current?.focus();
              }}
              width={340}
              height={400}
              searchPlaceHolder="Search emoji"
            />
          </PopoverContent>
        </Popover>

        {/* Attach */}
        <Popover open={attachOpen} onOpenChange={setAttachOpen}>
          <PopoverTrigger asChild>
            <Button size="icon" variant="ghost" className="shrink-0 text-muted-foreground hover:text-primary" aria-label="Attach file">
              <Paperclip className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" side="top" align="start">
            <div className="grid grid-cols-2 gap-1.5">
              <AttachBtn icon={ImageIcon} label="Photo" color="bg-violet-500" onClick={() => { imageInputRef.current?.click(); setAttachOpen(false); }} />
              <AttachBtn icon={Camera} label="Camera" color="bg-rose-500" onClick={() => { cameraInputRef.current?.click(); setAttachOpen(false); }} />
              <AttachBtn icon={Video} label="Video" color="bg-sky-500" onClick={() => { fileInputRef.current?.click(); setAttachOpen(false); }} />
              <AttachBtn icon={FileText} label="Document" color="bg-emerald-500" onClick={() => { fileInputRef.current?.click(); setAttachOpen(false); }} />
            </div>
          </PopoverContent>
        </Popover>

        {/* Text input */}
        <div className="relative min-w-0 flex-1">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Type a message…"
            rows={1}
            className="max-h-[120px] w-full resize-none rounded-2xl bg-chat-bubble-them px-4 py-2.5 text-sm leading-relaxed text-foreground shadow-bubble outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30"
            aria-label="Message input"
          />
        </div>

        {/* Send / Mic */}
        {text.trim() ? (
          <motion.button
            key="send"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={handleSend}
            disabled={sending}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
            aria-label="Send message"
          >
            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </motion.button>
        ) : (
          <motion.button
            key="mic"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={recording ? stopRecording : startRecording}
            className={cn(
              'grid h-10 w-10 shrink-0 place-items-center rounded-full text-white shadow-lg transition-transform hover:scale-105 active:scale-95',
              recording ? 'bg-destructive' : 'bg-primary',
            )}
            aria-label="Record voice message"
          >
            <Mic className="h-5 w-5" />
          </motion.button>
        )}
      </div>

      {/* Hidden file inputs */}
      <input ref={imageInputRef} type="file" accept="image/*" hidden onChange={(e) => handleFiles(e.target.files, 'image')} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => handleFiles(e.target.files, 'camera')} />
      <input ref={fileInputRef} type="file" accept="image/*,video/*,audio/*,application/*" hidden onChange={(e) => handleFiles(e.target.files)} />
    </div>
  );
}

function AttachBtn({
  icon: Icon, label, color, onClick,
}: {
  icon: typeof ImageIcon;
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-lg p-2 text-sm font-medium transition-colors hover:bg-muted"
    >
      <span className={cn('grid h-9 w-9 place-items-center rounded-full text-white', color)}>
        <Icon className="h-4 w-4" />
      </span>
      {label}
    </button>
  );
}
