import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreatePaymentRequest {
  orderId: string;
  returnUrl: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const paynlApiToken = Deno.env.get('PAYNL_API_TOKEN');
    const paynlServiceId = Deno.env.get('PAYNL_SERVICE_ID');

    if (!paynlApiToken || !paynlServiceId) {
      console.error('Pay.nl credentials not configured');
      return new Response(
        JSON.stringify({ error: 'Payment service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const body: CreatePaymentRequest = await req.json();
    const { orderId, returnUrl } = body;

    if (!orderId || !returnUrl) {
      return new Response(
        JSON.stringify({ error: 'Order ID and return URL are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderError);
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if order is already paid
    if (order.payment_status === 'paid') {
      return new Response(
        JSON.stringify({ error: 'Order is already paid' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if payment method is iDEAL
    if (order.payment_method !== 'ideal') {
      return new Response(
        JSON.stringify({ error: 'Order does not require online payment' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare webhook URL
    const webhookUrl = `${supabaseUrl}/functions/v1/paynl-webhook`;

    // Convert amount to cents (Pay.nl expects amounts in cents)
    const amountInCents = Math.round(order.total * 100);

    // Create Pay.nl order using their Pioneer API
    // API docs: https://developer.pay.nl/docs/initiate-a-transaction-1
    const authString = btoa(`${paynlApiToken}:`);
    
    const paynlPayload = {
      serviceId: paynlServiceId,
      amount: {
        value: amountInCents,
        currency: 'EUR',
      },
      paymentMethod: {
        id: 10, // iDEAL payment method ID
      },
      description: `Bestelling ${order.order_number}`,
      reference: order.order_number,
      returnUrl: returnUrl,
      exchangeUrl: webhookUrl,
      customer: {
        email: order.email,
        phone: order.phone,
        firstName: order.contact_person.split(' ')[0] || order.contact_person,
        lastName: order.contact_person.split(' ').slice(1).join(' ') || '',
        company: order.company_name || undefined,
      },
    };

    console.log('Creating Pay.nl order for:', order.order_number);

    const paynlResponse = await fetch('https://connect.pay.nl/v1/orders', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paynlPayload),
    });

    const paynlData = await paynlResponse.json();

    if (!paynlResponse.ok) {
      console.error('Pay.nl API error:', paynlData);
      return new Response(
        JSON.stringify({ error: 'Failed to create payment', details: paynlData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Store Pay.nl transaction ID in the order
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        payment_id: paynlData.id,
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Failed to update order with payment ID:', updateError);
    }

    console.log('Pay.nl order created:', paynlData.id);

    // Return the payment URL for redirect
    return new Response(
      JSON.stringify({
        success: true,
        paymentId: paynlData.id,
        redirectUrl: paynlData.links?.redirect || paynlData.checkoutUrl,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in create-payment:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
