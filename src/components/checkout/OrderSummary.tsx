import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CartItem, getCartItemPrice, formatSelectedOptions } from '@/hooks/useCart';

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  deliveryCost: number;
  total: number;
  orderType: 'delivery' | 'pickup';
  isFreeDelivery: boolean;
  amountUntilFreeDelivery: number;
  freeDeliveryThreshold: number;
  minOrderAmount: number;
  meetsMinOrder: boolean;
  amountUntilMinOrder: number;
  onUpdateQuantity: (cartItemKey: string, quantity: number) => void;
  formatPrice: (price: number) => string;
}

export const OrderSummary = ({
  items,
  subtotal,
  deliveryCost,
  total,
  orderType,
  isFreeDelivery,
  amountUntilFreeDelivery,
  freeDeliveryThreshold,
  minOrderAmount,
  meetsMinOrder,
  amountUntilMinOrder,
  onUpdateQuantity,
  formatPrice,
}: OrderSummaryProps) => {
  return (
    <div className="bg-card rounded-xl p-6 shadow-card sticky top-24">
      <h2 className="text-xl font-semibold mb-4">Besteloverzicht</h2>
      
      <div className="space-y-3 mb-4">
        {items.map((item) => {
          const itemPrice = getCartItemPrice(item);
          const optionsText = formatSelectedOptions(item.selectedOptions);
          
          return (
            <div key={item.cartItemKey} className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{item.product.name}</p>
                {optionsText && (
                  <p className="text-xs text-muted-foreground truncate">{optionsText}</p>
                )}
                {item.notes && (
                  <p className="text-xs text-muted-foreground/70 truncate italic">{item.notes}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-muted rounded-lg">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onUpdateQuantity(item.cartItemKey, item.quantity - 1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onUpdateQuantity(item.cartItemKey, item.quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <span className="text-sm font-medium w-16 text-right">
                  {formatPrice(itemPrice * item.quantity)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <Separator className="my-4" />

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotaal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {orderType === 'pickup' ? 'Afhalen' : 'Bezorgkosten'}
          </span>
          <span className={isFreeDelivery ? 'text-primary font-medium' : ''}>
            {orderType === 'pickup' ? 'Gratis' : (isFreeDelivery ? 'Gratis' : formatPrice(deliveryCost))}
          </span>
        </div>
      </div>

      <Separator className="my-4" />

      <div className="flex justify-between font-semibold text-lg">
        <span>Totaal</span>
        <span>{formatPrice(total)}</span>
      </div>

      {/* Free delivery progress */}
      {orderType === 'delivery' && !isFreeDelivery && freeDeliveryThreshold > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground">
            Nog {formatPrice(amountUntilFreeDelivery)} tot gratis bezorging
          </p>
          <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all"
              style={{ width: `${Math.min((subtotal / freeDeliveryThreshold) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Minimum order amount warning */}
      {orderType === 'delivery' && !meetsMinOrder && minOrderAmount > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
            Minimaal bestelbedrag: {formatPrice(minOrderAmount)}
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
            Nog {formatPrice(amountUntilMinOrder)} nodig voor bezorging
          </p>
        </div>
      )}
    </div>
  );
};
