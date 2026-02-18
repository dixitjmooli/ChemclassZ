import { NextRequest, NextResponse } from 'next/server';
import { getDb, doc, getDoc, updateDoc } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, chapterId, marks } = body;

    if (!studentId || !chapterId || marks === undefined) {
      return NextResponse.json(
        { error: 'Student ID, chapter ID, and marks are required' },
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

    if (!progressDoc.exists()) {
      return NextResponse.json(
        { error: 'Student progress not found' },
        { status: 404 }
      );
    }

    const progress = progressDoc.data();
    
    // Update test marks for the chapter
    const updatedChapters = { ...progress.chapters };
    
    if (!updatedChapters[chapterId]) {
      updatedChapters[chapterId] = {
        chapterId,
        topicsProgress: {},
        hotsCompleted: false,
        notesCompleted: false,
      };
    }
    
    updatedChapters[chapterId].testMarks = parseInt(marks) || 0;

    await updateDoc(progressRef, {
      chapters: updatedChapters,
      lastUpdated: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Test marks saved successfully!',
    });
  } catch (error) {
    console.error('Error saving test marks:', error);
    return NextResponse.json(
      { error: 'Failed to save test marks. Please try again.' },
      { status: 500 }
    );
  }
}
