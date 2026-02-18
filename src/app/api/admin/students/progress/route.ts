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

    // Get ALL progress documents
    const progressSnapshot = await getDocs(collection(db, 'progress'));

    // Get all students
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'student'));
    const studentsSnapshot = await getDocs(q);

    const students = [];
    const progressMap = {};

    // Build students list
    studentsSnapshot.forEach((userDoc) => {
      const user = userDoc.data();
      const docId = userDoc.id;
      const dataId = user.id;

      students.push({
        id: docId,
        username: user.username || '',
        name: user.name || '',
        role: user.role || 'student',
        school: user.school || '',
        createdAt: user.createdAt || '',
      });
    });

    // Match progress to students
    progressSnapshot.forEach((progressDoc) => {
      const data = progressDoc.data();
      const docId = progressDoc.id;
      const studentIdFromData = data.studentId;

      // Try to match by document ID
      const studentByDocId = students.find(s => s.id === docId);
      if (studentByDocId) {
        progressMap[studentByDocId.id] = data;
        return;
      }

      // Try to match by studentId field
      if (studentIdFromData) {
        const studentByDataId = students.find(s => s.id === studentIdFromData);
        if (studentByDataId) {
          progressMap[studentByDataId.id] = data;
        }
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
