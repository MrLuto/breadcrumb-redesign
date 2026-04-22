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
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: orders, error } = await supabase
      .from("orders")
      .select("*, order_items(*, order_item_options(*))")
      .eq("order_status", "new")
      .is("printed_at", null)
      // Skip iDEAL orders that have not been paid yet — they should not print
      // until the Pay.nl webhook updates payment_status to 'paid'.
      .not("and(payment_method.eq.ideal,payment_status.eq.pending)", "is", null)
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Belt-and-suspenders: also filter in JS in case the PostgREST filter syntax
    // above is interpreted differently by the client.
    const filteredOrders = (orders || []).filter(
      (o: any) => !(o.payment_method === "ideal" && o.payment_status === "pending"),
    );

    const formattedOrders = (orders || []).map((order: any) => ({
      id: order.id,
      order_number: order.order_number,
      created_at: order.created_at,
      company_name: order.company_name,
      contact_person: order.contact_person,
      customer_type: order.customer_type,
      phone: order.phone,
      email: order.email,
      order_type: order.order_type,
      delivery_address: order.delivery_address,
      postcode: order.postcode,
      city: order.city,
      delivery_date: order.delivery_date,
      delivery_time: order.delivery_time,
      delivery_asap: order.delivery_asap,
      subtotal: order.subtotal,
      delivery_cost: order.delivery_cost,
      total: order.total,
      payment_method: order.payment_method,
      payment_status: order.payment_status,
      notes: order.notes,
      order_items: (order.order_items || []).map((item: any) => ({
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        notes: item.notes,
        options: (item.order_item_options || []).map((opt: any) => ({
          group: opt.option_group_name,
          name: opt.option_name,
          price: opt.price_adjustment,
        })),
      })),
    }));

    return new Response(JSON.stringify({ orders: formattedOrders }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("get-print-queue error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
