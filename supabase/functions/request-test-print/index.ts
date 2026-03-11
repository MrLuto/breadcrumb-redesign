import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    const adminSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: isAdmin } = await adminSupabase.rpc("is_admin", { _user_id: userId });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { client_id, template } = await req.json();

    if (!client_id) {
      return new Response(JSON.stringify({ error: "client_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the printer client info for labeling
    const { data: client, error: clientError } = await adminSupabase
      .from("print_clients")
      .select("nickname, desktop_name")
      .eq("id", client_id)
      .single();

    if (clientError || !client) {
      return new Response(JSON.stringify({ error: "Printer not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const printerLabel = client.nickname || client.desktop_name;
    const now = new Date();
    const orderNumber = `TEST-${now.getTime()}`;

    // Insert a real test order into the orders table
    const { data: order, error: orderError } = await adminSupabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        company_name: "Test Print",
        contact_person: printerLabel,
        customer_type: "business",
        phone: "",
        email: "test@testprint.local",
        order_type: "pickup",
        delivery_address: "",
        postcode: "0000 AA",
        city: "Test",
        delivery_date: now.toISOString().slice(0, 10),
        delivery_time: null,
        delivery_asap: false,
        subtotal: 0,
        delivery_cost: 0,
        total: 0,
        payment_method: "direct",
        payment_status: "paid",
        order_status: "new",
        notes: `Testprint voor ${printerLabel} (template: ${template || "receipt"})`,
      })
      .select("id")
      .single();

    if (orderError) throw orderError;

    // Insert a test order item
    const { error: itemError } = await adminSupabase
      .from("order_items")
      .insert({
        order_id: order.id,
        product_name: "Testpagina printer",
        quantity: 1,
        unit_price: 0,
        total_price: 0,
        notes: template ? `Template: ${template}` : "Testafdruk",
      });

    if (itemError) throw itemError;

    return new Response(JSON.stringify({ success: true, order_id: order.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("request-test-print error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
