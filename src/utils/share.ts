// ============================================================================
// Profile sharing utilities.
// ============================================================================

import type { UserProfile } from '@/types';

/**
 * Build a shareable profile URL.
 * Uses the current origin + hash routing so it works with the app's existing
 * HashRouter. The link opens the app and could deep-link to a contact view.
 */
export function buildProfileLink(user: Pick<UserProfile, 'username'>): string {
  const origin = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
  return `${origin}#/u/${encodeURIComponent(user.username)}`;
}

/**
 * Share a profile link via the Web Share API when available.
 * Returns true if shared, false if the caller should fall back to clipboard.
 */
export async function shareProfile(user: Pick<UserProfile, 'name' | 'username'>): Promise<boolean> {
  const url = buildProfileLink(user);
  const shareData: ShareData = {
    title: `${user.name} on Blink`,
    text: `Connect with ${user.name} on Blink`,
    url,
  };
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share(shareData);
      return true;
    } catch {
      // User cancelled or share failed — fall through to clipboard
    }
  }
  return false;
}

/**
 * Copy the profile link to clipboard. Returns true on success.
 */
export async function copyProfileLink(user: Pick<UserProfile, 'username'>): Promise<boolean> {
  const url = buildProfileLink(user);
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch {
      // fall through to legacy method
    }
  }
  // Legacy fallback
  try {
    const ta = document.createElement('textarea');
    ta.value = url;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
