import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '@/store/uiStore';

const SHORTCUTS: Record<string, () => void> = {};

export function registerShortcut(key: string, handler: () => void) {
  SHORTCUTS[key.toLowerCase()] = handler;
}

export function unregisterShortcut(key: string) {
  delete SHORTCUTS[key.toLowerCase()];
}

/**
 * Global keyboard shortcuts:
 *  Cmd/Ctrl+K — command palette
 *  Cmd/Ctrl+/ — toggle search
 *  g then c   — go to chats
 *  g then s   — go to status
 *  g then p   — go to profile
 *  /          — focus search in chat list
 */
export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const setCommandOpen = useUIStore((s) => s.setCommandOpen);
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);

  useEffect(() => {
    let gPressed = false;
    let gTimer: ReturnType<typeof setTimeout> | null = null;

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Cmd/Ctrl+K — always available
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen(true);
        return;
      }

      // Cmd/Ctrl+/ — global search
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }

      if (isTyping) return;

      // 'g' then letter — vim-style navigation
      if (e.key.toLowerCase() === 'g' && !gPressed) {
        gPressed = true;
        if (gTimer) clearTimeout(gTimer);
        gTimer = setTimeout(() => (gPressed = false), 800);
        return;
      }
      if (gPressed) {
        if (e.key.toLowerCase() === 'c') navigate('/chats');
        if (e.key.toLowerCase() === 's') navigate('/status');
        if (e.key.toLowerCase() === 'p') navigate('/profile');
        if (e.key.toLowerCase() === 'e') navigate('/settings');
        gPressed = false;
        if (gTimer) clearTimeout(gTimer);
        return;
      }

      // single-key shortcuts
      const fn = SHORTCUTS[e.key.toLowerCase()];
      if (fn) fn();
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate, setCommandOpen, setSearchOpen]);
}
