import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  onSnapshot,
  query,
  where,
  Timestamp,
  writeBatch,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './firebase';

// Types
export interface TeacherAssignment {
  classId: string;
  subjectId: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: 'student' | 'teacher' | 'institute_owner' | 'superadmin' | 'independent_teacher';
  instituteId?: string;
  assignedClassId?: string;
  assignedSubjectId?: string;
  classId?: string;
  assignments?: TeacherAssignment[];
  // For independent teacher
  classes?: { id: string; name: string }[];
  subjects?: { id: string; name: string; classIds: string[] }[];
  referralCode?: string;
  independentTeacherId?: string;
  // Syllabus preference
  usePredefinedSyllabus?: boolean;
  // Per class-subject syllabus assignments
  syllabusAssignments?: {
    classId: string;
    className: string;
    subjectId: string;
    subjectName: string;
    syllabusId: string | null;
    syllabusType: 'predefined' | 'custom' | null;
    syllabusName: string | null;
  }[];
  createdAt: Date;
}

export interface Institute {
  id: string;
  name: string;
  referralCode: string;
  ownerId: string;
  classes: { id: string; name: string }[];
  subjects: { id: string; name: string; classIds: string[] }[];
  createdAt: Date;
}

export interface Topic {
  id: string;
  topicNo: number;
  name: string;
  chapterId: string;
}

export interface Chapter {
  id: string;
  chapterNo: number;
  name: string;
  topics: Topic[];
}

export interface Subject {
  id: string;
  name: string;
  classNumber?: number;
  instituteId: string | null;
  isDefault: boolean;
  chapters: Chapter[];
}

export interface ProgressItem {
  id: string;
  topicId: string;
  lectureCompleted: boolean;
  ncertCompleted: boolean;
  level1Completed: boolean;
  level2Completed: boolean;
  notesCompleted: boolean;
}

export interface Progress {
  id: string;
  userId: string;
  subjectId: string;
  overallProgress: number;
  items: ProgressItem[];
  hotsCompleted: Record<string, boolean>;
  updatedAt: Date;
}

export interface TestMarks {
  id: string;
  testId: string;
  userId: string;
  chapterId: string;
  subjectId: string;
  marks: number;
  maxMarks: number;
}

export interface Test {
  id: string;
  chapterId: string;
  subjectId: string;
  testName: string;
  maxMarks: number;
  createdAt: Date;
}

export interface PdfData {
  id: string;
  chapterId: string;
  subjectId: string;
  hotsPdf: string | null;
  topicPdfs: Record<string, string> | null;
}

export interface DisciplineStars {
  id: string;
  userId: string;
  stars: number;
}

export interface ActivityLog {
  id: string;
  userId: string;
  type: 'progress' | 'test' | 'discipline';
  action: string;
  details: string;
  change?: number;
  createdAt: Date;
}

export interface StreakData {
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
}

// Streak milestone messages
export const STREAK_MILESTONES: Record<number, string> = {
  7: "🔥 7 DAYS! You're building a habit! Reward yourself with something tasty!",
  15: "🌟 15 DAYS! You're unstoppable! Time for a fun break!",
  30: "🏆 30 DAYS! You're a LEGEND! You've earned a celebration!",
  50: "💎 50 DAYS! Consistency master! Treat yourself to something special!",
  100: "🏅 100 DAYS! You're UNBEATABLE! This calls for a BIG celebration!",
};

// Collection names
const COLLECTIONS = {
  USERS: 'users',
  INSTITUTES: 'institutes',
  SUBJECTS: 'subjects',
  CHAPTERS: 'chapters',
  PROGRESS: 'progress',
  TESTS: 'tests',
  TEST_MARKS: 'testMarks',
  PDFS: 'pdfs',
  DISCIPLINE_STARS: 'disciplineStars',
  ACTIVITY_LOG: 'activityLog',
  STREAKS: 'streaks',
  TODOS: 'todos'
};

// ==================== TODO ITEM TYPES ====================

export interface TodoItem {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  category: 'teaching' | 'admin' | 'student' | 'personal';
  priority: 'high' | 'medium' | 'low';
  dueDate: Date | null;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Simple password hashing
const hashPassword = (password: string): string => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
};

// Generate unique referral code
const generateReferralCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Helper to safely convert to Date
const toDate = (value: unknown): Date => {
  if (!value) return new Date();
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') return new Date(value);
  return new Date();
};

// ==================== AUTH ====================

export const loginUser = async (emailOrUsername: string, password: string): Promise<User> => {
  const usersRef = collection(db, COLLECTIONS.USERS);
  
  // Try email first
  let q = query(usersRef, where('email', '==', emailOrUsername.toLowerCase()));
  let snapshot = await getDocs(q);
  
  // If not found, try username
  if (snapshot.empty) {
    q = query(usersRef, where('username', '==', emailOrUsername.toLowerCase()));
    snapshot = await getDocs(q);
  }
  
  if (snapshot.empty) {
    throw new Error('User not found');
  }
  
  const userDoc = snapshot.docs[0];
  const userData = userDoc.data();
  
  // Check password
  const hashedPassword = hashPassword(password);
  if (userData.passwordHash !== hashedPassword && userData.password !== password) {
    throw new Error('Invalid password');
  }
  
  return {
    id: userDoc.id,
    name: userData.name,
    email: userData.email || '',
    username: userData.username || '',
    role: userData.role,
    instituteId: userData.instituteId,
    assignedClassId: userData.assignedClassId,
    assignedSubjectId: userData.assignedSubjectId,
    classId: userData.classId,
    assignments: userData.assignments || undefined,
    // For independent teacher
    classes: userData.classes || undefined,
    subjects: userData.subjects || undefined,
    referralCode: userData.referralCode || undefined,
    independentTeacherId: userData.independentTeacherId || undefined,
    usePredefinedSyllabus: userData.usePredefinedSyllabus || false,
    enrollments: userData.enrollments || undefined,
    createdAt: toDate(userData.createdAt)
  };
};

export const logoutUser = async (): Promise<void> => {
  console.log('User logged out');
};

// ==================== USER MANAGEMENT ====================

export const createUser = async (
  name: string,
  email: string,
  username: string,
  password: string,
  role: 'student' | 'teacher' | 'institute_owner' | 'superadmin',
  options?: {
    instituteId?: string;
    assignedClassId?: string;
    assignedSubjectId?: string;
    classId?: string;
    assignments?: { classId: string; subjectId: string }[];
    independentTeacherId?: string;
    enrollments?: { id: string; teacherId?: string; instituteId?: string; classId: string; subjectId: string; teacherName?: string; subjectName: string; className?: string }[];
  }
): Promise<User> => {
  const usersRef = collection(db, COLLECTIONS.USERS);
  
  // Check if email exists
  if (email) {
    const emailQuery = query(usersRef, where('email', '==', email.toLowerCase()));
    const emailSnapshot = await getDocs(emailQuery);
    if (!emailSnapshot.empty) {
      throw new Error('Email already exists');
    }
  }
  
  // Check if username exists
  if (username) {
    const usernameQuery = query(usersRef, where('username', '==', username.toLowerCase()));
    const usernameSnapshot = await getDocs(usernameQuery);
    if (!usernameSnapshot.empty) {
      throw new Error('Username already exists');
    }
  }
  
  const userRef = doc(collection(db, COLLECTIONS.USERS));

  // Clean enrollments - remove undefined values from each enrollment object
  const cleanEnrollments = options?.enrollments?.map(enrollment => {
    const cleanEnrollment: Record<string, any> = {};
    for (const key in enrollment) {
      if (enrollment[key as keyof typeof enrollment] !== undefined) {
        cleanEnrollment[key] = enrollment[key as keyof typeof enrollment];
      }
    }
    return cleanEnrollment;
  }) || null;

  const userData = {
    name,
    email: email?.toLowerCase() || '',
    username: username?.toLowerCase() || '',
    passwordHash: hashPassword(password),
    role,
    instituteId: options?.instituteId || null,
    assignedClassId: options?.assignedClassId || null,
    assignedSubjectId: options?.assignedSubjectId || null,
    classId: options?.classId || null,
    assignments: options?.assignments || null,
    independentTeacherId: options?.independentTeacherId || null,
    enrollments: cleanEnrollments,
    createdAt: Timestamp.now()
  };

  await setDoc(userRef, userData);
  
  return {
    id: userRef.id,
    name,
    email: email?.toLowerCase() || '',
    username: username?.toLowerCase() || '',
    role,
    instituteId: options?.instituteId,
    assignedClassId: options?.assignedClassId,
    assignedSubjectId: options?.assignedSubjectId,
    classId: options?.classId,
    assignments: options?.assignments,
    independentTeacherId: options?.independentTeacherId,
    enrollments: options?.enrollments,
    createdAt: new Date()
  };
};

export const updateUserPassword = async (userId: string, newPassword: string): Promise<void> => {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  await updateDoc(userRef, {
    passwordHash: hashPassword(newPassword),
    updatedAt: Timestamp.now()
  });
};

export const updateUserInstitute = async (userId: string, instituteId: string): Promise<void> => {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  await updateDoc(userRef, {
    instituteId,
    updatedAt: Timestamp.now()
  });
};

// Get user by ID
export const getUser = async (userId: string): Promise<User | null> => {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) return null;
  
  const data = userDoc.data();
  return {
    id: userDoc.id,
    name: data.name,
    email: data.email || '',
    username: data.username || '',
    role: data.role,
    instituteId: data.instituteId,
    assignedClassId: data.assignedClassId,
    assignedSubjectId: data.assignedSubjectId,
    classId: data.classId,
    assignments: data.assignments || undefined,
    classes: data.classes || undefined,
    subjects: data.subjects || undefined,
    referralCode: data.referralCode || undefined,
    independentTeacherId: data.independentTeacherId || undefined,
    usePredefinedSyllabus: data.usePredefinedSyllabus || false,
    syllabusAssignments: data.syllabusAssignments || undefined,
    enrollments: data.enrollments || undefined,
    createdAt: toDate(data.createdAt)
  };
};

// Check if username is available
export const checkUsernameAvailability = async (username: string): Promise<boolean> => {
  const usersRef = collection(db, COLLECTIONS.USERS);
  const q = query(usersRef, where('username', '==', username.toLowerCase()));
  const snapshot = await getDocs(q);
  return snapshot.empty;
};

