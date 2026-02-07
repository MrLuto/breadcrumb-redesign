import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type PaymentStatus = 'checking' | 'paid' | 'pending' | 'failed';

const PaymentReturn = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const confirmationToken = searchParams.get('token');
  
  const [status, setStatus] = useState<PaymentStatus>('checking');
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (!orderId || !confirmationToken) {
        setStatus('failed');
        return;
      }

      try {
        // Fetch order to check payment status
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&select=order_number,payment_status,confirmation_token`,
          {
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch order');
        }

        const orders = await response.json();
        
        if (orders.length === 0 || orders[0].confirmation_token !== confirmationToken) {
          setStatus('failed');
          return;
        }

        const order = orders[0];
        setOrderNumber(order.order_number);

        if (order.payment_status === 'paid') {
          setStatus('paid');
        } else if (order.payment_status === 'pending') {
          // Payment might still be processing, wait a bit and check again
          if (retryCount < 5) {
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
            }, 2000);
          } else {
            setStatus('pending');
          }
        } else {
          setStatus('pending');
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
        setStatus('failed');
      }
    };

    checkPaymentStatus();
  }, [orderId, confirmationToken, retryCount]);

  // Redirect to confirmation page when paid
  useEffect(() => {
    if (status === 'paid' && orderId && confirmationToken) {
      navigate(`/bestelling-bevestigd/${orderId}?token=${confirmationToken}`, { replace: true });
    }
  }, [status, orderId, confirmationToken, navigate]);

  if (status === 'checking') {
    return (
      <Layout>
        <div className="container py-16">
          <div className="max-w-md mx-auto text-center space-y-6">
            <Skeleton className="h-16 w-16 rounded-full mx-auto" />
            <Skeleton className="h-8 w-64 mx-auto" />
            <Skeleton className="h-4 w-48 mx-auto" />
            <p className="text-muted-foreground">Betaling wordt gecontroleerd...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (status === 'paid') {
    return (
      <Layout>
        <div className="container py-16">
          <div className="max-w-md mx-auto text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.6 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-green-100 text-green-600 rounded-full mb-6"
            >
              <CheckCircle className="h-10 w-10" />
            </motion.div>
            <h1 className="text-2xl font-bold mb-4">Betaling geslaagd!</h1>
            <p className="text-muted-foreground mb-6">
              Je wordt doorgestuurd naar je bevestiging...
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (status === 'pending') {
    return (
      <Layout>
        <div className="container py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto text-center"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 text-amber-600 rounded-full mb-6">
              <Clock className="h-10 w-10" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Betaling in behandeling</h1>
            <p className="text-muted-foreground mb-6">
              {orderNumber && (
                <span className="block font-medium text-foreground mb-2">
                  Bestelnummer: {orderNumber}
                </span>
              )}
              Je betaling wordt nog verwerkt. Dit kan enkele minuten duren. 
              Je ontvangt een bevestigingsmail zodra de betaling is afgerond.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/">
                <Button variant="outline">Terug naar home</Button>
              </Link>
              <Button onClick={() => setRetryCount(0)}>
                Status opnieuw controleren
              </Button>
            </div>
          </motion.div>
        </div>
      </Layout>
    );
  }

  // Failed status
  return (
    <Layout>
      <div className="container py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto text-center"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 text-red-600 rounded-full mb-6">
            <XCircle className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Betaling mislukt</h1>
          <p className="text-muted-foreground mb-6">
            De betaling is geannuleerd of mislukt. Je bestelling is niet verwerkt.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/">
              <Button variant="outline">Terug naar home</Button>
            </Link>
            <Link to="/afrekenen">
              <Button>Opnieuw proberen</Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default PaymentReturn;
