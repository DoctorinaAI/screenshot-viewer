/// <reference types="vite/client" />

interface ImportMetaEnv {
  // "firebase" (default) wires the real Firebase SDK; "fake" wires an
  // offline backend with synthetic runs + canvas-rendered images so the
  // SPA boots without network or credentials. Toggle via `vite --mode fake`.
  readonly VITE_BACKEND?: "firebase" | "fake";

  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
