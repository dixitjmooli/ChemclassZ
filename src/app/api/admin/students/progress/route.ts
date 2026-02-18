import { NextRequest, NextResponse } from 'next/server';
import { getDb, getDocs, collection, query, where } from '@/lib/firebase';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    if (!db) {
      return NextResponse.json(
        { error: 'Firebase not initialized' },
        { status: 500 }
      );
    }

    // Get all students
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'student'));
    const studentsSnapshot = await getDocs(q);

    const students = [];
    studentsSnapshot.forEach((userDoc) => {
      const user = userDoc.data();
      students.push({
        id: userDoc.id,
        username: user.username || '',
        name: user.name || '',
        role: user.role || 'student',
        school: user.school || '',
        createdAt: user.createdAt || '',
      });
    });

    // Get ALL progress documents
    const progressSnapshot = await getDocs(collection(db, 'progress'));

    // Create lookup by studentId field in progress data
    const progressMap = {};
    progressSnapshot.forEach((progressDoc) => {
      const data = progressDoc.data();
      // Use the studentId field from progress data as the key
      if (data.studentId) {
        progressMap[data.studentId] = data;
      }
    });

    return NextResponse.json({
      success: true,
      students,
      progress: progressMap,
    });
  } catch (error) {
    console.error('Error fetching students progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students progress. Please try again.', details: String(error) },
      { status: 500 }
    );
  }
}
