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
  customer_type: 'private' | 'business';
  order_type: 'delivery' | 'pickup';
  company_name?: string;
  kvk_number?: string;
  department?: string;
  contact_person: string;
  email: string;
  phone: string;
  delivery_address?: string;
  postcode?: string;
  city?: string;
  billing_address?: string;
  billing_postcode?: string;
  billing_city?: string;
  delivery_date: string;
  delivery_asap: boolean;
  delivery_time?: string;
  payment_method: 'ideal' | 'pin' | 'invoice' | 'monthly_invoice' | 'cash';
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

  const { data: existing } = await supabase
    .from('rate_limits')
    .select('id, request_count, window_start')
    .eq('ip_address', ipAddress)
    .eq('function_name', functionName)
    .gte('window_start', windowStart)
    .maybeSingle();

  if (existing) {
    if (existing.request_count >= maxRequests) {
      return false;
    }
    await supabase
      .from('rate_limits')
      .update({ request_count: existing.request_count + 1 })
      .eq('id', existing.id);
  } else {
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

// Get shop settings
async function getShopSettings(supabase: any) {
  const { data } = await supabase
    .from('shop_settings')
    .select('key, value')
    .in('key', ['delivery_cost', 'free_delivery_threshold', 'min_preparation_time_minutes']);

  const settings = {
    delivery_cost: 4,
    free_delivery_threshold: 40,
    min_preparation_time_minutes: 60,
  };

  data?.forEach((row: any) => {
    try {
      // Parse JSON if it's a string, otherwise use the value directly
      let value = row.value;
      if (typeof value === 'string') {
        try {
          value = JSON.parse(value);
        } catch {
          // If JSON parsing fails, use the string value as-is
        }
      }
      
      switch (row.key) {
        case 'delivery_cost':
          settings.delivery_cost = parseFloat(value) || 4;
          break;
        case 'free_delivery_threshold':
          settings.free_delivery_threshold = parseFloat(value) || 40;
          break;
        case 'min_preparation_time_minutes':
          settings.min_preparation_time_minutes = parseInt(value) || 60;
          break;
      }
    } catch (e) {
      console.warn(`Failed to parse setting ${row.key}:`, e);
    }
  });

  return settings;
}

// Check if date is closed - supports all recurrence types (none, weekly, monthly, yearly)
async function isDateClosed(supabase: any, dateString: string): Promise<{ isClosed: boolean; reason?: string }> {
  const date = new Date(dateString);
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const dayOfMonth = date.getDate(); // 1-31
  const month = date.getMonth() + 1; // 1-12

  const { data: closedDays } = await supabase
    .from('closed_days')
    .select('*')
    .eq('is_active', true);

  if (!closedDays) return { isClosed: false };

  for (const closedDay of closedDays) {
    const recurrenceType = closedDay.recurrence_type || 'none';
    
    // Check one-time closure (specific date)
    if (recurrenceType === 'none' && closedDay.date === dateString) {
      return { isClosed: true, reason: closedDay.reason };
    }

    // Check weekly recurring (e.g., every Sunday)
    if (recurrenceType === 'weekly' && closedDay.day_of_week === dayOfWeek) {
      return { isClosed: true, reason: closedDay.reason };
    }

    // Check monthly recurring (e.g., every 1st of the month)
    if (recurrenceType === 'monthly' && closedDay.day_of_month === dayOfMonth) {
      return { isClosed: true, reason: closedDay.reason };
    }

    // Check yearly recurring (e.g., every December 25th)
    if (recurrenceType === 'yearly' && 
        closedDay.day_of_month === dayOfMonth && 
        closedDay.month === month) {
      return { isClosed: true, reason: closedDay.reason };
    }
  }

  return { isClosed: false };
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
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Rate limiting
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || req.headers.get('cf-connecting-ip') 
      || 'unknown';

    const withinLimit = await checkRateLimit(supabase, clientIP);
    if (!withinLimit) {
      return new Response(
        JSON.stringify({ error: 'Too many orders. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request
    const body: CreateOrderRequest = await req.json();
    const { items, formData } = body;

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Cart is empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate form data
    if (!formData || 
        !formData.contact_person || 
        !formData.email || 
        !formData.phone ||
        !formData.delivery_date) {
      return new Response(
        JSON.stringify({ error: 'Missing required order information' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate minimum delivery date (must be tomorrow or later)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deliveryDateCheck = new Date(formData.delivery_date);
    deliveryDateCheck.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (deliveryDateCheck < tomorrow) {
      return new Response(
        JSON.stringify({ error: 'Bezorgdatum moet minimaal morgen zijn' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate customer type
    if (!['private', 'business'].includes(formData.customer_type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid customer type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate business has company name
    if (formData.customer_type === 'business' && !formData.company_name?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Company name is required for business orders' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate order type
    if (!['delivery', 'pickup'].includes(formData.order_type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid order type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate delivery address for delivery orders
    if (formData.order_type === 'delivery') {
      if (!formData.delivery_address || !formData.postcode || !formData.city) {
        return new Response(
          JSON.stringify({ error: 'Delivery address is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate postcode format
      const postcodeRegex = /^\d{4}\s?[A-Za-z]{2}$/;
      if (!postcodeRegex.test(formData.postcode)) {
        return new Response(
          JSON.stringify({ error: 'Invalid postcode' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate payment method
    const validPaymentMethods = ['ideal', 'pin', 'invoice', 'monthly_invoice', 'cash'];
    if (!validPaymentMethods.includes(formData.payment_method)) {
      return new Response(
        JSON.stringify({ error: 'Invalid payment method' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if date is closed
    const closedCheck = await isDateClosed(supabase, formData.delivery_date);
    if (closedCheck.isClosed) {
      return new Response(
        JSON.stringify({ error: `Gesloten op deze dag: ${closedCheck.reason || 'Kies een andere datum'}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get shop settings
    const shopSettings = await getShopSettings(supabase);

    // Get opening hours for the delivery date
    const deliveryDate = new Date(formData.delivery_date);
    const dayOfWeek = deliveryDate.getDay();
    
    const { data: openingHoursData } = await supabase
      .from('opening_hours')
      .select('*')
      .eq('day_of_week', dayOfWeek)
      .single();

    // Validate delivery time is within opening hours
    if (!formData.delivery_asap && formData.delivery_time && openingHoursData) {
      if (openingHoursData.is_closed) {
        return new Response(
          JSON.stringify({ error: 'Wij zijn gesloten op deze dag' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const [hours, minutes] = formData.delivery_time.split(':').map(Number);
      const timeInMinutes = hours * 60 + minutes;

      const [openH, openM] = openingHoursData.open_time.split(':').map(Number);
      const openInMinutes = openH * 60 + openM;

      const [closeH, closeM] = openingHoursData.close_time.split(':').map(Number);
      const closeInMinutes = closeH * 60 + closeM;

      if (timeInMinutes < openInMinutes || timeInMinutes > closeInMinutes) {
        const openTime = openingHoursData.open_time.slice(0, 5);
        const closeTime = openingHoursData.close_time.slice(0, 5);
        return new Response(
          JSON.stringify({ 
            error: `Bezorgtijd moet tussen ${openTime} en ${closeTime} zijn` 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Validate delivery time for same-day orders
    if (!formData.delivery_asap && formData.delivery_time) {
      const now = new Date();
      const isToday = deliveryDate.toDateString() === now.toDateString();

      if (isToday) {
        const [hours, minutes] = formData.delivery_time.split(':').map(Number);
        const selectedTime = new Date(deliveryDate);
        selectedTime.setHours(hours, minutes, 0, 0);
        
        const minTime = new Date(now.getTime() + shopSettings.min_preparation_time_minutes * 60 * 1000);
        
        if (selectedTime < minTime) {
          return new Response(
            JSON.stringify({ error: `Tijd moet minimaal ${shopSettings.min_preparation_time_minutes} minuten in de toekomst zijn` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Fetch products
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

    // Validate products
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

    // Calculate subtotal
    let subtotal = 0;
    for (const item of items) {
      const product = productMap.get(item.product_id)!;
      subtotal += product.price * item.quantity;
    }

    // Calculate delivery cost
    let deliveryCost = 0;
    let deliveryZone = null;

    if (formData.order_type === 'delivery') {
      const normalizedPostcode = formData.postcode!.toUpperCase().replace(/\s/g, '');
      const postcodePrefix = normalizedPostcode.slice(0, 4);

      // Check if delivery is available for this postcode and get zone details
      const { data: zone } = await supabase
        .from('delivery_zones')
        .select('postcode_prefix, is_active, delivery_cost, min_order_amount')
        .eq('postcode_prefix', postcodePrefix)
        .eq('is_active', true)
        .maybeSingle();

      if (!zone) {
        return new Response(
          JSON.stringify({ error: 'Bezorgen niet mogelijk op deze postcode' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check minimum order amount for this zone
      if (zone.min_order_amount && subtotal < zone.min_order_amount) {
        return new Response(
          JSON.stringify({ 
            error: `Minimaal bestelbedrag voor deze postcode is €${zone.min_order_amount.toFixed(2)}. Uw bestelling: €${subtotal.toFixed(2)}` 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      deliveryZone = postcodePrefix;
      
      // Apply delivery cost (free if above threshold)
      if (subtotal >= shopSettings.free_delivery_threshold) {
        deliveryCost = 0;
      } else {
        deliveryCost = zone.delivery_cost || shopSettings.delivery_cost;
      }
    }

    const total = subtotal + deliveryCost;

    // For pickup orders, use pickup address from settings
    let deliveryAddress = formData.delivery_address?.trim() || null;
    let postcodeValue = formData.postcode?.toUpperCase().replace(/\s/g, '') || null;
    let cityValue = formData.city?.trim() || null;

    if (formData.order_type === 'pickup') {
      // Get pickup address from shop settings
      const { data: pickupSetting } = await supabase
        .from('shop_settings')
        .select('value')
        .eq('key', 'pickup_address')
        .single();
      
      deliveryAddress = pickupSetting?.value ? String(pickupSetting.value) : 'Afhalen bij winkel';
      postcodeValue = postcodeValue || '0000AA'; // Placeholder for pickup
      cityValue = cityValue || 'Gouda';
    }

    // Create order with unique temp order number
    const tempOrderNumber = `TEMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: tempOrderNumber,
        customer_type: formData.customer_type,
        order_type: formData.order_type,
        company_name: formData.company_name?.trim() || (formData.customer_type === 'private' ? formData.contact_person.trim() : 'Particulier'),
        kvk_number: formData.kvk_number?.trim() || null,
        department: formData.department?.trim() || null,
        contact_person: formData.contact_person.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        delivery_address: deliveryAddress,
        postcode: postcodeValue,
        city: cityValue,
        billing_address: formData.billing_address?.trim() || null,
        billing_postcode: formData.billing_postcode?.toUpperCase().replace(/\s/g, '') || null,
        billing_city: formData.billing_city?.trim() || null,
        delivery_date: formData.delivery_date,
        delivery_asap: formData.delivery_asap,
        delivery_time: formData.delivery_time || null,
        delivery_zone: deliveryZone,
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

    // Create order items
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
      await supabase.from('orders').delete().eq('id', order.id);
      return new Response(
        JSON.stringify({ error: 'Failed to create order items' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Order created successfully: ${order.order_number}`);

    // Send confirmation email (fire and forget - don't block order creation)
    const siteUrl = Deno.env.get('SITE_URL') || 'https://frisversbroodjes.nl';
    
    try {
      const emailPayload = {
        orderId: order.id,
        orderNumber: order.order_number,
        confirmationToken: order.confirmation_token,
        customerEmail: formData.email.trim().toLowerCase(),
        customerName: formData.contact_person.trim(),
        companyName: formData.company_name?.trim() || undefined,
        orderType: formData.order_type,
        deliveryAddress: deliveryAddress || '',
        postcode: postcodeValue || '',
        city: cityValue || '',
        deliveryDate: formData.delivery_date,
        deliveryTime: formData.delivery_time || undefined,
        deliveryAsap: formData.delivery_asap,
        items: orderItems.map(item => ({
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          notes: item.notes || undefined,
        })),
        subtotal,
        deliveryCost,
        total,
        notes: formData.notes?.trim() || undefined,
        paymentMethod: formData.payment_method,
        siteUrl,
      };

      // Call the email function via internal Supabase function invoke
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      
      fetch(`${supabaseUrl}/functions/v1/send-order-confirmation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify(emailPayload),
      }).then(res => {
        if (res.ok) {
          console.log('Order confirmation email queued successfully');
        } else {
          console.error('Failed to send confirmation email:', res.status);
        }
      }).catch(err => {
        console.error('Error sending confirmation email:', err);
      });
    } catch (emailError) {
      // Log but don't fail the order if email fails
      console.error('Error preparing confirmation email:', emailError);
    }

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
