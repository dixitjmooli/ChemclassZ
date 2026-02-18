import { NextRequest, NextResponse } from 'next/server';
import { getDb, collection, query, where, getDocs } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, role } = body;

    if (!username || !password || !role) {
      return NextResponse.json(
        { error: 'Username, password, and role are required' },
        { status: 400 }
      );
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json(
        { error: 'Firebase not initialized. Please check your configuration.' },
        { status: 500 }
      );
    }

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username), where('role', '==', role));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    const userDoc = querySnapshot.docs[0];
    const user = userDoc.data();
    const userId = userDoc.id; // Use document ID, not data.id

    if (user.password !== password) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        username: user.username,
        name: user.name,
        role: user.role,
        school: user.school,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
