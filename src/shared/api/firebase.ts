// Firebase initialization. Web SDK config comes from build-time Vite env;
// these values are public identifiers (security lives in firestore.rules and
// storage.rules), so it's fine for them to land in the JS bundle.
//
// Firestore uses an explicit memory-only cache. IndexedDB persistence is a
// foot-gun for a PWA: stale docs would survive sign-out and bleed across
// users on a shared machine, and the IDB layer occasionally holds a write
// lock that keeps a freshly-deployed shell stuck reading old data after
// the service worker has already updated. Memory cache is rebuilt on every
// page load — predictable, ACL-safe, and small enough for our workload.

import { type FirebaseApp, initializeApp } from "firebase/app";
import { type Auth, getAuth } from "firebase/auth";
import { type Firestore, initializeFirestore, memoryLocalCache } from "firebase/firestore";
import { type FirebaseStorage, getStorage } from "firebase/storage";

function readConfig() {
  const env = import.meta.env;
  const config = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  };
  const missing = Object.entries(config)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length > 0) {
    throw new Error(
      `Firebase config missing: ${missing.join(", ")}. Copy .env.example to .env.local and fill in the values from "firebase apps:sdkconfig WEB ... --project doctorina-test".`,
    );
  }
  return config;
}

let _app: FirebaseApp | undefined;
let _auth: Auth | undefined;
let _firestore: Firestore | undefined;
let _storage: FirebaseStorage | undefined;

export function firebaseApp(): FirebaseApp {
  if (!_app) _app = initializeApp(readConfig());
  return _app;
}

export function firebaseAuth(): Auth {
  if (!_auth) _auth = getAuth(firebaseApp());
  return _auth;
}

export function firestore(): Firestore {
  if (!_firestore) {
    _firestore = initializeFirestore(firebaseApp(), {
      localCache: memoryLocalCache(),
    });
  }
  return _firestore;
}

export function firebaseStorage(): FirebaseStorage {
  if (!_storage) _storage = getStorage(firebaseApp());
  return _storage;
}
