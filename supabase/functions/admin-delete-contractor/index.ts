// Deletes a contractor profile. Admins only.
// Called by the app's Admin tab with the admin's session token and { contractorId }.
// If the contractor has a live Pro subscription, it is cancelled first so
// Stripe stops charging for a profile that no longer exists.
import { admin, corsHeaders, getUser, json, stripe } from "../_shared/stripe.ts";

const LIVE_STATUSES = new Set(["active", "trialing", "past_due", "unpaid", "incomplete"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const user = await getUser(req);
    if (!user) return json({ error: "Please sign in first." }, 401);
    if (user.app_metadata?.role !== "admin") return json({ error: "Admins only." }, 403);

    const { contractorId } = await req.json().catch(() => ({}));
    if (!Number.isInteger(contractorId)) return json({ error: "Missing contractorId." }, 400);

    const { data: contractor, error: findError } = await admin
      .from("contractors")
      .select("id, user_id")
      .eq("id", contractorId)
      .maybeSingle();
    if (findError) throw findError;
    if (!contractor) return json({ error: "Contractor not found." }, 404);

    if (contractor.user_id) {
      const { data: billing } = await admin
        .from("contractor_billing")
        .select("stripe_subscription_id, subscription_status")
        .eq("user_id", contractor.user_id)
        .maybeSingle();
      if (billing?.stripe_subscription_id && LIVE_STATUSES.has(billing.subscription_status ?? "")) {
        await stripe.subscriptions.cancel(billing.stripe_subscription_id);
      }
    }

    const { error: deleteError } = await admin.from("contractors").delete().eq("id", contractorId);
    if (deleteError) throw deleteError;

    return json({ deleted: contractorId });
  } catch (err) {
    console.error("admin-delete-contractor failed:", err);
    return json({ error: "Couldn't delete the contractor. Please try again." }, 500);
  }
});
