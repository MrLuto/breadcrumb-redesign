import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, Package, Calendar, MapPin, Phone, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderItem = Database['public']['Tables']['order_items']['Row'];

type OrderWithItems = Order & {
  order_items: OrderItem[];
};

const OrderConfirmation = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;

      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', orderId)
        .single();

      if (error) {
        console.error('Error fetching order:', error);
      } else {
        setOrder(data as OrderWithItems);
      }
      setIsLoading(false);
    };

    fetchOrder();
  }, [orderId]);

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

  if (!order) {
    return (
      <Layout>
        <div className="container py-16">
          <div className="max-w-md mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Bestelling niet gevonden</h1>
            <p className="text-muted-foreground mb-6">
              We konden deze bestelling niet vinden.
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
                <div className="space-y-2">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.quantity}x {item.product_name}
                      </span>
                      <span className="font-medium">{formatPrice(item.total_price)}</span>
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
