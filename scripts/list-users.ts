import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD5OezmO6lgh8Glp7x2q-9_0UlDl1rdtgQ",
  authDomain: "chem-class-z.firebaseapp.com",
  projectId: "chem-class-z",
  storageBucket: "chem-class-z.firebasestorage.app",
  messagingSenderId: "739620636050",
  appId: "1:739620636050:web:d83df6da9fdb075845ed4b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function listUsers() {
  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(usersRef);
  
  console.log('\n============================================');
  console.log('ALL REGISTERED USERS - LOGIN CREDENTIALS');
  console.log('============================================\n');
  
  const users: any[] = [];
  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    users.push({
      id: doc.id,
      name: data.name,
      email: data.email || 'N/A',
      username: data.username || 'N/A',
      role: data.role,
      instituteId: data.instituteId || 'N/A',
      independentTeacherId: data.independentTeacherId || 'N/A',
      referralCode: data.referralCode || 'N/A',
    });
  });
  
  // Group by role
  const superadmins = users.filter(u => u.role === 'superadmin');
  const admins = users.filter(u => u.role === 'admin');
  const instituteOwners = users.filter(u => u.role === 'institute_owner');
  const teachers = users.filter(u => u.role === 'teacher');
  const independentTeachers = users.filter(u => u.role === 'independent_teacher');
  const students = users.filter(u => u.role === 'student');
  
  console.log(`TOTAL USERS: ${users.length}\n`);
  
  if (superadmins.length > 0) {
    console.log('--- SUPER ADMINS ---');
    superadmins.forEach(u => {
      console.log(`Name: ${u.name}`);
      console.log(`Username: ${u.username}`);
      console.log(`Email: ${u.email}`);
      console.log(`Role: ${u.role}`);
      console.log('');
    });
  }
  
  if (admins.length > 0) {
    console.log('--- ADMINS ---');
    admins.forEach(u => {
      console.log(`Name: ${u.name}`);
      console.log(`Username: ${u.username}`);
      console.log(`Email: ${u.email}`);
      console.log('');
    });
  }
  
  if (instituteOwners.length > 0) {
    console.log('--- INSTITUTE OWNERS ---');
    instituteOwners.forEach(u => {
      console.log(`Name: ${u.name}`);
      console.log(`Username: ${u.username}`);
      console.log(`Email: ${u.email}`);
      console.log(`Referral Code: ${u.referralCode}`);
      console.log('');
    });
  }
  
  if (teachers.length > 0) {
    console.log('--- INSTITUTE TEACHERS ---');
    teachers.forEach(u => {
      console.log(`Name: ${u.name}`);
      console.log(`Username: ${u.username}`);
      console.log(`Email: ${u.email}`);
      console.log(`Institute ID: ${u.instituteId}`);
      console.log('');
    });
  }
  
  if (independentTeachers.length > 0) {
    console.log('--- INDEPENDENT TEACHERS ---');
    independentTeachers.forEach(u => {
      console.log(`Name: ${u.name}`);
      console.log(`Username: ${u.username}`);
      console.log(`Email: ${u.email}`);
      console.log(`Referral Code: ${u.referralCode}`);
      console.log('');
    });
  }
  
  if (students.length > 0) {
    console.log('--- STUDENTS ---');
    students.forEach(u => {
      console.log(`Name: ${u.name}`);
      console.log(`Username: ${u.username}`);
      console.log(`Institute/Teacher ID: ${u.instituteId || u.independentTeacherId}`);
      console.log('');
    });
  }
  
  console.log('============================================');
  console.log('NOTE: Passwords are hashed in the database');
  console.log('Login using username or email + password');
  console.log('============================================\n');
  
  process.exit(0);
}

listUsers().catch(console.error);
