import { User, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomerTypeToggleProps {
  value: 'private' | 'business';
  onChange: (value: 'private' | 'business') => void;
}

export function CustomerTypeToggle({ value, onChange }: CustomerTypeToggleProps) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange('private')}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all',
          value === 'private'
            ? 'border-primary bg-primary/5 text-primary'
            : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
        )}
      >
        <User className="h-5 w-5" />
        <span className="font-medium">Particulier</span>
      </button>
      <button
        type="button"
        onClick={() => onChange('business')}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all',
          value === 'business'
            ? 'border-primary bg-primary/5 text-primary'
            : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
        )}
      >
        <Building2 className="h-5 w-5" />
        <span className="font-medium">Zakelijk</span>
      </button>
    </div>
  );
}
