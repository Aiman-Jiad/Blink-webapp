import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/shared/UserAvatar';

interface StatusRingProps {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
  seen: boolean;
  muted?: boolean;
  segmentCount?: number;
  currentSegment?: number;
  className?: string;
}

const RING_SIZE = {
  sm: { outer: 'h-12 w-12', pad: 'p-[2px]', inner: 'p-[1.5px]' },
  md: { outer: 'h-14 w-14', pad: 'p-[2.5px]', inner: 'p-[2px]' },
  lg: { outer: 'h-16 w-16', pad: 'p-[3px]', inner: 'p-[2.5px]' },
};

/**
 * Status ring around an avatar.
 * - Unseen: gradient ring (primary color)
 * - Seen: muted ring (gray)
 * - Muted: dashed muted ring
 */
export function StatusRing({
  name, src, size = 'md', seen, muted = false, className,
}: StatusRingProps) {
  const rs = RING_SIZE[size];

  if (muted) {
    return (
      <div className={cn('relative shrink-0 rounded-full', rs.outer, className)}>
        <div className="h-full w-full rounded-full border-2 border-dashed border-muted-foreground/30">
          <div className={cn('h-full w-full rounded-full bg-card', rs.inner)}>
            <UserAvatar name={name} src={src} size="sm" className="h-full w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative shrink-0 rounded-full', rs.outer, className)}>
      {/* Ring layer */}
      <div
        className={cn(
          'absolute inset-0 rounded-full',
          seen
            ? 'bg-muted-foreground/25'
            : 'ring-gradient',
        )}
      />
      {/* Inner gap + avatar */}
      <div className={cn('relative h-full w-full rounded-full bg-background', rs.pad)}>
        <div className={cn('h-full w-full rounded-full bg-card', rs.inner)}>
          <UserAvatar name={name} src={src} size="sm" className="h-full w-full" />
        </div>
      </div>
    </div>
  );
}
