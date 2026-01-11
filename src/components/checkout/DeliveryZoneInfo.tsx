import { CheckCircle2, XCircle, AlertCircle, Truck } from 'lucide-react';
import { DeliveryZone } from '@/hooks/useDeliveryZones';
import { cn } from '@/lib/utils';

interface DeliveryZoneInfoProps {
  zone: DeliveryZone | null;
  postcode: string;
  subtotal: number;
}

export function DeliveryZoneInfo({ zone, postcode, subtotal }: DeliveryZoneInfoProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  // Only show when postcode has 4 digits
  const prefix = postcode.replace(/\s/g, '').substring(0, 4);
  if (prefix.length < 4) return null;

  if (!zone) {
    return (
      <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
        <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-destructive">Bezorgen niet mogelijk</p>
          <p className="text-sm text-muted-foreground">
            Helaas bezorgen wij niet in postcode {prefix}. Neem contact op voor alternatieven.
          </p>
        </div>
      </div>
    );
  }

  const meetsMinimum = !zone.min_order_amount || subtotal >= zone.min_order_amount;

  return (
    <div className={cn(
      "flex items-start gap-3 p-4 rounded-lg border",
      meetsMinimum 
        ? "bg-primary/5 border-primary/20" 
        : "bg-amber-50 border-amber-200"
    )}>
      {meetsMinimum ? (
        <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
      ) : (
        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
      )}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Truck className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-foreground">{zone.zone_name}</span>
        </div>
        
        <div className="text-sm text-muted-foreground space-y-1">
          <p>Bezorgkosten: <span className="font-medium text-foreground">{formatPrice(zone.delivery_cost)}</span></p>
          
          {zone.min_order_amount && zone.min_order_amount > 0 && (
            <p>
              Minimale bestelling: {formatPrice(zone.min_order_amount)}
              {!meetsMinimum && (
                <span className="text-amber-600 ml-2">
                  (nog {formatPrice(zone.min_order_amount - subtotal)} nodig)
                </span>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}