import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface OrderItemOption {
  group_name: string;
  name: string;
  price_adjustment: number;
}

interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
  options?: OrderItemOption[];
}

interface OrderConfirmationRequest {
  orderId: string;
  orderNumber: string;
  confirmationToken: string;
  customerEmail: string;
  customerName: string;
  companyName?: string;
  orderType: 'delivery' | 'pickup';
  deliveryAddress: string;
  postcode: string;
  city: string;
  deliveryDate: string;
  deliveryTime?: string;
  deliveryAsap: boolean;
  items: OrderItem[];
  subtotal: number;
  deliveryCost: number;
  total: number;
  notes?: string;
  paymentMethod: string;
  siteUrl: string;
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('nl-NL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const getPaymentMethodLabel = (method: string): string => {
  const labels: Record<string, string> = {
    'ideal': 'iDEAL',
    'pin': 'PIN bij bezorging/afhalen',
    'invoice': 'Op factuur',
    'monthly_invoice': 'Maandelijkse factuur',
    'cash': 'Contant',
  };
  return labels[method] || method;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: OrderConfirmationRequest = await req.json();

    // Validate required fields
    if (!data.customerEmail || !data.orderNumber || !data.orderId) {
      throw new Error("Missing required fields");
    }

    const confirmationUrl = `${data.siteUrl}/bestelling-bevestigd/${data.orderId}?token=${data.confirmationToken}`;

    // Build items HTML
    const itemsHtml = data.items.map(item => {
      const optionsHtml = item.options && item.options.length > 0
        ? `<br><small style="color: #555;">↳ ${item.options.map(opt => 
            opt.price_adjustment > 0 
              ? `${opt.name} (+${formatPrice(opt.price_adjustment)})` 
              : opt.name
          ).join(', ')}</small>`
        : '';
      
      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">
            ${item.quantity}x ${item.product_name}
            ${optionsHtml}
            ${item.notes ? `<br><small style="color: #666;">Opmerking: ${item.notes}</small>` : ''}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: right;">
            ${formatPrice(item.total_price)}
          </td>
        </tr>
      `;
    }).join('');

    const emailResponse = await resend.emails.send({
      from: "FrisVers Broodjes <frisvers@sites.byluto.nl>",
      to: [data.customerEmail],
      subject: `Bevestiging bestelling ${data.orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          
          <div style="background: linear-gradient(135deg, #4F7942 0%, #228B22 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Bedankt voor je bestelling!</h1>
          </div>
          
          <div style="background: #fff; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 12px 12px;">
            
            <p style="font-size: 16px;">
              Beste ${data.customerName},
            </p>
            
            <p>
              Je bestelling <strong>${data.orderNumber}</strong> is succesvol ontvangen. 
              ${data.companyName ? `(${data.companyName})` : ''}
            </p>

            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 24px 0;">
              <h3 style="margin: 0 0 16px 0; color: #4F7942;">
                ${data.orderType === 'pickup' ? '📍 Afhalen' : '🚚 Bezorging'}
              </h3>
              
              ${data.orderType === 'delivery' ? `
                <p style="margin: 0 0 8px 0;">
                  <strong>Adres:</strong><br>
                  ${data.deliveryAddress}<br>
                  ${data.postcode} ${data.city}
                </p>
              ` : `
                <p style="margin: 0 0 8px 0;">
                  <strong>Afhaaladres:</strong><br>
                  ${data.deliveryAddress}
                </p>
              `}
              
              <p style="margin: 16px 0 0 0;">
                <strong>Datum:</strong> ${formatDate(data.deliveryDate)}<br>
                <strong>Tijd:</strong> ${data.deliveryAsap ? 'Zo snel mogelijk' : (data.deliveryTime || 'Nog te bepalen')}
              </p>
            </div>

            <h3 style="color: #4F7942; border-bottom: 2px solid #4F7942; padding-bottom: 8px;">
              Bestelgegevens
            </h3>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background: #f8f9fa;">
                  <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e5e5;">Product</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e5e5;">Prijs</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">Subtotaal</td>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: right;">${formatPrice(data.subtotal)}</td>
                </tr>
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">
                    ${data.orderType === 'pickup' ? 'Afhalen' : 'Bezorgkosten'}
                  </td>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: right;">
                    ${data.deliveryCost === 0 ? 'Gratis' : formatPrice(data.deliveryCost)}
                  </td>
                </tr>
                <tr style="background: #f8f9fa;">
                  <td style="padding: 12px; font-weight: bold; font-size: 18px;">Totaal</td>
                  <td style="padding: 12px; font-weight: bold; font-size: 18px; text-align: right; color: #4F7942;">
                    ${formatPrice(data.total)}
                  </td>
                </tr>
              </tfoot>
            </table>

            ${data.notes ? `
              <div style="background: #fff3cd; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                <strong>Opmerkingen:</strong><br>
                ${data.notes}
              </div>
            ` : ''}

            <p>
              <strong>Betaalmethode:</strong> ${getPaymentMethodLabel(data.paymentMethod)}
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmationUrl}" 
                 style="display: inline-block; background: #4F7942; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold;">
                Bekijk je bestelling
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;">

            <p style="color: #666; font-size: 14px;">
              Heb je vragen over je bestelling? Neem dan contact met ons op via onze website of bel ons.
            </p>
            
            <p style="color: #666; font-size: 14px; margin-top: 24px;">
              Met vriendelijke groet,<br>
              <strong>FrisVers Broodjes</strong>
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            <p>
              Deze e-mail is automatisch verzonden. Antwoord niet op dit bericht.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Order confirmation email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, ...emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-order-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
