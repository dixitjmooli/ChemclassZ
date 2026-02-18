import { NextRequest, NextResponse } from 'next/server';
import { getDb, collection, getDocs, query, where, doc, setDoc } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, username, password, school } = body;

    if (!name || !username || !password) {
      return NextResponse.json(
        { error: 'Name, username, and password are required' },
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

    // Check if username already exists
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return NextResponse.json(
        { error: 'Username already exists. Please choose a different username.' },
        { status: 409 }
      );
    }

    // Create new student
    const studentId = `student-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newStudent = {
      id: studentId,
      username,
      password,
      name,
      school: school || undefined,
      role: 'student',
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'users', studentId), newStudent);

    return NextResponse.json({
      success: true,
      message: 'Student added successfully!',
      student: {
        id: newStudent.id,
        username: newStudent.username,
        name: newStudent.name,
        role: newStudent.role,
        school: newStudent.school,
        createdAt: newStudent.createdAt,
      },
    });
  } catch (error) {
    console.error('Error adding student:', error);
    return NextResponse.json(
      { error: 'Failed to add student. Please try again.' },
      { status: 500 }
    );
  }
}
