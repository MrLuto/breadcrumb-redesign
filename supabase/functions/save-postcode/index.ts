import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting config
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 10;

// Input validation
const POSTCODE_REGEX = /^\d{4}[A-Z]{2}$/;
const MAX_CITY_LENGTH = 100;

interface DeliveryZone {
  postcode_prefix: string;
  delivery_cost: number;
  min_order_amount: number | null;
  is_active: boolean;
}

const validatePostcode = (postcode: unknown): { valid: boolean; cleaned?: string; error?: string } => {
  if (typeof postcode !== 'string') {
    return { valid: false, error: 'Postcode must be a string' };
  }
  
  const cleaned = postcode.replace(/\s/g, '').toUpperCase();
  
  if (cleaned.length > 10) {
    return { valid: false, error: 'Postcode too long' };
  }
  
  if (!POSTCODE_REGEX.test(cleaned)) {
    return { valid: false, error: 'Invalid postcode format' };
  }
  
  return { valid: true, cleaned };
};

const validateCity = (city: unknown): { valid: boolean; cleaned?: string | null; error?: string } => {
  if (city === null || city === undefined) {
    return { valid: true, cleaned: null };
  }
  
  if (typeof city !== 'string') {
    return { valid: false, error: 'City must be a string' };
  }
  
  const cleaned = city.trim();
  
  if (cleaned.length > MAX_CITY_LENGTH) {
    return { valid: false, error: 'City name too long' };
  }
  
  return { valid: true, cleaned: cleaned || null };
};

// Check postcode against DB zones
const checkPostcode = (postcode: string, zones: DeliveryZone[]) => {
  const match = postcode.match(/^(\d{4})([A-Z]{2})$/);
  
  if (!match) {
    return { inArea: false };
  }
  
  const prefix = match[1];
  
  for (const zone of zones) {
    if (zone.postcode_prefix === prefix && zone.is_active) {
      return {
        inArea: true,
        minutes: 90,
        cost: zone.delivery_cost,
        minimum: zone.min_order_amount || 0,
      };
    }
  }
  
  return { inArea: false };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const checkRateLimit = async (supabase: any, ip: string, functionName: string): Promise<{ allowed: boolean; remaining: number }> => {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  
  // Try to get existing rate limit record
  const { data: existing } = await supabase
    .from('rate_limits')
    .select('*')
    .eq('ip_address', ip)
    .eq('function_name', functionName)
    .gte('window_start', windowStart)
    .single();
  
  if (existing) {
    if (existing.request_count >= MAX_REQUESTS_PER_WINDOW) {
      return { allowed: false, remaining: 0 };
    }
    
    // Increment counter
    await supabase
      .from('rate_limits')
      .update({ request_count: existing.request_count + 1 })
      .eq('id', existing.id);
    
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - existing.request_count - 1 };
  }
  
  // Create new rate limit record
  await supabase
    .from('rate_limits')
    .upsert({
      ip_address: ip,
      function_name: functionName,
      request_count: 1,
      window_start: new Date().toISOString(),
    }, { onConflict: 'ip_address,function_name' });
  
  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || req.headers.get('cf-connecting-ip') 
      || req.headers.get('x-real-ip')
      || 'unknown';

    // Check rate limit
    const { allowed, remaining } = await checkRateLimit(supabase, clientIP, 'save-postcode');
    
    if (!allowed) {
      console.log('Rate limit exceeded for IP:', clientIP);
      return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Retry-After': '3600'
        },
      });
    }

    const body = await req.json();
    
    // Validate postcode
    const postcodeValidation = validatePostcode(body.postcode);
    if (!postcodeValidation.valid) {
      return new Response(JSON.stringify({ error: postcodeValidation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Validate city
    const cityValidation = validateCity(body.city);
    if (!cityValidation.valid) {
      return new Response(JSON.stringify({ error: cityValidation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const postcode = postcodeValidation.cleaned!;
    const city = cityValidation.cleaned;

    console.log('Saving postcode for IP:', clientIP, 'Postcode:', postcode);

    // Fetch delivery zones from database
    const { data: zonesData } = await supabase
      .from('delivery_zones')
      .select('postcode_prefix, delivery_cost, min_order_amount, is_active')
      .eq('is_active', true);
    
    const zones: DeliveryZone[] = zonesData || [];
    const deliveryInfo = checkPostcode(postcode, zones);

    // Upsert the postcode for this IP
    const { error } = await supabase.from('ip_postcodes').upsert({
      ip_address: clientIP,
      postcode: postcode,
      city: city,
      in_delivery_area: deliveryInfo.inArea,
    }, { onConflict: 'ip_address' });

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    return new Response(JSON.stringify({
      success: true,
      postcode: postcode,
      ...deliveryInfo,
    }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': remaining.toString()
      },
    });

  } catch (error) {
    console.error('Error in save-postcode function:', error);
    // Return generic error message - don't expose internal details
    return new Response(JSON.stringify({ 
      error: 'Unable to process your request. Please try again later.',
      code: 'ERR_SAVE_500'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
