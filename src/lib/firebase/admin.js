import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const apps = getApps();
let isInitialized = apps.length > 0;

if (!isInitialized) {
  try {
    if (process.env.FIREBASE_PRIVATE_KEY) {
      initializeApp({
        credential: cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Handle newline characters in the private key from environment variables
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
      isInitialized = true;
    }
  } catch (error) {
    console.error('Firebase admin initialization error', error.stack);
  }
}

export const adminDb = isInitialized ? getFirestore() : null;
export const adminAuth = isInitialized ? getAuth() : null;
