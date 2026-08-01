import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { gradientFor } from '@/utils';

interface GroupAvatarProps {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_MAP = {
  sm: 'h-9 w-9',
  md: 'h-12 w-12',
  lg: 'h-14 w-14',
  xl: 'h-20 w-20',
} as const;

const ICON_SIZE = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-9 w-9',
} as const;

export function GroupAvatar({ name, src, size = 'md', className }: GroupAvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        loading="lazy"
        className={cn('shrink-0 rounded-full object-cover', SIZE_MAP[size], className)}
      />
    );
  }
  return (
    <div
      className={cn(
        'grid shrink-0 place-items-center rounded-full bg-gradient-to-br font-semibold text-white',
        SIZE_MAP[size],
        gradientFor(name),
        className,
      )}
    >
      <Users className={ICON_SIZE[size]} />
    </div>
  );
}
