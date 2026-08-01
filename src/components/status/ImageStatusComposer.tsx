import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Send, ZoomIn, RotateCcw, ImagePlus, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface ImageStatusComposerProps {
  onClose: () => void;
  onPost: (data: { content: string; caption: string }) => void;
}

type Phase = 'select' | 'edit' | 'uploading';

export function ImageStatusComposer({ onClose, onPost }: ImageStatusComposerProps) {
  const [phase, setPhase] = useState<Phase>('select');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setPhase('edit');
    };
    reader.readAsDataURL(file);
  }

  function resetImage() {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  }, [offset]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setOffset({ x: dragStart.current.ox + dx, y: dragStart.current.oy + dy });
  }, [dragging]);

  const onPointerUp = useCallback(() => setDragging(false), []);

  function handlePost() {
    if (!imageSrc || !previewRef.current) return;
    setPhase('uploading');

    // Render the cropped image to a canvas for optimization
    const canvas = document.createElement('canvas');
    const targetSize = 600;
    canvas.width = targetSize;
    canvas.height = targetSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Fill background
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, targetSize, targetSize);

      // Calculate dimensions maintaining aspect ratio
      const scale = zoom;
      const minDim = Math.min(img.width, img.height);
      const srcSize = minDim / scale;
      const srcX = (img.width - srcSize) / 2 - (offset.x / previewRef.current!.clientWidth) * srcSize;
      const srcY = (img.height - srcSize) / 2 - (offset.y / previewRef.current!.clientHeight) * srcSize;

      ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, targetSize, targetSize);

      const optimized = canvas.toDataURL('image/jpeg', 0.85);
      setTimeout(() => {
        onPost({ content: optimized, caption: caption.trim() });
      }, 600);
    };
    img.src = imageSrc;
  }

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
        className="flex w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-panel shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5">
          <h2 className="font-display text-base font-bold">
            {phase === 'select' ? 'Add Photo Status' : phase === 'uploading' ? 'Uploading…' : 'Edit Photo'}
          </h2>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {phase === 'select' && (
          <div className="flex flex-col items-center gap-4 p-8">
            <div className="grid h-24 w-24 place-items-center rounded-3xl bg-primary/10 text-primary">
              <ImagePlus className="h-10 w-10" strokeWidth={1.5} />
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Choose a photo to share as your status. It will disappear after 24 hours.
            </p>
            <Button onClick={() => fileInputRef.current?.click()} className="w-full">
              <ImagePlus className="mr-2 h-4 w-4" /> Select Photo
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        )}

        {phase === 'edit' && imageSrc && (
          <>
            {/* Preview area */}
            <div className="flex flex-col items-center gap-3 p-4">
              <div
                ref={previewRef}
                className="relative aspect-square w-full max-w-sm cursor-grab overflow-hidden rounded-2xl bg-black active:cursor-grabbing"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={onPointerUp}
              >
                <img
                  src={imageSrc}
                  alt="Preview"
                  className="h-full w-full select-none object-cover"
                  style={{
                    transform: `scale(${zoom}) translate(${offset.x / zoom}px, ${offset.y / zoom}px)`,
                    transition: dragging ? 'none' : 'transform 0.1s ease-out',
                  }}
                  draggable={false}
                />
                {/* Crop guide overlay */}
                <div className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-white/30" />
              </div>

              {/* Zoom slider */}
              <div className="flex w-full max-w-sm items-center gap-3 px-2">
                <ZoomIn className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Slider
                  value={[zoom]}
                  min={1}
                  max={3}
                  step={0.05}
                  onValueChange={(v) => setZoom(v[0])}
                  className="flex-1"
                />
                <button
                  onClick={resetImage}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
                  aria-label="Reset"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>

              {/* Caption */}
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value.slice(0, 100))}
                placeholder="Add a caption…"
                maxLength={100}
                className="w-full max-w-sm rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40"
              />

              {/* Actions */}
              <div className="flex w-full max-w-sm gap-2">
                <Button variant="outline" className="flex-1" onClick={() => fileInputRef.current?.click()}>
                  Change
                </Button>
                <Button className="flex-1" onClick={handlePost}>
                  <Send className="mr-1.5 h-4 w-4" /> Post
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          </>
        )}

        {phase === 'uploading' && (
          <div className="flex flex-col items-center gap-4 p-12">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm font-medium">Publishing your status…</p>
            <p className="text-xs text-muted-foreground">This will just take a moment</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
