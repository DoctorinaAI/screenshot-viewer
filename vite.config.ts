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
        globPatterns: ["**/*.{js,css,html,svg,ico,woff,woff2}"],
        cleanupOutdatedCaches: true,
        navigateFallback: "/index.html",
        // Don't intercept Firebase Auth handler URLs.
        navigateFallbackDenylist: [/^\/__\/auth\//],
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
