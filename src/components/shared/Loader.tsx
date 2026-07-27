import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';

interface LoaderProps {
  fullscreen?: boolean;
  label?: string;
}

export function Loader({ fullscreen, label }: LoaderProps) {
  if (fullscreen) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-background">
        <Logo size={56} showWordmark />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          {label}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );
}
