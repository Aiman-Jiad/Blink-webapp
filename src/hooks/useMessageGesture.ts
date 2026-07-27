import { useRef, useState, useCallback } from 'react';

interface SwipeHandlers {
  onSwipeRight?: () => void;
  onLongPress?: () => void;
  longPressMs?: number;
  threshold?: number;
}

/**
 * Touch-gesture hook for message bubbles.
 * - Swipe right → reply (WhatsApp-style)
 * - Long press → context menu (mobile)
 * Distinguishes a tap from a press/drag via a small movement threshold so it
 * never hijacks normal scrolling.
 */
export function useMessageGesture({
  onSwipeRight,
  onLongPress,
  longPressMs = 450,
  threshold = 40,
}: SwipeHandlers) {
  const startX = useRef(0);
  const startY = useRef(0);
  const currentX = useRef(0);
  const longTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dragX, setDragX] = useState(0);
  const [active, setActive] = useState(false);

  const clearLong = useCallback(() => {
    if (longTimer.current) {
      clearTimeout(longTimer.current);
      longTimer.current = null;
    }
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    startX.current = t.clientX;
    startY.current = t.clientY;
    currentX.current = t.clientX;
    setActive(true);
    setDragX(0);
    if (onLongPress) {
      clearLong();
      longTimer.current = setTimeout(() => {
        onLongPress();
        setActive(false);
        setDragX(0);
      }, longPressMs);
    }
  }, [onLongPress, longPressMs, clearLong]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!active) return;
    const t = e.touches[0];
    const dx = t.clientX - startX.current;
    const dy = t.clientY - startY.current;
    // If the finger moves more than a few px, cancel the long-press timer so
    // scrolling still works and we don't fire a context menu by accident.
    if (Math.abs(dy) > 8 || Math.abs(dx) > 8) clearLong();
    // Only allow rightward drag; clamp the visual offset.
    if (dx > 0) {
      currentX.current = t.clientX;
      setDragX(Math.min(dx, 60));
    } else {
      currentX.current = startX.current;
      setDragX(0);
    }
  }, [active, clearLong]);

  const onTouchEnd = useCallback(() => {
    clearLong();
    const dx = currentX.current - startX.current;
    setActive(false);
    setDragX(0);
    if (dx > threshold && onSwipeRight) onSwipeRight();
  }, [clearLong, threshold, onSwipeRight]);

  return {
    dragX,
    gestureHandlers: { onTouchStart, onTouchMove, onTouchEnd },
    isGestureActive: active,
  };
}
