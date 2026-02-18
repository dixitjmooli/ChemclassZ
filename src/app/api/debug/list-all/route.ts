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
      const data = doc.data();
      users.push({
        documentId: doc.id,
        dataId: data.id,
        name: data.name,
        username: data.username,
        role: data.role
      });
    });

    // Get all progress
    const progressSnapshot = await getDocs(collection(db, 'progress'));
    const progress = [];
    progressSnapshot.forEach((doc) => {
      const data = doc.data();
      progress.push({
        documentId: doc.id,
        dataStudentId: data.studentId,
        overallProgress: data.overallProgress,
        lastUpdated: data.lastUpdated
      });
    });

    return NextResponse.json({
      users,
      progress,
      summary: {
        totalUsers: users.length,
        totalProgress: progress.length
      }
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
