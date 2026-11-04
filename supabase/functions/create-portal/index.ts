// Opens the Stripe customer portal so a contractor can cancel or update their card.
// Called by the app with the contractor's session token; returns { url }.
import { admin, corsHeaders, getUser, json, siteUrl, stripe } from "../_shared/stripe.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const user = await getUser(req);
    if (!user) return json({ error: "Please sign in first." }, 401);

    const { data: billing } = await admin
      .from("contractor_billing")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!billing) return json({ error: "No billing account found." }, 404);

    const session = await stripe.billingPortal.sessions.create({
      customer: billing.stripe_customer_id,
      return_url: `${siteUrl(req)}/`,
    });

    return json({ url: session.url });
  } catch (err) {
    console.error("create-portal failed:", err);
    return json({ error: "Couldn't open billing. Please try again." }, 500);
  }
});
