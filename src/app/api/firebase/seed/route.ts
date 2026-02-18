import { NextResponse } from 'next/server';
import { getDb, setDoc, doc, collection, getDocs, query, where } from '@/lib/firebase';

export async function POST() {
  try {
    const db = getDb();
    if (!db) {
      return NextResponse.json(
        { error: 'Firebase not initialized' },
        { status: 500 }
      );
    }

    // Check if admin already exists
    const adminQuery = query(collection(db, 'users'), where('username', '==', 'admin'));
    const adminSnapshot = await getDocs(adminQuery);

    if (!adminSnapshot.empty) {
      return NextResponse.json({
        success: true,
        message: 'Users already exist in database'
      });
    }

    // Create admin user
    await setDoc(doc(db, 'users', 'admin'), {
      id: 'admin',
      username: 'admin',
      password: 'admin123',
      name: 'Admin User',
      role: 'admin',
      school: 'ChemClass Pro Admin',
      createdAt: new Date().toISOString(),
    });

    // Create student 1
    await setDoc(doc(db, 'users', 'student1'), {
      id: 'student1',
      username: 'student1',
      password: 'student123',
      name: 'Rahul Sharma',
      role: 'student',
      school: 'Delhi Public School',
      createdAt: new Date().toISOString(),
    });

    // Create student 2
    await setDoc(doc(db, 'users', 'student2'), {
      id: 'student2',
      username: 'student2',
      password: 'student123',
      name: 'Priya Singh',
      role: 'student',
      school: 'Kendriya Vidyalaya',
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Users created successfully',
      users: [
        { username: 'admin', password: 'admin123', role: 'admin' },
        { username: 'student1', password: 'student123', role: 'student' },
        { username: 'student2', password: 'student123', role: 'student' },
      ]
    });
  } catch (error) {
    console.error('Error seeding database:', error);
    return NextResponse.json(
      { error: 'Failed to seed database' },
      { status: 500 }
    );
  }
}
