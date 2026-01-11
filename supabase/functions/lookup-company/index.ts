import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    // Use the KVK Open Data API (free, no key required)
    // This searches the public trade register
    const kvkSearchUrl = `https://zoeken.kvk.nl/search.ashx?handelsnaam=${encodeURIComponent(query)}&kvknummer=&straat=&postcode=&huisnummer=&plaats=&hoofdvestiging=1&rechtspersoon=1&nevenvestiging=0&zoekvervallen=0&zoekuitgeschreven=1&start=0&searchfield=uitgebreidzoeken&_=${Date.now()}`;
    
    let companies: Array<{
      name: string;
      kvkNumber: string;
      address: string;
      postcode: string;
      city: string;
    }> = [];

    try {
      const response = await fetch(kvkSearchUrl, {
        headers: {
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0 (compatible; FrisVersshop/1.0)",
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.resultaten && Array.isArray(data.resultaten)) {
          companies = data.resultaten.slice(0, 10).map((item: any) => ({
            name: item.handelsnaam || "",
            kvkNumber: item.kvkNummer || "",
            address: item.straat ? `${item.straat} ${item.huisnummer || ""}`.trim() : "",
            postcode: item.postcode || "",
            city: item.plaats || "",
          }));
        }
      } else {
        console.error("KVK API response not OK:", response.status);
      }
    } catch (apiError) {
      console.error("KVK API error:", apiError);
      // Fall through to return empty results
    }

    // If KVK search didn't work, try a simpler approach with companies house NL
    if (companies.length === 0) {
      try {
        // Try alternative: handelsregister.online (public data)
        const altUrl = `https://handelsregister.online/api/v1/search?q=${encodeURIComponent(query)}`;
        const altResponse = await fetch(altUrl, {
          headers: { "Accept": "application/json" },
        });
        
        if (altResponse.ok) {
          const altData = await altResponse.json();
          if (Array.isArray(altData)) {
            companies = altData.slice(0, 10).map((item: any) => ({
              name: item.name || item.handelsnaam || "",
              kvkNumber: item.kvk || item.kvkNumber || "",
              address: item.address || item.straat || "",
              postcode: item.postcode || item.zipcode || "",
              city: item.city || item.plaats || "",
            }));
          }
        }
      } catch (altError) {
        console.error("Alternative API error:", altError);
      }
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
      JSON.stringify({ error: "Er is een fout opgetreden bij het zoeken", companies: [] }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});