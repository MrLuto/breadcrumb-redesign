import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderItem {
  product_id: string;
  quantity: number;
  notes?: string;
}

interface OrderFormData {
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  delivery_address: string;
  postcode: string;
  city: string;
  delivery_date: string;
  delivery_time?: string;
  payment_method: 'direct' | 'invoice' | 'monthly_invoice';
  notes?: string;
}

interface CreateOrderRequest {
  items: OrderItem[];
  formData: OrderFormData;
}

// Rate limiting helper
async function checkRateLimit(supabase: any, ipAddress: string): Promise<boolean> {
  const functionName = 'create-order';
  const windowMinutes = 60;
  const maxRequests = 10;

  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

  // Get existing rate limit record
  const { data: existing } = await supabase
    .from('rate_limits')
    .select('id, request_count, window_start')
    .eq('ip_address', ipAddress)
    .eq('function_name', functionName)
    .gte('window_start', windowStart)
    .maybeSingle();

  if (existing) {
    if (existing.request_count >= maxRequests) {
      return false; // Rate limited
    }
    // Increment counter
    await supabase
      .from('rate_limits')
      .update({ request_count: existing.request_count + 1 })
      .eq('id', existing.id);
  } else {
    // Create new rate limit record
    await supabase
      .from('rate_limits')
      .insert({
        ip_address: ipAddress,
        function_name: functionName,
        request_count: 1,
        window_start: new Date().toISOString(),
      });
  }

  return true;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
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

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || req.headers.get('cf-connecting-ip') 
      || 'unknown';

    // Check rate limit
    const withinLimit = await checkRateLimit(supabase, clientIP);
    if (!withinLimit) {
      return new Response(
        JSON.stringify({ error: 'Too many orders. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: CreateOrderRequest = await req.json();
    const { items, formData } = body;

    // Validate items array
    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Cart is empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate form data
    if (!formData || 
        !formData.company_name || 
        !formData.contact_person || 
        !formData.email || 
        !formData.phone ||
        !formData.delivery_address ||
        !formData.postcode ||
        !formData.city ||
        !formData.delivery_date) {
      return new Response(
        JSON.stringify({ error: 'Missing required order information' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate postcode format (Dutch)
    const postcodeRegex = /^\d{4}\s?[A-Za-z]{2}$/;
    if (!postcodeRegex.test(formData.postcode)) {
      return new Response(
        JSON.stringify({ error: 'Invalid postcode' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate payment method
    const validPaymentMethods = ['direct', 'invoice', 'monthly_invoice'];
    if (!validPaymentMethods.includes(formData.payment_method)) {
      return new Response(
        JSON.stringify({ error: 'Invalid payment method' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch products from database to validate prices
    const productIds = items.map(item => item.product_id);
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, price, is_available')
      .in('id', productIds);

    if (productsError || !products) {
      console.error('Error fetching products:', productsError);
      return new Response(
        JSON.stringify({ error: 'Failed to validate products' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate all products exist and are available
    const productMap = new Map(products.map(p => [p.id, p]));
    
    for (const item of items) {
      const product = productMap.get(item.product_id);
      if (!product) {
        return new Response(
          JSON.stringify({ error: `Product not found: ${item.product_id}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (!product.is_available) {
        return new Response(
          JSON.stringify({ error: `Product unavailable: ${product.name}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (!item.quantity || item.quantity < 1 || item.quantity > 1000) {
        return new Response(
          JSON.stringify({ error: `Invalid quantity for product: ${product.name}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Calculate subtotal from database prices (not client prices!)
    let subtotal = 0;
    for (const item of items) {
      const product = productMap.get(item.product_id)!;
      subtotal += product.price * item.quantity;
    }

    // Normalize postcode
    const normalizedPostcode = formData.postcode.toUpperCase().replace(/\s/g, '');
    const postcodePrefix = normalizedPostcode.slice(0, 4);

    // Fetch delivery zone to validate delivery cost
    const { data: deliveryZone } = await supabase
      .from('delivery_zones')
      .select('delivery_cost, min_order_amount, is_active')
      .eq('postcode_prefix', postcodePrefix)
      .eq('is_active', true)
      .maybeSingle();

    // Check if delivery is available
    if (!deliveryZone) {
      return new Response(
        JSON.stringify({ error: 'Delivery not available to this postcode' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check minimum order amount
    if (deliveryZone.min_order_amount && subtotal < deliveryZone.min_order_amount) {
      return new Response(
        JSON.stringify({ 
          error: `Minimum order amount is €${deliveryZone.min_order_amount.toFixed(2)}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const deliveryCost = deliveryZone.delivery_cost;
    const total = subtotal + deliveryCost;

    // Create the order with server-calculated prices
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: 'TEMP', // Will be replaced by database trigger
        company_name: formData.company_name.trim(),
        contact_person: formData.contact_person.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        delivery_address: formData.delivery_address.trim(),
        postcode: normalizedPostcode,
        city: formData.city.trim(),
        delivery_date: formData.delivery_date,
        delivery_time: formData.delivery_time || null,
        delivery_zone: postcodePrefix,
        payment_method: formData.payment_method,
        notes: formData.notes?.trim() || null,
        subtotal,
        delivery_cost: deliveryCost,
        total,
        order_status: 'new',
        payment_status: 'pending',
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return new Response(
        JSON.stringify({ error: 'Failed to create order' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create order items with database prices
    const orderItems = items.map(item => {
      const product = productMap.get(item.product_id)!;
      return {
        order_id: order.id,
        product_id: item.product_id,
        product_name: product.name,
        quantity: item.quantity,
        unit_price: product.price,
        total_price: product.price * item.quantity,
        notes: item.notes?.trim() || null,
      };
    });

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      // Cleanup: delete the order
      await supabase.from('orders').delete().eq('id', order.id);
      return new Response(
        JSON.stringify({ error: 'Failed to create order items' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Order created successfully: ${order.order_number}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        orderId: order.id,
        orderNumber: order.order_number,
        confirmationToken: order.confirmation_token,
        total
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in create-order:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