// Validate username format
export const validateUsername = (username: string): { valid: boolean; error?: string } => {
  if (!username || username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }
  if (username.length > 20) {
    return { valid: false, error: 'Username must be less than 20 characters' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }
  return { valid: true };
};

// Update user data
export const updateUser = async (userId: string, data: Record<string, any>): Promise<void> => {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  
  // Filter out undefined values - Firebase doesn't accept them
  const cleanData: Record<string, any> = {};
  for (const key in data) {
    if (data[key] !== undefined) {
      cleanData[key] = data[key];
    }
  }
  
  await updateDoc(userRef, {
    ...cleanData,
    updatedAt: Timestamp.now()
  });
};

export const deleteUser = async (userId: string): Promise<void> => {
  // Delete user's progress
  const progressRef = doc(db, COLLECTIONS.PROGRESS, userId);
  await deleteDoc(progressRef);
  
  // Delete user's test marks
  const testMarksRef = collection(db, COLLECTIONS.TEST_MARKS);
  const q = query(testMarksRef, where('userId', '==', userId));
  const snapshot = await getDocs(q);
  
  const batch = writeBatch(db);
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
  
  // Delete user's discipline stars
  const starsRef = doc(db, COLLECTIONS.DISCIPLINE_STARS, userId);
  await deleteDoc(starsRef).catch(() => {});
  
  // Delete user's streak
  const streakRef = doc(db, COLLECTIONS.STREAKS, userId);
  await deleteDoc(streakRef).catch(() => {});
  
  // Delete user's activity log
  const activityRef = collection(db, COLLECTIONS.ACTIVITY_LOG);
  const activityQ = query(activityRef, where('userId', '==', userId));
  const activitySnapshot = await getDocs(activityQ);
  const activityBatch = writeBatch(db);
  activitySnapshot.docs.forEach((doc) => {
    activityBatch.delete(doc.ref);
  });
  await activityBatch.commit().catch(() => {});
  
  // Delete user document
  await deleteDoc(doc(db, COLLECTIONS.USERS, userId));
};

export const deleteInstitute = async (instituteId: string): Promise<void> => {
  // Get all users belonging to this institute
  const usersRef = collection(db, COLLECTIONS.USERS);
  const q = query(usersRef, where('instituteId', '==', instituteId));
  const snapshot = await getDocs(q);
  
  // Delete all users (teachers, students, owner)
  for (const userDoc of snapshot.docs) {
    await deleteUser(userDoc.id);
  }
  
  // Delete institute's subjects from subjects collection
  const subjectsRef = collection(db, COLLECTIONS.SUBJECTS);
  const subjectsQ = query(subjectsRef, where('instituteId', '==', instituteId));
  const subjectsSnapshot = await getDocs(subjectsQ);
  const subjectsBatch = writeBatch(db);
  subjectsSnapshot.docs.forEach((doc) => {
    subjectsBatch.delete(doc.ref);
  });
  await subjectsBatch.commit().catch(() => {});
  
  // Delete institute document
  await deleteDoc(doc(db, COLLECTIONS.INSTITUTES, instituteId));
};

// Get all teachers for an institute
export const getTeachersForInstitute = async (instituteId: string): Promise<{ id: string; name: string; email?: string }[]> => {
  const usersRef = collection(db, COLLECTIONS.USERS);
  const q = query(usersRef, where('instituteId', '==', instituteId), where('role', '==', 'teacher'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    name: doc.data().name,
    email: doc.data().email
  }));
};

// ==================== INDEPENDENT TEACHER ====================

export const createIndependentTeacher = async (
  name: string,
  email: string,
  username: string,
  password: string,
  classes: string[],
  subjectData: { name: string; classIds: string[] }[]
): Promise<User> => {
  // Generate unique referral code
  let referralCode = generateReferralCode();
  let codeExists = true;
  
  while (codeExists) {
    const usersRef = collection(db, COLLECTIONS.USERS);
    const q = query(usersRef, where('referralCode', '==', referralCode));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      codeExists = false;
    } else {
      referralCode = generateReferralCode();
    }
  }
  
  // Create class objects
  const classObjects = classes.map((className) => ({
    id: doc(collection(db, '_')).id,
    name: className
  }));
  
  // Create separate subjects for each class-subject combination
  // E.g., "Science" for classes [6, 7, 10] becomes:
  // "Science (Class 6)", "Science (Class 7)", "Science (Class 10)"
  const subjectObjects: { id: string; name: string; classIds: string[] }[] = [];
  
  for (const subject of subjectData) {
    // For each class in the subject's classIds, create a separate subject
    for (const className of subject.classIds) {
      const subjectId = doc(collection(db, '_')).id;
      
      // Find the class object to get proper ID
      const classObj = classObjects.find(c => c.name === className || c.id === className);
      const classId = classObj ? classObj.id : className;
      const displayClassName = classObj ? classObj.name : className;
      
      // Create subject name with class: "Science (Class 6)"
      const subjectName = `${subject.name} (${displayClassName})`;
      
      subjectObjects.push({ 
        id: subjectId, 
        name: subjectName, 
        classIds: [classId] // Each subject has only one class
      });
    }
  }
  
  // Check if email/username exists
  const usersRef = collection(db, COLLECTIONS.USERS);
  if (email) {
    const emailQuery = query(usersRef, where('email', '==', email.toLowerCase()));
    const emailSnapshot = await getDocs(emailQuery);
    if (!emailSnapshot.empty) throw new Error('Email already exists');
  }
  
  if (username) {
    const usernameQuery = query(usersRef, where('username', '==', username.toLowerCase()));
    const usernameSnapshot = await getDocs(usernameQuery);
    if (!usernameSnapshot.empty) throw new Error('Username already exists');
  }
  
  const userRef = doc(collection(db, COLLECTIONS.USERS));
  const userData = {
    name,
    email: email?.toLowerCase() || '',
    username: username?.toLowerCase() || '',
    passwordHash: hashPassword(password),
    role: 'independent_teacher',
    classes: classObjects,
    subjects: subjectObjects,
    referralCode,
    createdAt: Timestamp.now()
  };
  
  await setDoc(userRef, userData);
  
  return {
    id: userRef.id,
    name,
    email: email?.toLowerCase() || '',
    username: username?.toLowerCase() || '',
    role: 'independent_teacher',
    classes: classObjects,
    subjects: subjectObjects,
    referralCode,
    createdAt: new Date()
  };
};

export const getIndependentTeacherByReferralCode = async (referralCode: string): Promise<User | null> => {
  const usersRef = collection(db, COLLECTIONS.USERS);
  const q = query(usersRef, where('referralCode', '==', referralCode.toUpperCase()), where('role', '==', 'independent_teacher'));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return null;
  
  const userDoc = snapshot.docs[0];
  const data = userDoc.data();
  
  return {
    id: userDoc.id,
    name: data.name,
    email: data.email || '',
    username: data.username || '',
    role: 'independent_teacher',
    classes: data.classes || [],
    subjects: data.subjects || [],
    referralCode: data.referralCode,
    createdAt: toDate(data.createdAt)
  };
};

export const updateIndependentTeacher = async (
  userId: string,
  data: { classes?: { id: string; name: string }[]; subjects?: { id: string; name: string; classIds: string[] }[] }
): Promise<void> => {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  await updateDoc(userRef, { ...data, updatedAt: Timestamp.now() });
};

export const subscribeToIndependentTeacher = (
  userId: string,
  callback: (teacher: User | null) => void
): (() => void) => {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  
  return onSnapshot(userRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    
    const data = snapshot.data();
    callback({
      id: snapshot.id,
      name: data.name,
      email: data.email || '',
      username: data.username || '',
      role: 'independent_teacher',
      classes: data.classes || [],
      subjects: data.subjects || [],
      referralCode: data.referralCode,
      independentTeacherId: data.independentTeacherId,
      createdAt: toDate(data.createdAt)
    });
  });
};

// ==================== INSTITUTE ====================

export const createInstitute = async (
  name: string,
  ownerId: string,
  classes: string[],
  subjectData: { name: string; classIds: string[] }[]
): Promise<Institute> => {
  // Generate unique referral code
  let referralCode = generateReferralCode();
  let codeExists = true;
  
  while (codeExists) {
    const institutesRef = collection(db, COLLECTIONS.INSTITUTES);
    const q = query(institutesRef, where('referralCode', '==', referralCode));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      codeExists = false;
    } else {
      referralCode = generateReferralCode();
    }
  }
  
  const instituteRef = doc(collection(db, COLLECTIONS.INSTITUTES));
  
  // Create class objects
  const classObjects = classes.map((className) => ({
    id: doc(collection(db, '_')).id,
    name: className
  }));
  
  // Create separate subjects for each class-subject combination
  // E.g., "Science" for classes [6, 7, 10] becomes:
  // "Science (Class 6)", "Science (Class 7)", "Science (Class 10)"
  const subjectObjects: { id: string; name: string; classIds: string[] }[] = [];
  
  for (const subject of subjectData) {
    // For each class in the subject's classIds, create a separate subject
    for (const className of subject.classIds) {
      const subjectId = doc(collection(db, '_')).id;
      
      // Find the class object to get proper ID
      const classObj = classObjects.find(c => c.name === className || c.id === className);
      const classId = classObj ? classObj.id : className;
      const displayClassName = classObj ? classObj.name : className;
      
      // Create subject name with class: "Science (Class 6)"
      const subjectName = `${subject.name} (${displayClassName})`;
      
      subjectObjects.push({ 
        id: subjectId, 
        name: subjectName, 
        classIds: [classId] // Each subject has only one class
      });
    }
  }
  
  const instituteData = {
    name,
    referralCode,
    ownerId,
    classes: classObjects,
    subjects: subjectObjects,
    createdAt: Timestamp.now()
  };
  
  await setDoc(instituteRef, instituteData);
  
  // Create subject documents
  for (const subject of subjectObjects) {
    const subjectRef = doc(db, COLLECTIONS.SUBJECTS, subject.id);
    await setDoc(subjectRef, {
      name: subject.name,
      classIds: subject.classIds,
      instituteId: instituteRef.id,
      isDefault: false,
      createdAt: Timestamp.now()
    });
  }
  
  // Update owner's instituteId
  const ownerRef = doc(db, COLLECTIONS.USERS, ownerId);
  await updateDoc(ownerRef, {
    instituteId: instituteRef.id,
    updatedAt: Timestamp.now()
  });
  
  return {
    id: instituteRef.id,
    name,
    referralCode,
    ownerId,
    classes: classObjects,
    subjects: subjectObjects,
    createdAt: new Date()
  };
};

