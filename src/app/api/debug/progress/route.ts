import { NextResponse } from 'next/server';
import { getDb, collection, getDocs } from '@/lib/firebase';

export async function GET() {
  try {
    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: 'Firebase not initialized' }, { status: 500 });
    }

    // Get all progress documents
    const progressRef = collection(db, 'progress');
    const progressSnapshot = await getDocs(progressRef);

    const progressList = [];
    progressSnapshot.forEach((doc) => {
      const data = doc.data();
      progressList.push({
        studentId: doc.id,
        studentIdFromData: data.studentId,
        overallProgress: data.overallProgress,
        lastUpdated: data.lastUpdated,
        chapterCount: data.chapters ? Object.keys(data.chapters).length : 0
      });
    });

    return NextResponse.json({
      success: true,
      totalProgressRecords: progressList.length,
      progressRecords: progressList
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
