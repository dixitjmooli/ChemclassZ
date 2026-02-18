import { NextResponse } from 'next/server';
import { getDb, collection, getDocs } from '@/lib/firebase';

export async function GET() {
  try {
    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: 'Firebase not initialized' }, { status: 500 });
    }

    // Get all users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = [];
    usersSnapshot.forEach((doc) => {
      users.push({
        documentId: doc.id,
        dataId: doc.data().id,
        name: doc.data().name,
        username: doc.data().username,
        role: doc.data().role
      });
    });

    // Get all progress
    const progressSnapshot = await getDocs(collection(db, 'progress'));
    const progressDocs = [];
    progressSnapshot.forEach((doc) => {
      const data = doc.data();
      progressDocs.push({
        documentId: doc.id,
        studentId: data.studentId,
        overallProgress: data.overallProgress,
        lastUpdated: data.lastUpdated
      });
    });

    return NextResponse.json({
      users,
      progressDocs
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