// New function to create institute with class entries (new flow)
export const createInstituteWithClasses = async (
  name: string,
  ownerId: string,
  classEntries: { classNumber: number; stream: string | null; subjectName: string; nickname: string | null; teacherId: string | null }[],
  teachers: { name: string; email: string; password: string }[]
): Promise<Institute> => {
  // First, check if all teacher usernames are available
  const usersRef = collection(db, COLLECTIONS.USERS);
  for (const teacher of teachers) {
    const username = teacher.email.split('@')[0].toLowerCase();
    const emailQuery = query(usersRef, where('email', '==', teacher.email.toLowerCase()));
    const emailSnapshot = await getDocs(emailQuery);
    if (!emailSnapshot.empty) {
      throw new Error(`Email "${teacher.email}" is already registered`);
    }
    
    const usernameQuery = query(usersRef, where('username', '==', username));
    const usernameSnapshot = await getDocs(usernameQuery);
    if (!usernameSnapshot.empty) {
      throw new Error(`Username "${username}" (from ${teacher.email}) is already taken. Please use a different email for teacher "${teacher.name}".`);
    }
  }
  
  // Generate unique referral code
  let referralCode = generateReferralCode();
  let codeExists = true;
  
  while (codeExists) {
    const institutesRef = collection(db, COLLECTIONS.INSTITUTES);
    const q = query(institutesRef, where('referralCode', '==', referralCode));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      codeExists = false;
    } else {
      referralCode = generateReferralCode();
    }
  }
  
  const instituteRef = doc(collection(db, COLLECTIONS.INSTITUTES));
  
  // Create class objects with teacher assignments
  const classObjects: { id: string; name: string; classNumber: number; stream: string | null; subjectName: string; nickname: string | null; teacherId: string | null }[] = [];
  const subjectObjects: { id: string; name: string; subjectName: string; classNumber: number; stream: string | null; classIds: string[] }[] = [];
  
  for (const entry of classEntries) {
    const classId = doc(collection(db, '_')).id;
    const subjectId = doc(collection(db, '_')).id;
    
    // Build display name
    const displayName = entry.nickname || (entry.stream ? `${entry.classNumber} ${entry.stream}` : `${entry.classNumber}`);
    const fullDisplayName = `${entry.subjectName} (${displayName})`;
    
    classObjects.push({
      id: classId,
      name: fullDisplayName,
      classNumber: entry.classNumber,
      stream: entry.stream,
      subjectName: entry.subjectName,
      nickname: entry.nickname,
      teacherId: entry.teacherId
    });
    
    subjectObjects.push({
      id: subjectId,
      name: fullDisplayName,
      subjectName: entry.subjectName,
      classNumber: entry.classNumber,
      stream: entry.stream,
      classIds: [classId]
    });
  }
  
  const instituteData = {
    name,
    referralCode,
    ownerId,
    classes: classObjects,
    subjects: subjectObjects,
    createdAt: Timestamp.now()
  };
  
  await setDoc(instituteRef, instituteData);
  
  // Create subject documents
  for (const subject of subjectObjects) {
    const subjectRef = doc(db, COLLECTIONS.SUBJECTS, subject.id);
    await setDoc(subjectRef, {
      name: subject.name,
      subjectName: subject.subjectName,
      classNumber: subject.classNumber,
      stream: subject.stream,
      classIds: subject.classIds,
      instituteId: instituteRef.id,
      isDefault: false,
      createdAt: Timestamp.now()
    });
  }
  
  // Create teachers with assignments
  const teacherUserIds: Record<string, string> = {};
  for (const teacher of teachers) {
    // Find classes assigned to this teacher
    const assignedClasses = classObjects.filter(c => c.teacherId === teacher.email || c.teacherId === teacher.name);
    
    const teacherAssignments = assignedClasses.map(cls => {
      const subject = subjectObjects.find(s => s.classIds.includes(cls.id));
      return {
        classId: cls.id,
        subjectId: subject?.id || ''
      };
    });
    
    const userRef = doc(collection(db, COLLECTIONS.USERS));
    teacherUserIds[teacher.email] = userRef.id;
    
    await setDoc(userRef, {
      name: teacher.name,
      email: teacher.email.toLowerCase(),
      username: teacher.email.split('@')[0].toLowerCase(),
      passwordHash: hashPassword(teacher.password),
      role: 'teacher',
      instituteId: instituteRef.id,
      assignments: teacherAssignments,
      createdAt: Timestamp.now()
    });
    
    // Update class objects with teacher NAME (not ID) for display purposes
    for (const cls of classObjects) {
      if (cls.teacherId === teacher.email || cls.teacherId === teacher.name) {
        cls.teacherId = teacher.name;  // Store teacher name for display
      }
    }
  }
  
  // Update institute with corrected teacher IDs
  await updateDoc(instituteRef, { classes: classObjects });
  
  return {
    id: instituteRef.id,
    name,
    referralCode,
    ownerId,
    classes: classObjects,
    subjects: subjectObjects,
    createdAt: new Date()
  };
};

// New function to create independent teacher with class entries
export const createIndependentTeacherWithClasses = async (
  name: string,
  email: string,
  username: string,
  password: string,
  classEntries: { classNumber: number; stream: string | null; subjectName: string; nickname: string | null; teacherId: string | null }[]
): Promise<User> => {
  // Generate unique referral code
  let referralCode = generateReferralCode();
  let codeExists = true;
  
  while (codeExists) {
    const usersRef = collection(db, COLLECTIONS.USERS);
    const q = query(usersRef, where('referralCode', '==', referralCode));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      codeExists = false;
    } else {
      referralCode = generateReferralCode();
    }
  }
  
  // Check if email/username exists
  const usersRef = collection(db, COLLECTIONS.USERS);
  if (email) {
    const emailQuery = query(usersRef, where('email', '==', email.toLowerCase()));
    const emailSnapshot = await getDocs(emailQuery);
    if (!emailSnapshot.empty) throw new Error('Email already exists');
  }
  
  if (username) {
    const usernameQuery = query(usersRef, where('username', '==', username.toLowerCase()));
    const usernameSnapshot = await getDocs(usernameQuery);
    if (!usernameSnapshot.empty) throw new Error('Username already exists');
  }
  
  // Create class and subject objects
  const classObjects: { id: string; name: string; classNumber: number; stream: string | null; subjectName: string; nickname: string | null }[] = [];
  const subjectObjects: { id: string; name: string; subjectName: string; classNumber: number; stream: string | null; classIds: string[] }[] = [];
  
  for (const entry of classEntries) {
    const classId = doc(collection(db, '_')).id;
    const subjectId = doc(collection(db, '_')).id;
    
    // Build display name
    const displayName = entry.nickname || (entry.stream ? `${entry.classNumber} ${entry.stream}` : `${entry.classNumber}`);
    const fullDisplayName = `${entry.subjectName} (${displayName})`;
    
    classObjects.push({
      id: classId,
      name: fullDisplayName,
      classNumber: entry.classNumber,
      stream: entry.stream,
      subjectName: entry.subjectName,
      nickname: entry.nickname
    });
    
    subjectObjects.push({
      id: subjectId,
      name: fullDisplayName,
      subjectName: entry.subjectName,
      classNumber: entry.classNumber,
      stream: entry.stream,
      classIds: [classId]
    });
  }
  
  const userRef = doc(collection(db, COLLECTIONS.USERS));
  const userData = {
    name,
    email: email?.toLowerCase() || '',
    username: username?.toLowerCase() || '',
    passwordHash: hashPassword(password),
    role: 'independent_teacher',
    classes: classObjects,
    subjects: subjectObjects,
    referralCode,
    createdAt: Timestamp.now()
  };
  
  await setDoc(userRef, userData);
  
  return {
    id: userRef.id,
    name,
    email: email?.toLowerCase() || '',
    username: username?.toLowerCase() || '',
    role: 'independent_teacher',
    classes: classObjects,
    subjects: subjectObjects,
    referralCode,
    createdAt: new Date()
  };
};

export const getInstitute = async (instituteId: string): Promise<Institute | null> => {
  const instituteRef = doc(db, COLLECTIONS.INSTITUTES, instituteId);
  const snapshot = await getDoc(instituteRef);
  
  if (!snapshot.exists()) {
    return null;
  }
  
  const data = snapshot.data();
  return {
    id: snapshot.id,
    name: data.name,
    referralCode: data.referralCode,
    ownerId: data.ownerId,
    classes: data.classes || [],
    subjects: (data.subjects || []).map((s: { id: string; name: string; classIds?: string[] }) => ({
      id: s.id,
      name: s.name,
      classIds: s.classIds || []
    })),
    createdAt: toDate(data.createdAt)
  };
};

export const getInstituteByReferralCode = async (referralCode: string): Promise<Institute | null> => {
  const institutesRef = collection(db, COLLECTIONS.INSTITUTES);
  const q = query(institutesRef, where('referralCode', '==', referralCode.toUpperCase()));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return null;
  }
  
  const doc = snapshot.docs[0];
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    referralCode: data.referralCode,
    ownerId: data.ownerId,
    classes: data.classes || [],
    subjects: (data.subjects || []).map((s: { id: string; name: string; classIds?: string[] }) => ({
      id: s.id,
      name: s.name,
      classIds: s.classIds || []
    })),
    createdAt: toDate(data.createdAt)
  };
};

export const subscribeToInstitute = (
  instituteId: string,
  callback: (institute: Institute | null) => void
): (() => void) => {
  const instituteRef = doc(db, COLLECTIONS.INSTITUTES, instituteId);
  
  return onSnapshot(instituteRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    
    const data = snapshot.data();
    callback({
      id: snapshot.id,
      name: data.name,
      referralCode: data.referralCode,
      ownerId: data.ownerId,
      classes: data.classes || [],
      subjects: (data.subjects || []).map((s: { id: string; name: string; classIds?: string[] }) => ({
        id: s.id,
        name: s.name,
        classIds: s.classIds || []
      })),
      createdAt: toDate(data.createdAt)
    });
  });
};

export const updateInstitute = async (
  instituteId: string,
  data: Partial<Pick<Institute, 'name' | 'classes' | 'subjects'>>
): Promise<void> => {
  const instituteRef = doc(db, COLLECTIONS.INSTITUTES, instituteId);
  await updateDoc(instituteRef, {
    ...data,
    updatedAt: Timestamp.now()
  });
};

// ==================== SUBJECTS ====================

export const getSubjects = async (instituteId?: string): Promise<Subject[]> => {
  const subjectsRef = collection(db, COLLECTIONS.SUBJECTS);
  const q = instituteId 
    ? query(subjectsRef, where('instituteId', '==', instituteId))
    : query(subjectsRef, where('isDefault', '==', true));
  
  const snapshot = await getDocs(q);
  
  const subjects: Subject[] = [];
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    // Get chapters for this subject
    const chaptersRef = collection(db, COLLECTIONS.SUBJECTS, doc.id, 'chapters');
    const chaptersSnapshot = await getDocs(chaptersRef);
    
    const chapters: Chapter[] = [];
    for (const chapterDoc of chaptersSnapshot.docs) {
      const chapterData = chapterDoc.data();
      const topicsRef = collection(db, COLLECTIONS.SUBJECTS, doc.id, 'chapters', chapterDoc.id, 'topics');
      const topicsSnapshot = await getDocs(topicsRef);
      
      const topics: Topic[] = topicsSnapshot.docs.map((topicDoc) => ({
        id: topicDoc.id,
        topicNo: topicDoc.data().topicNo,
        name: topicDoc.data().name,
        chapterId: chapterDoc.id
      })).sort((a, b) => a.topicNo - b.topicNo);
      
      chapters.push({
        id: chapterDoc.id,
        chapterNo: chapterData.chapterNo,
        name: chapterData.name,
        topics
      });
    }
    
    subjects.push({
      id: doc.id,
      name: data.name,
      classNumber: data.classNumber,
      instituteId: data.instituteId,
      isDefault: data.isDefault || false,
      chapters: chapters.sort((a, b) => a.chapterNo - b.chapterNo)
    });
  }
  
  return subjects;
};

export const subscribeToSubjects = (
  instituteId: string | null,
  callback: (subjects: Subject[]) => void
): (() => void) => {
  const subjectsRef = collection(db, COLLECTIONS.SUBJECTS);
  const q = instituteId
    ? query(subjectsRef, where('instituteId', '==', instituteId))
    : query(subjectsRef, where('isDefault', '==', true));
  
  return onSnapshot(q, async (snapshot) => {
    const subjects: Subject[] = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      // Get chapters for this subject
      const chaptersRef = collection(db, COLLECTIONS.SUBJECTS, doc.id, 'chapters');
      const chaptersSnapshot = await getDocs(chaptersRef);
      
      const chapters: Chapter[] = [];
      for (const chapterDoc of chaptersSnapshot.docs) {
        const chapterData = chapterDoc.data();
        const topicsRef = collection(db, COLLECTIONS.SUBJECTS, doc.id, 'chapters', chapterDoc.id, 'topics');
        const topicsSnapshot = await getDocs(topicsRef);
        
        const topics: Topic[] = topicsSnapshot.docs.map((topicDoc) => ({
          id: topicDoc.id,
          topicNo: topicDoc.data().topicNo,
          name: topicDoc.data().name,
          chapterId: chapterDoc.id
        })).sort((a, b) => a.topicNo - b.topicNo);
        
        chapters.push({
          id: chapterDoc.id,
          chapterNo: chapterData.chapterNo,
          name: chapterData.name,
          topics
        });
      }
      
      subjects.push({
        id: doc.id,
        name: data.name,
        classNumber: data.classNumber,
        instituteId: data.instituteId,
        isDefault: data.isDefault || false,
        chapters: chapters.sort((a, b) => a.chapterNo - b.chapterNo)
      });
    }
    
    callback(subjects);
  });
};

