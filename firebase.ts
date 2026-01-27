
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configurazione Firebase modular SDK (v9+)
const firebaseConfig = {
  apiKey: "AIzaSyDrVX3nI6SSp_rgVipWLZFumGt_bzQVUSA",
  authDomain: "unilife-c6c28.firebaseapp.com",
  projectId: "unilife-c6c28",
  storageBucket: "unilife-c6c28.firebasestorage.app",
  messagingSenderId: "1092900695218",
  appId: "1:1092900695218:web:62781733d83a1c2f1f2dab",
  measurementId: "G-3X4R4QJ32R"
};

// Inizializzazione Firebase instance e servizi
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
