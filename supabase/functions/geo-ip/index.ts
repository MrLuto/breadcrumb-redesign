import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting config
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 20;

// Delivery zones: [startNumeric, endNumeric, deliveryMinutes, cost, minimum]
const deliveryZones = [
  { start: 2741, end: 2743, minutes: 120, cost: 4.00, minimum: 20.00 },
  { start: 2800, end: 2811, minutes: 90, cost: 4.00, minimum: 20.00 },
  { start: 2820, end: 2821, minutes: 90, cost: 4.00, minimum: 20.00 },
  { start: 2830, end: 2831, minutes: 90, cost: 4.00, minimum: 20.00 },
  { start: 2840, end: 2841, minutes: 120, cost: 4.00, minimum: 20.00 },
  { start: 2850, end: 2851, minutes: 120, cost: 4.00, minimum: 20.00 },
];

// Input validation
const POSTCODE_REGEX = /^\d{4}[A-Z]{0,2}$/;
const MAX_CITY_LENGTH = 100;

interface DeliveryInfo {
  inArea: boolean;
  minutes?: number;
  cost?: number;
  minimum?: number;
}

const sanitizeString = (str: unknown, maxLength: number): string | null => {
  if (typeof str !== 'string') return null;
  return str.trim().slice(0, maxLength) || null;
};

const checkPostcode = (postcode: string): DeliveryInfo => {
  const cleaned = postcode.replace(/\s/g, '').toUpperCase();
  const match = cleaned.match(/^(\d{4})([A-Z]{2})?$/);
  
  if (!match) {
    return { inArea: false };
  }
  
  const numericPart = parseInt(match[1], 10);
  
  for (const zone of deliveryZones) {
    if (numericPart >= zone.start && numericPart <= zone.end) {
      return {
        inArea: true,
        minutes: zone.minutes,
        cost: zone.cost,
        minimum: zone.minimum,
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
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get client IP from headers (Supabase/Cloudflare provides this)
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || req.headers.get('cf-connecting-ip') 
      || req.headers.get('x-real-ip')
      || 'unknown';

    console.log('Client IP:', clientIP);

    // Check rate limit
    const { allowed, remaining } = await checkRateLimit(supabase, clientIP, 'geo-ip');
    
    if (!allowed) {
      console.log('Rate limit exceeded for IP:', clientIP);
      return new Response(JSON.stringify({ 
        error: 'Too many requests. Please try again later.',
        inArea: false 
      }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Retry-After': '3600'
        },
      });
    }

    // ALWAYS fetch fresh from geo-ip API - skip database cache
    // This ensures we get the most up-to-date location data
    console.log('Fetching fresh geo-ip data for:', clientIP);

    let geoData = null;
    try {
      // ip-api.com is free for non-commercial use, 45 requests per minute
      const geoResponse = await fetch(`http://ip-api.com/json/${clientIP}?fields=status,country,city,zip,lat,lon`);
      if (geoResponse.ok) {
        geoData = await geoResponse.json();
        console.log('Geo IP response:', geoData);
      }
    } catch (geoError) {
      console.error('Geo IP lookup failed:', geoError);
    }

    // If we got a postal code from geo IP (check for Netherlands variants)
    const isNetherlands = geoData?.country === 'Netherlands' || 
                          geoData?.country === 'The Netherlands' ||
                          geoData?.country === 'NL';
    
    if (geoData?.status === 'success' && geoData?.zip && isNetherlands) {
      // Dutch postal codes from ip-api might be partial (just numeric, like "3772")
      // Sanitize the input
      const rawPostcode = String(geoData.zip || '').replace(/\s/g, '').slice(0, 10);
      
      if (!POSTCODE_REGEX.test(rawPostcode.toUpperCase())) {
        console.log('Invalid postcode format from geo-ip:', rawPostcode);
        return new Response(JSON.stringify({
          ip: clientIP,
          postcode: null,
          city: sanitizeString(geoData.city, MAX_CITY_LENGTH),
          source: 'geo-ip',
          suggested: false,
          inArea: false,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const postcode = rawPostcode.toUpperCase();
      const city = sanitizeString(geoData.city, MAX_CITY_LENGTH);
      const deliveryInfo = checkPostcode(postcode);
      
      // Update database for analytics (upsert to update existing entry)
      await supabase.from('ip_postcodes').upsert({
        ip_address: clientIP,
        postcode: postcode,
        city: city,
        in_delivery_area: deliveryInfo.inArea,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'ip_address' });

      return new Response(JSON.stringify({
        ip: clientIP,
        postcode: postcode,
        city: city,
        source: 'geo-ip',
        suggested: true, // Mark as suggestion, not confirmed
        ...deliveryInfo,
      }), {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': remaining.toString()
        },
      });
    }

    // Not in Netherlands but got some location data
    if (geoData?.status === 'success' && geoData?.city) {
      return new Response(JSON.stringify({
        ip: clientIP,
        postcode: null,
        city: sanitizeString(geoData.city, MAX_CITY_LENGTH),
        country: sanitizeString(geoData.country, 100),
        source: 'geo-ip',
        suggested: false,
        inArea: false,
      }), {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': remaining.toString()
        },
      });
    }

    // No postcode found
    return new Response(JSON.stringify({
      ip: clientIP,
      postcode: null,
      city: geoData?.city ? sanitizeString(geoData.city, MAX_CITY_LENGTH) : null,
      source: 'none',
      inArea: false,
    }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': remaining.toString()
      },
    });

  } catch (error) {
    console.error('Error in geo-ip function:', error);
    // Return generic error message - don't expose internal details
    return new Response(JSON.stringify({ 
      error: 'Unable to process your request. Please try again later.',
      code: 'ERR_GEO_500',
      inArea: false,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