// ==================== TAUGHT PROGRESS (Teacher Syllabus Completion) ====================

export interface TaughtProgressItem {
  id: string;
  topicId: string;
  taught: boolean;
  taughtAt?: Date;
}

export interface TaughtProgress {
  id: string;
  teacherId: string;
  subjectId: string;
  instituteId?: string;
  independentTeacherId?: string;
  overallProgress: number;
  items: TaughtProgressItem[];
  updatedAt: Date;
}

// Initialize taught progress for a teacher on a subject
export const initializeTaughtProgress = async (
  teacherId: string,
  subjectId: string,
  chapters: { id: string; topics: { id: string }[] }[],
  options?: { instituteId?: string; independentTeacherId?: string }
): Promise<void> => {
  const progressId = `${teacherId}_${subjectId}_taught`;
  const progressRef = doc(db, COLLECTIONS.PROGRESS, progressId);
  
  const existingProgress = await getDoc(progressRef);
  if (existingProgress.exists()) {
    console.log('Taught progress already exists');
    return;
  }
  
  const items: TaughtProgressItem[] = [];
  
  for (const chapter of chapters) {
    for (const topic of chapter.topics) {
      items.push({
        id: `${teacherId}_${topic.id}_taught`,
        topicId: topic.id,
        taught: false
      });
    }
  }
  
  await setDoc(progressRef, {
    teacherId,
    subjectId,
    instituteId: options?.instituteId || null,
    independentTeacherId: options?.independentTeacherId || null,
    overallProgress: 0,
    items,
    type: 'taught',
    updatedAt: Timestamp.now()
  });
};

// Update taught status for a topic
export const updateTaughtProgressItem = async (
  teacherId: string,
  subjectId: string,
  topicId: string,
  taught: boolean
): Promise<void> => {
  const progressId = `${teacherId}_${subjectId}_taught`;
  const progressRef = doc(db, COLLECTIONS.PROGRESS, progressId);
  
  let progressDoc = await getDoc(progressRef);
  
  if (!progressDoc.exists()) {
    console.log('Taught progress not found');
    return;
  }
  
  const data = progressDoc.data();
  let items = data.items || [];
  
  const updatedItems = items.map((item: TaughtProgressItem) =>
    item.topicId === topicId 
      ? { ...item, taught, taughtAt: taught ? Timestamp.now() : null } 
      : item
  );
  
  // Calculate overall progress
  const taughtCount = updatedItems.filter((item: TaughtProgressItem) => item.taught).length;
  const totalCount = updatedItems.length;
  const overallProgress = totalCount > 0 ? Math.round((taughtCount / totalCount) * 100) : 0;
  
  await setDoc(progressRef, {
    ...data,
    items: updatedItems,
    overallProgress,
    updatedAt: Timestamp.now()
  });
};

// Subscribe to taught progress
export const subscribeToTaughtProgress = (
  teacherId: string,
  subjectId: string,
  callback: (progress: TaughtProgress | null) => void
): (() => void) => {
  const progressId = `${teacherId}_${subjectId}_taught`;
  const progressRef = doc(db, COLLECTIONS.PROGRESS, progressId);
  
  return onSnapshot(progressRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    
    const data = snapshot.data();
    callback({
      id: snapshot.id,
      teacherId: data.teacherId,
      subjectId: data.subjectId,
      instituteId: data.instituteId,
      independentTeacherId: data.independentTeacherId,
      overallProgress: data.overallProgress || 0,
      items: (data.items || []).map((item: any) => ({
        id: item.id,
        topicId: item.topicId,
        taught: item.taught || false,
        taughtAt: item.taughtAt ? toDate(item.taughtAt) : undefined
      })),
      updatedAt: toDate(data.updatedAt)
    });
  });
};

// Get all taught progress for an institute
export const subscribeToAllTaughtProgressForInstitute = (
  instituteId: string,
  callback: (progress: TaughtProgress[]) => void
): (() => void) => {
  const progressRef = collection(db, COLLECTIONS.PROGRESS);
  const q = query(progressRef, where('instituteId', '==', instituteId), where('type', '==', 'taught'));
  
  return onSnapshot(q, (snapshot) => {
    const progressData: TaughtProgress[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        teacherId: data.teacherId,
        subjectId: data.subjectId,
        instituteId: data.instituteId,
        independentTeacherId: data.independentTeacherId,
        overallProgress: data.overallProgress || 0,
        items: (data.items || []).map((item: any) => ({
          id: item.id,
          topicId: item.topicId,
          taught: item.taught || false,
          taughtAt: item.taughtAt ? toDate(item.taughtAt) : undefined
        })),
        updatedAt: toDate(data.updatedAt)
      };
    });
    callback(progressData);
  });
};

// Get taught progress for independent teacher
export const subscribeToTaughtProgressForIndependentTeacher = (
  teacherId: string,
  callback: (progress: TaughtProgress[]) => void
): (() => void) => {
  const progressRef = collection(db, COLLECTIONS.PROGRESS);
  const q = query(progressRef, where('teacherId', '==', teacherId), where('type', '==', 'taught'));
  
  return onSnapshot(q, (snapshot) => {
    const progressData: TaughtProgress[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        teacherId: data.teacherId,
        subjectId: data.subjectId,
        instituteId: data.instituteId,
        independentTeacherId: data.independentTeacherId,
        overallProgress: data.overallProgress || 0,
        items: (data.items || []).map((item: any) => ({
          id: item.id,
          topicId: item.topicId,
          taught: item.taught || false,
          taughtAt: item.taughtAt ? toDate(item.taughtAt) : undefined
        })),
        updatedAt: toDate(data.updatedAt)
      };
    });
    callback(progressData);
  });
};

// ==================== PROGRESS ====================

export const initializeProgress = async (userId: string, subjectId: string): Promise<void> => {
  const progressId = `${userId}_${subjectId}`;
  const progressRef = doc(db, COLLECTIONS.PROGRESS, progressId);
  
  const existingProgress = await getDoc(progressRef);
  if (existingProgress.exists()) {
    console.log('Progress already exists for user:', userId, 'subject:', subjectId);
    return;
  }
  
  console.log('Initializing new progress for user:', userId, 'subject:', subjectId);
  
  // Get chapters for this subject
  const chaptersRef = collection(db, COLLECTIONS.SUBJECTS, subjectId, 'chapters');
  const chaptersSnapshot = await getDocs(chaptersRef);
  
  const items: ProgressItem[] = [];
  const hotsCompleted: Record<string, boolean> = {};
  
  for (const chapterDoc of chaptersSnapshot.docs) {
    const topicsRef = collection(db, COLLECTIONS.SUBJECTS, subjectId, 'chapters', chapterDoc.id, 'topics');
    const topicsSnapshot = await getDocs(topicsRef);
    
    topicsSnapshot.docs.forEach((topicDoc) => {
      items.push({
        id: `${userId}_${topicDoc.id}`,
        topicId: topicDoc.id,
        lectureCompleted: false,
        ncertCompleted: false,
        level1Completed: false,
        level2Completed: false,
        notesCompleted: false
      });
    });
    
    hotsCompleted[chapterDoc.id] = false;
  }
  
  await setDoc(progressRef, {
    userId,
    subjectId,
    overallProgress: 0,
    items,
    hotsCompleted,
    updatedAt: Timestamp.now()
  });
};

export const subscribeToProgress = (
  userId: string,
  subjectId: string,
  callback: (progress: Progress | null) => void
): (() => void) => {
  const progressId = `${userId}_${subjectId}`;
  const progressRef = doc(db, COLLECTIONS.PROGRESS, progressId);
  
  return onSnapshot(progressRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    
    const data = snapshot.data();
    callback({
      id: snapshot.id,
      userId: data.userId,
      subjectId: data.subjectId,
      overallProgress: data.overallProgress || 0,
      items: data.items || [],
      hotsCompleted: data.hotsCompleted || {},
      updatedAt: toDate(data.updatedAt)
    });
  });
};

export const updateProgressItem = async (
  userId: string,
  subjectId: string,
  topicId: string,
  field: keyof Omit<ProgressItem, 'id' | 'topicId'>,
  value: boolean
): Promise<void> => {
  const progressId = `${userId}_${subjectId}`;
  const progressRef = doc(db, COLLECTIONS.PROGRESS, progressId);
  let progressDoc = await getDoc(progressRef);
  
  if (!progressDoc.exists()) {
    await initializeProgress(userId, subjectId);
    progressDoc = await getDoc(progressRef);
  }
  
  const data = progressDoc.exists() ? progressDoc.data() : { items: [] };
  let items = data.items || [];
  
  const topicExists = items.some((item: ProgressItem) => item.topicId === topicId);
  
  if (!topicExists) {
    items = [
      ...items,
      {
        id: `${userId}_${topicId}`,
        topicId,
        lectureCompleted: false,
        ncertCompleted: false,
        level1Completed: false,
        level2Completed: false,
        notesCompleted: false
      }
    ];
  }
  
  const updatedItems = items.map((item: ProgressItem) =>
    item.topicId === topicId ? { ...item, [field]: value } : item
  );
  
  const totalTopicsCount = updatedItems.length;
  let totalProgress = 0;
  updatedItems.forEach((item: ProgressItem) => {
    const completed = [
      item.lectureCompleted,
      item.ncertCompleted,
      item.level1Completed,
      item.level2Completed,
      item.notesCompleted,
    ].filter(Boolean).length;
    totalProgress += (completed / 5) * 100;
  });
  
  const overallProgress = totalTopicsCount > 0 ? totalProgress / totalTopicsCount : 0;
  
  await setDoc(progressRef, {
    userId,
    subjectId,
    items: updatedItems,
    overallProgress,
    hotsCompleted: data.hotsCompleted || {},
    updatedAt: Timestamp.now()
  });
  
  if (value === true) {
    const logRef = doc(collection(db, COLLECTIONS.ACTIVITY_LOG));
    await setDoc(logRef, {
      userId,
      type: 'progress',
      action: `Completed ${field.replace('Completed', '')}`,
      details: `Topic: ${topicId}`,
      createdAt: Timestamp.now()
    });
  }
};

// ==================== SYNC SYLLABUS TO STUDENTS ====================

