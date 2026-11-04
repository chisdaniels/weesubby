// Receives Stripe events and keeps contractors.plan in sync with the subscription.
// Deploy with JWT verification OFF — Stripe can't send a Supabase token.
// Authenticity comes from the Stripe-Signature header instead.
import Stripe from "npm:stripe@17.7.0";
import { admin, stripe } from "../_shared/stripe.ts";

const PRO_STATUSES = new Set(["active", "trialing", "past_due"]);
const cryptoProvider = Stripe.createSubtleCryptoProvider();

async function syncSubscription(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  const { data: billing } = await admin
    .from("contractor_billing")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  const userId = billing?.user_id ?? sub.metadata?.user_id;
  if (!userId) {
    console.warn("No WeeSubby user for Stripe customer", customerId);
    return;
  }

  const isPro = PRO_STATUSES.has(sub.status);

  await admin.from("contractor_billing").upsert({
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    subscription_status: sub.status,
    updated_at: new Date().toISOString(),
  });

  const { data: contractor } = await admin
    .from("contractors")
    .select("plan")
    .eq("user_id", userId)
    .maybeSingle();
  if (!contractor) return;

  const update: Record<string, unknown> = { plan: isPro ? "pro" : "free" };
  if (isPro && contractor.plan !== "pro") update.plan_started_at = new Date().toISOString();
  if (!isPro) update.plan_started_at = null;

  const { error } = await admin.from("contractors").update(update).eq("user_id", userId);
  if (error) throw error;
}

Deno.serve(async (req) => {
  const signature = req.headers.get("Stripe-Signature");
  const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!signature || !secret) return new Response("Missing signature", { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, secret, undefined, cryptoProvider);
  } catch (err) {
    console.error("Bad webhook signature:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const subId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
          await syncSubscription(await stripe.subscriptions.retrieve(subId));
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
    }
  } catch (err) {
    // Non-2xx makes Stripe retry later.
    console.error(`Handling ${event.type} failed:`, err);
    return new Response("Handler error", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
