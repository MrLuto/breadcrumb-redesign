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
    // Available printers can be passed as comma-separated query param
    const printersParam = url.searchParams.get("printers");
    const availablePrinters = printersParam
      ? printersParam.split(",").map((p) => p.trim()).filter(Boolean)
      : undefined;

    if (!machineId) {
      return new Response(JSON.stringify({ error: "machine_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "GET") {
      // Build upsert payload
      const upsertData: Record<string, unknown> = {
        machine_id: machineId,
        desktop_name: desktopName || "Onbekend",
        last_seen_at: new Date().toISOString(),
      };

      // Include available printers if provided
      if (availablePrinters !== undefined) {
        upsertData.available_printers = availablePrinters;
      }

      const { data: client, error: upsertError } = await supabase
        .from("print_clients")
        .upsert(upsertData, { onConflict: "machine_id" })
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
          print_template: client.print_template,
          test_print_requested_at: client.test_print_requested_at,
          test_print_template: client.test_print_template,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // POST: acknowledge test print (Go client calls this after printing)
    if (req.method === "POST") {
      const body = await req.json();

      if (body.action === "ack_test_print" && machineId) {
        const { error: ackError } = await supabase
          .from("print_clients")
          .update({ test_print_requested_at: null })
          .eq("machine_id", machineId);

        if (ackError) throw ackError;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Unknown action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
