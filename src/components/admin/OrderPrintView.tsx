import { forwardRef } from 'react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { OrderWithItems } from '@/hooks/useOrders';

interface OrderPrintViewProps {
  order: OrderWithItems;
}

export const OrderPrintView = forwardRef<HTMLDivElement, OrderPrintViewProps>(
  ({ order }, ref) => {
    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('nl-NL', {
        style: 'currency',
        currency: 'EUR',
      }).format(price);
    };

    const getCustomerTypeLabel = (type: string | null) => {
      if (type === 'private') return 'Particulier';
      return 'Zakelijk';
    };

    const getOrderTypeLabel = (type: string | null) => {
      if (type === 'pickup') return 'Afhalen';
      return 'Bezorgen';
    };

    const getPaymentMethodLabel = (method: string) => {
      const methods: Record<string, string> = {
        ideal: 'iDEAL',
        pin: 'PIN',
        invoice: 'Op factuur',
        monthly_invoice: 'Maandfactuur',
        cash: 'Contant',
        direct: 'Direct betalen',
      };
      return methods[method] || method;
    };

    return (
      <div ref={ref} className="print-view p-8 bg-white text-black max-w-[210mm] mx-auto">
        <style>{`
          @media print {
            .print-view {
              padding: 0;
              font-size: 12pt;
            }
            .print-view table {
              width: 100%;
              border-collapse: collapse;
            }
            .print-view th,
            .print-view td {
              border: 1px solid #000;
              padding: 4px 8px;
              text-align: left;
            }
            .print-view th {
              background-color: #f0f0f0;
            }
          }
        `}</style>

        {/* Header */}
        <div className="border-b-2 border-black pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">BESTELLING</h1>
              <p className="text-lg font-medium">{order.order_number}</p>
            </div>
            <div className="text-right">
              <p className="text-sm">Besteldatum:</p>
              <p className="font-medium">
                {format(new Date(order.created_at), 'PPP HH:mm', { locale: nl })}
              </p>
            </div>
          </div>
        </div>

        {/* Order Info */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h2 className="font-bold mb-2 border-b pb-1">Klantgegevens</h2>
            <p className="text-sm text-gray-600">
              {getCustomerTypeLabel((order as any).customer_type)}
            </p>
            <p className="font-medium">{order.company_name}</p>
            <p>{order.contact_person}</p>
            <p>{order.phone}</p>
            <p>{order.email}</p>
          </div>
          <div>
            <h2 className="font-bold mb-2 border-b pb-1">
              {(order as any).order_type === 'pickup' ? 'Afhalen' : 'Bezorgen'}
            </h2>
            {(order as any).order_type !== 'pickup' && (
              <>
                <p>{order.delivery_address}</p>
                <p>{order.postcode} {order.city}</p>
              </>
            )}
            <p className="mt-2">
              <strong>Datum:</strong>{' '}
              {format(new Date(order.delivery_date), 'PPPP', { locale: nl })}
            </p>
            {(order as any).delivery_asap ? (
              <p><strong>Tijd:</strong> Zo snel mogelijk</p>
            ) : order.delivery_time && (
              <p><strong>Tijd:</strong> {order.delivery_time}</p>
            )}
          </div>
        </div>

        {/* Products */}
        <div className="mb-6">
          <h2 className="font-bold mb-2 border-b pb-1">Producten</h2>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left py-2 px-2">Product</th>
                <th className="text-center py-2 px-2 w-16">Aantal</th>
                <th className="text-right py-2 px-2 w-24">Prijs</th>
                <th className="text-right py-2 px-2 w-24">Totaal</th>
              </tr>
            </thead>
            <tbody>
              {order.order_items.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="py-2 px-2">
                    <p className="font-medium">{item.product_name}</p>
                    {item.notes && (
                      <p className="text-sm italic text-gray-600">→ {item.notes}</p>
                    )}
                  </td>
                  <td className="text-center py-2 px-2">{item.quantity}</td>
                  <td className="text-right py-2 px-2">{formatPrice(item.unit_price)}</td>
                  <td className="text-right py-2 px-2">{formatPrice(item.total_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="border-t-2 border-black pt-4 mb-6">
          <div className="flex justify-end">
            <div className="w-64">
              <div className="flex justify-between py-1">
                <span>Subtotaal:</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Bezorgkosten:</span>
                <span>{order.delivery_cost === 0 ? 'Gratis' : formatPrice(order.delivery_cost)}</span>
              </div>
              <div className="flex justify-between py-2 border-t font-bold text-lg">
                <span>TOTAAL:</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="mb-6">
          <p>
            <strong>Betaalmethode:</strong> {getPaymentMethodLabel(order.payment_method)}
          </p>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="border-t pt-4">
            <h2 className="font-bold mb-2">Opmerkingen</h2>
            <p className="p-3 bg-gray-100 rounded">{order.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t text-center text-sm text-gray-500">
          <p>Afgedrukt op {format(new Date(), 'PPP HH:mm', { locale: nl })}</p>
        </div>
      </div>
    );
  }
);

OrderPrintView.displayName = 'OrderPrintView';
