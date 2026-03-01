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

    const url = new URL(req.url);
    const platform = url.searchParams.get("platform"); // darwin, linux, windows
    const arch = url.searchParams.get("arch"); // amd64, arm64
    const currentVersion = url.searchParams.get("version"); // e.g. "1.0.0"

    if (!platform || !arch) {
      return new Response(
        JSON.stringify({ error: "platform and arch are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get latest version from shop_settings
    const { data: setting } = await supabase
      .from("shop_settings")
      .select("value")
      .eq("key", "print_client_version")
      .single();

    const latestVersion = (setting?.value as string) || "1.0.0";

    // Build the binary filename
    const ext = platform === "windows" ? ".exe" : "";
    const filename = `fvs-printer-${platform}-${arch}${ext}`;

    // Build download URL from storage bucket
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const downloadUrl = `${supabaseUrl}/storage/v1/object/public/printer-client/${filename}`;

    const updateAvailable = currentVersion ? currentVersion !== latestVersion : false;

    return new Response(
      JSON.stringify({
        latest_version: latestVersion,
        current_version: currentVersion || null,
        update_available: updateAvailable,
        download_url: updateAvailable ? downloadUrl : null,
        filename,
        checksum_url: updateAvailable
          ? `${supabaseUrl}/storage/v1/object/public/printer-client/${filename}.sha256`
          : null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("print-client-update error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
