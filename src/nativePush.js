// Push notifications inside the iPhone app (Apple Push Notification service).
// Only used when isNativeApp is true. The plugin is loaded on demand so the
// website bundle doesn't include it.
import { supabase } from "./lib/supabase";

let currentToken = null;

async function plugin() {
  if (!window.Capacitor?.isPluginAvailable?.("PushNotifications")) {
    throw new Error("Push notifications aren't available in this build of the app.");
  }
  return (await import("@capacitor/push-notifications")).PushNotifications;
}

// "granted" | "denied" | "prompt"
export async function nativePushPermission() {
  const { receive } = await (await plugin()).checkPermissions();
  return receive.startsWith("prompt") ? "prompt" : receive;
}

// Asks for permission if needed, registers with Apple, and saves this
// iPhone's token for the signed-in user. Returns the final permission.
export async function enableNativePush() {
  const P = await plugin();
  let { receive } = await P.checkPermissions();
  if (receive.startsWith("prompt")) ({ receive } = await P.requestPermissions());
  if (receive !== "granted") return receive.startsWith("prompt") ? "prompt" : receive;

  const token = await registerWithApple(P);
  const { error } = await supabase.rpc("save_native_push_token", { p_token: token });
  if (error) throw error;
  currentToken = token.toLowerCase();
  return "granted";
}

// Asks Apple for this iPhone's push token. Fails with a readable message instead of
// waiting forever if Apple never answers (e.g. no push capability in this build).
async function registerWithApple(P) {
  const handles = [];
  let timer;
  try {
    return await new Promise((resolve, reject) => {
      timer = setTimeout(() => reject(new Error("Apple didn't respond. Check your internet connection and try again.")), 20000);
      Promise.all([
        P.addListener("registration", t => resolve(t.value)),
        P.addListener("registrationError", e => reject(new Error(e?.error || "Apple refused to register this iPhone for notifications."))),
      ])
        .then(hs => { handles.push(...hs); return P.register(); })
        .catch(reject);
    });
  } finally {
    clearTimeout(timer);
    handles.forEach(h => h.remove());
  }
}

// Called on sign-out so this iPhone stops getting the old account's alerts.
export async function removeNativePushToken() {
  if (!currentToken) return;
  await supabase.from("native_push_tokens").delete().eq("token", currentToken);
  currentToken = null;
}

// Runs `onTap(data)` when someone taps a WeeSubby notification. Returns an unsubscribe function.
export function onNativePushTap(onTap) {
  let handle;
  plugin()
    .then(P => P.addListener("pushNotificationActionPerformed", a => onTap(a.notification?.data || {})))
    .then(h => { handle = h; })
    .catch(err => console.error("push tap listener failed:", err));
  return () => handle?.remove();
}
