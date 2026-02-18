import { NextResponse } from 'next/server';
import { getDb, collection, getDocs } from '@/lib/firebase';

export async function GET() {
  try {
    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: 'Firebase not initialized' }, { status: 500 });
    }

    // Get ALL users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = [];
    usersSnapshot.forEach(doc => {
      users.push({
        documentId: doc.id,
        data: doc.data()
      });
    });

    // Get ALL progress
    const progressSnapshot = await getDocs(collection(db, 'progress'));
    const progress = [];
    progressSnapshot.forEach(doc => {
      progress.push({
        documentId: doc.id,
        studentIdInData: doc.data().studentId,
        overallProgress: doc.data().overallProgress,
        lastUpdated: doc.data().lastUpdated
      });
    });

    return NextResponse.json({
      success: true,
      users,
      progress,
      summary: {
        totalUsers: users.length,
        totalProgressDocs: progress.length,
        students: users.filter(u => u.data.role === 'student').map(u => ({
          name: u.data.name,
          documentId: u.documentId,
          idInData: u.data.id
        })),
        progressDocs: progress.map(p => ({
          documentId: p.documentId,
          studentIdInData: p.studentIdInData,
          overallProgress: p.overallProgress
        }))
      }
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
