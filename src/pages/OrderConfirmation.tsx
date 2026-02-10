import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, Package, Calendar, MapPin, Phone, Mail, ShieldAlert } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderItem = Database['public']['Tables']['order_items']['Row'];
type OrderItemOption = Database['public']['Tables']['order_item_options']['Row'];

type OrderItemWithOptions = OrderItem & {
  order_item_options: OrderItemOption[];
};

type OrderWithItems = Order & {
  order_items: OrderItemWithOptions[];
};

const OrderConfirmation = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const confirmationToken = searchParams.get('token');
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;

      // Require confirmation token for security
      if (!confirmationToken) {
        setAccessDenied(true);
        setIsLoading(false);
        return;
      }

      try {
        // Use fetch with custom headers to pass the confirmation token for RLS verification
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&select=*,order_items(*,order_item_options(*))`,
          {
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              'Content-Type': 'application/json',
              'x-confirmation-token': confirmationToken,
            },
          }
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch order');
        }
        
        const orders = await response.json();
        
        if (orders.length === 0) {
          setAccessDenied(true);
        } else {
          setOrder(orders[0] as OrderWithItems);
        }
      } catch (error) {
        console.error('Error fetching order:', error);
        setAccessDenied(true);
      }
      
      setIsLoading(false);
    };

    fetchOrder();
  }, [orderId, confirmationToken]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-16">
          <div className="max-w-2xl mx-auto space-y-8">
            <Skeleton className="h-16 w-16 rounded-full mx-auto" />
            <Skeleton className="h-8 w-64 mx-auto" />
            <Skeleton className="h-4 w-48 mx-auto" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </Layout>
    );
  }

  if (accessDenied || !order) {
    return (
      <Layout>
        <div className="container py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 text-amber-600 rounded-full mb-6">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold mb-4">
              {accessDenied ? 'Toegang geweigerd' : 'Bestelling niet gevonden'}
            </h1>
            <p className="text-muted-foreground mb-6">
              {accessDenied 
                ? 'Deze bestellingslink is ongeldig of verlopen. Gebruik de link uit je bevestigingsmail.'
                : 'We konden deze bestelling niet vinden.'
              }
            </p>
            <Link to="/assortiment">
              <Button>Terug naar assortiment</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-12 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          {/* Success Header */}
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.6 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-green-100 text-green-600 rounded-full mb-6"
            >
              <CheckCircle className="h-10 w-10" />
            </motion.div>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-3">
              Bedankt voor je bestelling!
            </h1>
            <p className="text-muted-foreground text-lg">
              Je bestelling is succesvol ontvangen en wordt verwerkt.
            </p>
          </div>

          {/* Order Details Card */}
          <div className="bg-card rounded-xl shadow-card overflow-hidden">
            {/* Order Number Header */}
            <div className="bg-primary/10 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Bestelnummer</p>
                  <p className="text-xl font-bold text-primary">{order.order_number}</p>
                </div>
                <Package className="h-8 w-8 text-primary" />
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Delivery Info */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Bezorgdatum</p>
                    <p className="font-medium">
                      {format(new Date(order.delivery_date), 'EEEE d MMMM yyyy', { locale: nl })}
                    </p>
                    {order.delivery_time && (
                      <p className="text-sm text-muted-foreground">{order.delivery_time}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Bezorgadres</p>
                    <p className="font-medium">{order.delivery_address}</p>
                    <p className="text-sm">{order.postcode} {order.city}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Contact Info */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">E-mail</p>
                    <p className="font-medium">{order.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Telefoon</p>
                    <p className="font-medium">{order.phone}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-3">Bestelde producten</h3>
                <div className="space-y-3">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <div>
                        <span>{item.quantity}x {item.product_name}</span>
                        {item.order_item_options && item.order_item_options.length > 0 && (
                          <div className="text-xs text-muted-foreground ml-4 mt-0.5">
                            ↳ {item.order_item_options.map(opt => 
                              opt.price_adjustment > 0 
                                ? `${opt.option_name} (+${formatPrice(opt.price_adjustment)})` 
                                : opt.option_name
                            ).join(', ')}
                          </div>
                        )}
                        {item.notes && (
                          <div className="text-xs text-muted-foreground ml-4 mt-0.5 italic">
                            Opmerking: {item.notes}
                          </div>
                        )}
                      </div>
                      <span className="font-medium whitespace-nowrap ml-4">{formatPrice(item.total_price)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotaal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Bezorgkosten</span>
                  <span>{formatPrice(order.delivery_cost)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg pt-2">
                  <span>Totaal</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="mt-8 text-center space-y-4">
            <p className="text-muted-foreground">
              Je ontvangt een bevestiging per e-mail op {order.email}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/">
                <Button variant="outline">Terug naar home</Button>
              </Link>
              <Link to="/assortiment">
                <Button>Nog een bestelling plaatsen</Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default OrderConfirmation;
