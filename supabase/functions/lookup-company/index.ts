import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OpenKVKResult {
  kvkNumber: string;
  branchNumber: string;
  name: string;
  tradeNames: {
    businessName?: string;
    shortBusinessName?: string;
    currentTradeNames?: string[];
  };
  addresses: Array<{
    type: string;
    street: string;
    houseNumber: string;
    houseNumberAddition?: string;
    postalCode: string;
    city: string;
    country: string;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();

    if (!query || query.length < 2) {
      return new Response(
        JSON.stringify({ error: "Zoekterm moet minimaal 2 tekens zijn" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Search OpenKVK API (free alternative)
    const searchUrl = `https://api.kvk.nl/api/v1/zoeken?naam=${encodeURIComponent(query)}&pagina=1&resultatenPerPagina=10`;
    
    // Note: OpenKVK is a free alternative, but for production you might want the official KVK API
    // For now, we'll use a workaround with openkvk.nl
    const openKvkUrl = `https://api.openkvk.nl/api/v1/bv?naam=${encodeURIComponent(query)}`;
    
    let companies: Array<{
      name: string;
      kvkNumber: string;
      address: string;
      postcode: string;
      city: string;
    }> = [];

    try {
      // Try OpenKVK API
      const response = await fetch(openKvkUrl, {
        headers: {
          "Accept": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        if (Array.isArray(data)) {
          companies = data.slice(0, 10).map((item: any) => ({
            name: item.handelsnaam || item.naam || "",
            kvkNumber: item.kvknummer || item.kvk || "",
            address: item.straat ? `${item.straat} ${item.huisnummer || ""}`.trim() : "",
            postcode: item.postcode || "",
            city: item.plaats || "",
          }));
        }
      }
    } catch (apiError) {
      console.error("OpenKVK API error:", apiError);
      // Continue with empty results - we'll fall back to manual entry
    }

    // If OpenKVK didn't work, try a basic search simulation for testing
    // In production, you'd want to use the official KVK API with a key
    if (companies.length === 0) {
      // Return empty but valid response
      console.log("No results from OpenKVK, returning empty array");
    }

    return new Response(
      JSON.stringify({ companies }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Error in lookup-company:", error);
    return new Response(
      JSON.stringify({ error: "Er is een fout opgetreden bij het zoeken" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});