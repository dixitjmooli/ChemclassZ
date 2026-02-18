import { NextResponse } from 'next/server';
import { getDb, collection, query, where, getDocs } from '@/lib/firebase';

export async function GET() {
  try {
    const db = getDb();
    if (!db) {
      return NextResponse.json(
        { error: 'Firebase not initialized' },
        { status: 500 }
      );
    }

    const studentsRef = collection(db, 'users');
    const q = query(studentsRef, where('role', '==', 'student'));
    const querySnapshot = await getDocs(q);

    const students = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      students,
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}
