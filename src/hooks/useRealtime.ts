import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Simulates real-time incoming messages and typing indicators for the demo
 * backend. In a real Firebase deployment this would be replaced by Firestore
 * onSnapshot listeners (see services/dataService.ts).
 *
 * Returns a function to register a listener for chat-level events.
 */
export function useRealtimeMock() {
  // Placeholder hook — real-time events are currently driven by the chat
  // store + optimistic updates in the message composer. Kept as a seam so
  // swapping in Firestore snapshots is localized.
  return null;
}

/**
 * Auto-scrolls a container to its bottom whenever `dep` changes, but only
 * if the user is already near the bottom (so we don't yank them up while
 * reading older messages).
 */
export function useAutoScroll<T>(dep: T) {
  const ref = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const threshold = 80;
      setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < threshold);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (el && atBottom) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [dep, atBottom]);

  const scrollToBottom = useCallback(() => {
    const el = ref.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, []);

  return { ref, scrollToBottom, atBottom };
}

/**
 * Tracks online/offline status of the browser.
 */
export function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}

/**
 * Media query hook.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [query]);
  return matches;
}
