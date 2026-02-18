import { getDb, collection, getDocs } from '@/lib/firebase';

export default async function DebugPage() {
  const db = getDb();
  if (!db) {
    return <div>Firebase not initialized</div>;
  }

  // Get ALL users
  const usersSnapshot = await getDocs(collection(db, 'users'));
  const users = [];
  usersSnapshot.forEach(doc => {
    users.push({
      docId: doc.id,
      ...doc.data()
    });
  });

  // Get ALL progress
  const progressSnapshot = await getDocs(collection(db, 'progress'));
  const progress = [];
  progressSnapshot.forEach(doc => {
    progress.push({
      docId: doc.id,
      studentId: doc.data().studentId,
      overallProgress: doc.data().overallProgress,
      lastUpdated: doc.data().lastUpdated
    });
  });

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', whiteSpace: 'pre' }}>
      <h1>FIREBASE DEBUG DUMP</h1>
      
      <h2>USERS ({users.length})</h2>
      {users.map(user => (
        <div key={user.docId} style={{ border: '1px solid #ccc', margin: '10px 0', padding: '10px' }}>
          <strong>Document ID:</strong> {user.docId}<br/>
          <strong>ID in data:</strong> {user.id}<br/>
          <strong>Name:</strong> {user.name}<br/>
          <strong>Username:</strong> {user.username}<br/>
          <strong>Role:</strong> {user.role}<br/>
          <strong>School:</strong> {user.school}
        </div>
      ))}

      <h2>PROGRESS ({progress.length})</h2>
      {progress.map(p => (
        <div key={p.docId} style={{ border: '1px solid #ccc', margin: '10px 0', padding: '10px' }}>
          <strong>Document ID:</strong> {p.docId}<br/>
          <strong>studentId in data:</strong> {p.studentId || '(none)'}<br/>
          <strong>Overall Progress:</strong> {p.overallProgress}%<br/>
          <strong>Last Updated:</strong> {p.lastUpdated}
        </div>
      ))}

      <h2>SUMMARY</h2>
      <p>Students: {users.filter(u => u.role === 'student').length}</p>
      <p>Progress docs: {progress.length}</p>
    </div>
  );
}
