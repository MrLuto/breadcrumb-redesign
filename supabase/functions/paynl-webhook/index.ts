import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting config
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 100; // Allow 100 webhook calls per hour per IP

// Pay.nl status codes
// https://developer.pay.nl/docs/order-statuses
const PAYNL_STATUS = {
  PENDING: -90, // Pending (not yet started)
  CANCEL: -63, // Cancelled
  DENIED: -64, // Denied (bank refused)
  EXPIRED: -80, // Expired
  VERIFY: 85, // Verification needed
  AUTHORIZE: 95, // Authorized (not yet captured)
  PAID: 100, // Paid
  PARTIAL_REFUND: -71, // Partially refunded
  REFUND: -81, // Fully refunded
  CHARGEBACK: -82, // Chargeback
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const checkRateLimit = async (supabase: any, ip: string, functionName: string): Promise<{ allowed: boolean }> => {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  
  const { data: existing } = await supabase
    .from('rate_limits')
    .select('*')
    .eq('ip_address', ip)
    .eq('function_name', functionName)
    .gte('window_start', windowStart)
    .single();
  
  if (existing) {
    if (existing.request_count >= MAX_REQUESTS_PER_WINDOW) {
      return { allowed: false };
    }
    
    await supabase
      .from('rate_limits')
      .update({ request_count: existing.request_count + 1 })
      .eq('id', existing.id);
    
    return { allowed: true };
  }
  
  await supabase
    .from('rate_limits')
    .upsert({
      ip_address: ip,
      function_name: functionName,
      request_count: 1,
      window_start: new Date().toISOString(),
    }, { onConflict: 'ip_address,function_name' });
  
  return { allowed: true };
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Get client IP and check rate limit
  const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
    || req.headers.get('cf-connecting-ip') 
    || req.headers.get('x-real-ip')
    || 'unknown';

  const { allowed } = await checkRateLimit(supabase, clientIP, 'paynl-webhook');
  
  if (!allowed) {
    console.log('Rate limit exceeded for IP:', clientIP);
    return new Response('Too many requests', { 
      status: 429,
      headers: { 'Retry-After': '3600' }
    });
  }

  try {
    const paynlApiToken = Deno.env.get('PAYNL_API_TOKEN');

    if (!paynlApiToken) {
      console.error('Pay.nl API token not configured');
      return new Response('Configuration error', { status: 500 });
    }

    // Pay.nl sends webhook as form-urlencoded or query params
    let paymentId: string | null = null;
    let action: string | null = null;

    // Try to get from query params first (GET request)
    const url = new URL(req.url);
    paymentId = url.searchParams.get('order_id') || url.searchParams.get('orderId');
    action = url.searchParams.get('action');

    // If not in query, try body for POST
    if (!paymentId && req.method === 'POST') {
      const contentType = req.headers.get('content-type') || '';
      
      if (contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await req.formData();
        paymentId = formData.get('order_id')?.toString() || formData.get('orderId')?.toString() || null;
        action = formData.get('action')?.toString() || null;
      } else if (contentType.includes('application/json')) {
        const body = await req.json();
        paymentId = body.order_id || body.orderId;
        action = body.action;
      }
    }

    if (!paymentId) {
      console.error('No payment ID received in webhook');
      return new Response('Missing payment ID', { status: 400 });
    }

    console.log(`Webhook received for payment: ${paymentId}, action: ${action}`);

    // Fetch payment status from Pay.nl API to verify
    const authString = btoa(`${paynlApiToken}:`);
    
    const statusResponse = await fetch(`https://connect.pay.nl/v1/orders/${paymentId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Basic ${authString}`,
      },
    });

    if (!statusResponse.ok) {
      console.error('Failed to fetch payment status from Pay.nl');
      return new Response('Failed to verify payment', { status: 500 });
    }

    const paymentData = await statusResponse.json();
    const statusCode = paymentData.status?.code;
    const reference = paymentData.reference; // This is our order_number

    console.log(`Payment ${paymentId} status: ${statusCode}, reference: ${reference}`);

    // Find order by payment_id or order_number
    let order;
    
    // Try by payment_id first
    const { data: orderByPaymentId } = await supabase
      .from('orders')
      .select('id, order_number, payment_status, order_status')
      .eq('payment_id', paymentId)
      .maybeSingle();

    if (orderByPaymentId) {
      order = orderByPaymentId;
    } else if (reference) {
      // Try by order_number (reference)
      const { data: orderByRef } = await supabase
        .from('orders')
        .select('id, order_number, payment_status, order_status')
        .eq('order_number', reference)
        .maybeSingle();
      order = orderByRef;
    }

    if (!order) {
      console.error(`Order not found for payment ${paymentId}`);
      return new Response('Order not found', { status: 404 });
    }

    // Determine new status based on Pay.nl status code
    let newPaymentStatus = order.payment_status;
    let newOrderStatus = order.order_status;

    if (statusCode === PAYNL_STATUS.PAID) {
      newPaymentStatus = 'paid';
      // Only update order status if it's still 'new'
      if (order.order_status === 'new') {
        newOrderStatus = 'confirmed';
      }
    } else if (statusCode === PAYNL_STATUS.CANCEL || statusCode === PAYNL_STATUS.DENIED || statusCode === PAYNL_STATUS.EXPIRED) {
      // Payment failed/cancelled - keep as pending so customer can retry
      newPaymentStatus = 'pending';
    } else if (statusCode === PAYNL_STATUS.REFUND || statusCode === PAYNL_STATUS.PARTIAL_REFUND) {
      newPaymentStatus = 'refunded';
    }

    // Update order if status changed
    if (newPaymentStatus !== order.payment_status || newOrderStatus !== order.order_status) {
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: newPaymentStatus,
          order_status: newOrderStatus,
          payment_id: paymentId, // Ensure payment_id is stored
        })
        .eq('id', order.id);

      if (updateError) {
        console.error('Failed to update order:', updateError);
        return new Response('Database error', { status: 500 });
      }

      console.log(`Order ${order.order_number} updated: payment_status=${newPaymentStatus}, order_status=${newOrderStatus}`);
    }

    // Pay.nl expects a "TRUE" response to acknowledge the webhook
    return new Response('TRUE', { 
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });

  } catch (error) {
    console.error('Unexpected error in paynl-webhook:', error);
    return new Response('Server error', { status: 500 });
  }
});
