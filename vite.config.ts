// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: null, // we register from our guarded wrapper
        devOptions: { enabled: false },
        filename: "sw.js",
        manifest: false, // we ship our own manifest.webmanifest
        workbox: {
          navigateFallback: "/",
          navigateFallbackDenylist: [/^\/~oauth/, /^\/api\//],
          runtimeCaching: [
            {
              urlPattern: ({ url }) =>
                url.pathname.startsWith("/~oauth") ||
                url.hostname.includes("supabase.co") ||
                url.hostname.includes("lovable.app"),
              handler: "NetworkOnly",
            },
            {
              urlPattern: ({ request }) => request.destination === "document",
              handler: "NetworkFirst",
              options: { cacheName: "html-cache" },
            },
          ],
        },
      }),
    ],
  },
});
