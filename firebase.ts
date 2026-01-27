
import * as firebaseApp from "firebase/app";
import * as firebaseAuth from "firebase/auth";
import * as firebaseFirestore from "firebase/firestore";

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

// Accessing modular functions through namespaced imports to resolve "no exported member" errors
const initializeApp = (firebaseApp as any).initializeApp;
const getAuth = (firebaseAuth as any).getAuth;
const getFirestore = (firebaseFirestore as any).getFirestore;
const GoogleAuthProvider = (firebaseAuth as any).GoogleAuthProvider;
const onAuthStateChanged = (firebaseAuth as any).onAuthStateChanged;
const signOut = (firebaseAuth as any).signOut;
const signInWithPopup = (firebaseAuth as any).signInWithPopup;

// Inizializzazione Firebase instance e servizi
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Centralized export of auth functions for application use
export { onAuthStateChanged, signOut, signInWithPopup };
