import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-print-key",
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(price);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const paymentMethodLabels: Record<string, string> = {
  ideal: "iDEAL",
  pin: "PIN",
  cash: "Contant",
  invoice: "Factuur",
  direct: "Direct",
  monthly_invoice: "Maandfactuur",
};

const paymentStatusLabels: Record<string, string> = {
  pending: "Niet betaald",
  paid: "Betaald",
  invoiced: "Gefactureerd",
  refunded: "Terugbetaald",
};

const customerTypeLabels: Record<string, string> = {
  business: "Zakelijk",
  private: "Particulier",
};

const orderTypeLabels: Record<string, string> = {
  delivery: "Bezorgen",
  pickup: "Afhalen",
};

function generateHtml(order: any): string {
  const itemsHtml = order.order_items
    .map((item: any) => {
      const optionsHtml = (item.options || [])
        .map(
          (opt: any) =>
            `<div class="option">${opt.group}: ${opt.name}${
              opt.price > 0 ? ` (+${formatPrice(opt.price)})` : ""
            }</div>`
        )
        .join("");
      const notesHtml = item.notes
        ? `<div class="option note">Opmerking: ${item.notes}</div>`
        : "";

      return `
        <tr>
          <td class="qty">${item.quantity}x</td>
          <td class="product">
            ${item.product_name}
            ${optionsHtml}
            ${notesHtml}
          </td>
          <td class="price">${formatPrice(item.unit_price)}</td>
          <td class="price">${formatPrice(item.total_price)}</td>
        </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bestelling ${order.order_number}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 12pt;
      color: #1a1a1a;
      line-height: 1.4;
    }
    .receipt {
      max-width: 700px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #1a1a1a;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    .header h1 {
      font-size: 22pt;
      letter-spacing: 4px;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .order-number {
      font-size: 14pt;
      font-weight: bold;
      color: #444;
    }
    .order-date {
      font-size: 10pt;
      color: #666;
    }
    .section {
      margin-bottom: 18px;
    }
    .section-title {
      font-size: 11pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #555;
      border-bottom: 1px solid #ccc;
      padding-bottom: 4px;
      margin-bottom: 8px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 120px 1fr;
      gap: 3px 10px;
      font-size: 11pt;
    }
    .info-label {
      color: #666;
    }
    .info-value {
      font-weight: 500;
    }
    table.products {
      width: 100%;
      border-collapse: collapse;
      margin-top: 5px;
    }
    table.products th {
      text-align: left;
      font-size: 10pt;
      text-transform: uppercase;
      color: #666;
      border-bottom: 2px solid #ddd;
      padding: 5px 8px;
    }
    table.products th.price,
    table.products td.price {
      text-align: right;
    }
    table.products td {
      padding: 8px;
      border-bottom: 1px solid #eee;
      vertical-align: top;
    }
    table.products td.qty {
      width: 40px;
      font-weight: bold;
    }
    .option {
      font-size: 9pt;
      color: #666;
      padding-left: 8px;
      margin-top: 2px;
    }
    .option::before {
      content: "› ";
    }
    .option.note {
      font-style: italic;
    }
    .totals {
      margin-top: 15px;
      border-top: 2px solid #1a1a1a;
      padding-top: 10px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      font-size: 11pt;
      padding: 2px 0;
    }
    .total-row.grand {
      font-size: 14pt;
      font-weight: bold;
      border-top: 2px solid #1a1a1a;
      margin-top: 8px;
      padding-top: 8px;
    }
    .payment-info {
      display: flex;
      gap: 30px;
      font-size: 11pt;
      margin-top: 10px;
    }
    .notes-box {
      background: #f5f5f5;
      padding: 10px 14px;
      border-left: 3px solid #999;
      font-size: 11pt;
      margin-top: 5px;
    }
    .footer {
      text-align: center;
      margin-top: 25px;
      padding-top: 15px;
      border-top: 3px solid #1a1a1a;
      font-size: 9pt;
      color: #888;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1>Bestelling</h1>
      <div class="order-number">${order.order_number}</div>
      <div class="order-date">Besteld op ${formatDateTime(order.created_at)}</div>
    </div>

    <div class="section">
      <div class="section-title">Klant</div>
      <div class="info-grid">
        <span class="info-label">Type:</span>
        <span class="info-value">${customerTypeLabels[order.customer_type] || order.customer_type}</span>
        <span class="info-label">Bedrijf:</span>
        <span class="info-value">${order.company_name}</span>
        <span class="info-label">Contact:</span>
        <span class="info-value">${order.contact_person}</span>
        <span class="info-label">Telefoon:</span>
        <span class="info-value">${order.phone}</span>
        <span class="info-label">Email:</span>
        <span class="info-value">${order.email}</span>
      </div>
    </div>

    <div class="section">
      <div class="section-title">${orderTypeLabels[order.order_type] || "Bezorging"}</div>
      <div class="info-grid">
        ${order.order_type === "delivery" ? `
        <span class="info-label">Adres:</span>
        <span class="info-value">${order.delivery_address}</span>
        <span class="info-label"></span>
        <span class="info-value">${order.postcode} ${order.city}</span>
        ` : ""}
        <span class="info-label">Datum:</span>
        <span class="info-value">${formatDate(order.delivery_date)}</span>
        <span class="info-label">Tijd:</span>
        <span class="info-value">${order.delivery_asap ? "Zo snel mogelijk" : order.delivery_time || "–"}</span>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Producten</div>
      <table class="products">
        <thead>
          <tr>
            <th>Aantal</th>
            <th>Product</th>
            <th class="price">Stukprijs</th>
            <th class="price">Totaal</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="totals">
        <div class="total-row">
          <span>Subtotaal</span>
          <span>${formatPrice(order.subtotal)}</span>
        </div>
        <div class="total-row">
          <span>Bezorgkosten</span>
          <span>${formatPrice(order.delivery_cost)}</span>
        </div>
        <div class="total-row grand">
          <span>Totaal</span>
          <span>${formatPrice(order.total)}</span>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="payment-info">
        <span><strong>Betaalwijze:</strong> ${paymentMethodLabels[order.payment_method] || order.payment_method}</span>
        <span><strong>Status:</strong> ${paymentStatusLabels[order.payment_status] || order.payment_status}</span>
      </div>
    </div>

    ${order.notes ? `
    <div class="section">
      <div class="section-title">Opmerkingen</div>
      <div class="notes-box">${order.notes}</div>
    </div>
    ` : ""}

    <div class="footer">
      Afgedrukt: ${formatDateTime(new Date().toISOString())}
    </div>
  </div>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = req.headers.get("x-print-key");
    const expectedKey = Deno.env.get("PRINT_API_KEY");

    if (!apiKey || apiKey !== expectedKey) {
      return new Response("Unauthorized", {
        status: 401,
        headers: corsHeaders,
      });
    }

    const url = new URL(req.url);
    const orderId = url.searchParams.get("order_id");

    if (!orderId) {
      return new Response(JSON.stringify({ error: "order_id query param required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: order, error } = await supabase
      .from("orders")
      .select("*, order_items(*, order_item_options(*))")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Transform items for template
    const formattedOrder = {
      ...order,
      order_items: (order.order_items || []).map((item: any) => ({
        ...item,
        options: (item.order_item_options || []).map((opt: any) => ({
          group: opt.option_group_name,
          name: opt.option_name,
          price: opt.price_adjustment,
        })),
      })),
    };

    const html = generateHtml(formattedOrder);

    return new Response(html, {
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err) {
    console.error("generate-print-html error:", err);
    return new Response("Internal server error", {
      status: 500,
      headers: corsHeaders,
    });
  }
});
