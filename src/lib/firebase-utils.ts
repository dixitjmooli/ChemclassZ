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
  Timestamp
} from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from './firebase';

// Types
export interface User {
  id: string;
  name: string;
  username: string;
  role: 'student' | 'admin';
  school: string;
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
  overallProgress: number;
  hotsCompleted: Record<string, boolean>; // chapterId -> boolean
  items: ProgressItem[];
  updatedAt: Date;
}

export interface TestMarks {
  id: string;
  userId: string;
  chapterId: string;
  marks: number;
  updatedAt: Date;
}

export interface PdfData {
  id: string;
  chapterId: string;
  hotsPdf: string | null;
  topicPdfs: Record<string, string> | null;
}

// ============ AUTH FUNCTIONS ============

export async function loginUser(username: string, password: string): Promise<User> {
  // First check if it's admin login
  if (username === 'admin') {
    const adminDoc = await getDoc(doc(db, 'users', 'admin'));
    if (adminDoc.exists()) {
      const adminData = adminDoc.data();
      if (adminData.password === password) {
        return {
          id: 'admin',
          name: adminData.name,
          username: 'admin',
          role: 'admin',
          school: adminData.school || 'Admin',
          createdAt: adminData.createdAt?.toDate() || new Date()
        } as User;
      }
    }
    throw new Error('Invalid admin credentials');
  }

  // For students, find by username
  const usersQuery = query(collection(db, 'users'), where('username', '==', username));
  const usersSnapshot = await getDocs(usersQuery);
  
  if (usersSnapshot.empty) {
    throw new Error('User not found');
  }

  const userDoc = usersSnapshot.docs[0];
  const userData = userDoc.data();
  
  if (userData.password !== password) {
    throw new Error('Invalid password');
  }

  return {
    id: userDoc.id,
    name: userData.name,
    username: userData.username,
    role: userData.role,
    school: userData.school,
    createdAt: userData.createdAt?.toDate() || new Date()
  } as User;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

// ============ USER FUNCTIONS ============

export async function createStudent(
  name: string,
  username: string,
  password: string,
  school: string
): Promise<User> {
  // Check if username already exists
  const usersQuery = query(collection(db, 'users'), where('username', '==', username));
  const usersSnapshot = await getDocs(usersQuery);
  
  if (!usersSnapshot.empty) {
    throw new Error('Username already exists');
  }

  const userRef = doc(collection(db, 'users'));
  const userData = {
    name,
    username,
    password,
    role: 'student',
    school,
    createdAt: Timestamp.now()
  };

  await setDoc(userRef, userData);

  return {
    id: userRef.id,
    name,
    username,
    role: 'student',
    school,
    createdAt: new Date()
  };
}

export async function getAllStudents(): Promise<User[]> {
  const usersQuery = query(collection(db, 'users'), where('role', '==', 'student'));
  const usersSnapshot = await getDocs(usersQuery);
  
  return usersSnapshot.docs.map(doc => ({
    id: doc.id,
    name: doc.data().name,
    username: doc.data().username,
    role: doc.data().role,
    school: doc.data().school,
    createdAt: doc.data().createdAt?.toDate() || new Date()
  })) as User[];
}

export async function deleteStudent(userId: string): Promise<void> {
  // Delete user's progress
  const progressDoc = await getDoc(doc(db, 'progress', userId));
  if (progressDoc.exists()) {
    await deleteDoc(doc(db, 'progress', userId));
  }
  
  // Delete user's test marks
  const testMarksQuery = query(collection(db, 'testMarks'), where('userId', '==', userId));
  const testMarksSnapshot = await getDocs(testMarksQuery);
  for (const doc of testMarksSnapshot.docs) {
    await deleteDoc(doc.ref);
  }
  
  // Delete user
  await deleteDoc(doc(db, 'users', userId));
}

export function subscribeToStudents(callback: (students: User[]) => void): () => void {
  const usersQuery = query(collection(db, 'users'), where('role', '==', 'student'));
  
  return onSnapshot(usersQuery, (snapshot) => {
    const students = snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      username: doc.data().username,
      role: doc.data().role,
      school: doc.data().school,
      createdAt: doc.data().createdAt?.toDate() || new Date()
    })) as User[];
    
    callback(students);
  });
}

// ============ CHAPTER FUNCTIONS ============

