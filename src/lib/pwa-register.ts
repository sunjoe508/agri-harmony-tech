// Guarded PWA service-worker registration.
// Refuses to register in dev, Lovable preview iframes, or kill-switch contexts.
import { registerSW } from "virtual:pwa-register";

const isPreviewHost = (host: string) =>
  host.startsWith("id-preview--") ||
  host.startsWith("preview--") ||
  host === "lovableproject.com" ||
  host.endsWith(".lovableproject.com") ||
  host === "lovableproject-dev.com" ||
  host.endsWith(".lovableproject-dev.com") ||
  host === "beta.lovable.dev" ||
  host.endsWith(".beta.lovable.dev");

export function maybeRegisterSW() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (!import.meta.env.PROD) return;
  if (window.self !== window.top) return; // iframe
  if (isPreviewHost(window.location.hostname)) return;
  if (new URLSearchParams(window.location.search).has("sw") &&
      new URLSearchParams(window.location.search).get("sw") === "off") {
    void navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => {
        if (r.active?.scriptURL.endsWith("/sw.js")) void r.unregister();
      });
    });
    return;
  }
  registerSW({ immediate: true });
}
