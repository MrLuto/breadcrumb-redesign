import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Delivery zones
const deliveryZones = [
  { start: 2741, end: 2743, minutes: 120, cost: 4.00, minimum: 20.00 },
  { start: 2800, end: 2811, minutes: 90, cost: 4.00, minimum: 20.00 },
  { start: 2820, end: 2821, minutes: 90, cost: 4.00, minimum: 20.00 },
  { start: 2830, end: 2831, minutes: 90, cost: 4.00, minimum: 20.00 },
  { start: 2840, end: 2841, minutes: 120, cost: 4.00, minimum: 20.00 },
  { start: 2850, end: 2851, minutes: 120, cost: 4.00, minimum: 20.00 },
];

const checkPostcode = (postcode: string) => {
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { postcode, city } = await req.json();
    
    if (!postcode) {
      return new Response(JSON.stringify({ error: 'Postcode is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || req.headers.get('cf-connecting-ip') 
      || req.headers.get('x-real-ip')
      || 'unknown';

    console.log('Saving postcode for IP:', clientIP, 'Postcode:', postcode);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const deliveryInfo = checkPostcode(postcode);

    // Upsert the postcode for this IP
    const { error } = await supabase.from('ip_postcodes').upsert({
      ip_address: clientIP,
      postcode: postcode.replace(/\s/g, '').toUpperCase(),
      city: city || null,
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
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in save-postcode function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
