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

    // Get all students
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'student'));
    const querySnapshot = await getDocs(q);

    const students = [];
    const progressMap = {};

    console.log(`Found ${querySnapshot.size} students in database`);

    // Process each student
    querySnapshot.forEach((userDoc) => {
      const user = userDoc.data();
      const userId = userDoc.id;

      console.log(`\nStudent: ${user.name}, ID: ${userId}, Doc ID: ${userDoc.id}, Data ID: ${user.id}`);

      students.push({
        id: userId,
        username: user.username || '',
        name: user.name || '',
        role: user.role || 'student',
        school: user.school || '',
        createdAt: user.createdAt || '',
      });
    });

    // Now get ALL progress documents
    console.log('\n=== Fetching all progress documents ===');
    const progressRef = collection(db, 'progress');
    const progressSnapshot = await getDocs(progressRef);

    console.log(`Found ${progressSnapshot.size} progress documents`);

    progressSnapshot.forEach((progressDoc) => {
      const progressId = progressDoc.id;
      const progressData = progressDoc.data();
      const studentIdFromProgress = progressData.studentId;

      console.log(`\nProgress document ID: ${progressId}`);
      console.log(`  studentId in data: ${studentIdFromProgress}`);
      console.log(`  overallProgress: ${progressData.overallProgress}`);

      // Try to match this progress to a student
      // First try matching by document ID (which should be the student's ID)
      if (students.find(s => s.id === progressId)) {
        console.log(`  ✅ Matched by progress doc ID to student`);
        progressMap[progressId] = progressData;
      }
      // Then try matching by studentId field in progress data
      else if (studentIdFromProgress && students.find(s => s.id === studentIdFromProgress)) {
        console.log(`  ✅ Matched by studentId field to student`);
        progressMap[studentIdFromProgress] = progressData;
      } else {
        console.log(`  ❌ No matching student found for this progress!`);
      }
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