// Sync custom subject syllabus changes to all enrolled students
export const syncSyllabusToStudents = async (
  subjectId: string,
  classId: string,
  instituteId?: string,
  independentTeacherId?: string
): Promise<{ success: boolean; studentsUpdated: number }> => {
  try {
    // Get all students enrolled in this class-subject
    const usersRef = collection(db, COLLECTIONS.USERS);
    let q;
    
    if (instituteId) {
      q = query(usersRef, 
        where('role', '==', 'student'),
        where('instituteId', '==', instituteId),
        where('classId', '==', classId)
      );
    } else if (independentTeacherId) {
      q = query(usersRef, 
        where('role', '==', 'student'),
        where('independentTeacherId', '==', independentTeacherId),
        where('classId', '==', classId)
      );
    } else {
      return { success: false, studentsUpdated: 0 };
    }
    
    const studentsSnapshot = await getDocs(q);
    
    // Get the subject with all chapters and topics
    const subjectRef = doc(db, COLLECTIONS.SUBJECTS, subjectId);
    const subjectDoc = await getDoc(subjectRef);
    
    if (!subjectDoc.exists()) {
      return { success: false, studentsUpdated: 0 };
    }
    
    // Get all chapters and topics
    const chaptersRef = collection(db, COLLECTIONS.SUBJECTS, subjectId, 'chapters');
    const chaptersSnapshot = await getDocs(chaptersRef);
    
    const allTopicIds: string[] = [];
    for (const chapterDoc of chaptersSnapshot.docs) {
      const topicsRef = collection(db, COLLECTIONS.SUBJECTS, subjectId, 'chapters', chapterDoc.id, 'topics');
      const topicsSnapshot = await getDocs(topicsRef);
      topicsSnapshot.docs.forEach(topicDoc => {
        allTopicIds.push(topicDoc.id);
      });
    }
    
    // Update progress for each student
    let studentsUpdated = 0;
    for (const studentDoc of studentsSnapshot.docs) {
      const studentId = studentDoc.id;
      const progressId = `${studentId}_${subjectId}`;
      const progressRef = doc(db, COLLECTIONS.PROGRESS, progressId);
      const progressDoc = await getDoc(progressRef);
      
      if (progressDoc.exists()) {
        const existingItems = progressDoc.data().items || [];
        const existingTopicIds = existingItems.map((item: ProgressItem) => item.topicId);
        
        // Add new topics that don't exist in progress
        const newTopics = allTopicIds.filter(topicId => !existingTopicIds.includes(topicId));
        const newItems = newTopics.map(topicId => ({
          id: doc(collection(db, '_')).id,
          topicId,
          lectureCompleted: false,
          ncertCompleted: false,
          level1Completed: false,
          level2Completed: false,
          notesCompleted: false
        }));
        
        // Keep existing items that are still in the syllabus
        const updatedItems = existingItems.filter((item: ProgressItem) => 
          allTopicIds.includes(item.topicId)
        );
        
        const allItems = [...updatedItems, ...newItems];
        
        // Calculate overall progress
        let totalProgress = 0;
        allItems.forEach((item: ProgressItem) => {
          const completed = [
            item.lectureCompleted,
            item.ncertCompleted,
            item.level1Completed,
            item.level2Completed,
            item.notesCompleted,
          ].filter(Boolean).length;
          totalProgress += (completed / 5) * 100;
        });
        
        const overallProgress = allItems.length > 0 ? totalProgress / allItems.length : 0;
        
        await setDoc(progressRef, {
          userId: studentId,
          subjectId,
          items: allItems,
          overallProgress,
          hotsCompleted: progressDoc.data().hotsCompleted || {},
          updatedAt: Timestamp.now()
        });
      } else {
        // Initialize new progress for this student
        const newItems = allTopicIds.map(topicId => ({
          id: doc(collection(db, '_')).id,
          topicId,
          lectureCompleted: false,
          ncertCompleted: false,
          level1Completed: false,
          level2Completed: false,
          notesCompleted: false
        }));
        
        await setDoc(progressRef, {
          userId: studentId,
          subjectId,
          items: newItems,
          overallProgress: 0,
          hotsCompleted: {},
          updatedAt: Timestamp.now()
        });
      }
      
      studentsUpdated++;
    }
    
    return { success: true, studentsUpdated };
  } catch (error) {
    console.error('Error syncing syllabus to students:', error);
    return { success: false, studentsUpdated: 0 };
  }
};

// ==================== USERS LIST ====================

// Get all students (non-subscription version)
export const getAllStudents = async (): Promise<User[]> => {
  const usersRef = collection(db, COLLECTIONS.USERS);
  const snapshot = await getDocs(usersRef);
  
  return snapshot.docs
    .filter((doc) => doc.data().role === 'student')
    .map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        email: data.email || '',
        username: data.username || '',
        role: data.role,
        instituteId: data.instituteId,
        assignedClassId: data.assignedClassId,
        assignedSubjectId: data.assignedSubjectId,
        classId: data.classId,
        independentTeacherId: data.independentTeacherId,
        createdAt: toDate(data.createdAt)
      };
    });
};

export const subscribeToAllStudents = (
  callback: (students: User[]) => void,
  instituteId?: string,
  classId?: string,
  subjectId?: string
): (() => void) => {
  const usersRef = collection(db, COLLECTIONS.USERS);
  
  return onSnapshot(usersRef, (snapshot) => {
    const students: User[] = snapshot.docs
      .filter((doc) => {
        const data = doc.data();
        const isStudent = data.role === 'student';
        const matchesInstitute = !instituteId || data.instituteId === instituteId;
        
        // Check if student matches class - check both classId and enrollments
        let matchesClass = !classId;
        if (classId) {
          // Check direct classId
          if (data.classId === classId) {
            matchesClass = true;
          }
          // Check enrollments array
          else if (data.enrollments && Array.isArray(data.enrollments)) {
            matchesClass = data.enrollments.some((e: { classId?: string; subjectId?: string }) => 
              e.classId === classId || (subjectId && e.subjectId === subjectId)
            );
          }
        }
        
        return isStudent && matchesInstitute && matchesClass;
      })
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          email: data.email || '',
          username: data.username || '',
          role: data.role,
          instituteId: data.instituteId,
          assignedClassId: data.assignedClassId,
          assignedSubjectId: data.assignedSubjectId,
          classId: data.classId,
          independentTeacherId: data.independentTeacherId,
          enrollments: data.enrollments || undefined,
          createdAt: toDate(data.createdAt)
        };
      });
    
    callback(students);
  });
};

export const subscribeToAllTeachers = (
  callback: (teachers: User[]) => void,
  instituteId?: string
): (() => void) => {
  const usersRef = collection(db, COLLECTIONS.USERS);
  
  return onSnapshot(usersRef, (snapshot) => {
    const teachers: User[] = snapshot.docs
      .filter((doc) => {
        const data = doc.data();
        const isTeacher = data.role === 'teacher';
        const matchesInstitute = !instituteId || data.instituteId === instituteId;
        return isTeacher && matchesInstitute;
      })
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          email: data.email || '',
          username: data.username || '',
          role: data.role,
          instituteId: data.instituteId,
          assignedClassId: data.assignedClassId,
          assignedSubjectId: data.assignedSubjectId,
          classId: data.classId,
          assignments: data.assignments || undefined,
          createdAt: toDate(data.createdAt)
        };
      });
    
    callback(teachers);
  });
};

export const subscribeToAllUsers = (
  callback: (users: User[]) => void
): (() => void) => {
  const usersRef = collection(db, COLLECTIONS.USERS);
  
  return onSnapshot(usersRef, (snapshot) => {
    const users: User[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        email: data.email || '',
        username: data.username || '',
        role: data.role,
        instituteId: data.instituteId,
        assignedClassId: data.assignedClassId,
        assignedSubjectId: data.assignedSubjectId,
        classId: data.classId,
        createdAt: toDate(data.createdAt)
      };
    });
    callback(users);
  });
};

export const subscribeToAllProgress = (
  callback: (progress: Progress[]) => void,
  subjectId?: string
): (() => void) => {
  const progressRef = collection(db, COLLECTIONS.PROGRESS);
  
  return onSnapshot(progressRef, (snapshot) => {
    const progress: Progress[] = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        userId: doc.data().userId,
        subjectId: doc.data().subjectId,
        overallProgress: doc.data().overallProgress || 0,
        items: doc.data().items || [],
        hotsCompleted: doc.data().hotsCompleted || {},
        updatedAt: toDate(doc.data().updatedAt)
      }))
      .filter((p) => !subjectId || p.subjectId === subjectId);
    callback(progress);
  });
};

// Subscribe to all progress without filtering (for superadmin)
export const subscribeToAllProgressUnfiltered = (
  callback: (progress: Progress[]) => void
): (() => void) => {
  const progressRef = collection(db, COLLECTIONS.PROGRESS);
  
  return onSnapshot(progressRef, (snapshot) => {
    const progress: Progress[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      userId: doc.data().userId,
      subjectId: doc.data().subjectId,
      overallProgress: doc.data().overallProgress || 0,
      items: doc.data().items || [],
      hotsCompleted: doc.data().hotsCompleted || {},
      updatedAt: toDate(doc.data().updatedAt)
    }));
    callback(progress);
  });
};

// ==================== TESTS ====================

export const createTest = async (
  chapterId: string,
  subjectId: string,
  testName: string,
  maxMarks: number
): Promise<Test> => {
  const testsRef = collection(db, COLLECTIONS.TESTS);
  const newRef = doc(testsRef);
  
  const test = {
    id: newRef.id,
    chapterId,
    subjectId,
    testName,
    maxMarks,
    createdAt: Timestamp.now()
  };
  
  await setDoc(newRef, test);
  
  return {
    ...test,
    createdAt: new Date()
  } as Test;
};

export const subscribeToTests = (
  callback: (tests: Test[]) => void,
  subjectId?: string
): (() => void) => {
  const testsRef = collection(db, COLLECTIONS.TESTS);
  
  return onSnapshot(testsRef, (snapshot) => {
    const tests: Test[] = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        chapterId: doc.data().chapterId,
        subjectId: doc.data().subjectId,
        testName: doc.data().testName,
        maxMarks: doc.data().maxMarks,
        createdAt: toDate(doc.data().createdAt)
      }))
      .filter((t) => !subjectId || t.subjectId === subjectId);
    callback(tests);
  });
};

export const subscribeToTestMarks = (
  callback: (testMarks: TestMarks[]) => void
): (() => void) => {
  const testMarksRef = collection(db, COLLECTIONS.TEST_MARKS);
  
  return onSnapshot(testMarksRef, (snapshot) => {
    const testMarks: TestMarks[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      testId: doc.data().testId,
      userId: doc.data().userId,
      chapterId: doc.data().chapterId,
      subjectId: doc.data().subjectId || '',
      marks: doc.data().marks,
      maxMarks: doc.data().maxMarks
    }));
    callback(testMarks);
  });
};

// Delete a test and all its marks
export const deleteTest = async (testId: string): Promise<void> => {
  // Delete all marks for this test
  const testMarksRef = collection(db, COLLECTIONS.TEST_MARKS);
  const q = query(testMarksRef, where('testId', '==', testId));
  const snapshot = await getDocs(q);
  
  const batch = writeBatch(db);
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
  
  // Delete the test
  await deleteDoc(doc(db, COLLECTIONS.TESTS, testId));
};

