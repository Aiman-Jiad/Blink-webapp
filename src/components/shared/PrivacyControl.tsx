import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PrivacyScope } from '@/types';

interface PrivacyControlProps {
  icon: typeof Check;
  label: string;
  description: string;
  value: PrivacyScope;
  onChange: (value: PrivacyScope) => void;
}

const SCOPES: { value: PrivacyScope; label: string }[] = [
  { value: 'everyone', label: 'Everyone' },
  { value: 'contacts', label: 'My Contacts' },
  { value: 'nobody', label: 'Nobody' },
];

export function PrivacyControl({ icon: Icon, label, description, value, onChange }: PrivacyControlProps) {
  return (
    <div className="px-4 py-3.5">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
          {/* Segmented control */}
          <div className="mt-2.5 flex gap-1 rounded-xl bg-muted p-1">
            {SCOPES.map((scope) => (
              <button
                key={scope.value}
                onClick={() => onChange(scope.value)}
                className={cn(
                  'flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-all duration-200 active:scale-95',
                  value === scope.value
                    ? 'bg-panel text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {scope.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
