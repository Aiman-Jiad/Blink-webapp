import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Bold, Italic, AlignLeft, AlignCenter, AlignRight, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  TEXT_GRADIENTS, TEXT_FONTS, TEXT_SIZES, MAX_TEXT_LENGTH,
} from '@/components/status/statusConfig';

interface TextStatusComposerProps {
  onClose: () => void;
  onPost: (data: {
    content: string;
    background: string;
    fontFamily: string;
    fontSize: string;
    textAlign: 'left' | 'center' | 'right';
  }) => void;
}

export function TextStatusComposer({ onClose, onPost }: TextStatusComposerProps) {
  const [value, setValue] = useState('');
  const [gradientIdx, setGradientIdx] = useState(0);
  const [fontIdx, setFontIdx] = useState(0);
  const [sizeIdx, setSizeIdx] = useState(1);
  const [align, setAlign] = useState<'left' | 'center' | 'right'>('center');
  const [bold, setBold] = useState(true);
  const [italic, setItalic] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    taRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const remaining = MAX_TEXT_LENGTH - value.length;
  const canPost = value.trim().length > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-lg flex-col overflow-hidden rounded-3xl shadow-2xl"
      >
        {/* Preview area */}
        <div className={cn('relative flex min-h-[280px] items-center justify-center bg-gradient-to-br p-8', TEXT_GRADIENTS[gradientIdx])}>
          <button
            onClick={onClose}
            className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/20 text-white transition-colors hover:bg-black/30"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <textarea
            ref={taRef}
            value={value}
            onChange={(e) => setValue(e.target.value.slice(0, MAX_TEXT_LENGTH))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); if (canPost) onPost({ content: value, background: TEXT_GRADIENTS[gradientIdx], fontFamily: TEXT_FONTS[fontIdx].value, fontSize: TEXT_SIZES[sizeIdx].value, textAlign: align }); }
              if (e.key === 'Escape') { e.preventDefault(); onClose(); }
            }}
            placeholder="Type your status…"
            className={cn(
              'w-full resize-none bg-transparent font-bold text-white outline-none placeholder:text-white/50',
              TEXT_SIZES[sizeIdx].value,
            )}
            style={{
              fontFamily: TEXT_FONTS[fontIdx].value,
              textAlign: align,
              fontStyle: italic ? 'italic' : 'normal',
              fontWeight: bold ? 700 : 400,
              lineHeight: 1.4,
            }}
            rows={5}
          />

          {/* Character counter */}
          <span className={cn(
            'absolute bottom-3 right-4 text-xs font-medium tabular-nums',
            remaining < 20 ? 'text-white/90' : 'text-white/50',
          )}>
            {remaining}
          </span>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-3 bg-panel p-4">
          {/* Font selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Font</span>
            <div className="flex gap-1.5">
              {TEXT_FONTS.map((font, i) => (
                <button
                  key={font.label}
                  onClick={() => setFontIdx(i)}
                  className={cn(
                    'rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all',
                    fontIdx === i
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/70',
                  )}
                  style={{ fontFamily: font.value }}
                >
                  {font.label}
                </button>
              ))}
            </div>
          </div>

          {/* Size + alignment + style */}
          <div className="flex items-center gap-3">
            {/* Size */}
            <div className="flex items-center gap-1">
              {TEXT_SIZES.map((size, i) => (
                <button
                  key={size.value}
                  onClick={() => setSizeIdx(i)}
                  className={cn(
                    'grid h-7 w-7 place-items-center rounded-lg text-xs font-bold transition-all',
                    sizeIdx === i ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70',
                  )}
                >
                  {size.label}
                </button>
              ))}
            </div>

            <div className="h-5 w-px bg-border" />

            {/* Alignment */}
            <div className="flex items-center gap-1">
              {([
                { icon: AlignLeft, val: 'left' as const },
                { icon: AlignCenter, val: 'center' as const },
                { icon: AlignRight, val: 'right' as const },
              ]).map(({ icon: Icon, val }) => (
                <button
                  key={val}
                  onClick={() => setAlign(val)}
                  className={cn(
                    'grid h-7 w-7 place-items-center rounded-lg transition-all',
                    align === val ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70',
                  )}
                  aria-label={`Align ${val}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>

            <div className="h-5 w-px bg-border" />

            {/* Style */}
            <button
              onClick={() => setBold(b => !b)}
              className={cn(
                'grid h-7 w-7 place-items-center rounded-lg transition-all',
                bold ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70',
              )}
              aria-label="Bold"
            >
              <Bold className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setItalic(i => !i)}
              className={cn(
                'grid h-7 w-7 place-items-center rounded-lg transition-all',
                italic ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70',
              )}
              aria-label="Italic"
            >
              <Italic className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Gradient picker */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Background</span>
            <div className="flex flex-1 gap-2">
              {TEXT_GRADIENTS.map((g, i) => (
                <button
                  key={g}
                  onClick={() => setGradientIdx(i)}
                  className={cn(
                    'h-7 flex-1 rounded-lg bg-gradient-to-br ring-2 transition-all duration-200',
                    g,
                    gradientIdx === i ? 'scale-105 ring-primary' : 'ring-transparent hover:scale-105',
                  )}
                  aria-label={`Background ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Post button */}
          <Button
            onClick={() => canPost && onPost({ content: value, background: TEXT_GRADIENTS[gradientIdx], fontFamily: TEXT_FONTS[fontIdx].value, fontSize: TEXT_SIZES[sizeIdx].value, textAlign: align })}
            disabled={!canPost}
            className="w-full"
          >
            <Send className="mr-2 h-4 w-4" />
            Post status
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
