import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // .trim() on every value — Vercel env vars can silently include a trailing
  // newline if copy-pasted, which causes Firebase to build URLs with %0A in
  // them (e.g. "Illegal url for new iframe" on the auth domain).
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim(),
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim(),
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim(),
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim(),
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim(),
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim(),
};

// Only initialize Firebase if the API key is present.
// During Next.js build-time SSR page collection, NEXT_PUBLIC_* env vars may
// not be available unless they are explicitly set in the Vercel project settings.
// Guard here so SSR imports don't throw auth/invalid-api-key at build time.
let app = null;
let auth = null;
let db = null;
let googleProvider = null;

if (firebaseConfig.apiKey) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
}

export { auth, db, googleProvider };
