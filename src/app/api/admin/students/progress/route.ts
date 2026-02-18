import { NextRequest, NextResponse } from 'next/server';
import { getDb, doc, getDocs, collection, query, where } from '@/lib/firebase';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    if (!db) {
      console.error('Firebase not initialized');
      return NextResponse.json(
        { error: 'Firebase not initialized' },
        { status: 500 }
      );
    }

    console.log('Starting to fetch students...');

    // Try to get students with role filter first
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'student'));
    const querySnapshot = await getDocs(q);

    console.log('Student query result count:', querySnapshot.size);

    let userDocs = querySnapshot.docs;

    // If no students found with role filter, try getting ALL users and filter manually
    if (userDocs.length === 0) {
      console.log('No students found with role filter, getting all users...');
      const allUsersSnapshot = await getDocs(collection(db, 'users'));
      console.log('Total users in database:', allUsersSnapshot.size);
      
      userDocs = [];
      allUsersSnapshot.forEach((doc) => {
        const userData = doc.data();
        console.log('User:', doc.id, 'Role:', userData.role);
        // Filter students manually
        if (userData.role === 'student') {
          userDocs.push(doc);
        }
      });
      console.log('Students after manual filter:', userDocs.length);
    }

    const students = [];
    const progressMap = {};

    // Get all students' progress
    for (const userDoc of userDocs) {
      const user = userDoc.data();
      // Use document ID if available, otherwise try to get it from data
      const userId = userDoc.id || user.id;

      if (!userId) {
        console.error('User document has no ID:', userDoc.id, user);
        continue;
      }

      console.log('Processing student:', userId, { name: user.name, username: user.username });

      students.push({
        id: userId,
        username: user.username || '',
        name: user.name || '',
        role: user.role || 'student',
        school: user.school || '',
        createdAt: user.createdAt || '',
      });

      // Get progress for this student
      try {
        const progressRef = doc(db, 'progress', userId);
        const progressDoc = await getDoc(progressRef);

        console.log('Looking for progress document with ID:', userId);

        if (progressDoc.exists()) {
          progressMap[userId] = progressDoc.data();
          const progressData = progressDoc.data();
          console.log('✅ Found progress for student:', userId);
          console.log('   Overall progress:', progressData?.overallProgress);
          console.log('   Last updated:', progressData?.lastUpdated);
        } else {
          console.log('⚠️ No progress found for student:', userId);
          console.log('   This might be because:');
          console.log('   1. Student has never logged in yet');
          console.log('   2. Progress was saved under a different ID');
        }
      } catch (progressError) {
        console.error('❌ Error fetching progress for student', userId, progressError);
      }
    }

    console.log('Returning students count:', students.length);
    console.log('Returning progress count:', Object.keys(progressMap).length);

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
