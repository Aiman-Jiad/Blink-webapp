import type { StatusItem } from '@/types';

export interface ContextualAction {
  type: 'url' | 'reminder';
  label: string;
  payload: string;
}

const URL_REGEX = /https?:\/\/[^\s]+/i;
// Detect time-like patterns: "3pm", "15:30", "tomorrow 9am", "meeting at 5"
const TIME_REGEX = /\b(\d{1,2}(:\d{2})?\s?(am|pm))\b|\b(\d{1,2}:\d{2})\b/i;
const REMINDER_KEYWORDS = /\b(meeting|reminder|call|appointment|deadline|due|schedule)\b/i;

/**
 * Deterministically detect contextual actions from status text.
 * Only surfaces actions when a real pattern is found — no fake AI.
 */
export function getContextualActions(item: StatusItem): ContextualAction[] {
  const actions: ContextualAction[] = [];
  const text = [item.content, item.caption].filter(Boolean).join(' ');

  const urlMatch = text.match(URL_REGEX);
  if (urlMatch) {
    actions.push({ type: 'url', label: 'Open Link', payload: urlMatch[0] });
  }

  if (TIME_REGEX.test(text) || REMINDER_KEYWORDS.test(text)) {
    const snippet = text.length > 60 ? text.slice(0, 60) + '…' : text;
    actions.push({ type: 'reminder', label: 'Add Reminder', payload: snippet });
  }

  return actions;
}
