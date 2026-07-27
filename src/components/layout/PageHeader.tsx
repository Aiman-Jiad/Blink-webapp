import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('flex items-center justify-between gap-3 border-b border-border/40 glass-strong px-4 py-3.5 shadow-soft transition-shadow duration-300 lg:px-6 lg:py-4', className)}>
      <div className="min-w-0">
        <h1 className="truncate font-display text-lg font-bold text-foreground lg:text-xl">{title}</h1>
        {subtitle && <p className="truncate text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
    </header>
  );
}
