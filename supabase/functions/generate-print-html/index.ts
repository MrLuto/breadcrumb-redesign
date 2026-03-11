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

function generateReceiptHtml(order: any): string {
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
    @page { size: A4; margin: 15mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 12pt; color: #1a1a1a; line-height: 1.4; }
    .receipt { max-width: 700px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; border-bottom: 3px solid #1a1a1a; padding-bottom: 15px; margin-bottom: 20px; }
    .header h1 { font-size: 22pt; letter-spacing: 4px; text-transform: uppercase; margin-bottom: 5px; }
    .order-number { font-size: 14pt; font-weight: bold; color: #444; }
    .order-date { font-size: 10pt; color: #666; }
    .section { margin-bottom: 18px; }
    .section-title { font-size: 11pt; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; color: #555; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 8px; }
    .info-grid { display: grid; grid-template-columns: 120px 1fr; gap: 3px 10px; font-size: 11pt; }
    .info-label { color: #666; }
    .info-value { font-weight: 500; }
    table.products { width: 100%; border-collapse: collapse; margin-top: 5px; }
    table.products th { text-align: left; font-size: 10pt; text-transform: uppercase; color: #666; border-bottom: 2px solid #ddd; padding: 5px 8px; }
    table.products th.price, table.products td.price { text-align: right; }
    table.products td { padding: 8px; border-bottom: 1px solid #eee; vertical-align: top; }
    table.products td.qty { width: 40px; font-weight: bold; }
    .option { font-size: 9pt; color: #666; padding-left: 8px; margin-top: 2px; }
    .option::before { content: "› "; }
    .option.note { font-style: italic; }
    .totals { margin-top: 15px; border-top: 2px solid #1a1a1a; padding-top: 10px; }
    .total-row { display: flex; justify-content: space-between; font-size: 11pt; padding: 2px 0; }
    .total-row.grand { font-size: 14pt; font-weight: bold; border-top: 2px solid #1a1a1a; margin-top: 8px; padding-top: 8px; }
    .payment-info { display: flex; gap: 30px; font-size: 11pt; margin-top: 10px; }
    .notes-box { background: #f5f5f5; padding: 10px 14px; border-left: 3px solid #999; font-size: 11pt; margin-top: 5px; }
    .footer { text-align: center; margin-top: 25px; padding-top: 15px; border-top: 3px solid #1a1a1a; font-size: 9pt; color: #888; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
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
        <tbody>${itemsHtml}</tbody>
      </table>
      <div class="totals">
        <div class="total-row"><span>Subtotaal</span><span>${formatPrice(order.subtotal)}</span></div>
        <div class="total-row"><span>Bezorgkosten</span><span>${formatPrice(order.delivery_cost)}</span></div>
        <div class="total-row grand"><span>Totaal</span><span>${formatPrice(order.total)}</span></div>
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

function generateInvoiceA4Html(order: any): string {
  const itemsHtml = order.order_items
    .map((item: any, i: number) => {
      const optionsHtml = (item.options || [])
        .map(
          (opt: any) =>
            `<div class="option">${opt.group}: ${opt.name}${
              opt.price > 0 ? ` (+${formatPrice(opt.price)})` : ""
            }</div>`
        )
        .join("");
      const notesHtml = item.notes
        ? `<div class="option note">${item.notes}</div>`
        : "";

      return `
        <tr>
          <td class="num">${i + 1}</td>
          <td class="product">
            ${item.product_name}
            ${optionsHtml}
            ${notesHtml}
          </td>
          <td class="center">${item.quantity}</td>
          <td class="right">${formatPrice(item.unit_price)}</td>
          <td class="right">${formatPrice(item.total_price)}</td>
        </tr>`;
    })
    .join("");

  const vatRate = 9;
  const netAmount = order.subtotal / (1 + vatRate / 100);
  const vatAmount = order.subtotal - netAmount;

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pakbon ${order.order_number}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 10pt; color: #222; line-height: 1.5; }
    .page { max-width: 210mm; margin: 0 auto; padding: 0; }

    .top-bar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
    .company-info h1 { font-size: 20pt; font-weight: 800; letter-spacing: 2px; color: #1a1a1a; }
    .company-info p { font-size: 9pt; color: #666; }
    .doc-meta { text-align: right; }
    .doc-meta .doc-type { font-size: 16pt; font-weight: 700; text-transform: uppercase; color: #333; margin-bottom: 8px; }
    .doc-meta table { font-size: 9pt; margin-left: auto; }
    .doc-meta table td { padding: 2px 0 2px 12px; }
    .doc-meta table td:first-child { color: #888; text-align: right; padding-left: 0; }

    .addresses { display: flex; gap: 40px; margin-bottom: 25px; }
    .address-block { flex: 1; }
    .address-block .label { font-size: 8pt; text-transform: uppercase; letter-spacing: 1.5px; color: #999; margin-bottom: 4px; }
    .address-block .name { font-weight: 700; font-size: 11pt; }
    .address-block p { font-size: 9.5pt; color: #444; margin-top: 2px; }

    .delivery-bar { background: #f7f7f7; border: 1px solid #e5e5e5; border-radius: 4px; padding: 10px 16px; display: flex; gap: 40px; margin-bottom: 20px; font-size: 9.5pt; }
    .delivery-bar strong { color: #333; }

    table.items { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    table.items th { background: #f0f0f0; font-size: 8.5pt; text-transform: uppercase; letter-spacing: 1px; color: #666; padding: 8px 10px; text-align: left; border-bottom: 2px solid #ddd; }
    table.items th.center, table.items td.center { text-align: center; }
    table.items th.right, table.items td.right { text-align: right; }
    table.items td { padding: 8px 10px; border-bottom: 1px solid #eee; vertical-align: top; }
    table.items td.num { width: 30px; color: #999; }
    .option { font-size: 8.5pt; color: #888; padding-left: 6px; }
    .option::before { content: "– "; }
    .option.note { font-style: italic; }

    .summary { display: flex; justify-content: flex-end; }
    .summary-table { width: 250px; }
    .summary-table .row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 10pt; }
    .summary-table .row.sep { border-top: 1px solid #ddd; margin-top: 4px; padding-top: 6px; }
    .summary-table .row.grand { border-top: 2px solid #222; margin-top: 6px; padding-top: 8px; font-size: 13pt; font-weight: 700; }

    .payment-bar { margin-top: 15px; padding: 10px 16px; background: #fafafa; border: 1px solid #e5e5e5; border-radius: 4px; font-size: 9.5pt; display: flex; gap: 30px; }

    .notes { margin-top: 20px; }
    .notes .label { font-size: 8pt; text-transform: uppercase; letter-spacing: 1.5px; color: #999; margin-bottom: 4px; }
    .notes .content { background: #fffde7; border-left: 3px solid #fbc02d; padding: 8px 14px; font-size: 9.5pt; }

    .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #ddd; text-align: center; font-size: 8pt; color: #aaa; }

    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="top-bar">
      <div class="company-info">
        <h1>Frisversshop</h1>
      </div>
      <div class="doc-meta">
        <div class="doc-type">Pakbon</div>
        <table>
          <tr><td>Nummer</td><td><strong>${order.order_number}</strong></td></tr>
          <tr><td>Datum</td><td>${formatDateTime(order.created_at)}</td></tr>
          <tr><td>Type</td><td>${customerTypeLabels[order.customer_type] || order.customer_type}</td></tr>
        </table>
      </div>
    </div>

    <div class="addresses">
      <div class="address-block">
        <div class="label">Klant</div>
        <div class="name">${order.company_name}</div>
        <p>${order.contact_person}</p>
        <p>${order.phone}</p>
        <p>${order.email}</p>
        ${order.kvk_number ? `<p>KvK: ${order.kvk_number}</p>` : ""}
        ${order.department ? `<p>Afd: ${order.department}</p>` : ""}
      </div>
      <div class="address-block">
        <div class="label">${order.order_type === "pickup" ? "Afhaaladres" : "Bezorgadres"}</div>
        ${order.order_type === "delivery" ? `
        <p>${order.delivery_address}</p>
        <p>${order.postcode} ${order.city}</p>
        ` : `<p>Afhalen bij FVS</p>`}
        ${order.billing_address && order.billing_address !== order.delivery_address ? `
        <div class="label" style="margin-top:10px">Factuuradres</div>
        <p>${order.billing_address}</p>
        <p>${order.billing_postcode || ""} ${order.billing_city || ""}</p>
        ` : ""}
      </div>
    </div>

    <div class="delivery-bar">
      <span><strong>Leverdatum:</strong> ${formatDate(order.delivery_date)}</span>
      <span><strong>Tijd:</strong> ${order.delivery_asap ? "Zo snel mogelijk" : order.delivery_time || "–"}</span>
      <span><strong>Type:</strong> ${orderTypeLabels[order.order_type] || "Bezorgen"}</span>
    </div>

    <table class="items">
      <thead>
        <tr>
          <th>#</th>
          <th>Omschrijving</th>
          <th class="center">Aantal</th>
          <th class="right">Prijs</th>
          <th class="right">Bedrag</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>

    <div class="summary">
      <div class="summary-table">
        <div class="row"><span>Subtotaal</span><span>${formatPrice(order.subtotal)}</span></div>
        <div class="row"><span>Bezorgkosten</span><span>${formatPrice(order.delivery_cost)}</span></div>
        <div class="row sep"><span>Netto</span><span>${formatPrice(netAmount)}</span></div>
        <div class="row"><span>BTW (${vatRate}%)</span><span>${formatPrice(vatAmount)}</span></div>
        <div class="row grand"><span>Totaal</span><span>${formatPrice(order.total)}</span></div>
      </div>
    </div>

    <div class="payment-bar">
      <span><strong>Betaalwijze:</strong> ${paymentMethodLabels[order.payment_method] || order.payment_method}</span>
      <span><strong>Betaalstatus:</strong> ${paymentStatusLabels[order.payment_status] || order.payment_status}</span>
    </div>

    ${order.notes ? `
    <div class="notes">
      <div class="label">Opmerkingen</div>
      <div class="content">${order.notes}</div>
    </div>
    ` : ""}

    <div class="footer">
      Afgedrukt: ${formatDateTime(new Date().toISOString())} &nbsp;|&nbsp; ${order.order_number}
    </div>
  </div>
</body>
</html>`;
}

function generatePlainTextHtml(order: any): string {
  const W = 48;
  const eq = (len: number) => "=".repeat(len);
  const dash = (len: number) => "-".repeat(len);
  const center = (s: string, len: number) => {
    const pad = Math.max(0, len - s.length);
    const left = Math.floor(pad / 2);
    return " ".repeat(left) + s + " ".repeat(pad - left);
  };

  const fmtDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  };
  const fmtDT = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };
  const fmtP = (n: number) => formatPrice(n).replace(/\s/g, " ");

  const itemLines = order.order_items
    .map((item: any) => {
      const qty = item.quantity + "x";
      const name = item.product_name;
      const up = fmtP(item.unit_price);
      const tp = fmtP(item.total_price);
      let l = `${qty.padEnd(4)}${name.padEnd(22)}${up.padStart(10)} ${tp.padStart(10)}`;
      const extras: string[] = [];
      (item.options || []).forEach((opt: any) => {
        extras.push(`     > ${opt.group}: ${opt.name}${opt.price > 0 ? " (+" + fmtP(opt.price) + ")" : ""}`);
      });
      if (item.notes) extras.push(`     -> ${item.notes}`);
      return [l, ...extras].join("\n");
    })
    .join("\n");

  const text = [
    eq(W),
    center("BESTELLING", W),
    eq(W),
    `Bestelnummer: ${order.order_number}`,
    `Besteldatum:  ${fmtDT(order.created_at)}`,
    "",
    "KLANT",
    dash(6),
    `  Type:      ${customerTypeLabels[order.customer_type] || order.customer_type}`,
    `  Bedrijf:   ${order.company_name}`,
    `  Contact:   ${order.contact_person}`,
    `  Telefoon:  ${order.phone}`,
    `  Email:     ${order.email}`,
    ...(order.kvk_number ? [`  KvK:       ${order.kvk_number}`] : []),
    ...(order.department ? [`  Afdeling:  ${order.department}`] : []),
    "",
    (orderTypeLabels[order.order_type] || "BEZORGING").toUpperCase(),
    dash(10),
    ...(order.order_type === "delivery"
      ? [`  Adres:     ${order.delivery_address}`, `             ${order.postcode} ${order.city}`]
      : [`  Type:      Afhalen`]),
    `  Datum:     ${fmtDate(order.delivery_date)}`,
    `  Tijd:      ${order.delivery_asap ? "Zo snel mogelijk" : order.delivery_time || "-"}`,
    "",
    "PRODUCTEN",
    dash(W),
    itemLines,
    "",
    `${"Subtotaal:".padEnd(28)}${fmtP(order.subtotal).padStart(18)}`,
    `${"Bezorgkosten:".padEnd(28)}${fmtP(order.delivery_cost).padStart(18)}`,
    eq(24).padStart(W),
    `${"TOTAAL:".padEnd(28)}${fmtP(order.total).padStart(18)}`,
    "",
    `Betaalwijze:   ${paymentMethodLabels[order.payment_method] || order.payment_method}`,
    `Betaalstatus:  ${paymentStatusLabels[order.payment_status] || order.payment_status}`,
    ...(order.notes
      ? ["", "OPMERKINGEN", dash(12), order.notes]
      : []),
    "",
    eq(W),
    `Afgedrukt: ${fmtDT(new Date().toISOString())}`,
    eq(W),
  ].join("\n");

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <title>Bestelling ${order.order_number}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: 'Courier New', Courier, monospace; font-size: 10pt; white-space: pre; line-height: 1.3; background: #fff; color: #000; margin: 10mm; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>${text}</body>
</html>`;
}

function generateTestHtml(template: string): string {
  const testOrder = {
    order_number: "FRIS-TEST-0001",
    created_at: new Date().toISOString(),
    customer_type: "business",
    company_name: "Test Bedrijf B.V.",
    contact_person: "Jan de Tester",
    phone: "06-12345678",
    email: "test@voorbeeld.nl",
    kvk_number: "12345678",
    department: "Receptie",
    order_type: "delivery",
    delivery_address: "Voorbeeldstraat 1",
    postcode: "1234 AB",
    city: "Amsterdam",
    billing_address: null,
    billing_postcode: null,
    billing_city: null,
    delivery_date: new Date().toISOString().split("T")[0],
    delivery_time: "12:00",
    delivery_asap: false,
    subtotal: 45.50,
    delivery_cost: 7.50,
    total: 53.00,
    payment_method: "invoice",
    payment_status: "pending",
    notes: "Graag voor 12 uur bezorgen. Lift is buiten gebruik, 2e verdieping.",
    order_items: [
      {
        quantity: 5,
        product_name: "Broodje Gezond",
        unit_price: 4.50,
        total_price: 22.50,
        notes: null,
        options: [
          { group: "Broodsoort", name: "Volkoren", price: 0 },
          { group: "Extra", name: "Avocado", price: 0.75 },
        ],
      },
      {
        quantity: 3,
        product_name: "Broodje Zalm",
        unit_price: 5.50,
        total_price: 16.50,
        notes: "Zonder ui",
        options: [
          { group: "Broodsoort", name: "Wit", price: 0 },
        ],
      },
      {
        quantity: 2,
        product_name: "Koffie",
        unit_price: 2.50,
        total_price: 5.00,
        notes: null,
        options: [],
      },
      {
        quantity: 1,
        product_name: "Jus d'Orange vers",
        unit_price: 3.50,
        total_price: 3.50,
        notes: null,
        options: [],
      },
    ],
  };

  if (template === "invoice_a4") {
    return generateInvoiceA4Html(testOrder);
  }
  if (template === "plain_text") {
    return generatePlainTextHtml(testOrder);
  }
  return generateReceiptHtml(testOrder);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);

    // Auth: accept either x-print-key (for print clients) or admin JWT (for admin UI)
    let authorized = false;

    const apiKey = req.headers.get("x-print-key") || url.searchParams.get("_key");
    const expectedKey = Deno.env.get("PRINT_API_KEY");
    if (apiKey && expectedKey && apiKey === expectedKey) {
      authorized = true;
    }

    if (!authorized) {
      const authHeader = req.headers.get("authorization");
      if (authHeader) {
        const supabaseAuth = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_ANON_KEY")!
        );
        const token = authHeader.replace("Bearer ", "");
        const { data: { user } } = await supabaseAuth.auth.getUser(token);
        if (user) {
          const adminCheck = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
          );
          const { data: roleData } = await adminCheck
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .eq("role", "admin")
            .maybeSingle();
          if (roleData) {
            authorized = true;
          }
        }
      }
    }

    if (!authorized) {
      return new Response("Unauthorized", {
        status: 401,
        headers: corsHeaders,
      });
    }

    const orderId = url.searchParams.get("order_id");
    const template = url.searchParams.get("template") || "receipt";
    const isTest = url.searchParams.get("test") === "true";

    // Test mode: return sample HTML without needing an order (for admin preview)
    if (isTest) {
      const html = generateTestHtml(template);
      return new Response(html, {
        headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
      });
    }

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

    const html = template === "invoice_a4"
      ? generateInvoiceA4Html(formattedOrder)
      : template === "plain_text"
        ? generatePlainTextHtml(formattedOrder)
        : generateReceiptHtml(formattedOrder);

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
