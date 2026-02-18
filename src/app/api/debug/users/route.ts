import { NextResponse } from 'next/server';
import { getDb, collection, getDocs } from '@/lib/firebase';

export async function GET() {
  try {
    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: 'Firebase not initialized' }, { status: 500 });
    }

    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);

    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({
        docId: doc.id,
        data: doc.data()
      });
    });

    return NextResponse.json({
      success: true,
      total: users.length,
      users
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
