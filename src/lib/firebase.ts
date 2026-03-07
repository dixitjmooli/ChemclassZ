import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD5OezmO6lgh8Glp7x2q-9_0UlDl1rdtgQ",
  authDomain: "chem-class-z.firebaseapp.com",
  projectId: "chem-class-z",
  storageBucket: "chem-class-z.firebasestorage.app",
  messagingSenderId: "739620636050",
  appId: "1:739620636050:web:d83df6da9fdb075845ed4b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore only (no Auth needed)
export const db = getFirestore(app);

export default app;
