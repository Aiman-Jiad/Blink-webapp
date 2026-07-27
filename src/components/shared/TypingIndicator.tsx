import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  className?: string;
  label?: string;
}
export function TypingIndicator({ className, label }: TypingIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <span className="flex items-center gap-1 rounded-full bg-current/10 px-1 py-1">
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-current" />
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-current" />
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-current" />
      </span>
      {label && <span className="text-xs font-medium">{label}</span>}
    </div>
  );
}
