import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-print-key",
};

const TEST_PRINT_ORDER_PREFIX = "test-print:";

function firstNonEmpty(...values: Array<string | null>): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}

function getClientIdentity(req: Request) {
  const url = new URL(req.url);

  return {
    machineId: firstNonEmpty(
      url.searchParams.get("machine_id"),
      req.headers.get("x-machine-id"),
      req.headers.get("x-print-machine-id"),
      req.headers.get("machine-id")
    ),
    desktopName: firstNonEmpty(
      url.searchParams.get("desktop_name"),
      req.headers.get("x-desktop-name"),
      req.headers.get("desktop-name")
    ),
  };
}

async function fetchPendingTestPrintClient(
  supabase: ReturnType<typeof createClient>,
  machineId: string | null,
  desktopName: string | null,
) {
  if (machineId) {
    const { data, error } = await supabase
      .from("print_clients")
      .select("id, machine_id, desktop_name, nickname, test_print_requested_at, test_print_template")
      .eq("machine_id", machineId)
      .eq("is_active", true)
      .not("test_print_requested_at", "is", null)
      .maybeSingle();

    if (error) throw error;
    if (data) return data;
  }

  if (desktopName) {
    const { data, error } = await supabase
      .from("print_clients")
      .select("id, machine_id, desktop_name, nickname, test_print_requested_at, test_print_template")
      .eq("desktop_name", desktopName)
      .eq("is_active", true)
      .not("test_print_requested_at", "is", null)
      .maybeSingle();

    if (error) throw error;
    if (data) return data;
  }

  return null;
}

function createTestPrintOrder(client: {
  id: string;
  desktop_name: string;
  nickname: string | null;
  test_print_requested_at: string | null;
  test_print_template: string | null;
}) {
  const requestedAt = client.test_print_requested_at
    ? new Date(client.test_print_requested_at)
    : new Date();
  const printerLabel = client.nickname || client.desktop_name;

  return {
    id: `${TEST_PRINT_ORDER_PREFIX}${client.id}:${requestedAt.getTime()}`,
    order_number: `TEST-${requestedAt.getTime()}`,
    created_at: requestedAt.toISOString(),
    company_name: "Test Print",
    contact_person: printerLabel,
    customer_type: "business",
    phone: "",
    email: "",
    order_type: "pickup",
    delivery_address: "",
    postcode: "",
    city: "",
    delivery_date: requestedAt.toISOString().slice(0, 10),
    delivery_time: null,
    delivery_asap: false,
    subtotal: 0,
    delivery_cost: 0,
    total: 0,
    payment_method: "direct",
    payment_status: "paid",
    notes: `Testprint voor ${printerLabel}`,
    order_items: [
      {
        product_name: "Testpagina printer",
        quantity: 1,
        unit_price: 0,
        total_price: 0,
        notes: client.test_print_template
          ? `Template: ${client.test_print_template}`
          : "Testafdruk",
        options: [],
      },
    ],
  };
}

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

    const { machineId, desktopName } = getClientIdentity(req);

    const { data: orders, error } = await supabase
      .from("orders")
      .select("*, order_items(*, order_item_options(*))")
      .eq("order_status", "new")
      .is("printed_at", null)
      .order("created_at", { ascending: true });

    if (error) throw error;

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

    const pendingTestClient = await fetchPendingTestPrintClient(
      supabase,
      machineId,
      desktopName,
    );

    if (pendingTestClient) {
      formattedOrders.unshift(createTestPrintOrder(pendingTestClient));
    }

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
