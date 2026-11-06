import Stripe from "npm:stripe@17.7.0";
import { createClient, type SupabaseClient, type User } from "npm:@supabase/supabase-js@2.49.4";

// Stripe's SDK throws at construction when the key is missing, which would
// crash the function before it can answer. Use a placeholder instead and let
// each function report "not configured" via stripeConfigured.
const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")?.trim() ?? "";
export const stripeConfigured = stripeKey.startsWith("sk_") || stripeKey.startsWith("rk_");
export const stripe = new Stripe(stripeConfigured ? stripeKey : "sk_not_configured", {
  httpClient: Stripe.createFetchHttpClient(),
});
if (!stripeConfigured) {
  // Log only the key's type prefix and length (e.g. "pk_live_", 107 chars), never the key,
  // so a wrong paste (publishable key, webhook secret, price ID) is easy to spot.
  const kind = stripeKey.match(/^[a-z]{2,6}_(?:live_|test_)?/)?.[0] ?? (stripeKey ? "unrecognised" : "empty");
  console.error(`STRIPE_SECRET_KEY doesn't look like a Stripe secret key (starts with "${kind}", ${stripeKey.length} characters). It should start with sk_live_ or rk_live_.`);
}

// Service-role client: bypasses RLS. Only ever used server-side.
export const admin: SupabaseClient = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Resolve the signed-in user from the request's Authorization header.
export async function getUser(req: Request): Promise<User | null> {
  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error) return null;
  return data.user;
}

// Where Stripe sends the browser back to. APP_URL (shared with the notify-
// functions) wins if set; otherwise the page the request came from.
export function siteUrl(req: Request): string {
  return (Deno.env.get("APP_URL") || req.headers.get("origin") || "").replace(/\/$/, "");
}
