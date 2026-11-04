// Starts a Stripe Checkout session for the WeeSubby Pro subscription.
// Called by the app with the contractor's session token; returns { url }.
import { admin, corsHeaders, getUser, json, siteUrl, stripe, stripeConfigured } from "../_shared/stripe.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const user = await getUser(req);
    if (!user) return json({ error: "Please sign in first." }, 401);

    const { data: contractor } = await admin
      .from("contractors")
      .select("id, name, plan")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!contractor) return json({ error: "Create your contractor profile first." }, 400);
    if (contractor.plan === "pro") return json({ error: "You're already on Pro." }, 400);

    const priceId = Deno.env.get("STRIPE_PRICE_ID");
    const site = siteUrl(req);
    if (!stripeConfigured || !priceId || !site) return json({ error: "Payments aren't configured yet." }, 500);

    // Reuse this contractor's Stripe customer if they've checked out before.
    const { data: billing } = await admin
      .from("contractor_billing")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    let customerId = billing?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: contractor.name,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
      const { error } = await admin
        .from("contractor_billing")
        .insert({ user_id: user.id, stripe_customer_id: customerId });
      if (error) throw error;
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: { metadata: { user_id: user.id } },
      allow_promotion_codes: true,
      success_url: `${site}/pricing?checkout=success`,
      cancel_url: `${site}/pricing?checkout=cancel`,
    });

    return json({ url: session.url });
  } catch (err) {
    console.error("create-checkout failed:", err);
    return json({ error: "Couldn't start checkout. Please try again." }, 500);
  }
});