export async function getChapters(): Promise<Chapter[]> {
  const chaptersSnapshot = await getDocs(collection(db, 'chapters'));
  const chapters: Chapter[] = [];

  for (const chapterDoc of chaptersSnapshot.docs) {
    const chapterData = chapterDoc.data();
    const topicsSnapshot = await getDocs(
      query(collection(db, 'topics'), where('chapterId', '==', chapterDoc.id))
    );
    
    const topics = topicsSnapshot.docs
      .map(doc => ({
        id: doc.id,
        topicNo: doc.data().topicNo,
        name: doc.data().name,
        chapterId: doc.data().chapterId
      }))
      .sort((a, b) => a.topicNo - b.topicNo);

    chapters.push({
      id: chapterDoc.id,
      chapterNo: chapterData.chapterNo,
      name: chapterData.name,
      topics
    });
  }

  return chapters.sort((a, b) => a.chapterNo - b.chapterNo);
}

export function subscribeToChapters(callback: (chapters: Chapter[]) => void): () => void {
  const chaptersRef = collection(db, 'chapters');
  
  return onSnapshot(chaptersRef, async (chaptersSnapshot) => {
    const chapters: Chapter[] = [];

    for (const chapterDoc of chaptersSnapshot.docs) {
      const chapterData = chapterDoc.data();
      const topicsSnapshot = await getDocs(
        query(collection(db, 'topics'), where('chapterId', '==', chapterDoc.id))
      );
      
      const topics = topicsSnapshot.docs
        .map(doc => ({
          id: doc.id,
          topicNo: doc.data().topicNo,
          name: doc.data().name,
          chapterId: doc.data().chapterId
        }))
        .sort((a, b) => a.topicNo - b.topicNo);

      chapters.push({
        id: chapterDoc.id,
        chapterNo: chapterData.chapterNo,
        name: chapterData.name,
        topics
      });
    }

    callback(chapters.sort((a, b) => a.chapterNo - b.chapterNo));
  });
}

// ============ PROGRESS FUNCTIONS ============

export async function getProgress(userId: string): Promise<Progress | null> {
  const progressDoc = await getDoc(doc(db, 'progress', userId));
  
  if (!progressDoc.exists()) {
    // Create initial progress
    const chaptersSnapshot = await getDocs(collection(db, 'chapters'));
    const items: ProgressItem[] = [];
    
    for (const chapterDoc of chaptersSnapshot.docs) {
      const topicsSnapshot = await getDocs(
        query(collection(db, 'topics'), where('chapterId', '==', chapterDoc.id))
      );
      
      for (const topicDoc of topicsSnapshot.docs) {
        items.push({
          id: `${userId}_${topicDoc.id}`,
          topicId: topicDoc.id,
          lectureCompleted: false,
          ncertCompleted: false,
          level1Completed: false,
          level2Completed: false,
          notesCompleted: false
        });
      }
    }

    const newProgress: Progress = {
      id: userId,
      userId,
      overallProgress: 0,
      hotsCompleted: {},
      items,
      updatedAt: new Date()
    };

    await setDoc(doc(db, 'progress', userId), {
      userId,
      overallProgress: 0,
      hotsCompleted: {},
      items: items.map(item => ({
        ...item,
        topicId: item.topicId
      })),
      updatedAt: Timestamp.now()
    });

    return newProgress;
  }

  const data = progressDoc.data();
  return {
    id: progressDoc.id,
    userId: data.userId,
    overallProgress: data.overallProgress || 0,
    hotsCompleted: data.hotsCompleted || {},
    items: data.items || [],
    updatedAt: data.updatedAt?.toDate() || new Date()
  };
}

export async function updateProgressItem(
  userId: string,
  topicId: string,
  field: keyof ProgressItem,
  value: boolean
): Promise<void> {
  const progressDoc = await getDoc(doc(db, 'progress', userId));
  
  if (!progressDoc.exists()) {
    throw new Error('Progress not found');
  }

  const data = progressDoc.data();
  const items = data.items || [];
  
  const itemIndex = items.findIndex((item: ProgressItem) => item.topicId === topicId);
  
  if (itemIndex === -1) {
    items.push({
      id: `${userId}_${topicId}`,
      topicId,
      lectureCompleted: field === 'lectureCompleted' ? value : false,
      ncertCompleted: field === 'ncertCompleted' ? value : false,
      level1Completed: field === 'level1Completed' ? value : false,
      level2Completed: field === 'level2Completed' ? value : false,
      notesCompleted: field === 'notesCompleted' ? value : false
    });
  } else {
    items[itemIndex][field] = value;
  }

  // Calculate overall progress
  let totalProgress = 0;
  items.forEach((item: ProgressItem) => {
    const completed = [
      item.lectureCompleted,
      item.ncertCompleted,
      item.level1Completed,
      item.level2Completed,
      item.notesCompleted
    ].filter(Boolean).length;
    totalProgress += (completed / 5) * 100;
  });
  
  const overallProgress = items.length > 0 ? totalProgress / items.length : 0;

  await updateDoc(doc(db, 'progress', userId), {
    items,
    overallProgress,
    updatedAt: Timestamp.now()
  });
}

