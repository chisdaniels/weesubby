// True when running inside the WeeSubby iPhone app (Capacitor), false on the website.
// Capacitor injects window.Capacitor into its web view, so the website bundle
// doesn't need to load any Capacitor code to tell the difference.
export const isNativeApp =
  typeof window !== "undefined" && window.Capacitor?.isNativePlatform?.() === true;
