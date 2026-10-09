import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Must pass firebaseConfig.firestoreDatabaseId to getFirestore
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();

// Connection testing probe
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('MART Health: Successfully verified connection to Cloud Firestore.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('MART Health: Cloud Firestore client is offline. Please check your network and Firebase configuration.');
      return false;
    }
    // Document not found is fine, connection succeeded
    return true;
  }
}

// Initial boot probe
testFirestoreConnection().catch((err) => {
  console.warn('Initial Firestore connection check notice:', err);
});
