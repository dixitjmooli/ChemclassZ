import { NextResponse } from 'next/server';
import { getDb, getDocs, collection, query, where } from '@/lib/firebase';

export async function GET() {
  try {
    const db = getDb();
    if (!db) {
      return new Response(JSON.stringify({ error: 'Firebase not initialized' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get all students
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'student'));
    const studentsSnapshot = await getDocs(q);

    const students = [];
    studentsSnapshot.forEach((doc) => {
      students.push({
        docId: doc.id,
        dataId: doc.data().id,
        name: doc.data().name
      });
    });

    // Get all progress
    const progressSnapshot = await getDocs(collection(db, 'progress'));
    const progressDocs = [];
    progressSnapshot.forEach((doc) => {
      progressDocs.push({
        docId: doc.id,
        studentId: doc.data().studentId,
        overallProgress: doc.data().overallProgress
      });
    });

    // Create HTML response
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Firebase Debug</title>
        <style>
          body { font-family: monospace; padding: 20px; }
          h1 { color: #333; }
          .section { background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 8px; }
          .item { padding: 8px; margin: 5px 0; background: white; border-left: 3px solid #0070f3; }
        </style>
      </head>
      <body>
        <h1>FIREBASE DATA DEBUG</h1>
        
        <div class="section">
          <h2>STUDENTS (${students.length})</h2>
          ${students.map(s => `<div class="item"><strong>${s.name}</strong><br>Doc ID: ${s.docId}<br>Data ID: ${s.dataId}</div>`).join('')}
        </div>
        
        <div class="section">
          <h2>PROGRESS DOCUMENTS (${progressDocs.length})</h2>
          ${progressDocs.map(p => `<div class="item"><strong>Doc ID: ${p.docId}</strong><br>studentId in data: ${p.studentId}<br>Progress: ${p.overallProgress}%</div>`).join('')}
        </div>
      </body>
      </html>
    `;

    return new Response(html, {
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