// Enter marks for a student in a test
export const enterTestMarks = async (
  testId: string,
  userId: string,
  chapterId: string,
  subjectId: string,
  marks: number,
  maxMarks: number
): Promise<void> => {
  // Check if marks already exist for this test and student
  const testMarksRef = collection(db, COLLECTIONS.TEST_MARKS);
  const q = query(
    testMarksRef,
    where('testId', '==', testId),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    // Create new
    const newRef = doc(collection(db, COLLECTIONS.TEST_MARKS));
    await setDoc(newRef, {
      testId,
      userId,
      chapterId,
      subjectId,
      marks,
      maxMarks,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  } else {
    // Update existing
    await updateDoc(snapshot.docs[0].ref, {
      marks,
      maxMarks,
      updatedAt: Timestamp.now()
    });
  }
};

// ==================== DISCIPLINE STARS ====================

export const subscribeToDisciplineStars = (
  userId: string,
  callback: (stars: DisciplineStars | null) => void
): (() => void) => {
  const starsRef = doc(db, COLLECTIONS.DISCIPLINE_STARS, userId);
  
  return onSnapshot(starsRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    
    callback({
      id: snapshot.id,
      userId: snapshot.data().userId,
      stars: snapshot.data().stars || 0
    });
  });
};

export const subscribeToAllDisciplineStars = (
  callback: (stars: DisciplineStars[]) => void
): (() => void) => {
  const starsRef = collection(db, COLLECTIONS.DISCIPLINE_STARS);
  
  return onSnapshot(starsRef, (snapshot) => {
    const stars: DisciplineStars[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      userId: doc.data().userId,
      stars: doc.data().stars || 0
    }));
    callback(stars);
  });
};

export const updateDisciplineStars = async (
  userId: string,
  change: number,
  reason: string
): Promise<void> => {
  const starsRef = doc(db, COLLECTIONS.DISCIPLINE_STARS, userId);
  const existingDoc = await getDoc(starsRef);
  
  let currentStars = 0;
  if (existingDoc.exists()) {
    currentStars = existingDoc.data().stars || 0;
  }
  
  const newStars = Math.max(0, currentStars + change);
  
  await setDoc(starsRef, {
    userId,
    stars: newStars,
    updatedAt: Timestamp.now()
  });
  
  await addActivityLog(userId, 'discipline', 
    change > 0 ? `Earned ${change} ⭐` : `Lost ${Math.abs(change)} ⭐`,
    reason,
    change
  );
};

export const initializeDisciplineStars = async (userId: string): Promise<void> => {
  const starsRef = doc(db, COLLECTIONS.DISCIPLINE_STARS, userId);
  const existingDoc = await getDoc(starsRef);
  
  if (!existingDoc.exists()) {
    await setDoc(starsRef, {
      userId,
      stars: 0,
      createdAt: Timestamp.now()
    });
  }
};

// ==================== ACTIVITY LOG ====================

export const addActivityLog = async (
  userId: string,
  type: 'progress' | 'test' | 'discipline',
  action: string,
  details: string,
  change?: number
): Promise<void> => {
  const logRef = doc(collection(db, COLLECTIONS.ACTIVITY_LOG));
  
  await setDoc(logRef, {
    userId,
    type,
    action,
    details,
    change,
    createdAt: Timestamp.now()
  });
};

export const subscribeToActivityLog = (
  userId: string,
  callback: (logs: ActivityLog[]) => void
): (() => void) => {
  const logRef = collection(db, COLLECTIONS.ACTIVITY_LOG);
  const q = query(logRef, where('userId', '==', userId));
  
  return onSnapshot(q, (snapshot) => {
    const logs: ActivityLog[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      userId: doc.data().userId,
      type: doc.data().type,
      action: doc.data().action,
      details: doc.data().details,
      change: doc.data().change,
      createdAt: toDate(doc.data().createdAt)
    }));
    
    callback(logs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 50));
  });
};

// ==================== STREAK ====================

const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

const getYesterdayDateString = (): string => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
};

export const updateStreakOnLogin = async (userId: string): Promise<{
  streak: number;
  milestone: number | null;
}> => {
  const streakRef = doc(db, COLLECTIONS.STREAKS, userId);
  let streakDoc = await getDoc(streakRef);
  
  if (!streakDoc.exists()) {
    await setDoc(streakRef, {
      userId,
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: '',
      createdAt: Timestamp.now()
    });
    streakDoc = await getDoc(streakRef);
  }
  
  const data = streakDoc.data();
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();
  
  let currentStreak = data?.currentStreak || 0;
  let longestStreak = data?.longestStreak || 0;
  const lastActiveDate = data?.lastActiveDate || '';
  
  if (lastActiveDate === today) {
    return { streak: currentStreak, milestone: null };
  }
  
  if (lastActiveDate === yesterday) {
    currentStreak += 1;
  } else if (lastActiveDate === '') {
    currentStreak = 1;
  } else {
    currentStreak = 1;
  }
  
  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }
  
  await setDoc(streakRef, {
    userId,
    currentStreak,
    longestStreak,
    lastActiveDate: today,
    updatedAt: Timestamp.now()
  });
  
  const milestone = STREAK_MILESTONES[currentStreak] ? currentStreak : null;
  
  return { streak: currentStreak, milestone };
};

export const subscribeToStreak = (
  userId: string,
  callback: (streak: StreakData | null) => void
): (() => void) => {
  const streakRef = doc(db, COLLECTIONS.STREAKS, userId);
  
  return onSnapshot(streakRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    
    callback({
      id: snapshot.id,
      userId: snapshot.data().userId,
      currentStreak: snapshot.data().currentStreak || 0,
      longestStreak: snapshot.data().longestStreak || 0,
      lastActiveDate: snapshot.data().lastActiveDate || ''
    });
  });
};

// ==================== INSTITUTES LIST (SuperAdmin) ====================

export const subscribeToAllInstitutes = (
  callback: (institutes: Institute[]) => void
): (() => void) => {
  const institutesRef = collection(db, COLLECTIONS.INSTITUTES);
  
  return onSnapshot(institutesRef, (snapshot) => {
    const institutes: Institute[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        referralCode: data.referralCode,
        ownerId: data.ownerId,
        classes: data.classes || [],
        subjects: data.subjects || [],
        createdAt: toDate(data.createdAt)
      };
    });
    callback(institutes);
  });
};

// ==================== CONNECTION CHECK ====================

export const checkFirebaseConnection = async (): Promise<boolean> => {
  try {
    const testRef = doc(db, '_test', 'connection');
    await getDoc(testRef);
    return true;
  } catch (error) {
    console.error('Firebase connection error:', error);
    return false;
  }
};

// ==================== SEED DEFAULT SUBJECTS ====================

export const seedDefaultSubjects = async (): Promise<void> => {
  const subjectsRef = collection(db, COLLECTIONS.SUBJECTS);
  const existingSubjects = await getDocs(query(subjectsRef, where('isDefault', '==', true)));
  
  if (!existingSubjects.empty) {
    console.log('Default subjects already seeded');
    return;
  }
  
  // Chemistry chapters (existing)
  const chemistryChapters = [
    {
      chapterNo: 1,
      name: "Solutions",
      topics: [
        { topicNo: 1, name: "Types of solutions" },
        { topicNo: 2, name: "Concentration Terms and Numericals" },
        { topicNo: 3, name: "Solubility of solid in liquids" },
        { topicNo: 4, name: "Solubility of gases in liquids (Henry's law)" },
        { topicNo: 5, name: "Vapour Pressure & Raoult's law" },
        { topicNo: 6, name: "Colligative Properties - Relative lowering of vapour pressure" },
        { topicNo: 7, name: "Colligative Properties - Elevation of boiling point" },
        { topicNo: 8, name: "Colligative Properties - Depression of freezing point" },
        { topicNo: 9, name: "Colligative Properties - Osmotic pressure" },
        { topicNo: 10, name: "Abnormal molecular mass & Van't Hoff factor" }
      ]
    },
    {
      chapterNo: 2,
      name: "Electrochemistry",
      topics: [
        { topicNo: 1, name: "Redox reactions (recapitulation)" },
        { topicNo: 2, name: "Standard electrode potential & EMF" },
        { topicNo: 3, name: "Nernst equation, Gibbs Energy & Equilibrium" },
        { topicNo: 4, name: "Conductance, conductivity and molar conductivity" },
        { topicNo: 5, name: "Variation of conductivity with concentration" },
        { topicNo: 6, name: "Kohlrausch's law" },
        { topicNo: 7, name: "Faraday's laws of electrolysis" },
        { topicNo: 8, name: "Types of cells - Primary, Secondary, Fuel Cell" }
      ]
    },
    {
      chapterNo: 3,
      name: "Chemical Kinetics",
      topics: [
        { topicNo: 1, name: "Rate of a reaction" },
        { topicNo: 2, name: "Rate law & Factors affecting rate" },
        { topicNo: 3, name: "Rate constant, Order of a reaction" },
        { topicNo: 4, name: "Molecularity of a reaction" },
        { topicNo: 5, name: "Integrated rate equations - Zero Order" },
        { topicNo: 6, name: "Integrated rate equations - First Order" },
        { topicNo: 7, name: "Pseudo first-order reactions" },
        { topicNo: 8, name: "Arrhenius equation, Activation energy" },
        { topicNo: 9, name: "Effect of Catalyst & Collision theory" }
      ]
    }
  ];
  
  // Physics chapters
  const physicsChapters = [
    {
      chapterNo: 1,
      name: "Electric Charges and Fields",
      topics: [
        { topicNo: 1, name: "Electric Charges" },
        { topicNo: 2, name: "Coulomb's Law" },
        { topicNo: 3, name: "Electric Field" },
        { topicNo: 4, name: "Electric Field Lines" },
        { topicNo: 5, name: "Electric Dipole" },
        { topicNo: 6, name: "Gauss's Law" },
        { topicNo: 7, name: "Applications of Gauss's Law" }
      ]
    },
    {
      chapterNo: 2,
      name: "Electrostatic Potential and Capacitance",
      topics: [
        { topicNo: 1, name: "Electric Potential" },
        { topicNo: 2, name: "Potential due to Point Charge" },
        { topicNo: 3, name: "Potential due to Electric Dipole" },
        { topicNo: 4, name: "Equipotential Surfaces" },
        { topicNo: 5, name: "Capacitors and Capacitance" },
        { topicNo: 6, name: "Combination of Capacitors" },
        { topicNo: 7, name: "Energy Stored in Capacitor" }
      ]
    }
  ];
  
  // Mathematics chapters
  const mathsChapters = [
    {
      chapterNo: 1,
      name: "Relations and Functions",
      topics: [
        { topicNo: 1, name: "Types of Relations" },
        { topicNo: 2, name: "Types of Functions" },
        { topicNo: 3, name: "Composition of Functions" },
        { topicNo: 4, name: "Inverse Functions" },
        { topicNo: 5, name: "Binary Operations" }
      ]
    },
    {
      chapterNo: 2,
      name: "Inverse Trigonometric Functions",
      topics: [
        { topicNo: 1, name: "Basic Concepts" },
        { topicNo: 2, name: "Properties of Inverse Trigonometric Functions" }
      ]
    }
  ];
  
  // Biology chapters
  const biologyChapters = [
    {
      chapterNo: 1,
      name: "Reproduction in Organisms",
      topics: [
        { topicNo: 1, name: "Life Span" },
        { topicNo: 2, name: "Asexual Reproduction" },
        { topicNo: 3, name: "Sexual Reproduction" },
        { topicNo: 4, name: "Vegetative Propagation" }
      ]
    },
    {
      chapterNo: 2,
      name: "Sexual Reproduction in Flowering Plants",
      topics: [
        { topicNo: 1, name: "Flower Structure" },
        { topicNo: 2, name: "Pollination" },
        { topicNo: 3, name: "Double Fertilization" },
        { topicNo: 4, name: "Seed and Fruit Formation" }
      ]
    }
  ];
  
  const defaultSubjects = [
    { name: 'Chemistry', chapters: chemistryChapters },
    { name: 'Physics', chapters: physicsChapters },
    { name: 'Mathematics', chapters: mathsChapters },
    { name: 'Biology', chapters: biologyChapters }
  ];
  
  for (const subjectData of defaultSubjects) {
    const subjectRef = doc(collection(db, COLLECTIONS.SUBJECTS));
    await setDoc(subjectRef, {
      name: subjectData.name,
      instituteId: null,
      isDefault: true,
      createdAt: Timestamp.now()
    });
    
    for (const chapterData of subjectData.chapters) {
      const chapterRef = doc(collection(db, COLLECTIONS.SUBJECTS, subjectRef.id, 'chapters'));
      await setDoc(chapterRef, {
        chapterNo: chapterData.chapterNo,
        name: chapterData.name
      });
      
      for (const topicData of chapterData.topics) {
        const topicRef = doc(collection(db, COLLECTIONS.SUBJECTS, subjectRef.id, 'chapters', chapterRef.id, 'topics'));
        await setDoc(topicRef, topicData);
      }
    }
  }
  
  console.log('Default subjects seeded successfully!');
};

