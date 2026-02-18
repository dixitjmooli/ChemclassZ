import { NextRequest, NextResponse } from 'next/server';
import { getDb, doc, getDoc, setDoc } from '@/lib/firebase';
import { CBSE_CHAPTERS } from '@/data/chapters';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
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
      const initialProgress = initializeStudentProgress(studentId);
      await setDoc(progressRef, initialProgress);
      return NextResponse.json({
        success: true,
        progress: initialProgress,
      });
    }
  } catch (error) {
    console.error('Error loading progress:', error);
    return NextResponse.json(
      { error: 'Failed to load progress. Please try again.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, chapterId, topicId, field, value } = body;

    console.log('=== SAVING PROGRESS ===');
    console.log('Student ID:', studentId);
    console.log('Chapter:', chapterId);

    if (!studentId || !chapterId || !topicId || !field) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Always get existing progress first, then save with setDoc
    const progressRef = doc(db, 'progress', studentId);
    let progressData;
    
    try {
      const progressDoc = await getDoc(progressRef);
      if (progressDoc.exists()) {
        progressData = progressDoc.data();
        console.log('Found existing progress');
      } else {
        progressData = initializeStudentProgress(studentId);
        console.log('Creating new progress');
      }
    } catch (e) {
      console.log('Error getting progress, creating new:', e);
      progressData = initializeStudentProgress(studentId);
    }

    // Update progress
    if (!progressData.chapters[chapterId]) {
      progressData.chapters[chapterId] = {
        chapterId,
        topicsProgress: {},
        hotsCompleted: false,
        notesCompleted: false
      };
    }

    if (topicId === 'chapter') {
      progressData.chapters[chapterId][field] = value;
    } else {
      if (!progressData.chapters[chapterId].topicsProgress[topicId]) {
        progressData.chapters[chapterId].topicsProgress[topicId] = {
          id: topicId,
          lectureCompleted: false,
          ncertCompleted: false,
          level1Completed: false,
          level2Completed: false,
          notesCompleted: false
        };
      }
      progressData.chapters[chapterId].topicsProgress[topicId][field] = value;
    }
    
    progressData.overallProgress = calculateOverallProgress(progressData);
    progressData.lastUpdated = new Date().toISOString();

    console.log('Saving with setDoc...');
    await setDoc(progressRef, progressData);
    console.log('✅ Saved! Progress:', progressData.overallProgress + '%');

    return NextResponse.json({
      success: true,
      message: 'Progress updated successfully',
      overallProgress: progressData.overallProgress
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json(
      { error: 'Failed to update progress. Please try again.', details: String(error) },
      { status: 500 }
    );
  }
}

function initializeStudentProgress(studentId: string) {
  const chapters = {};
  CBSE_CHAPTERS.forEach((chapter) => {
    const topicsProgress = {};
    chapter.topics.forEach((topic) => {
      topicsProgress[topic.id] = {
        id: topic.id,
        lectureCompleted: false,
        ncertCompleted: false,
        level1Completed: false,
        level2Completed: false,
        notesCompleted: false,
      };
    });
    chapters[chapter.id] = {
      chapterId: chapter.id,
      topicsProgress,
      hotsCompleted: false,
      notesCompleted: false,
    };
  });
  return {
    studentId,
    chapters,
    overallProgress: 0,
    lastUpdated: new Date().toISOString(),
  };
}

function calculateOverallProgress(progress: any): number {
  let totalMilestones = 0;
  let completedMilestones = 0;
  CBSE_CHAPTERS.forEach((chapter) => {
    const chapterProgress = progress.chapters[chapter.id];
    if (chapterProgress) {
      chapter.topics.forEach((topic) => {
        const topicProgress = chapterProgress.topicsProgress[topic.id];
        if (topicProgress) {
          totalMilestones += 4;
          if (topicProgress.lectureCompleted) completedMilestones++;
          if (topicProgress.ncertCompleted) completedMilestones++;
          if (topicProgress.level1Completed) completedMilestones++;
          if (topicProgress.level2Completed) completedMilestones++;
        }
      });
      totalMilestones += 2;
      if (chapterProgress.hotsCompleted) completedMilestones++;
      if (chapterProgress.notesCompleted) completedMilestones++;
    }
  });
  return totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
}
