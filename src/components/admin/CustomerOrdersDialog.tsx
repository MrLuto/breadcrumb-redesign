import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Package, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ORDER_STATUSES, PAYMENT_STATUSES, PAYMENT_METHODS, isPendingIdealOrder, type OrderWithItems } from '@/hooks/useOrders';
import type { CustomerProfile } from '@/hooks/useCustomerProfiles';

interface CustomerOrdersDialogProps {
  customer: CustomerProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(price);

function OrderRow({ order }: { order: OrderWithItems }) {
  const [expanded, setExpanded] = useState(false);
  const orderStatus = ORDER_STATUSES.find(s => s.value === order.order_status);
  const paymentStatus = PAYMENT_STATUSES.find(s => s.value === order.payment_status);
  const paymentMethod = PAYMENT_METHODS.find(m => m.value === order.payment_method);

  return (
    <div className="border rounded-lg">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
          <span className="font-medium text-sm">{order.order_number}</span>
          <span className="text-sm text-muted-foreground">
            {format(new Date(order.delivery_date), 'PP', { locale: nl })}
          </span>
          <Badge className={`${orderStatus?.color} text-white text-xs`}>{orderStatus?.label}</Badge>
          <Badge className={`${paymentStatus?.color} text-white text-xs`}>{paymentStatus?.label}</Badge>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-semibold text-sm">{formatPrice(order.total)}</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3">
          <Separator />
          <div className="space-y-1">
            {order.order_items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <div>
                  <span>{item.quantity}x {item.product_name}</span>
                  {item.order_item_options?.length > 0 && (
                    <span className="text-muted-foreground ml-1">
                      ({item.order_item_options.map(o => o.option_name).join(', ')})
                    </span>
                  )}
                  {item.notes && <p className="text-xs text-muted-foreground italic">{item.notes}</p>}
                </div>
                <span>{formatPrice(item.total_price)}</span>
              </div>
            ))}
          </div>
          <Separator />
          <div className="flex justify-between text-sm">
            <span>Subtotaal</span><span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Bezorgkosten</span><span>{formatPrice(order.delivery_cost)}</span>
          </div>
          <div className="flex justify-between font-semibold border-t pt-2">
            <span>Totaal</span><span>{formatPrice(order.total)}</span>
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground pt-1 flex-wrap">
            <span>Betaalwijze: {paymentMethod?.label || order.payment_method}</span>
            <span>Type: {order.order_type === 'pickup' ? 'Afhalen' : 'Bezorgen'}</span>
            {order.notes && <span>Opmerking: {order.notes}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

function OrderList({ orders, emptyMessage }: { orders: OrderWithItems[]; emptyMessage: string }) {
  if (orders.length === 0) {
    return <p className="text-center text-muted-foreground py-6 text-sm">{emptyMessage}</p>;
  }
  return (
    <div className="space-y-2">
      {orders.map((order) => (
        <OrderRow key={order.id} order={order} />
      ))}
    </div>
  );
}

export function CustomerOrdersDialog({ customer, open, onOpenChange }: CustomerOrdersDialogProps) {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['customer-orders-admin', customer?.user_id],
    queryFn: async () => {
      if (!customer?.user_id) return [];
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, order_item_options(*))')
        .eq('user_id', customer.user_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as OrderWithItems[]).filter((o) => !isPendingIdealOrder(o));
    },
    enabled: !!customer?.user_id && open,
  });

  const customerName = customer?.customer_type === 'business'
    ? customer?.company_name || customer?.contact_person
    : customer?.contact_person;

  const openOrders = orders?.filter(o => o.order_status !== 'delivered' && o.order_status !== 'cancelled') || [];
  const closedOrders = orders?.filter(o => o.order_status === 'delivered' || o.order_status === 'cancelled') || [];
  const totalSpent = orders?.reduce((sum, o) => sum + Number(o.total), 0) || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Bestellingen van {customerName || 'klant'}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !orders?.length ? (
          <p className="text-center text-muted-foreground py-8">Geen bestellingen gevonden</p>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-3 text-sm flex-wrap">
              <Badge variant="outline">{orders.length} bestelling(en)</Badge>
              <Badge variant="outline">Totaal besteed: {formatPrice(totalSpent)}</Badge>
              {openOrders.length > 0 && (
                <Badge variant="destructive">{openOrders.length} open</Badge>
              )}
            </div>

            <Tabs defaultValue={openOrders.length > 0 ? 'open' : 'history'}>
              <TabsList className="w-full">
                <TabsTrigger value="open" className="flex-1 gap-1.5">
                  Open
                  {openOrders.length > 0 && (
                    <Badge variant="destructive" className="h-5 min-w-[20px] px-1 text-xs ml-1">
                      {openOrders.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="history" className="flex-1">
                  Geschiedenis ({closedOrders.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="open" className="mt-3">
                <OrderList orders={openOrders} emptyMessage="Geen openstaande bestellingen" />
              </TabsContent>
              <TabsContent value="history" className="mt-3">
                <OrderList orders={closedOrders} emptyMessage="Geen afgeronde bestellingen" />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}