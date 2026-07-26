import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials, gradientFor } from '@/utils';
import type { UserStatus } from '@/types';

interface UserAvatarProps {
  name: string;
  src?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  status?: UserStatus;
  showStatus?: boolean;
  ring?: 'none' | 'status' | 'call';
  className?: string;
}

const SIZE_MAP = {
  xs: 'h-7 w-7 text-[10px]',
  sm: 'h-9 w-9 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-xl',
  '2xl': 'h-28 w-28 text-3xl',
} as const;

const STATUS_DOT = {
  xs: 'h-2 w-2 ring-2',
  sm: 'h-2.5 w-2.5 ring-2',
  md: 'h-3 w-3 ring-2',
  lg: 'h-3.5 w-3.5 ring-2',
  xl: 'h-4 w-4 ring-4',
  '2xl': 'h-5 w-5 ring-4',
} as const;

const STATUS_COLOR: Record<UserStatus, string> = {
  online: 'bg-emerald-500',
  offline: 'bg-slate-400',
  away: 'bg-amber-500',
};

export function UserAvatar({
  name,
  src,
  size = 'md',
  status,
  showStatus = false,
  ring = 'none',
  className,
}: UserAvatarProps) {
  const initials = getInitials(name);
  const gradient = gradientFor(name);

  const avatar = (
    <Avatar className={cn(SIZE_MAP[size], 'relative', className)}>
      {src ? (
        <AvatarImage src={src} alt={name} className="object-cover" />
      ) : null}
      <AvatarFallback className={cn('bg-gradient-to-br font-semibold text-white', gradient)}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );

  if (ring === 'status') {
    return (
      <div className={cn('relative rounded-full p-[2px] status-ring', SIZE_MAP[size])} style={{}}>
        <div className="h-full w-full rounded-full bg-background p-[2px]">{avatar}</div>
      </div>
    );
  }

  return (
    <div className="relative inline-flex">
      {avatar}
      {showStatus && status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full ring-background',
            STATUS_DOT[size],
            STATUS_COLOR[status],
          )}
        />
      )}
    </div>
  );
}
