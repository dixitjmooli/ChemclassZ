import { NextResponse } from 'next/server';
import { getDb, collection, getDocs, doc, getDoc } from '@/lib/firebase';

export async function GET() {
  try {
    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: 'Firebase not initialized' }, { status: 500 });
    }

    console.log('=== DEBUGGING DATABASE ===');

    // Get ALL users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = [];
    usersSnapshot.forEach((doc) => {
      users.push({
        docId: doc.id,
        data: doc.data()
      });
    });

    console.log('Total users in database:', users.length);
    users.forEach(user => {
      console.log(`  - User: ${user.docId}, Role: ${user.data.role}, Name: ${user.data.name}`);
    });

    // Get ALL progress documents
    const progressSnapshot = await getDocs(collection(db, 'progress'));
    const progressDocs = [];
    progressSnapshot.forEach((doc) => {
      const data = doc.data();
      progressDocs.push({
        docId: doc.id,
        overallProgress: data.overallProgress,
        lastUpdated: data.lastUpdated,
        chapterCount: Object.keys(data.chapters || {}).length
      });
    });

    console.log('Total progress documents:', progressDocs.length);
    progressDocs.forEach(prog => {
      console.log(`  - Progress ID: ${prog.docId}, Overall: ${prog.overallProgress}%, Chapters: ${prog.chapterCount}`);
    });

    // Cross-reference: Check if each student has progress
    const studentsWithoutProgress = [];
    const studentsWithProgress = [];

    users.forEach(user => {
      const hasProgress = progressDocs.some(p => p.docId === user.docId && user.data.role === 'student');
      if (user.data.role === 'student') {
        if (hasProgress) {
          studentsWithProgress.push({
            id: user.docId,
            name: user.data.name,
            progressId: user.docId
          });
        } else {
          studentsWithoutProgress.push({
            id: user.docId,
            name: user.data.name
          });
        }
      }
    });

    console.log('Students with progress:', studentsWithProgress.length);
    console.log('Students without progress:', studentsWithoutProgress.length);

    return NextResponse.json({
      success: true,
      summary: {
        totalUsers: users.length,
        totalProgressDocs: progressDocs.length,
        students: users.filter(u => u.data.role === 'student').length,
        studentsWithProgress: studentsWithProgress.length,
        studentsWithoutProgress: studentsWithoutProgress.length
      },
      users,
      progressDocs,
      studentsWithProgress,
      studentsWithoutProgress
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
