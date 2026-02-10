import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { OrderWithItems, ORDER_STATUSES, PAYMENT_STATUSES } from '@/hooks/useOrders';

interface OrderDetailDialogProps {
  order: OrderWithItems | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetailDialog({ order, open, onOpenChange }: OrderDetailDialogProps) {
  if (!order) return null;

  const orderStatus = ORDER_STATUSES.find(s => s.value === order.order_status);
  const paymentStatus = PAYMENT_STATUSES.find(s => s.value === order.payment_status);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Bestelling {order.order_number}
            <Badge className={orderStatus?.color}>{orderStatus?.label}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Besteldatum</h4>
              <p>{format(new Date(order.created_at), 'PPP', { locale: nl })}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Bezorgdatum</h4>
              <p>{format(new Date(order.delivery_date), 'PPP', { locale: nl })}
                {order.delivery_time && ` om ${order.delivery_time}`}
              </p>
            </div>
          </div>

          <Separator />

          {/* Customer Info */}
          <div>
            <h3 className="font-semibold mb-3">Klantgegevens</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Bedrijf:</span>
                <p className="font-medium">{order.company_name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Contactpersoon:</span>
                <p className="font-medium">{order.contact_person}</p>
              </div>
              {order.kvk_number && (
                <div>
                  <span className="text-muted-foreground">KvK-nummer:</span>
                  <p className="font-medium">{order.kvk_number}</p>
                </div>
              )}
              {order.department && (
                <div>
                  <span className="text-muted-foreground">Afdeling:</span>
                  <p className="font-medium">{order.department}</p>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">E-mail:</span>
                <p className="font-medium">{order.email}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Telefoon:</span>
                <p className="font-medium">{order.phone}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Delivery Info */}
          <div>
            <h3 className="font-semibold mb-3">Bezorgadres</h3>
            <p className="text-sm">
              {order.delivery_address}<br />
              {order.postcode} {order.city}
            </p>
            {order.delivery_zone && (
              <p className="text-sm text-muted-foreground mt-1">Zone: {order.delivery_zone}</p>
            )}
          </div>

          {/* Billing Address */}
          {order.billing_address && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3">Facturatieadres</h3>
                <p className="text-sm">
                  {order.billing_address}<br />
                  {order.billing_postcode} {order.billing_city}
                </p>
              </div>
            </>
          )}

          <Separator />

          {/* Order Items */}
          <div>
            <h3 className="font-semibold mb-3">Producten</h3>
            <div className="space-y-2">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex justify-between items-start py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity}x @ {formatPrice(item.unit_price)}
                    </p>
                    {item.order_item_options && item.order_item_options.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {item.order_item_options.map((opt) => (
                          <p key={opt.id} className="text-sm text-muted-foreground">
                            {opt.option_group_name}: {opt.option_name}
                            {opt.price_adjustment > 0 && ` (+${formatPrice(opt.price_adjustment)})`}
                          </p>
                        ))}
                      </div>
                    )}
                    {item.notes && (
                      <p className="text-sm italic text-muted-foreground">{item.notes}</p>
                    )}
                  </div>
                  <p className="font-medium">{formatPrice(item.total_price)}</p>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotaal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Bezorgkosten</span>
              <span>{formatPrice(order.delivery_cost)}</span>
            </div>
            <div className="flex justify-between font-semibold text-lg pt-2 border-t">
              <span>Totaal</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="flex items-center gap-4 pt-2">
            <span className="text-sm text-muted-foreground">Betaalstatus:</span>
            <Badge className={paymentStatus?.color}>{paymentStatus?.label}</Badge>
          </div>

          {/* Notes */}
          {order.notes && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Opmerkingen</h3>
                <p className="text-sm bg-muted p-3 rounded-md">{order.notes}</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
