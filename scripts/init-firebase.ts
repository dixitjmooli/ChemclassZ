/**
 * Firebase Initialization Script
 * Run this script to set up your Firebase database with initial data
 * 
 * Usage:
 * bun run scripts/init-firebase.ts
 */

import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs,
  query,
  where 
} from 'firebase/firestore';

// Firebase Configuration - UPDATE THESE WITH YOUR FIREBASE CREDENTIALS
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "YOUR_APP_ID"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// Sample data
const adminUser = {
  id: 'admin-001',
  username: 'admin',
  password: 'admin123', // Change this in production!
  name: 'Admin User',
  role: 'admin',
  createdAt: new Date()
};

const sampleStudents = [
  {
    id: 'student-001',
    username: 'rahul',
    password: 'rahul123',
    name: 'Rahul Sharma',
    school: 'Delhi Public School',
    role: 'student',
    createdAt: new Date()
  },
  {
    id: 'student-002',
    username: 'priya',
    password: 'priya123',
    name: 'Priya Singh',
    school: 'Kendriya Vidyalaya',
    role: 'student',
    createdAt: new Date()
  },
  {
    id: 'student-003',
    username: 'amit',
    password: 'amit123',
    name: 'Amit Kumar',
    school: 'Modern School',
    role: 'student',
    createdAt: new Date()
  }
];

async function initializeFirebase() {
  console.log('🔥 Initializing Firebase Database...\n');

  try {
    // Check if admin exists
    const adminRef = doc(db, 'users', adminUser.id);
    const adminDoc = await getDoc(adminRef);
    
    if (adminDoc.exists()) {
      console.log('✅ Admin user already exists');
    } else {
      await setDoc(adminRef, adminUser);
      console.log('✅ Admin user created:');
      console.log('   Username:', adminUser.username);
      console.log('   Password:', adminUser.password);
      console.log('   ⚠️  Please change the password after first login!\n');
    }

    // Add sample students
    console.log('📚 Adding sample students...\n');
    for (const student of sampleStudents) {
      const studentRef = doc(db, 'users', student.id);
      const studentDoc = await getDoc(studentRef);
      
      if (studentDoc.exists()) {
        console.log(`✅ Student "${student.name}" already exists`);
      } else {
        await setDoc(studentRef, student);
        console.log(`✅ Student "${student.name}" created`);
        console.log(`   Username: ${student.username}`);
        console.log(`   Password: ${student.password}\n`);
      }
    }

    console.log('\n🎉 Firebase initialization complete!');
    console.log('\n📝 Login Credentials:');
    console.log('═════════════════════════════════════════');
    console.log('\n👨‍💼 Admin:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('\n👨‍🎓 Sample Students:');
    sampleStudents.forEach(student => {
      console.log(`   ${student.name}:`);
      console.log(`   Username: ${student.username}`);
      console.log(`   Password: ${student.password}`);
    });
    console.log('\n═════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Error initializing Firebase:', error);
    process.exit(1);
  }
}

// Run initialization
initializeFirebase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