// ==================== SEED SUPERADMIN ====================

export const seedSuperAdmin = async (): Promise<void> => {
  const usersRef = collection(db, COLLECTIONS.USERS);
  const q = query(usersRef, where('role', '==', 'superadmin'));
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    console.log('SuperAdmin already exists');
    return;
  }
  
  const superAdminRef = doc(collection(db, COLLECTIONS.USERS));
  await setDoc(superAdminRef, {
    name: 'DIXIT JAIN',
    email: 'dixitj786@gmail.com',
    username: 'dixitj786',
    passwordHash: hashPassword('dikshit123'),
    role: 'superadmin',
    createdAt: Timestamp.now()
  });
  
  console.log('SuperAdmin created successfully!');
};

// ==================== SEED CLASS 10 SYLLABUS ====================

export interface PredefinedChapterInput {
  chapterNo: number;
  name: string;
  topics: { name: string }[];
}

export interface PredefinedSubjectInput {
  name: string;
  classNumber: number;
  chapters: PredefinedChapterInput[];
}

// Seed a predefined subject to Firestore
export const seedPredefinedSubject = async (
  subjectData: PredefinedSubjectInput
): Promise<string> => {
  // Use predictable ID: class${classNumber}_${subjectName.toLowerCase()} with underscores for spaces
  const subjectId = `class${subjectData.classNumber}_${subjectData.name.toLowerCase().replace(/\s+/g, '_')}`;
  
  // Check if subject already exists for this class
  const subjectRef = doc(db, COLLECTIONS.SUBJECTS, subjectId);
  const existingDoc = await getDoc(subjectRef);
  
  if (existingDoc.exists()) {
    console.log(`Subject ${subjectData.name} for Class ${subjectData.classNumber} already exists with ID: ${subjectId}`);
    return subjectId;
  }
  
  // Create the subject with predictable ID
  await setDoc(subjectRef, {
    name: subjectData.name,
    classNumber: subjectData.classNumber,
    instituteId: null,
    isDefault: true,
    createdAt: Timestamp.now()
  });
  
  // Add chapters and topics
  for (const chapterData of subjectData.chapters) {
    const chapterRef = doc(collection(db, COLLECTIONS.SUBJECTS, subjectId, 'chapters'));
    await setDoc(chapterRef, {
      chapterNo: chapterData.chapterNo,
      name: chapterData.name
    });
    
    // Add topics
    for (let i = 0; i < chapterData.topics.length; i++) {
      const topicData = chapterData.topics[i];
      const topicRef = doc(collection(db, COLLECTIONS.SUBJECTS, subjectId, 'chapters', chapterRef.id, 'topics'));
      await setDoc(topicRef, {
        topicNo: i + 1,
        name: topicData.name
      });
    }
  }
  
  console.log(`Subject ${subjectData.name} for Class ${subjectData.classNumber} seeded successfully with ID: ${subjectId}!`);
  return subjectId;
};

// Get all predefined subjects grouped by class
export const getPredefinedSubjectsByClass = async (): Promise<Record<number, Subject[]>> => {
  const subjectsRef = collection(db, COLLECTIONS.SUBJECTS);
  const q = query(subjectsRef, where('isDefault', '==', true));
  const snapshot = await getDocs(q);
  
  const result: Record<number, Subject[]> = {};
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const classNum = data.classNumber || 12; // Default to 12 for existing data
    
    // Get chapters
    const chaptersRef = collection(db, COLLECTIONS.SUBJECTS, doc.id, 'chapters');
    const chaptersSnapshot = await getDocs(chaptersRef);
    
    const chapters: Chapter[] = [];
    for (const chapterDoc of chaptersSnapshot.docs) {
      const chapterData = chapterDoc.data();
      const topicsRef = collection(db, COLLECTIONS.SUBJECTS, doc.id, 'chapters', chapterDoc.id, 'topics');
      const topicsSnapshot = await getDocs(topicsRef);
      
      const topics: Topic[] = topicsSnapshot.docs.map((topicDoc) => ({
        id: topicDoc.id,
        topicNo: topicDoc.data().topicNo,
        name: topicDoc.data().name,
        chapterId: chapterDoc.id
      })).sort((a, b) => a.topicNo - b.topicNo);
      
      chapters.push({
        id: chapterDoc.id,
        chapterNo: chapterData.chapterNo,
        name: chapterData.name,
        topics
      });
    }
    
    const subject: Subject = {
      id: doc.id,
      name: data.name,
      instituteId: null,
      isDefault: true,
      chapters: chapters.sort((a, b) => a.chapterNo - b.chapterNo)
    };
    
    if (!result[classNum]) {
      result[classNum] = [];
    }
    result[classNum].push(subject);
  }
  
  return result;
};

// ==================== CUSTOM SYLLABUS ====================

export interface CustomChapter {
  id: string;
  chapterNo: number;
  name: string;
  topics: { id: string; topicNo: number; name: string }[];
}

export interface CustomSubject {
  id: string;
  name: string;
  instituteId: string | null;
  independentTeacherId: string | null;
  classIds: string[];
  chapters: CustomChapter[];
  isDefault: boolean;
  createdAt: Date;
}

// Create a custom subject with chapters and topics
export const createCustomSubject = async (
  name: string,
  classIds: string[],
  chapters: { name: string; topics: string[] }[],
  options: { instituteId?: string; independentTeacherId?: string }
): Promise<CustomSubject> => {
  console.log('createCustomSubject called with:', { name, classIds, chapters, options });
  
  const subjectRef = doc(collection(db, COLLECTIONS.SUBJECTS));
  
  await setDoc(subjectRef, {
    name,
    classIds,
    instituteId: options.instituteId || null,
    independentTeacherId: options.independentTeacherId || null,
    isDefault: false,
    createdAt: Timestamp.now()
  });
  
  console.log('Subject document created with ID:', subjectRef.id);
  
  // Create chapters and topics
  const chapterObjects: CustomChapter[] = [];
  
  for (let i = 0; i < chapters.length; i++) {
    const chapterData = chapters[i];
    const chapterRef = doc(collection(db, COLLECTIONS.SUBJECTS, subjectRef.id, 'chapters'));
    
    await setDoc(chapterRef, {
      chapterNo: i + 1,
      name: chapterData.name
    });
    
    console.log(`Chapter ${i + 1} created:`, chapterData.name, 'with', chapterData.topics.length, 'topics');
    
    const topicObjects: { id: string; topicNo: number; name: string }[] = [];
    
    for (let j = 0; j < chapterData.topics.length; j++) {
      const topicRef = doc(collection(db, COLLECTIONS.SUBJECTS, subjectRef.id, 'chapters', chapterRef.id, 'topics'));
      await setDoc(topicRef, {
        topicNo: j + 1,
        name: chapterData.topics[j]
      });
      topicObjects.push({ id: topicRef.id, topicNo: j + 1, name: chapterData.topics[j] });
    }
    
    chapterObjects.push({
      id: chapterRef.id,
      chapterNo: i + 1,
      name: chapterData.name,
      topics: topicObjects
    });
  }
  
  console.log('Subject creation complete. Chapters:', chapterObjects.length);
  
  return {
    id: subjectRef.id,
    name,
    instituteId: options.instituteId || null,
    independentTeacherId: options.independentTeacherId || null,
    classIds,
    chapters: chapterObjects,
    isDefault: false,
    createdAt: new Date()
  };
};

// Add a chapter to a subject
export const addChapterToSubject = async (
  subjectId: string,
  name: string,
  topics: string[]
): Promise<CustomChapter> => {
  // Get current chapters count
  const chaptersRef = collection(db, COLLECTIONS.SUBJECTS, subjectId, 'chapters');
  const chaptersSnapshot = await getDocs(chaptersRef);
  const chapterNo = chaptersSnapshot.size + 1;
  
  const chapterRef = doc(chaptersRef);
  await setDoc(chapterRef, { chapterNo, name });
  
  const topicObjects: { id: string; topicNo: number; name: string }[] = [];
  
  for (let i = 0; i < topics.length; i++) {
    const topicRef = doc(collection(db, COLLECTIONS.SUBJECTS, subjectId, 'chapters', chapterRef.id, 'topics'));
    await setDoc(topicRef, { topicNo: i + 1, name: topics[i] });
    topicObjects.push({ id: topicRef.id, topicNo: i + 1, name: topics[i] });
  }
  
  return { id: chapterRef.id, chapterNo, name, topics: topicObjects };
};

// Update a chapter
export const updateChapter = async (
  subjectId: string,
  chapterId: string,
  name: string
): Promise<void> => {
  const chapterRef = doc(db, COLLECTIONS.SUBJECTS, subjectId, 'chapters', chapterId);
  await updateDoc(chapterRef, { name, updatedAt: Timestamp.now() });
};

// Delete a chapter
export const deleteChapter = async (subjectId: string, chapterId: string): Promise<void> => {
  // Delete all topics first
  const topicsRef = collection(db, COLLECTIONS.SUBJECTS, subjectId, 'chapters', chapterId, 'topics');
  const topicsSnapshot = await getDocs(topicsRef);
  
  const batch = writeBatch(db);
  topicsSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  
  // Delete chapter
  await deleteDoc(doc(db, COLLECTIONS.SUBJECTS, subjectId, 'chapters', chapterId));
};

// Add a topic to a chapter
export const addTopicToChapter = async (
  subjectId: string,
  chapterId: string,
  name: string
): Promise<{ id: string; topicNo: number; name: string }> => {
  const topicsRef = collection(db, COLLECTIONS.SUBJECTS, subjectId, 'chapters', chapterId, 'topics');
  const topicsSnapshot = await getDocs(topicsRef);
  const topicNo = topicsSnapshot.size + 1;
  
  const topicRef = doc(topicsRef);
  await setDoc(topicRef, { topicNo, name });
  
  return { id: topicRef.id, topicNo, name };
};

