import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  Firestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot,
  collection, 
  getDocs,
  query, 
  where,
  orderBy,
  Query,
  addDoc,
  deleteDoc
} from 'firebase/firestore';
import {
  getAuth,
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';

// Firebase Configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ""
};

// Initialize Firebase
let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (!app && !getApps().length) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  } else if (!app && getApps().length > 0) {
    app = getApps()[0]!;
    db = getFirestore(app);
    auth = getAuth(app);
  }
  
  return app;
}

export function getDb(): Firestore | null {
  getFirebaseApp();
  return db;
}

export function getAuthInstance(): Auth | null {
  getFirebaseApp();
  return auth;
}

// Check if Firebase is configured
export function isFirebaseConfigured(): boolean {
  return firebaseConfig.apiKey !== "" && 
         firebaseConfig.projectId !== "" &&
         firebaseConfig.appId !== "";
}

// Export all Firestore functions
export { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy,
  addDoc,
  deleteDoc
};

// Export Auth functions
export { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
};

export type { User };
