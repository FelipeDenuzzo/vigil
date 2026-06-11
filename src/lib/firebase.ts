import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);

// experimentalForceLongPolling: evita ERR_BLOCKED_BY_CLIENT causado por
// extensões de navegador (uBlock, AdBlock, Brave) que bloqueiam o streaming
// gRPC-Web do Firestore (Listen/channel e Write/channel).
// experimentalAutoDetectLongPolling: false impede que o SDK retorne para
// gRPC-Web automaticamente em qualquer situação.
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  experimentalAutoDetectLongPolling: false,
  cacheSizeBytes: CACHE_SIZE_UNLIMITED,
});

export default db;
