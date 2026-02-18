import { NextRequest, NextResponse } from 'next/server';
import { getDb, doc, getDoc } from '@/lib/firebase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json(
        { error: 'Firebase not initialized' },
        { status: 500 }
      );
    }

    const progressRef = doc(db, 'progress', studentId);
    const progressDoc = await getDoc(progressRef);

    if (progressDoc.exists()) {
      return NextResponse.json({
        success: true,
        progress: progressDoc.data(),
      });
    } else {
      return NextResponse.json({
        success: true,
        progress: null,
      });
    }
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress. Please try again.' },
      { status: 500 }
    );
  }
}
