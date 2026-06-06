import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCyyIXR6VNwChgZxl7B1bLLLuu4LOAkwTE",
  authDomain: "vigil-felipe-prod-498620.firebaseapp.com",
  projectId: "vigil-felipe-prod-498620",
  storageBucket: "vigil-felipe-prod-498620.firebasestorage.app",
  messagingSenderId: "340788189794",
  appId: "1:340788189794:web:a04fb4c8d462dcfba90f3b"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