// Update a topic
export const updateTopic = async (
  subjectId: string,
  chapterId: string,
  topicId: string,
  name: string
): Promise<void> => {
  const topicRef = doc(db, COLLECTIONS.SUBJECTS, subjectId, 'chapters', chapterId, 'topics', topicId);
  await updateDoc(topicRef, { name, updatedAt: Timestamp.now() });
};

// Delete a topic
export const deleteTopic = async (
  subjectId: string,
  chapterId: string,
  topicId: string
): Promise<void> => {
  await deleteDoc(doc(db, COLLECTIONS.SUBJECTS, subjectId, 'chapters', chapterId, 'topics', topicId));
};

// Delete a subject and all its chapters/topics
export const deleteSubject = async (subjectId: string): Promise<void> => {
  // Delete all chapters and topics
  const chaptersRef = collection(db, COLLECTIONS.SUBJECTS, subjectId, 'chapters');
  const chaptersSnapshot = await getDocs(chaptersRef);
  
  for (const chapterDoc of chaptersSnapshot.docs) {
    const topicsRef = collection(db, COLLECTIONS.SUBJECTS, subjectId, 'chapters', chapterDoc.id, 'topics');
    const topicsSnapshot = await getDocs(topicsRef);
    
    const batch = writeBatch(db);
    topicsSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    
    await deleteDoc(chapterDoc.ref);
  }
  
  // Delete subject
  await deleteDoc(doc(db, COLLECTIONS.SUBJECTS, subjectId));
};

// Get custom subjects for independent teacher
export const getCustomSubjectsForTeacher = async (teacherId: string): Promise<CustomSubject[]> => {
  const subjectsRef = collection(db, COLLECTIONS.SUBJECTS);
  const q = query(subjectsRef, where('independentTeacherId', '==', teacherId));
  const snapshot = await getDocs(q);
  
  const subjects: CustomSubject[] = [];
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const chapters = await getChaptersForSubject(doc.id);
    
    subjects.push({
      id: doc.id,
      name: data.name,
      instituteId: data.instituteId,
      independentTeacherId: data.independentTeacherId,
      classIds: data.classIds || [],
      chapters,
      isDefault: false,
      createdAt: toDate(data.createdAt)
    });
  }
  
  return subjects;
};

// Get custom subjects for institute
export const getCustomSubjectsForInstitute = async (instituteId: string): Promise<CustomSubject[]> => {
  const subjectsRef = collection(db, COLLECTIONS.SUBJECTS);
  const q = query(subjectsRef, where('instituteId', '==', instituteId));
  const snapshot = await getDocs(q);
  
  const subjects: CustomSubject[] = [];
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const chapters = await getChaptersForSubject(doc.id);
    
    subjects.push({
      id: doc.id,
      name: data.name,
      instituteId: data.instituteId,
      independentTeacherId: data.independentTeacherId,
      classIds: data.classIds || [],
      chapters,
      isDefault: false,
      createdAt: toDate(data.createdAt)
    });
  }
  
  return subjects;
};

// Helper to get chapters for a subject
const getChaptersForSubject = async (subjectId: string): Promise<CustomChapter[]> => {
  const chaptersRef = collection(db, COLLECTIONS.SUBJECTS, subjectId, 'chapters');
  const chaptersSnapshot = await getDocs(query(chaptersRef, orderBy('chapterNo')));
  
  console.log(`Found ${chaptersSnapshot.docs.length} chapters for subject ${subjectId}`);
  
  const chapters: CustomChapter[] = [];
  
  for (const chapterDoc of chaptersSnapshot.docs) {
    const topicsRef = collection(db, COLLECTIONS.SUBJECTS, subjectId, 'chapters', chapterDoc.id, 'topics');
    const topicsSnapshot = await getDocs(query(topicsRef, orderBy('topicNo')));
    
    const topics = topicsSnapshot.docs.map((topicDoc) => ({
      id: topicDoc.id,
      topicNo: topicDoc.data().topicNo,
      name: topicDoc.data().name
    }));
    
    console.log(`Chapter ${chapterDoc.id} has ${topics.length} topics`);
    
    chapters.push({
      id: chapterDoc.id,
      chapterNo: chapterDoc.data().chapterNo,
      name: chapterDoc.data().name,
      topics
    });
  }
  
  return chapters;
};

// Subscribe to custom subjects for independent teacher
export const subscribeToCustomSubjectsForTeacher = (
  teacherId: string,
  callback: (subjects: CustomSubject[]) => void
): (() => void) => {
  const subjectsRef = collection(db, COLLECTIONS.SUBJECTS);
  const q = query(subjectsRef, where('independentTeacherId', '==', teacherId));
  
  return onSnapshot(q, async (snapshot) => {
    const subjects: CustomSubject[] = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const chapters = await getChaptersForSubject(doc.id);
      
      subjects.push({
        id: doc.id,
        name: data.name,
        instituteId: data.instituteId,
        independentTeacherId: data.independentTeacherId,
        classIds: data.classIds || [],
        chapters,
        isDefault: false,
        createdAt: toDate(data.createdAt)
      });
    }
    
    callback(subjects);
  });
};

// Subscribe to custom subjects for institute
export const subscribeToCustomSubjectsForInstitute = (
  instituteId: string,
  callback: (subjects: CustomSubject[]) => void
): (() => void) => {
  const subjectsRef = collection(db, COLLECTIONS.SUBJECTS);
  const q = query(subjectsRef, where('instituteId', '==', instituteId));
  
  return onSnapshot(q, async (snapshot) => {
    const subjects: CustomSubject[] = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const chapters = await getChaptersForSubject(doc.id);
      
      subjects.push({
        id: doc.id,
        name: data.name,
        instituteId: data.instituteId,
        independentTeacherId: data.independentTeacherId,
        classIds: data.classIds || [],
        chapters,
        isDefault: false,
        createdAt: toDate(data.createdAt)
      });
    }
    
    callback(subjects);
  });
};

// ==================== TODO ITEMS ====================

// Create a new todo item
export const createTodo = async (
  userId: string,
  todo: {
    title: string;
    description?: string;
    category: 'teaching' | 'admin' | 'student' | 'personal';
    priority: 'high' | 'medium' | 'low';
    dueDate?: Date;
  }
): Promise<TodoItem> => {
  const todoRef = doc(collection(db, COLLECTIONS.TODOS));
  
  const todoData = {
    userId,
    title: todo.title,
    description: todo.description || null,
    category: todo.category,
    priority: todo.priority,
    dueDate: todo.dueDate ? Timestamp.fromDate(todo.dueDate) : null,
    completed: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };
  
  await setDoc(todoRef, todoData);
  
  return {
    id: todoRef.id,
    userId,
    title: todo.title,
    description: todo.description || null,
    category: todo.category,
    priority: todo.priority,
    dueDate: todo.dueDate || null,
    completed: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

// Update a todo item
export const updateTodo = async (
  todoId: string,
  updates: Partial<{
    title: string;
    description: string | null;
    category: 'teaching' | 'admin' | 'student' | 'personal';
    priority: 'high' | 'medium' | 'low';
    dueDate: Date | null;
    completed: boolean;
  }>
): Promise<void> => {
  const todoRef = doc(db, COLLECTIONS.TODOS, todoId);
  
  const updateData: Record<string, any> = {
    ...updates,
    updatedAt: Timestamp.now()
  };
  
  // Convert Date to Timestamp for dueDate
  if (updates.dueDate !== undefined) {
    updateData.dueDate = updates.dueDate ? Timestamp.fromDate(updates.dueDate) : null;
  }
  
  await updateDoc(todoRef, updateData);
};

// Delete a todo item
export const deleteTodo = async (todoId: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTIONS.TODOS, todoId));
};

// Toggle todo completion
export const toggleTodoComplete = async (todoId: string, completed: boolean): Promise<void> => {
  const todoRef = doc(db, COLLECTIONS.TODOS, todoId);
  await updateDoc(todoRef, {
    completed,
    updatedAt: Timestamp.now()
  });
};

// Subscribe to todos for a user
export const subscribeToTodos = (
  userId: string,
  callback: (todos: TodoItem[]) => void
): (() => void) => {
  const todosRef = collection(db, COLLECTIONS.TODOS);
  const q = query(todosRef, where('userId', '==', userId));
  
  return onSnapshot(q, (snapshot) => {
    const todos: TodoItem[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        title: data.title,
        description: data.description || null,
        category: data.category,
        priority: data.priority,
        dueDate: data.dueDate ? toDate(data.dueDate) : null,
        completed: data.completed || false,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt)
      };
    });
    
    // Sort: incomplete first, then by priority (high > medium > low), then by due date
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    todos.sort((a, b) => {
      // Completed items go to end
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      // Sort by priority
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      // Sort by due date (earlier first, nulls last)
      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime();
      }
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      return 0;
    });
    
    callback(todos);
  });
};

// Subscribe to all taught progress for independent teacher (for progress summary)
export const subscribeToAllTaughtProgressForTeacher = (
  teacherId: string,
  callback: (progress: TaughtProgress[]) => void
): (() => void) => {
  const progressRef = collection(db, COLLECTIONS.PROGRESS);
  const q = query(progressRef, where('teacherId', '==', teacherId), where('type', '==', 'taught'));
  
  return onSnapshot(q, (snapshot) => {
    const progressData: TaughtProgress[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        teacherId: data.teacherId,
        subjectId: data.subjectId,
        instituteId: data.instituteId,
        independentTeacherId: data.independentTeacherId,
        overallProgress: data.overallProgress || 0,
        items: (data.items || []).map((item: any) => ({
          id: item.id,
          topicId: item.topicId,
          taught: item.taught || false,
          taughtAt: item.taughtAt ? toDate(item.taughtAt) : undefined
        })),
        updatedAt: toDate(data.updatedAt)
      };
    });
    callback(progressData);
  });
};

// ==================== SYLLABUS PREFERENCE ====================

/**
 * Set syllabus preference for independent teacher or institute
 * When usePredefined is true, students will see predefined syllabus instead of custom
 */
export const setSyllabusPreference = async (
  userId: string,
  usePredefined: boolean,
  role: 'independent_teacher' | 'institute_owner'
): Promise<void> => {
  if (role === 'independent_teacher') {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    await updateDoc(userRef, { 
      usePredefinedSyllabus: usePredefined,
      updatedAt: Timestamp.now() 
    });
  } else {
    // For institute owner, update the institute document
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
    if (userDoc.exists()) {
      const instituteId = userDoc.data().instituteId;
      if (instituteId) {
        const instituteRef = doc(db, COLLECTIONS.INSTITUTES, instituteId);
        await updateDoc(instituteRef, { 
          usePredefinedSyllabus: usePredefined,
          updatedAt: Timestamp.now() 
        });
      }
    }
  }
};

/**
 * Get syllabus preference for independent teacher or institute
 */
export const getSyllabusPreference = async (
  userId: string,
  role: 'independent_teacher' | 'institute_owner'
): Promise<boolean> => {
  if (role === 'independent_teacher') {
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
    if (userDoc.exists()) {
      return userDoc.data().usePredefinedSyllabus ?? false;
    }
  } else {
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
    if (userDoc.exists()) {
      const instituteId = userDoc.data().instituteId;
      if (instituteId) {
        const instituteDoc = await getDoc(doc(db, COLLECTIONS.INSTITUTES, instituteId));
        if (instituteDoc.exists()) {
          return instituteDoc.data().usePredefinedSyllabus ?? false;
        }
      }
    }
  }
  return false; // Default to custom syllabus
};


