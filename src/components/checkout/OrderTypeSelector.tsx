import { Truck, Store, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderTypeSelectorProps {
  value: 'delivery' | 'pickup';
  onChange: (value: 'delivery' | 'pickup') => void;
  disabled?: boolean;
  disableDelivery?: boolean;
  deliveryError?: string;
}

export function OrderTypeSelector({ 
  value, 
  onChange, 
  disabled,
  disableDelivery,
  deliveryError 
}: OrderTypeSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => !disableDelivery && onChange('delivery')}
          disabled={disabled || disableDelivery}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all',
            value === 'delivery' && !disableDelivery
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-border text-muted-foreground',
            disableDelivery 
              ? 'opacity-50 cursor-not-allowed bg-muted' 
              : 'hover:border-primary/50 hover:text-foreground',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Truck className="h-5 w-5" />
          <span className="font-medium">Bezorgen</span>
        </button>
        <button
          type="button"
          onClick={() => onChange('pickup')}
          disabled={disabled}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all',
            value === 'pickup'
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Store className="h-5 w-5" />
          <span className="font-medium">Afhalen</span>
        </button>
      </div>
      {disableDelivery && deliveryError && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{deliveryError}</span>
        </div>
      )}
    </div>
  );
}
