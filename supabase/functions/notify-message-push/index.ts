// Supabase Edge Function: notify-message-push
//
// Called by the app right after someone sends a message. Confirms the caller
// sent that message, then sends a web push notification to every device the
// recipient turned notifications on for. A user's reply to the team goes to
// every admin. Devices that have turned notifications off are removed.
// Secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY (and APP_URL for the contact).
//
// Also sends to the iPhone app through Apple Push Notification service when
// these secrets are set (iPhones are skipped until then):
//   APNS_KEY_ID, APNS_TEAM_ID, APNS_PRIVATE_KEY (contents of the .p8 file),
//   APNS_BUNDLE_ID (optional, default com.weesubby.app).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader) return json({ error: "missing auth" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey     = Deno.env.get("SUPABASE_ANON_KEY")!;
    const vapidPublic  = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY");
    if (!vapidPublic || !vapidPrivate) return json({ error: "push keys not configured" }, 500);
    // APP_URL may be set without a scheme ("weesubby.com"); the VAPID
    // contact must be a full https URL.
    const rawUrl = (Deno.env.get("APP_URL") || "weesubby.com").trim().replace(/\/+$/, "");
    const appUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    webpush.setVapidDetails(appUrl, vapidPublic, vapidPrivate);

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return json({ error: "unauthorized" }, 401);

    const { messageId } = await req.json().catch(() => ({}));
    if (!messageId) return json({ error: "missing messageId" }, 400);

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: msg } = await admin
      .from("messages")
      .select("id, contractor_id, sender_id, recipient_id, from_admin, text")
      .eq("id", messageId)
      .maybeSingle();
    if (!msg || msg.sender_id !== user.id) return json({ error: "not your message" }, 403);

    // Who to notify: a user's reply to the team reaches every admin.
    let recipients: string[];
    if (msg.contractor_id == null && !msg.from_admin) {
      const { data: admins } = await admin.from("admins").select("user_id");
      recipients = (admins || []).map((a: any) => a.user_id);
    } else {
      recipients = [msg.recipient_id];
    }
    recipients = recipients.filter((id) => id && id !== user.id);
    if (!recipients.length) return json({ sent: 0 }, 200);

    // Sender name as the recipient should see it.
    let title = "New message";
    if (msg.from_admin) {
      title = "WeeSubby Team";
    } else if (msg.contractor_id != null) {
      const { data: c } = await admin.from("contractors").select("name, user_id").eq("id", msg.contractor_id).maybeSingle();
      if (c && c.user_id === msg.sender_id) title = c.name;
      else title = (await customerName(admin, msg.sender_id)) || "A customer";
    } else {
      title = (await customerName(admin, msg.sender_id)) || "A user";
    }
    const body = String(msg.text || "").slice(0, 140);
    const payload = JSON.stringify({
      title,
      body,
      url: "/messages",
      // One notification per conversation; a new message replaces the last.
      tag: payloadTag(msg),
    });

    // iPhone app (APNs) runs alongside web push.
    const nativeResult = sendApns(admin, recipients, { title, body, tag: payloadTag(msg) });

    const { data: subs } = await admin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .in("user_id", recipients);

    let sent = 0;
    const gone: number[] = [];
    await Promise.all((subs || []).map(async (s: any) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 86400 });
        sent++;
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) gone.push(s.id);
        else console.error("push failed:", err?.statusCode, err?.body || String(err));
      }
    }));
    if (gone.length) await admin.from("push_subscriptions").delete().in("id", gone);

    const native = await nativeResult;
    return json({ sent, removed: gone.length, ios_sent: native.sent, ios_removed: native.removed }, 200);
  } catch (err) {
    console.error("notify-message-push error:", err);
    return json({ error: String(err) }, 500);
  }
});

// One notification per conversation; a new message replaces the last.
function payloadTag(msg: any) {
  return `msg-${msg.contractor_id ?? "team"}-${msg.from_admin ? msg.recipient_id : msg.sender_id}`;
}

// ---------- Apple Push Notification service (iPhone app) ----------

let apnsJwt: { token: string; at: number } | null = null;

function b64url(bytes: Uint8Array | string) {
  const bin = typeof bytes === "string" ? bytes : String.fromCharCode(...bytes);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Provider token signed with the .p8 key (ES256). Apple accepts one for up to an hour.
async function apnsToken(keyId: string, teamId: string, p8: string) {
  const now = Math.floor(Date.now() / 1000);
  if (apnsJwt && now - apnsJwt.at < 50 * 60) return apnsJwt.token;
  const pem = p8.replace(/\\n/g, "\n").replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const head = b64url(JSON.stringify({ alg: "ES256", kid: keyId }));
  const claims = b64url(JSON.stringify({ iss: teamId, iat: now }));
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(`${head}.${claims}`)));
  apnsJwt = { token: `${head}.${claims}.${b64url(sig)}`, at: now };
  return apnsJwt.token;
}

async function sendApns(admin: any, recipients: string[], n: { title: string; body: string; tag: string }) {
  const keyId = Deno.env.get("APNS_KEY_ID");
  const teamId = Deno.env.get("APNS_TEAM_ID");
  const p8 = Deno.env.get("APNS_PRIVATE_KEY");
  const topic = Deno.env.get("APNS_BUNDLE_ID") || "com.weesubby.app";
  if (!keyId || !teamId || !p8) return { sent: 0, removed: 0 };
  try {
    const { data: devices } = await admin.from("native_push_tokens").select("id, token").in("user_id", recipients);
    if (!devices?.length) return { sent: 0, removed: 0 };
    const jwt = await apnsToken(keyId, teamId, p8);
    const body = JSON.stringify({
      aps: { alert: { title: n.title, body: n.body }, sound: "default", "thread-id": n.tag },
      tab: "messages",
    });
    const post = (host: string, token: string) => fetch(`https://${host}/3/device/${token}`, {
      method: "POST",
      headers: {
        authorization: `bearer ${jwt}`,
        "apns-topic": topic,
        "apns-push-type": "alert",
        "apns-priority": "10",
        "apns-expiration": String(Math.floor(Date.now() / 1000) + 86400),
        "apns-collapse-id": n.tag.slice(0, 64),
      },
      body,
    });
    let sent = 0;
    const gone: number[] = [];
    await Promise.all(devices.map(async (d: any) => {
      // App Store / TestFlight builds use production; builds run from Xcode use the sandbox.
      let res = await post("api.push.apple.com", d.token);
      let reason = res.ok ? "" : (await res.json().catch(() => ({})))?.reason;
      if (reason === "BadDeviceToken") {
        res = await post("api.sandbox.push.apple.com", d.token);
        reason = res.ok ? "" : (await res.json().catch(() => ({})))?.reason;
      }
      if (res.ok) sent++;
      else if (res.status === 410 || reason === "BadDeviceToken" || reason === "Unregistered") gone.push(d.id);
      else console.error("apns failed:", res.status, reason);
    }));
    if (gone.length) await admin.from("native_push_tokens").delete().in("id", gone);
    return { sent, removed: gone.length };
  } catch (err) {
    console.error("apns error:", err);
    return { sent: 0, removed: 0 };
  }
}

async function customerName(admin: ReturnType<typeof createClient>, userId: string) {
  const { data } = await admin.auth.admin.getUserById(userId);
  const name = data?.user?.user_metadata?.homeowner_name;
  return typeof name === "string" && name.trim() ? name.trim() : null;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...CORS_HEADERS },
  });
}
