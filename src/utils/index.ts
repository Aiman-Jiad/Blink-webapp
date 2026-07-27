// ============================================================================
// Utility helpers shared across the app.
// ============================================================================

import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek, isThisYear } from 'date-fns';
import type { MessageStatus } from '@/types';

/** Format a timestamp for message bubbles — 12-hour with AM/PM. */
export function formatMessageTime(ts: number): string {
  return format(ts, 'h:mm a');
}

/** Format a timestamp for chat list previews — 12-hour with AM/PM. */
export function formatChatTime(ts: number): string {
  if (isToday(ts)) return format(ts, 'h:mm a');
  if (isYesterday(ts)) return 'Yesterday';
  if (isThisWeek(ts)) return format(ts, 'EEE');
  if (isThisYear(ts)) return format(ts, 'd MMM');
  return format(ts, 'dd/MM/yyyy');
}

/** Format last seen / relative time. */
export function formatRelativeTime(ts: number): string {
  return formatDistanceToNow(ts, { addSuffix: true });
}

/** Format a call duration in seconds to mm:ss. */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Get the status label for a message. */
export function statusLabel(status: MessageStatus): string {
  return {
    sending: 'Sending…',
    sent: 'Sent',
    delivered: 'Delivered',
    read: 'Read',
  }[status];
}

/** Get a human-readable file size. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/** Get initials from a name. */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** A deterministic gradient from a string (for avatars without photos). */
export function gradientFor(seed: string): string {
  const palettes = [
    'from-emerald-400 to-teal-600',
    'from-sky-400 to-blue-600',
    'from-amber-400 to-orange-600',
    'from-rose-400 to-pink-600',
    'from-violet-400 to-indigo-600',
    'from-lime-400 to-green-600',
    'from-cyan-400 to-sky-600',
    'from-fuchsia-400 to-purple-600',
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return palettes[hash % palettes.length];
}

/** Sanitize text input to prevent the worst XSS vectors (we render via React, but belt + braces). */
export function sanitizeText(input: string): string {
  return input.replace(/\u0000/g, '').slice(0, 5000);
}

/** Simple debounce. */
export function debounce<T extends (...args: never[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return ((...args: never[]) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

/** Group messages by date for the chat view. */
export function groupByDate<T extends { createdAt: number }>(items: T[]): { label: string; items: T[] }[] {
  const groups: { label: string; items: T[] }[] = [];
  for (const item of items) {
    const label = isToday(item.createdAt)
      ? 'Today'
      : isYesterday(item.createdAt)
        ? 'Yesterday'
        : isThisYear(item.createdAt)
          ? format(item.createdAt, 'd MMMM')
          : format(item.createdAt, 'd MMMM yyyy');
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(item);
    else groups.push({ label, items: [item] });
  }
  return groups;
}
