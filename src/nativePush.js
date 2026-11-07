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

  const token = await new Promise(async (resolve, reject) => {
    const handles = [];
    const done = () => handles.forEach(h => h.remove());
    handles.push(await P.addListener("registration", t => { done(); resolve(t.value); }));
    handles.push(await P.addListener("registrationError", e => { done(); reject(new Error(e.error || "Registration failed")); }));
    await P.register();
  });
  const { error } = await supabase.rpc("save_native_push_token", { p_token: token });
  if (error) throw error;
  currentToken = token.toLowerCase();
  return "granted";
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
