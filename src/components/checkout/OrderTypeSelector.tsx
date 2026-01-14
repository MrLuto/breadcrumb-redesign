import { Truck, Store } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderTypeSelectorProps {
  value: 'delivery' | 'pickup';
  onChange: (value: 'delivery' | 'pickup') => void;
  disabled?: boolean;
}

export function OrderTypeSelector({ value, onChange, disabled }: OrderTypeSelectorProps) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange('delivery')}
        disabled={disabled}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all',
          value === 'delivery'
            ? 'border-primary bg-primary/5 text-primary'
            : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <Truck className="h-5 w-5" />
        <span className="font-medium">Bezorgen</span>
      </button>
      <button
        type="button"
        onClick={() => onChange('pickup')}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all',
          value === 'pickup'
            ? 'border-primary bg-primary/5 text-primary'
            : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
        )}
      >
        <Store className="h-5 w-5" />
        <span className="font-medium">Afhalen</span>
      </button>
    </div>
  );
}
