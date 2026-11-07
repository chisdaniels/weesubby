// Permanently deletes the signed-in user's own WeeSubby account.
// Called from "Delete my account" in the account menu (required by Apple for the iPhone app).
//
// Removes: the login, their contractor profile (and its reviews, documents, badges),
// uploaded license/insurance files, messages, notifications, support tickets,
// and the contact details on jobs they posted. Their open jobs come off the board.
// Reviews they wrote stay on the contractor's profile under "Former WeeSubby user".
// A live Pro subscription is cancelled in Stripe first.
import { admin, corsHeaders, getUser, json, stripe, stripeConfigured } from "../_shared/stripe.ts";

const LIVE_STATUSES = new Set(["active", "trialing", "past_due", "unpaid", "incomplete"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const user = await getUser(req);
    if (!user) return json({ error: "Please sign in first." }, 401);
    const uid = user.id;

    // Keep the admin team from being locked out by accident.
    const { data: adminRow } = await admin.from("admins").select("user_id").eq("user_id", uid).maybeSingle();
    if (adminRow) {
      return json({ error: "Admins can't delete their account here. Ask another admin to remove you from the Admin Team first." }, 409);
    }

    // 1. Stop billing.
    const { data: billing } = await admin
      .from("contractor_billing")
      .select("stripe_subscription_id, subscription_status")
      .eq("user_id", uid)
      .maybeSingle();
    if (billing?.stripe_subscription_id && LIVE_STATUSES.has(billing.subscription_status ?? "")) {
      if (!stripeConfigured) {
        return json({ error: "We couldn't cancel your Pro subscription right now, so your account wasn't deleted. Please contact support." }, 503);
      }
      await stripe.subscriptions.cancel(billing.stripe_subscription_id);
    }

    // 2. Contractor profile (cascades to its reviews, credentials, badges, denials).
    const { error: proError } = await admin.from("contractors").delete().eq("user_id", uid);
    if (proError) throw proError;

    // 3. Uploaded license/insurance files live under "<user id>/".
    const { data: files } = await admin.storage.from("credentials").list(uid, { limit: 1000 });
    if (files?.length) {
      const { error: fileError } = await admin.storage.from("credentials").remove(files.map(f => `${uid}/${f.name}`));
      if (fileError) throw fileError;
    }

    // 4. Jobs they posted: remove their contact details; take open ones off the board.
    const { data: jobs, error: jobsError } = await admin.from("jobs").select("id").eq("posted_by", uid);
    if (jobsError) throw jobsError;
    const jobIds = (jobs ?? []).map(j => j.id);
    if (jobIds.length) {
      const { error: contactError } = await admin.from("job_contacts").delete().in("job_id", jobIds);
      if (contactError) throw contactError;
      const { error: offError } = await admin.from("jobs")
        .update({ deleted_at: new Date().toISOString() })
        .eq("posted_by", uid).is("accepted_by", null).is("deleted_at", null);
      if (offError) throw offError;
    }

    // 5. Reviews they wrote stay, without their name.
    const { error: reviewError } = await admin.from("reviews").update({ author: "Former WeeSubby user" }).eq("user_id", uid);
    if (reviewError) throw reviewError;

    // 6. Support tickets carry their email.
    const { error: ticketError } = await admin.from("support_tickets").delete().eq("user_id", uid);
    if (ticketError) throw ticketError;

    // 7. The login itself (cascades to messages, push subscriptions, billing record).
    const { error: authError } = await admin.auth.admin.deleteUser(uid);
    if (authError) throw authError;

    return json({ deleted: true });
  } catch (err) {
    console.error("delete-account failed:", err);
    return json({ error: "Couldn't delete your account. Please try again or contact support." }, 500);
  }
});
