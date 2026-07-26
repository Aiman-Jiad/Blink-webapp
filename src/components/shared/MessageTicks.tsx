import { Check, CheckCheck, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MessageStatus } from '@/types';

interface MessageTicksProps {
  status: MessageStatus;
  className?: string;
}

export function MessageTicks({ status, className }: MessageTicksProps) {
  if (status === 'sending') {
    return <Clock className={cn('h-3.5 w-3.5 opacity-60', className)} />;
  }
  if (status === 'sent') {
    return <Check className={cn('h-3.5 w-3.5 opacity-70', className)} />;
  }
  if (status === 'delivered') {
    return <CheckCheck className={cn('h-3.5 w-3.5 opacity-70', className)} />;
  }
  // read
  return <CheckCheck className={cn('h-3.5 w-3.5 text-sky-400', className)} />;
}
