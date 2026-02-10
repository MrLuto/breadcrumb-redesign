import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-print-key",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify API key
    const apiKey = req.headers.get("x-print-key");
    const expectedKey = Deno.env.get("PRINT_API_KEY");

    if (!apiKey || apiKey !== expectedKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const url = new URL(req.url);
    const machineId = url.searchParams.get("machine_id");
    const desktopName = url.searchParams.get("desktop_name");

    if (!machineId) {
      return new Response(JSON.stringify({ error: "machine_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "GET") {
      // Register/heartbeat + fetch settings
      // Upsert the client record (register if new, update last_seen if existing)
      const { data: client, error: upsertError } = await supabase
        .from("print_clients")
        .upsert(
          {
            machine_id: machineId,
            desktop_name: desktopName || "Onbekend",
            last_seen_at: new Date().toISOString(),
          },
          { onConflict: "machine_id" }
        )
        .select()
        .single();

      if (upsertError) throw upsertError;

      return new Response(
        JSON.stringify({
          id: client.id,
          machine_id: client.machine_id,
          desktop_name: client.desktop_name,
          is_active: client.is_active,
          printer_name: client.printer_name,
          paper_width_mm: client.paper_width_mm,
          margin_mm: client.margin_mm,
          auto_print: client.auto_print,
          poll_interval_seconds: client.poll_interval_seconds,
          copies: client.copies,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("print-client-settings error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
