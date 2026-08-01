export const STATUS_USER_MAP: Record<string, { name: string; photo: string }> = {
  u_sofia: { name: 'Sofia Romano', photo: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop' },
  u_marcus: { name: 'Marcus Reid', photo: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop' },
  u_alice: { name: 'Alice Chen', photo: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop' },
  u_kenji: { name: 'Kenji Tanaka', photo: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop' },
  u_priya: { name: 'Priya Sharma', photo: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop' },
};

export const TEXT_GRADIENTS = [
  'from-emerald-500 to-teal-700',
  'from-sky-500 to-blue-700',
  'from-rose-500 to-pink-700',
  'from-amber-500 to-orange-700',
  'from-violet-500 to-purple-700',
  'from-cyan-500 to-teal-700',
  'from-slate-700 to-slate-900',
];

export const TEXT_PATTERNS = [
  'bg-gradient-to-br from-emerald-500 to-teal-700',
  'bg-gradient-to-br from-sky-500 to-blue-700',
  'bg-gradient-to-br from-rose-500 to-pink-700',
  'bg-gradient-to-br from-amber-500 to-orange-700',
  'bg-gradient-to-br from-violet-500 to-purple-700',
  'bg-gradient-to-br from-cyan-500 to-teal-700',
  'bg-gradient-to-br from-slate-700 to-slate-900',
];

export const TEXT_FONTS = [
  { label: 'Modern', value: "'Plus Jakarta Sans', sans-serif" },
  { label: 'Clean', value: "'Inter', sans-serif" },
  { label: 'Serif', value: "Georgia, 'Times New Roman', serif" },
  { label: 'Mono', value: "'Courier New', monospace" },
] as const;

export const TEXT_SIZES = [
  { label: 'S', value: 'text-xl' },
  { label: 'M', value: 'text-2xl' },
  { label: 'L', value: 'text-3xl' },
  { label: 'XL', value: 'text-4xl' },
] as const;

export const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '👏', '🔥', '👍'];

export const HIGHLIGHT_COVERS = [
  'from-sky-500 to-blue-700',
  'from-emerald-500 to-teal-700',
  'from-rose-500 to-pink-700',
  'from-amber-500 to-orange-700',
  'from-violet-500 to-purple-700',
  'from-cyan-500 to-teal-700',
];

export const STATUS_DURATION_MS = 5000;
export const STATUS_EXPIRY_MS = 1000 * 60 * 60 * 24;
export const MAX_TEXT_LENGTH = 200;
export const MAX_VIDEO_DURATION_SEC = 30;
export const MAX_VIDEO_SIZE_MB = 15;
