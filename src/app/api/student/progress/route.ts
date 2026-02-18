import { NextRequest, NextResponse } from 'next/server';
import { getDb, doc, getDoc, updateDoc, setDoc } from '@/lib/firebase';
import { CBSE_CHAPTERS } from '@/data/chapters';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    console.log('GET progress for student:', studentId);

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
      console.log('✅ Found existing progress for student:', studentId);
      const progressData = progressDoc.data();
      console.log('Progress data keys:', Object.keys(progressData || {}));
      console.log('Overall progress:', progressData?.overallProgress);
      console.log('Last updated:', progressData?.lastUpdated);
      return NextResponse.json({
        success: true,
        progress: progressData,
      });
    } else {
      console.log('⚠️ No progress found, initializing for student:', studentId);
      // Initialize progress for new student
      const initialProgress = initializeStudentProgress(studentId);
      console.log('Initial progress created, saving to Firebase...');
      await setDoc(progressRef, initialProgress);
      console.log('✅ Initialized and saved new progress for student:', studentId);
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

    console.log('POST update progress:', { studentId, chapterId, topicId, field, value });

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

    // Get or create student progress
    const progressRef = doc(db, 'progress', studentId);
    const progressDoc = await getDoc(progressRef);

    let progressData;
    let isNewProgress = false;

    if (progressDoc.exists()) {
      progressData = progressDoc.data();
      console.log('✅ Found existing progress document');
    } else {
      // Initialize progress for new student
      progressData = initializeStudentProgress(studentId);
      isNewProgress = true;
      console.log('⚠️ No progress found, created new progress in memory');
    }

    // Update the specific checkbox
    if (!progressData.chapters[chapterId]) {
      progressData.chapters[chapterId] = {
        chapterId,
        topicsProgress: {},
        hotsCompleted: false,
        notesCompleted: false,
      };
    }

    // Handle chapter-level fields (HOTS, Notes)
    if (topicId === 'chapter') {
      console.log('Updating chapter-level field:', field, 'to', value);
      progressData.chapters[chapterId][field] = value;
    } else {
      // Handle topic-level fields (lecture, ncert, level1, level2)
      console.log('Updating topic-level field:', topicId, field, 'to', value);
      if (!progressData.chapters[chapterId].topicsProgress[topicId]) {
        progressData.chapters[chapterId].topicsProgress[topicId] = {
          id: topicId,
          lectureCompleted: false,
          ncertCompleted: false,
          level1Completed: false,
          level2Completed: false,
          notesCompleted: false,
        };
      }

      progressData.chapters[chapterId].topicsProgress[topicId][field] = value;
    }
    progressData.overallProgress = calculateOverallProgress(progressData);
    progressData.lastUpdated = new Date().toISOString();

    console.log('Saving updated progress to Firebase... isNewProgress:', isNewProgress);

    // Use setDoc for new progress, updateDoc for existing
    if (isNewProgress) {
      console.log('Creating new progress document with setDoc');
      await setDoc(progressRef, progressData);
    } else {
      console.log('Updating existing progress document with updateDoc');
      await updateDoc(progressRef, {
        chapters: progressData.chapters,
        overallProgress: progressData.overallProgress,
        lastUpdated: progressData.lastUpdated,
      });
    }

    console.log('✅ Progress saved successfully to Firebase');

    return NextResponse.json({
      success: true,
      message: 'Progress updated successfully',
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json(
      { error: 'Failed to update progress. Please try again.' },
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
          totalMilestones += 4; // lecture, ncert, level1, level2
          if (topicProgress.lectureCompleted) completedMilestones++;
          if (topicProgress.ncertCompleted) completedMilestones++;
          if (topicProgress.level1Completed) completedMilestones++;
          if (topicProgress.level2Completed) completedMilestones++;
        }
      });
      totalMilestones += 2; // hots, notes
      if (chapterProgress.hotsCompleted) completedMilestones++;
      if (chapterProgress.notesCompleted) completedMilestones++;
    }
  });
  
  return totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
}
