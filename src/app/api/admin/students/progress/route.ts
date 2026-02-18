import { NextRequest, NextResponse } from 'next/server';
import { getDb, doc, getDocs, collection, query, where } from '@/lib/firebase';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    if (!db) {
      return NextResponse.json(
        { error: 'Firebase not initialized' },
        { status: 500 }
      );
    }

    console.log('=== Fetching students for admin ===');

    // Get ALL progress documents first
    const progressRef = collection(db, 'progress');
    const progressSnapshot = await getDocs(progressRef);
    
    console.log(`Found ${progressSnapshot.size} progress documents`);

    // Store all progress in a map with both keys
    const progressByDocId = {};
    const progressByStudentId = {};

    progressSnapshot.forEach((progressDoc) => {
      const data = progressDoc.data();
      const docId = progressDoc.id;
      const studentIdInData = data.studentId;

      // Map by document ID
      progressByDocId[docId] = data;

      // Also map by studentId field if it exists
      if (studentIdInData) {
        progressByStudentId[studentIdInData] = data;
      }
    });

    // Get all students
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'student'));
    const querySnapshot = await getDocs(q);

    const students = [];
    const progressMap = {};

    console.log(`Found ${querySnapshot.size} students`);

    // Process each student
    querySnapshot.forEach((userDoc) => {
      const user = userDoc.data();
      const docId = userDoc.id;
      const dataId = user.id;

      console.log(`\nStudent: ${user.name}`);
      console.log(`  Document ID: ${docId}`);
      console.log(`  ID in data: ${dataId}`);

      // Try to find progress by document ID first
      let progress = progressByDocId[docId];
      if (!progress && dataId) {
        progress = progressByDocId[dataId];
      }

      // If still no progress, try by studentId field
      if (!progress && progressByStudentId[docId]) {
        progress = progressByStudentId[docId];
      }
      if (!progress && dataId && progressByStudentId[dataId]) {
        progress = progressByStudentId[dataId];
      }

      if (progress) {
        console.log(`  ✅ Found progress! Overall: ${progress.overallProgress}%`);
        progressMap[docId] = progress;
      } else {
        console.log(`  ❌ No progress found for this student`);
      }

      students.push({
        id: docId,
        username: user.username || '',
        name: user.name || '',
        role: user.role || 'student',
        school: user.school || '',
        createdAt: user.createdAt || '',
      });
    });

    console.log(`\n=== Final Results ===`);
    console.log(`Students: ${students.length}`);
    console.log(`Progress matched: ${Object.keys(progressMap).length}`);

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
