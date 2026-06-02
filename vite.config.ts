import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import solid from "vite-plugin-solid";

export default defineConfig({
  plugins: [
    tailwindcss(),
    solid(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      manifest: {
        name: "Doctorina · Screenshots",
        short_name: "Doctorina",
        description: "Internal viewer for Flutter integration-test screenshots.",
        theme_color: "#0a0a0a",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
        ],
      },
      workbox: {
        // Pre-cache the app shell only. Run artifacts (manifest.json +
        // images.zip on Cloud Storage) are intentionally NOT runtime-cached:
        // CacheFirst would serve them to a different signed-in user on a
        // shared machine after sign-out, defeating the @doctorina.com ACL.
        // The browser's HTTP cache (Cloud Storage already sets immutable
        // Cache-Control on these objects) gives us fast repeat reads inside
        // a session without persisting auth-restricted content past it.
        //
        // *.html is deliberately NOT precached: index.html is the entry
        // every navigation hits, and precaching it would serve a stale
        // shell after a deploy until the next SW activation completes.
        // The NetworkFirst handler below always tries the network for HTML
        // so a fresh deploy lands on the very next navigation, and falls
        // back to its own runtime cache when offline.
        globPatterns: ["**/*.{js,css,svg,ico,woff,woff2}"],
        cleanupOutdatedCaches: true,
        // Take over open tabs immediately on activation. Combined with the
        // NetworkFirst HTML handler this means a deploy lands on the next
        // navigation without an explicit "update available" prompt.
        skipWaiting: true,
        clientsClaim: true,
        // Explicitly disable workbox's auto-injected NavigationRoute.
        // vite-plugin-pwa defaults `navigateFallback` to "index.html",
        // which makes workbox-build emit
        //   registerRoute(new NavigationRoute(createHandlerBoundToURL("index.html")))
        // BEFORE our runtime handler. That route would (a) throw at install
        // time because we no longer precache *.html, and (b) match every
        // navigation first, preventing the NetworkFirst handler below from
        // ever firing. Setting to `undefined` overrides the plugin default.
        navigateFallback: undefined,
        runtimeCaching: [
          {
            // Firebase Auth's signInWithRedirect lands on /__/auth/...
            // The SW must not intercept that — the redirect handler
            // expects to hit the network. Anything else that navigates
            // (a.k.a. clicks a link / types a URL) gets NetworkFirst.
            urlPattern: ({ request, url }) =>
              request.mode === "navigate" && !url.pathname.startsWith("/__/auth/"),
            handler: "NetworkFirst",
            options: {
              cacheName: "app-shell",
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 4, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    target: "esnext",
    sourcemap: false,
    // Build into firebase/dist so the hosting deploy can find it without
    // escaping the project directory. Modern firebase-tools rejects a
    // `public` path that resolves outside of where firebase.json lives.
    outDir: "firebase/dist",
    emptyOutDir: true,
    // Firebase JS SDK alone is ~360 kB raw / ~110 kB gzipped, and that's
    // already minimal for the modules we use (app + auth + firestore +
    // storage). Bumping the warning so it stays useful for real surprises.
    chunkSizeWarningLimit: 400,
    rollupOptions: {
      output: {
        // Split Firebase JS SDK + UI primitives off the entry so they can be
        // cached independently of app updates (Firebase + Kobalte change
        // infrequently; app code changes every PR).
        manualChunks(id) {
          if (id.includes("/node_modules/")) {
            if (id.includes("/firebase/")) return "firebase";
            if (id.includes("/@kobalte/") || id.includes("/@solidjs/router")) return "ui";
          }
          return undefined;
        },
      },
    },
  },
});
