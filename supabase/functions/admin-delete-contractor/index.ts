// Deletes a contractor profile. Admins only.
// Called by the app's Admin page with the admin's session token and { contractorId }.
// If the contractor has a live Pro subscription, it is cancelled first so
// Stripe stops charging for a profile that no longer exists.
import { admin, corsHeaders, getUser, json, stripe, stripeConfigured } from "../_shared/stripe.ts";

const LIVE_STATUSES = new Set(["active", "trialing", "past_due", "unpaid", "incomplete"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const user = await getUser(req);
    if (!user) return json({ error: "Please sign in first." }, 401);
    const { data: adminRow } = await admin.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
    if (!adminRow) return json({ error: "Admins only." }, 403);

    const { contractorId } = await req.json().catch(() => ({}));
    if (!Number.isInteger(contractorId)) return json({ error: "Missing contractorId." }, 400);

    const { data: contractor, error: findError } = await admin
      .from("contractors")
      .select("*")
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
        // Don't delete a paying pro if we can't stop their billing.
        if (!stripeConfigured) {
          return json({ error: "This pro has an active Pro subscription and Stripe isn't configured, so it can't be cancelled. Cancel it in Stripe first." }, 409);
        }
        await stripe.subscriptions.cancel(billing.stripe_subscription_id);
      }
    }

    const { error: deleteError } = await admin.from("contractors").delete().eq("id", contractorId);
    if (deleteError) throw deleteError;

    const { error: auditError } = await admin.from("admin_audit_log").insert({
      actor: user.id,
      table_name: "contractors",
      action: "delete",
      row_key: String(contractorId),
      old_data: contractor,
    });
    if (auditError) console.error("audit log insert failed:", auditError);

    return json({ deleted: contractorId });
  } catch (err) {
    console.error("admin-delete-contractor failed:", err);
    return json({ error: "Couldn't delete the contractor. Please try again." }, 500);
  }
});