export async function updateHotsProgress(
  userId: string,
  chapterId: string,
  completed: boolean
): Promise<void> {
  const progressDoc = await getDoc(doc(db, 'progress', userId));
  
  if (!progressDoc.exists()) {
    throw new Error('Progress not found');
  }

  const data = progressDoc.data();
  const hotsCompleted = data.hotsCompleted || {};
  hotsCompleted[chapterId] = completed;

  await updateDoc(doc(db, 'progress', userId), {
    hotsCompleted,
    updatedAt: Timestamp.now()
  });
}

export function subscribeToProgress(userId: string, callback: (progress: Progress | null) => void): () => void {
  return onSnapshot(doc(db, 'progress', userId), (doc) => {
    if (!doc.exists()) {
      callback(null);
      return;
    }

    const data = doc.data();
    callback({
      id: doc.id,
      userId: data.userId,
      overallProgress: data.overallProgress || 0,
      hotsCompleted: data.hotsCompleted || {},
      items: data.items || [],
      updatedAt: data.updatedAt?.toDate() || new Date()
    });
  });
}

export function subscribeToAllProgress(callback: (progress: Progress[]) => void): () => void {
  return onSnapshot(collection(db, 'progress'), (snapshot) => {
    const progressData = snapshot.docs.map(doc => ({
      id: doc.id,
      userId: doc.data().userId,
      overallProgress: doc.data().overallProgress || 0,
      hotsCompleted: doc.data().hotsCompleted || {},
      items: doc.data().items || [],
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    }));
    
    callback(progressData);
  });
}

// ============ TEST MARKS FUNCTIONS ============

export async function getTestMarks(): Promise<TestMarks[]> {
  const testMarksSnapshot = await getDocs(collection(db, 'testMarks'));
  
  return testMarksSnapshot.docs.map(doc => ({
    id: doc.id,
    userId: doc.data().userId,
    chapterId: doc.data().chapterId,
    marks: doc.data().marks,
    updatedAt: doc.data().updatedAt?.toDate() || new Date()
  }));
}

export async function updateTestMarks(
  userId: string,
  chapterId: string,
  marks: number
): Promise<void> {
  const testMarksId = `${userId}_${chapterId}`;
  
  await setDoc(doc(db, 'testMarks', testMarksId), {
    userId,
    chapterId,
    marks,
    updatedAt: Timestamp.now()
  });
}

export function subscribeToTestMarks(callback: (testMarks: TestMarks[]) => void): () => void {
  return onSnapshot(collection(db, 'testMarks'), (snapshot) => {
    const testMarksData = snapshot.docs.map(doc => ({
      id: doc.id,
      userId: doc.data().userId,
      chapterId: doc.data().chapterId,
      marks: doc.data().marks,
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    }));
    
    callback(testMarksData);
  });
}

// ============ PDF FUNCTIONS ============

export async function getPdfs(): Promise<PdfData[]> {
  const pdfsSnapshot = await getDocs(collection(db, 'pdfs'));
  
  return pdfsSnapshot.docs.map(doc => ({
    id: doc.id,
    chapterId: doc.data().chapterId,
    hotsPdf: doc.data().hotsPdf || null,
    topicPdfs: doc.data().topicPdfs || null
  }));
}

export async function updatePdf(
  chapterId: string,
  hotsPdf: string | null,
  topicPdfs: Record<string, string> | null
): Promise<void> {
  await setDoc(doc(db, 'pdfs', chapterId), {
    chapterId,
    hotsPdf,
    topicPdfs
  });
}

export function subscribeToPdfs(callback: (pdfs: PdfData[]) => void): () => void {
  return onSnapshot(collection(db, 'pdfs'), (snapshot) => {
    const pdfsData = snapshot.docs.map(doc => ({
      id: doc.id,
      chapterId: doc.data().chapterId,
      hotsPdf: doc.data().hotsPdf || null,
      topicPdfs: doc.data().topicPdfs || null
    }));
    
    callback(pdfsData);
  });
}

// ============ SEED FUNCTIONS ============

