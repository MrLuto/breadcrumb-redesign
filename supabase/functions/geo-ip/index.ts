import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Delivery zones: [startNumeric, endNumeric, deliveryMinutes, cost, minimum]
const deliveryZones = [
  { start: 2741, end: 2743, minutes: 120, cost: 4.00, minimum: 20.00 },
  { start: 2800, end: 2811, minutes: 90, cost: 4.00, minimum: 20.00 },
  { start: 2820, end: 2821, minutes: 90, cost: 4.00, minimum: 20.00 },
  { start: 2830, end: 2831, minutes: 90, cost: 4.00, minimum: 20.00 },
  { start: 2840, end: 2841, minutes: 120, cost: 4.00, minimum: 20.00 },
  { start: 2850, end: 2851, minutes: 120, cost: 4.00, minimum: 20.00 },
];

interface DeliveryInfo {
  inArea: boolean;
  minutes?: number;
  cost?: number;
  minimum?: number;
}

const checkPostcode = (postcode: string): DeliveryInfo => {
  const cleaned = postcode.replace(/\s/g, '').toUpperCase();
  const match = cleaned.match(/^(\d{4})([A-Z]{2})$/);
  
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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP from headers (Supabase/Cloudflare provides this)
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || req.headers.get('cf-connecting-ip') 
      || req.headers.get('x-real-ip')
      || 'unknown';

    console.log('Client IP:', clientIP);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if we have a stored postcode for this IP
    const { data: existingData } = await supabase
      .from('ip_postcodes')
      .select('*')
      .eq('ip_address', clientIP)
      .single();

    if (existingData) {
      console.log('Found existing postcode for IP:', existingData.postcode);
      const deliveryInfo = checkPostcode(existingData.postcode);
      return new Response(JSON.stringify({
        ip: clientIP,
        postcode: existingData.postcode,
        city: existingData.city,
        source: 'database',
        ...deliveryInfo,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Try to get location from IP using free ip-api.com
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
      // We'll use it as a suggestion
      const postcode = geoData.zip.replace(/\s/g, '');
      const deliveryInfo = checkPostcode(postcode);
      
      // Store in database for future lookups
      await supabase.from('ip_postcodes').upsert({
        ip_address: clientIP,
        postcode: postcode,
        city: geoData.city || null,
        in_delivery_area: deliveryInfo.inArea,
      }, { onConflict: 'ip_address' });

      return new Response(JSON.stringify({
        ip: clientIP,
        postcode: postcode,
        city: geoData.city,
        source: 'geo-ip',
        suggested: true, // Mark as suggestion, not confirmed
        ...deliveryInfo,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Not in Netherlands but got some location data
    if (geoData?.status === 'success' && geoData?.city) {
      return new Response(JSON.stringify({
        ip: clientIP,
        postcode: null,
        city: geoData.city,
        country: geoData.country,
        source: 'geo-ip',
        suggested: false,
        inArea: false,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // No postcode found
    return new Response(JSON.stringify({
      ip: clientIP,
      postcode: null,
      city: geoData?.city || null,
      source: 'none',
      inArea: false,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in geo-ip function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      inArea: false,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
