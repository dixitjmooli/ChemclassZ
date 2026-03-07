import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  Timestamp 
} from 'firebase/firestore';

// Firebase config - you'll need to add your config here
const firebaseConfig = {
  // Add your Firebase config here
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Simple password hashing
const hashPassword = (password: string): string => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
};

async function seedSuperAdmin() {
  try {
    // Check if superadmin exists
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'superadmin'));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      console.log('SuperAdmin already exists');
      return;
    }
    
    // Create superadmin
    const superAdminRef = doc(collection(db, 'users'));
    await setDoc(superAdminRef, {
      name: 'DIXIT JAIN',
      username: 'dixitj786',
      passwordHash: hashPassword('dikshit123'),
      role: 'superadmin',
      school: 'App Manager',
      createdAt: Timestamp.now()
    });
    
    console.log('SuperAdmin created successfully!');
    console.log('Username: dixitj786');
    console.log('Password: dikshit123');
  } catch (error) {
    console.error('Error creating superadmin:', error);
  }
}

seedSuperAdmin();
