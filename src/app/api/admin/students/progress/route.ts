import { NextRequest, NextResponse } from 'next/server';
import { getDb, doc, getDocs, collection, query, where } from '@/lib/firebase';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    if (!db) {
      console.error('❌ Firebase not initialized');
      return NextResponse.json(
        { error: 'Firebase not initialized' },
        { status: 500 }
      );
    }

    console.log('=== ADMIN: Fetching students and progress ===');

    // Get ALL progress documents first
    let progressSnapshot;
    try {
      const progressRef = collection(db, 'progress');
      progressSnapshot = await getDocs(progressRef);
      console.log(`✅ Progress query succeeded. Found ${progressSnapshot.size} documents`);
    } catch (e) {
      console.error('❌ Error querying progress collection:', e);
      return NextResponse.json(
        { error: 'Failed to query progress: ' + String(e) },
        { status: 500 }
      );
    }
    
    // Store all progress in a map
    const progressByDocId = {};
    const progressByStudentId = {};

    progressSnapshot.forEach((progressDoc) => {
      const data = progressDoc.data();
      const docId = progressDoc.id;
      const studentIdInData = data.studentId;

      progressByDocId[docId] = data;

      if (studentIdInData) {
        progressByStudentId[studentIdInData] = data;
      }
    });

    console.log(`Progress by Doc ID: ${Object.keys(progressByDocId).length}`);
    console.log(`Progress by studentId: ${Object.keys(progressByStudentId).length}`);

    // Get all students
    let querySnapshot;
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', 'student'));
      querySnapshot = await getDocs(q);
      console.log(`✅ Student query succeeded. Found ${querySnapshot.size} students`);
    } catch (e) {
      console.error('❌ Error querying students:', e);
      return NextResponse.json(
        { error: 'Failed to query students: ' + String(e) },
        { status: 500 }
      );
    }

    const students = [];
    const progressMap = {};

    // Process each student
    querySnapshot.forEach((userDoc) => {
      const user = userDoc.data();
      const docId = userDoc.id;
      const dataId = user.id;

      console.log(`\nStudent: ${user.name}`);
      console.log(`  Doc ID: ${docId}`);
      console.log(`  Data ID: ${dataId}`);
      console.log(`  Has progress by Doc ID: ${!!progressByDocId[docId]}`);
      console.log(`  Has progress by Data ID: ${dataId && !!progressByDocId[dataId]}`);
      console.log(`  Has progress by studentId: ${!!progressByStudentId[docId]}`);

      // Try to find progress
      let progress = progressByDocId[docId] || (dataId && progressByDocId[dataId]) || progressByStudentId[docId] || (dataId && progressByStudentId[dataId]);

      if (progress) {
        console.log(`  ✅ Matched! Progress: ${progress.overallProgress}%`);
        progressMap[docId] = progress;
      } else {
        console.log(`  ❌ No progress match found`);
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

    console.log(`\n=== FINAL RESULTS ===`);
    console.log(`Students: ${students.length}`);
    console.log(`Progress matched: ${Object.keys(progressMap).length}`);
    console.log(`Progress IDs in map: ${Object.keys(progressMap).join(', ')}`);

    return NextResponse.json({
      success: true,
      students,
      progress: progressMap,
      debug: {
        totalStudents: students.length,
        totalProgressInDb: progressSnapshot.size,
        matchedProgress: Object.keys(progressMap).length,
        studentIds: students.map(s => s.id),
        progressIds: Object.keys(progressMap)
      }
    });
  } catch (error) {
    console.error('=== ERROR in admin/progress ===', error);
    return NextResponse.json(
      { error: 'Failed to fetch students progress. Please try again.', details: String(error) },
      { status: 500 }
    );
  }
}
