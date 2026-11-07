import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { isNativeApp } from './platform.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register the minimal service worker so Chrome/Edge/Android surface the
// install prompt. It doesn't cache anything — deploys still land instantly.
// Not needed inside the iPhone app, which is already installed.
if ("serviceWorker" in navigator && !isNativeApp) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(err => {
      console.warn("SW registration failed:", err);
    });
  });
}