export const chaptersData = [
  {
    chapterNo: 1,
    name: "Solutions",
    topics: [
      { topicNo: 1, name: "Types of Solutions" },
      { topicNo: 2, name: "Solubility" },
      { topicNo: 3, name: "Raoult's Law" },
      { topicNo: 4, name: "Colligative Properties" },
      { topicNo: 5, name: "Abnormal Molar Masses" }
    ]
  },
  {
    chapterNo: 2,
    name: "Electrochemistry",
    topics: [
      { topicNo: 1, name: "Electrochemical Cells" },
      { topicNo: 2, name: "Nernst Equation" },
      { topicNo: 3, name: "Conductance" },
      { topicNo: 4, name: "Electrolytic Cells" },
      { topicNo: 5, name: "Batteries" }
    ]
  },
  {
    chapterNo: 3,
    name: "Chemical Kinetics",
    topics: [
      { topicNo: 1, name: "Rate of Reaction" },
      { topicNo: 2, name: "Factors Affecting Rate" },
      { topicNo: 3, name: "Integrated Rate Laws" },
      { topicNo: 4, name: "Collision Theory" }
    ]
  },
  {
    chapterNo: 4,
    name: "The d and f Block Elements",
    topics: [
      { topicNo: 1, name: "d-Block Elements" },
      { topicNo: 2, name: "f-Block Elements" },
      { topicNo: 3, name: "Properties" },
      { topicNo: 4, name: "Compounds" }
    ]
  },
  {
    chapterNo: 5,
    name: "Coordination Compounds",
    topics: [
      { topicNo: 1, name: "Nomenclature" },
      { topicNo: 2, name: "Isomerism" },
      { topicNo: 3, name: "Bonding" },
      { topicNo: 4, name: "Stability" },
      { topicNo: 5, name: "Applications" }
    ]
  },
  {
    chapterNo: 6,
    name: "Haloalkanes and Haloarenes",
    topics: [
      { topicNo: 1, name: "Classification" },
      { topicNo: 2, name: "Nomenclature" },
      { topicNo: 3, name: "Preparation" },
      { topicNo: 4, name: "Properties" },
      { topicNo: 5, name: "Reactions" }
    ]
  },
  {
    chapterNo: 7,
    name: "Alcohols, Phenols and Ethers",
    topics: [
      { topicNo: 1, name: "Alcohols" },
      { topicNo: 2, name: "Phenols" },
      { topicNo: 3, name: "Ethers" },
      { topicNo: 4, name: "Preparation" },
      { topicNo: 5, name: "Properties" }
    ]
  },
  {
    chapterNo: 8,
    name: "Aldehydes, Ketones and Carboxylic Acids",
    topics: [
      { topicNo: 1, name: "Aldehydes" },
      { topicNo: 2, name: "Ketones" },
      { topicNo: 3, name: "Carboxylic Acids" },
      { topicNo: 4, name: "Reactions" }
    ]
  },
  {
    chapterNo: 9,
    name: "Amines",
    topics: [
      { topicNo: 1, name: "Classification" },
      { topicNo: 2, name: "Nomenclature" },
      { topicNo: 3, name: "Preparation" },
      { topicNo: 4, name: "Properties" },
      { topicNo: 5, name: "Reactions" }
    ]
  },
  {
    chapterNo: 10,
    name: "Biomolecules",
    topics: [
      { topicNo: 1, name: "Carbohydrates" },
      { topicNo: 2, name: "Proteins" },
      { topicNo: 3, name: "Enzymes" },
      { topicNo: 4, name: "Vitamins" },
      { topicNo: 5, name: "Nucleic Acids" }
    ]
  }
];

export async function seedDatabase(): Promise<void> {
  // Create admin user
  const adminDoc = await getDoc(doc(db, 'users', 'admin'));
  if (!adminDoc.exists()) {
    await setDoc(doc(db, 'users', 'admin'), {
      name: 'Admin',
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      school: 'ChemClass Pro',
      createdAt: Timestamp.now()
    });
    console.log('Admin user created');
  }

  // Create chapters and topics
  for (const chapterData of chaptersData) {
    const chapterId = `chapter_${chapterData.chapterNo}`;
    const chapterDoc = await getDoc(doc(db, 'chapters', chapterId));
    
    if (!chapterDoc.exists()) {
      await setDoc(doc(db, 'chapters', chapterId), {
        chapterNo: chapterData.chapterNo,
        name: chapterData.name
      });

      for (const topicData of chapterData.topics) {
        const topicId = `topic_${chapterData.chapterNo}_${topicData.topicNo}`;
        await setDoc(doc(db, 'topics', topicId), {
          chapterId,
          topicNo: topicData.topicNo,
          name: topicData.name
        });
      }
      
      console.log(`Chapter ${chapterData.chapterNo}: ${chapterData.name} created`);
    }
  }
  
  console.log('Database seeded successfully!');
}

export async function checkAndSeedDatabase(): Promise<boolean> {
  const chaptersSnapshot = await getDocs(collection(db, 'chapters'));
  
  if (chaptersSnapshot.empty) {
    console.log('Database is empty, seeding...');
    await seedDatabase();
    return true;
  }
  
  return false;
}
