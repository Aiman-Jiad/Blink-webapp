import { cn } from '@/lib/utils';
import { MessageCircle } from 'lucide-react';

interface LogoProps {
  size?: number;
  showWordmark?: boolean;
  className?: string;
}

export function Logo({ size = 32, showWordmark = false, className }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        className="relative grid place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-lg shadow-emerald-500/20"
        style={{ width: size, height: size }}
      >
        <MessageCircle style={{ width: size * 0.55, height: size * 0.55 }} strokeWidth={2.4} />
        <span
          className="absolute -right-0.5 -bottom-0.5 rounded-full bg-emerald-400 ring-2 ring-background"
          style={{ width: size * 0.22, height: size * 0.22 }}
        />
      </div>
      {showWordmark && (
        <span className="font-display text-xl font-extrabold tracking-tight text-foreground">
          Blink
        </span>
      )}
    </div>
  );
}
