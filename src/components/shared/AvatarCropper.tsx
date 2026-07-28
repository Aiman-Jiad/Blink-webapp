import { useCallback, useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Check, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { cropAndOptimize, loadImageFromFile } from '@/utils/image';

interface AvatarCropperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageFile: File | null;
  onSave: (dataUrl: string) => void;
}

export function AvatarCropper({ open, onOpenChange, imageFile, onSave }: AvatarCropperProps) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0.5, y: 0.5 });
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  useEffect(() => {
    if (!open || !imageFile) return;
    setZoom(1);
    setOffset({ x: 0.5, y: 0.5 });
    setImg(null);
    loadImageFromFile(imageFile)
      .then(setImg)
      .catch(() => {});
  }, [open, imageFile]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const size = 280;
    canvas.width = size;
    canvas.height = size;
    ctx.clearRect(0, 0, size, size);
    const minDim = Math.min(img.naturalWidth, img.naturalHeight);
    const sourceSize = minDim / Math.max(zoom, 1);
    const sx = offset.x * img.naturalWidth - sourceSize / 2;
    const sy = offset.y * img.naturalHeight - sourceSize / 2;
    ctx.drawImage(img, sx, sy, sourceSize, sourceSize, 0, 0, size, size);
  }, [img, zoom, offset]);

  useEffect(() => { draw(); }, [draw]);

  function onPointerDown(e: React.PointerEvent) {
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging || !img) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Convert pixel delta to fraction of the source crop area
    const minDim = Math.min(img.naturalWidth, img.naturalHeight);
    const sourceSize = minDim / Math.max(zoom, 1);
    const dx = (e.clientX - dragStart.current.x) / canvas.width;
    const dy = (e.clientY - dragStart.current.y) / canvas.height;
    let nx = dragStart.current.ox - dx * (sourceSize / img.naturalWidth);
    let ny = dragStart.current.oy - dy * (sourceSize / img.naturalHeight);
    // Clamp so the crop stays within the image
    const halfCrop = (sourceSize / 2) / img.naturalWidth;
    nx = Math.max(halfCrop, Math.min(1 - halfCrop, nx));
    const halfCropY = (sourceSize / 2) / img.naturalHeight;
    ny = Math.max(halfCropY, Math.min(1 - halfCropY, ny));
    setOffset({ x: nx, y: ny });
  }

  function onPointerUp() { setDragging(false); }

  function handleSave() {
    if (!img) return;
    setSaving(true);
    // Defer to next frame so the spinner shows
    requestAnimationFrame(() => {
      const dataUrl = cropAndOptimize(img, zoom, offset.x, offset.y, 256);
      setSaving(false);
      onSave(dataUrl);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm gap-0 p-0 sm:rounded-2xl">
        <DialogHeader className="px-5 pt-5">
          <DialogTitle className="text-center text-base font-semibold">Edit profile photo</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 px-5 pb-5 pt-2">
          {/* Circular crop preview */}
          <div className="relative">
            <div className="overflow-hidden rounded-full border-4 border-background shadow-lg ring-1 ring-border">
              <canvas
                ref={canvasRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                className={cn('h-56 w-56 touch-none', dragging ? 'cursor-grabbing' : 'cursor-grab')}
              />
            </div>
            {/* Crop guide ring */}
            <div className="pointer-events-none absolute inset-0 rounded-full border-2 border-white/40" />
          </div>

          <p className="text-center text-xs text-muted-foreground">Drag to reposition</p>

          {/* Zoom control */}
          <div className="flex w-full items-center gap-3">
            <ZoomOut className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.01}
              onValueChange={(v) => setZoom(v[0])}
              aria-label="Zoom"
            />
            <ZoomIn className="h-4 w-4 shrink-0 text-muted-foreground" />
          </div>

          {/* Actions */}
          <div className="flex w-full gap-2 pt-1">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => { setZoom(1); setOffset({ x: 0.5, y: 0.5 }); }}
            >
              <RotateCcw className="mr-1.5 h-4 w-4" /> Reset
            </Button>
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={!img || saving}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="mr-1.5 h-4 w-4" /> Save</>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
