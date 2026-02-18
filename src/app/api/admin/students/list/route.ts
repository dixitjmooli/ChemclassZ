import { NextResponse } from 'next/server';
import { getDb, collection, getDocs, query, where } from '@/lib/firebase';

export async function GET() {
  try {
    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: 'Firebase not initialized' }, { status: 500 });
    }

    // Get ALL users first (no filter)
    const allUsersRef = collection(db, 'users');
    const allSnapshot = await getDocs(allUsersRef);

    const allUsers = [];
    allSnapshot.forEach((doc) => {
      const data = doc.data();
      allUsers.push({
        docId: doc.id,
        hasIdField: !!data.id,
        role: data.role,
        username: data.username,
        name: data.name,
        data: data
      });
    });

    // Now get students only
    const q = query(collection(db, 'users'), where('role', '==', 'student'));
    const studentSnapshot = await getDocs(q);

    const students = [];
    studentSnapshot.forEach((doc) => {
      const data = doc.data();
      students.push({
        docId: doc.id,
        idFromData: data.id,
        role: data.role,
        username: data.username,
        name: data.name
      });
    });

    return NextResponse.json({
      success: true,
      totalUsers: allUsers.length,
      allUsers,
      totalStudents: students.length,
      students
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
