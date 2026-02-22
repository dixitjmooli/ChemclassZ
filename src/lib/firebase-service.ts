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
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';

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
  items: ProgressItem[];
  hotsCompleted: Record<string, boolean>;
  updatedAt: Date;
}

export interface TestMarks {
  id: string;
  userId: string;
  chapterId: string;
  marks: number;
}

export interface PdfData {
  id: string;
  chapterId: string;
  hotsPdf: string | null;
  topicPdfs: Record<string, string> | null;
}

// Collection names
const COLLECTIONS = {
  USERS: 'users',
  CHAPTERS: 'chapters',
  PROGRESS: 'progress',
  TEST_MARKS: 'testMarks',
  PDFS: 'pdfs'
};

// Simple password hashing (for basic security)
const hashPassword = (password: string): string => {
  // Simple hash - in production, use bcrypt on backend
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
};

// ==================== AUTH ====================

export const loginUser = async (username: string, password: string): Promise<User> => {
  // Find user by username in Firestore
  const usersRef = collection(db, COLLECTIONS.USERS);
  const q = query(usersRef, where('username', '==', username.toLowerCase()));
  const snapshot = await getDocs(q);
  
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
    username: userData.username,
    role: userData.role,
    school: userData.school,
    createdAt: userData.createdAt?.toDate() || new Date()
  };
};

export const logoutUser = async (): Promise<void> => {
  // No Firebase Auth to sign out from
  console.log('User logged out');
};

export const createUser = async (
  name: string,
  username: string,
  password: string,
  school: string,
  role: 'student' | 'admin' = 'student'
): Promise<User> => {
  // Check if username exists
  const usersRef = collection(db, COLLECTIONS.USERS);
  const q = query(usersRef, where('username', '==', username.toLowerCase()));
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    throw new Error('Username already exists');
  }
  
  // Create user document in Firestore
  const userRef = doc(collection(db, COLLECTIONS.USERS));
  const userData = {
    name,
    username: username.toLowerCase(),
    passwordHash: hashPassword(password),
    role,
    school,
    createdAt: Timestamp.now()
  };
  
  await setDoc(userRef, userData);
  
  // Create initial progress for student
  if (role === 'student') {
    await initializeProgress(userRef.id);
  }
  
  return {
    id: userRef.id,
    name,
    username: username.toLowerCase(),
    role,
    school,
    createdAt: new Date()
  };
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
  
  // Delete user document
  await deleteDoc(doc(db, COLLECTIONS.USERS, userId));
};

// ==================== CHAPTERS ====================

export const getChapters = async (): Promise<Chapter[]> => {
  const chaptersRef = collection(db, COLLECTIONS.CHAPTERS);
  const snapshot = await getDocs(chaptersRef);
  
  const chapters: Chapter[] = [];
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    // Get topics for this chapter
    const topicsRef = collection(db, COLLECTIONS.CHAPTERS, doc.id, 'topics');
    const topicsSnapshot = await getDocs(topicsRef);
    
    const topics: Topic[] = topicsSnapshot.docs.map((topicDoc) => ({
      id: topicDoc.id,
      topicNo: topicDoc.data().topicNo,
      name: topicDoc.data().name,
      chapterId: doc.id
    })).sort((a, b) => a.topicNo - b.topicNo);
    
    chapters.push({
      id: doc.id,
      chapterNo: data.chapterNo,
      name: data.name,
      topics
    });
  }
  
  return chapters.sort((a, b) => a.chapterNo - b.chapterNo);
};

// Subscribe to chapters with real-time updates
export const subscribeToChapters = (callback: (chapters: Chapter[]) => void): (() => void) => {
  const chaptersRef = collection(db, COLLECTIONS.CHAPTERS);
  
  return onSnapshot(chaptersRef, async (snapshot) => {
    const chapters: Chapter[] = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const topicsRef = collection(db, COLLECTIONS.CHAPTERS, doc.id, 'topics');
      const topicsSnapshot = await getDocs(topicsRef);
      
      const topics: Topic[] = topicsSnapshot.docs.map((topicDoc) => ({
        id: topicDoc.id,
        topicNo: topicDoc.data().topicNo,
        name: topicDoc.data().name,
        chapterId: doc.id
      })).sort((a, b) => a.topicNo - b.topicNo);
      
      chapters.push({
        id: doc.id,
        chapterNo: data.chapterNo,
        name: data.name,
        topics
      });
    }
    
    callback(chapters.sort((a, b) => a.chapterNo - b.chapterNo));
  });
};

// ==================== PROGRESS ====================

export const initializeProgress = async (userId: string): Promise<void> => {
  const progressRef = doc(db, COLLECTIONS.PROGRESS, userId);
  
  // Check if progress already exists - DON'T overwrite!
  const existingProgress = await getDoc(progressRef);
  if (existingProgress.exists()) {
    console.log('Progress already exists for user:', userId);
    return;
  }
  
  console.log('Initializing new progress for user:', userId);
  const chapters = await getChapters();
  
  const items: ProgressItem[] = [];
  
  chapters.forEach(chapter => {
    chapter.topics.forEach(topic => {
      items.push({
        id: `${userId}_${topic.id}`,
        topicId: topic.id,
        lectureCompleted: false,
        ncertCompleted: false,
        level1Completed: false,
        level2Completed: false,
        notesCompleted: false
      });
    });
  });
  
  // Initialize HOTS completion for each chapter
  const hotsCompleted: Record<string, boolean> = {};
  chapters.forEach(chapter => {
    hotsCompleted[chapter.id] = false;
  });
  
  await setDoc(progressRef, {
    userId,
    overallProgress: 0,
    items,
    hotsCompleted,
    updatedAt: Timestamp.now()
  });
};

export const getProgress = async (userId: string): Promise<Progress | null> => {
  const progressRef = doc(db, COLLECTIONS.PROGRESS, userId);
  const snapshot = await getDoc(progressRef);
  
  if (!snapshot.exists()) {
    return null;
  }
  
  const data = snapshot.data();
  return {
    id: snapshot.id,
    userId: data.userId,
    overallProgress: data.overallProgress || 0,
    items: data.items || [],
    hotsCompleted: data.hotsCompleted || {},
    updatedAt: data.updatedAt?.toDate() || new Date()
  };
};

// Subscribe to progress with real-time updates
export const subscribeToProgress = (
  userId: string, 
  callback: (progress: Progress | null) => void
): (() => void) => {
  const progressRef = doc(db, COLLECTIONS.PROGRESS, userId);
  
  return onSnapshot(progressRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    
    const data = snapshot.data();
    callback({
      id: snapshot.id,
      userId: data.userId,
      overallProgress: data.overallProgress || 0,
      items: data.items || [],
      hotsCompleted: data.hotsCompleted || {},
      updatedAt: data.updatedAt?.toDate() || new Date()
    });
  });
};

export const updateProgressItem = async (
  userId: string,
  topicId: string,
  field: keyof Omit<ProgressItem, 'id' | 'topicId'>,
  value: boolean
): Promise<void> => {
  const progressRef = doc(db, COLLECTIONS.PROGRESS, userId);
  let progressDoc = await getDoc(progressRef);
  
  // If progress doesn't exist, initialize it
  if (!progressDoc.exists()) {
    await initializeProgress(userId);
    // Re-fetch after initialization
    progressDoc = await getDoc(progressRef);
  }
  
  const data = progressDoc.exists() ? progressDoc.data() : { items: [] };
  let items = data.items || [];
  
  // Check if topic exists in items, if not add it
  const topicExists = items.some((item: ProgressItem) => item.topicId === topicId);
  
  if (!topicExists) {
    // Add new item for this topic
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
  
  // Update the specific item
  const updatedItems = items.map((item: ProgressItem) =>
    item.topicId === topicId ? { ...item, [field]: value } : item
  );
  
  // Calculate overall progress - based on total topics in all chapters
  // Get all chapters to count total topics
  const allChapters = await getChapters();
  const totalTopicsCount = allChapters.reduce((sum, ch) => sum + ch.topics.length, 0);
  
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
  
  // Divide by total topics in curriculum, not just items in progress
  const overallProgress = totalTopicsCount > 0 ? totalProgress / totalTopicsCount : 0;
  
  await setDoc(progressRef, {
    userId,
    items: updatedItems,
    overallProgress,
    hotsCompleted: data.hotsCompleted || {},
    updatedAt: Timestamp.now()
  });
};

export const updateHotsCompleted = async (
  userId: string,
  chapterId: string,
  completed: boolean
): Promise<void> => {
  const progressRef = doc(db, COLLECTIONS.PROGRESS, userId);
  let progressDoc = await getDoc(progressRef);
  
  if (!progressDoc.exists()) {
    await initializeProgress(userId);
    progressDoc = await getDoc(progressRef);
  }
  
  const data = progressDoc.exists() ? progressDoc.data() : {};
  const hotsCompleted = data.hotsCompleted || {};
  hotsCompleted[chapterId] = completed;
  
  await setDoc(progressRef, {
    userId,
    items: data.items || [],
    overallProgress: data.overallProgress || 0,
    hotsCompleted,
    updatedAt: Timestamp.now()
  });
};

// ==================== TEST MARKS ====================

export const getTestMarks = async (): Promise<TestMarks[]> => {
  const testMarksRef = collection(db, COLLECTIONS.TEST_MARKS);
  const snapshot = await getDocs(testMarksRef);
  
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    userId: doc.data().userId,
    chapterId: doc.data().chapterId,
    marks: doc.data().marks
  }));
};

// Subscribe to all test marks with real-time updates
export const subscribeToTestMarks = (
  callback: (testMarks: TestMarks[]) => void
): (() => void) => {
  const testMarksRef = collection(db, COLLECTIONS.TEST_MARKS);
  
  return onSnapshot(testMarksRef, (snapshot) => {
    const testMarks: TestMarks[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      userId: doc.data().userId,
      chapterId: doc.data().chapterId,
      marks: doc.data().marks
    }));
    callback(testMarks);
  });
};

export const updateTestMarks = async (
  userId: string,
  chapterId: string,
  marks: number
): Promise<void> => {
  // Check if marks already exist
  const testMarksRef = collection(db, COLLECTIONS.TEST_MARKS);
  const q = query(
    testMarksRef, 
    where('userId', '==', userId), 
    where('chapterId', '==', chapterId)
  );
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    // Create new
    const newRef = doc(collection(db, COLLECTIONS.TEST_MARKS));
    await setDoc(newRef, {
      userId,
      chapterId,
      marks,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  } else {
    // Update existing
    await updateDoc(snapshot.docs[0].ref, {
      marks,
      updatedAt: Timestamp.now()
    });
  }
};

// ==================== USERS ====================

export const getAllStudents = async (): Promise<User[]> => {
  const usersRef = collection(db, COLLECTIONS.USERS);
  const q = query(usersRef, where('role', '==', 'student'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name,
    username: doc.data().username,
    role: doc.data().role,
    school: doc.data().school,
    createdAt: doc.data().createdAt?.toDate() || new Date()
  }));
};

// Subscribe to all students with real-time updates
export const subscribeToAllStudents = (
  callback: (students: User[]) => void
): (() => void) => {
  const usersRef = collection(db, COLLECTIONS.USERS);
  const q = query(usersRef, where('role', '==', 'student'));
  
  return onSnapshot(q, (snapshot) => {
    const students: User[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name,
      username: doc.data().username,
      role: doc.data().role,
      school: doc.data().school,
      createdAt: doc.data().createdAt?.toDate() || new Date()
    }));
    callback(students);
  });
};

export const getAllProgress = async (): Promise<Progress[]> => {
  const progressRef = collection(db, COLLECTIONS.PROGRESS);
  const snapshot = await getDocs(progressRef);
  
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    userId: doc.data().userId,
    overallProgress: doc.data().overallProgress || 0,
    items: doc.data().items || [],
    hotsCompleted: doc.data().hotsCompleted || {},
    updatedAt: doc.data().updatedAt?.toDate() || new Date()
  }));
};

// Subscribe to all progress with real-time updates
export const subscribeToAllProgress = (
  callback: (progress: Progress[]) => void
): (() => void) => {
  const progressRef = collection(db, COLLECTIONS.PROGRESS);
  
  return onSnapshot(progressRef, (snapshot) => {
    const progress: Progress[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      userId: doc.data().userId,
      overallProgress: doc.data().overallProgress || 0,
      items: doc.data().items || [],
      hotsCompleted: doc.data().hotsCompleted || {},
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    }));
    callback(progress);
  });
};

// ==================== PDFs ====================

export const getPdfs = async (): Promise<PdfData[]> => {
  const pdfsRef = collection(db, COLLECTIONS.PDFS);
  const snapshot = await getDocs(pdfsRef);
  
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    chapterId: doc.data().chapterId,
    hotsPdf: doc.data().hotsPdf || null,
    topicPdfs: doc.data().topicPdfs || null
  }));
};

// Subscribe to PDFs with real-time updates
export const subscribeToPdfs = (
  callback: (pdfs: PdfData[]) => void
): (() => void) => {
  const pdfsRef = collection(db, COLLECTIONS.PDFS);
  
  return onSnapshot(pdfsRef, (snapshot) => {
    const pdfs: PdfData[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      chapterId: doc.data().chapterId,
      hotsPdf: doc.data().hotsPdf || null,
      topicPdfs: doc.data().topicPdfs || null
    }));
    callback(pdfs);
  });
};

export const updatePdf = async (
  chapterId: string,
  hotsPdf: string | null,
  topicPdfs: Record<string, string> | null
): Promise<void> => {
  const pdfsRef = collection(db, COLLECTIONS.PDFS);
  const q = query(pdfsRef, where('chapterId', '==', chapterId));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    const newRef = doc(collection(db, COLLECTIONS.PDFS));
    await setDoc(newRef, {
      chapterId,
      hotsPdf,
      topicPdfs,
      updatedAt: Timestamp.now()
    });
  } else {
    await updateDoc(snapshot.docs[0].ref, {
      hotsPdf,
      topicPdfs,
      updatedAt: Timestamp.now()
    });
  }
};

// ==================== SEED DATA ====================

export const seedChaptersAndAdmin = async (): Promise<void> => {
  // Check if chapters already exist
  const chaptersRef = collection(db, COLLECTIONS.CHAPTERS);
  const existingChapters = await getDocs(chaptersRef);
  
  if (!existingChapters.empty) {
    console.log('Chapters already seeded');
    return;
  }
  
  const chaptersData = [
    {
      chapterNo: 1,
      name: "Solutions",
      marks: 7,
      topics: [
        { topicNo: 1, name: "Types of solutions (solid in liquid, liquid in liquid, gas in liquid, etc.)" },
        { topicNo: 2, name: "Concentration Terms and Numericals (Mass percentage, Mole fraction, Molarity, Molality, ppm)" },
        { topicNo: 3, name: "Solubility of solid in liquids" },
        { topicNo: 4, name: "Solubility of gases in liquids (Henry's law)" },
        { topicNo: 5, name: "Vapour Pressure & Raoult's law (Ideal & Non-ideal solutions, Azeotropic Mixture)" },
        { topicNo: 6, name: "Colligative Properties - Relative lowering of vapour pressure" },
        { topicNo: 7, name: "Colligative Properties - Elevation of boiling point" },
        { topicNo: 8, name: "Colligative Properties - Depression of freezing point" },
        { topicNo: 9, name: "Colligative Properties - Osmotic pressure" },
        { topicNo: 10, name: "Abnormal molecular mass & Van't Hoff factor (Association & Dissociation)" }
      ]
    },
    {
      chapterNo: 2,
      name: "Electrochemistry",
      marks: 9,
      topics: [
        { topicNo: 1, name: "Redox reactions (recapitulation)" },
        { topicNo: 2, name: "Standard electrode potential & Electromotive force (EMF) of a cell" },
        { topicNo: 3, name: "Nernst equation, Gibbs Energy & Equilibrium Constant" },
        { topicNo: 4, name: "Conductance, conductivity and molar conductivity in electrolytic solutions" },
        { topicNo: 5, name: "Variation of conductivity with concentration" },
        { topicNo: 6, name: "Kohlrausch's law" },
        { topicNo: 7, name: "Electrolytic cell, Faraday's laws of electrolysis & Products of Electrolysis" },
        { topicNo: 8, name: "Types of cells - Primary Cells, Secondary Cells, Fuel Cell & Corrosion" }
      ]
    },
    {
      chapterNo: 3,
      name: "Chemical Kinetics",
      marks: 7,
      topics: [
        { topicNo: 1, name: "Rate of a reaction (Average & Instantaneous rate)" },
        { topicNo: 2, name: "Rate law & Factors affecting rate of reaction" },
        { topicNo: 3, name: "Rate constant, Order of a reaction, Numericals" },
        { topicNo: 4, name: "Molecularity of a reaction" },
        { topicNo: 5, name: "Integrated rate equations - Zero Order, Half life, Graphs" },
        { topicNo: 6, name: "Integrated rate equations - First Order, Half life, Graphs" },
        { topicNo: 7, name: "Pseudo first-order reactions" },
        { topicNo: 8, name: "Temperature dependence of rate constant (Arrhenius equation), Activation energy" },
        { topicNo: 9, name: "Effect of Catalyst & Collision theory" }
      ]
    },
    {
      chapterNo: 4,
      name: "d- and f-Block Elements",
      marks: 7,
      topics: [
        { topicNo: 1, name: "General introduction & Electronic configuration of transition elements" },
        { topicNo: 2, name: "Properties - Physical, MP, BP & Enthalpy of Atomization" },
        { topicNo: 3, name: "Ionization enthalpy & Oxidation states" },
        { topicNo: 4, name: "Atomic Size & Lanthanoid contraction" },
        { topicNo: 5, name: "Colour & Magnetic properties" },
        { topicNo: 6, name: "Catalytic property, Interstitial compounds & Alloy formation" },
        { topicNo: 7, name: "Preparation and properties of potassium dichromate (K₂Cr₂O₇)" },
        { topicNo: 8, name: "Preparation and properties of potassium permanganate (KMnO₄)" },
        { topicNo: 9, name: "Lanthanoids - Electronic configuration, Oxidation states & Chemical reactivity" },
        { topicNo: 10, name: "Actinoids (IMPORTANT QUESTIONS)" }
      ]
    },
    {
      chapterNo: 5,
      name: "Coordination Compounds",
      marks: 7,
      topics: [
        { topicNo: 1, name: "Introduction to coordination compounds" },
        { topicNo: 2, name: "Werner's theory (Primary & Secondary Valency)" },
        { topicNo: 3, name: "Important Terms (Central atom, Ligands, Coordination number, etc.)" },
        { topicNo: 4, name: "IUPAC nomenclature of mononuclear coordination compounds" },
        { topicNo: 5, name: "Isomerism in coordination compounds (Structural & Stereoisomerism)" },
        { topicNo: 6, name: "Bonding in coordination compounds - VBT" },
        { topicNo: 7, name: "Crystal Field Theory (CFT)" },
        { topicNo: 8, name: "Colour & Stability of complexes" },
        { topicNo: 9, name: "Carbonyl Group & application of coordination compounds" }
      ]
    },
    {
      chapterNo: 6,
      name: "Haloalkanes and Haloarenes",
      marks: 6,
      topics: [
        { topicNo: 1, name: "Classification, Nomenclature & Nature of carbon-halogen (C–X) bond" },
        { topicNo: 2, name: "Methods of preparation of Haloalkanes (from alcohols, Swartz, Finkelstein, etc.)" },
        { topicNo: 3, name: "Physical properties (Melting point, Boiling point, etc.)" },
        { topicNo: 4, name: "Chemical reactions - Nucleophilic substitution" },
        { topicNo: 5, name: "SN1 & SN2 mechanism" },
        { topicNo: 6, name: "Elimination reactions & Substitution vs Elimination" },
        { topicNo: 7, name: "Reaction with metals (Wurtz reaction, Fittig reaction, etc.)" },
        { topicNo: 8, name: "Preparation of Haloarenes" },
        { topicNo: 9, name: "Chemical Reactions of Haloarenes" },
        { topicNo: 10, name: "Polyhalogen compounds" },
        { topicNo: 11, name: "Practice Questions" }
      ]
    },
    {
      chapterNo: 7,
      name: "Alcohols, Phenols and Ethers",
      marks: 6,
      topics: [
        { topicNo: 1, name: "Classification of Alcohol, Phenol & Ethers" },
        { topicNo: 2, name: "Nomenclature of Alcohol, Phenol & Ethers" },
        { topicNo: 3, name: "Preparation of Alcohols (From Alkenes, Carbonyl, Grignard)" },
        { topicNo: 4, name: "Physical properties of Alcohols" },
        { topicNo: 5, name: "Chemical reactions of alcohols (Dehydration, Oxidation, Esterification, etc.)" },
        { topicNo: 6, name: "Preparation of Phenols" },
        { topicNo: 7, name: "Chemical Reactions of Phenol (Acidic Nature, Reimer-Tiemann, Nitration, etc.)" },
        { topicNo: 8, name: "Preparation of Ethers" },
        { topicNo: 9, name: "Chemical Reaction of Ethers" },
        { topicNo: 10, name: "Practice Questions" }
      ]
    },
    {
      chapterNo: 8,
      name: "Aldehydes, Ketones and Carboxylic Acids",
      marks: 8,
      topics: [
        { topicNo: 1, name: "Nomenclature of Aldehyde, Ketones" },
        { topicNo: 2, name: "Structure and Preparation of carbonyl group" },
        { topicNo: 3, name: "Preparation of aldehyde Only" },
        { topicNo: 4, name: "Preparation of ketones only" },
        { topicNo: 5, name: "Chemical reactions of aldehydes and ketones - Nucleophilic addition reactions" },
        { topicNo: 6, name: "Reduction (Clemensson, etc.) and Oxidation (Tollens, etc.) Reactions" },
        { topicNo: 7, name: "Aldol condensation & Cannizzaro reaction" },
        { topicNo: 8, name: "Electrophilic substitution in aromatic aldehydes and ketones" },
        { topicNo: 9, name: "Preparation of Carboxylic acids" },
        { topicNo: 10, name: "Chemical Reactions of Carboxylic Acid" },
        { topicNo: 11, name: "Practice Questions" }
      ]
    },
    {
      chapterNo: 9,
      name: "Amines",
      marks: 6,
      topics: [
        { topicNo: 1, name: "Structure, Nomenclature & Classification of amines" },
        { topicNo: 2, name: "Preparation of Amines (Reduction, Gabriel phthalimide synthesis, Hoffmann bromamide, etc.)" },
        { topicNo: 3, name: "Physical properties and Basic character of amines" },
        { topicNo: 4, name: "Chemical reactions (Alkylation, Acylation, Benzoylation, etc.)" },
        { topicNo: 5, name: "Aromatic Amines Reactions (Nitration, Sulphonation, etc.)" },
        { topicNo: 6, name: "Distinguish Reactions (Hinsberg, Carbylamine, nitrous acid, Coupling Reaction)" },
        { topicNo: 7, name: "Reactions of Benzene Diazonium Halide" }
      ]
    },
    {
      chapterNo: 10,
      name: "Biomolecules",
      marks: 7,
      topics: [
        { topicNo: 1, name: "Carbohydrates - Classification" },
        { topicNo: 2, name: "Preparation & Structure of glucose" },
        { topicNo: 3, name: "Cyclic form of Glucose" },
        { topicNo: 4, name: "Disaccharides and Polysaccharides" },
        { topicNo: 5, name: "Amino Acids & Proteins" },
        { topicNo: 6, name: "Classification (Primary, Secondary, etc.) & Denaturation of Proteins" },
        { topicNo: 7, name: "Enzymes & Vitamins" },
        { topicNo: 8, name: "Nucleic acids (DNA, RNA)" }
      ]
    }
  ];
  
  // Create chapters and topics
  for (const chapterData of chaptersData) {
    const chapterRef = doc(collection(db, COLLECTIONS.CHAPTERS));
    await setDoc(chapterRef, {
      chapterNo: chapterData.chapterNo,
      name: chapterData.name
    });
    
    // Create topics as subcollection
    for (const topicData of chapterData.topics) {
      const topicRef = doc(collection(db, COLLECTIONS.CHAPTERS, chapterRef.id, 'topics'));
      await setDoc(topicRef, topicData);
    }
  }
  
  // Create admin user
  const adminRef = doc(collection(db, COLLECTIONS.USERS));
  await setDoc(adminRef, {
    name: 'Admin',
    username: 'admin',
    passwordHash: hashPassword('admin123'),
    role: 'admin',
    school: 'ChemClass Pro',
    createdAt: Timestamp.now()
  });
  
  console.log('Seed completed successfully!');
};

// Force re-seed chapters (delete old and create new)
export const forceReseedChapters = async (): Promise<void> => {
  console.log('Force re-seeding chapters...');
  
  // Delete all existing chapters and their topics
  const chaptersRef = collection(db, COLLECTIONS.CHAPTERS);
  const existingChapters = await getDocs(chaptersRef);
  
  for (const chapterDoc of existingChapters.docs) {
    // Delete all topics in this chapter
    const topicsRef = collection(db, COLLECTIONS.CHAPTERS, chapterDoc.id, 'topics');
    const topicsSnapshot = await getDocs(topicsRef);
    
    for (const topicDoc of topicsSnapshot.docs) {
      await deleteDoc(topicDoc.ref);
    }
    
    // Delete the chapter
    await deleteDoc(chapterDoc.ref);
  }
  
  console.log('Old chapters deleted, creating new ones...');
  
  // Now seed new chapters
  const chaptersData = [
    {
      chapterNo: 1,
      name: "Solutions",
      marks: 7,
      topics: [
        { topicNo: 1, name: "Types of solutions (solid in liquid, liquid in liquid, gas in liquid, etc.)" },
        { topicNo: 2, name: "Concentration Terms and Numericals (Mass percentage, Mole fraction, Molarity, Molality, ppm)" },
        { topicNo: 3, name: "Solubility of solid in liquids" },
        { topicNo: 4, name: "Solubility of gases in liquids (Henry's law)" },
        { topicNo: 5, name: "Vapour Pressure & Raoult's law (Ideal & Non-ideal solutions, Azeotropic Mixture)" },
        { topicNo: 6, name: "Colligative Properties - Relative lowering of vapour pressure" },
        { topicNo: 7, name: "Colligative Properties - Elevation of boiling point" },
        { topicNo: 8, name: "Colligative Properties - Depression of freezing point" },
        { topicNo: 9, name: "Colligative Properties - Osmotic pressure" },
        { topicNo: 10, name: "Abnormal molecular mass & Van't Hoff factor (Association & Dissociation)" }
      ]
    },
    {
      chapterNo: 2,
      name: "Electrochemistry",
      marks: 9,
      topics: [
        { topicNo: 1, name: "Redox reactions (recapitulation)" },
        { topicNo: 2, name: "Standard electrode potential & Electromotive force (EMF) of a cell" },
        { topicNo: 3, name: "Nernst equation, Gibbs Energy & Equilibrium Constant" },
        { topicNo: 4, name: "Conductance, conductivity and molar conductivity in electrolytic solutions" },
        { topicNo: 5, name: "Variation of conductivity with concentration" },
        { topicNo: 6, name: "Kohlrausch's law" },
        { topicNo: 7, name: "Electrolytic cell, Faraday's laws of electrolysis & Products of Electrolysis" },
        { topicNo: 8, name: "Types of cells - Primary Cells, Secondary Cells, Fuel Cell & Corrosion" }
      ]
    },
    {
      chapterNo: 3,
      name: "Chemical Kinetics",
      marks: 7,
      topics: [
        { topicNo: 1, name: "Rate of a reaction (Average & Instantaneous rate)" },
        { topicNo: 2, name: "Rate law & Factors affecting rate of reaction" },
        { topicNo: 3, name: "Rate constant, Order of a reaction, Numericals" },
        { topicNo: 4, name: "Molecularity of a reaction" },
        { topicNo: 5, name: "Integrated rate equations - Zero Order, Half life, Graphs" },
        { topicNo: 6, name: "Integrated rate equations - First Order, Half life, Graphs" },
        { topicNo: 7, name: "Pseudo first-order reactions" },
        { topicNo: 8, name: "Temperature dependence of rate constant (Arrhenius equation), Activation energy" },
        { topicNo: 9, name: "Effect of Catalyst & Collision theory" }
      ]
    },
    {
      chapterNo: 4,
      name: "d- and f-Block Elements",
      marks: 7,
      topics: [
        { topicNo: 1, name: "General introduction & Electronic configuration of transition elements" },
        { topicNo: 2, name: "Properties - Physical, MP, BP & Enthalpy of Atomization" },
        { topicNo: 3, name: "Ionization enthalpy & Oxidation states" },
        { topicNo: 4, name: "Atomic Size & Lanthanoid contraction" },
        { topicNo: 5, name: "Colour & Magnetic properties" },
        { topicNo: 6, name: "Catalytic property, Interstitial compounds & Alloy formation" },
        { topicNo: 7, name: "Preparation and properties of potassium dichromate (K₂Cr₂O₇)" },
        { topicNo: 8, name: "Preparation and properties of potassium permanganate (KMnO₄)" },
        { topicNo: 9, name: "Lanthanoids - Electronic configuration, Oxidation states & Chemical reactivity" },
        { topicNo: 10, name: "Actinoids (IMPORTANT QUESTIONS)" }
      ]
    },
    {
      chapterNo: 5,
      name: "Coordination Compounds",
      marks: 7,
      topics: [
        { topicNo: 1, name: "Introduction to coordination compounds" },
        { topicNo: 2, name: "Werner's theory (Primary & Secondary Valency)" },
        { topicNo: 3, name: "Important Terms (Central atom, Ligands, Coordination number, etc.)" },
        { topicNo: 4, name: "IUPAC nomenclature of mononuclear coordination compounds" },
        { topicNo: 5, name: "Isomerism in coordination compounds (Structural & Stereoisomerism)" },
        { topicNo: 6, name: "Bonding in coordination compounds - VBT" },
        { topicNo: 7, name: "Crystal Field Theory (CFT)" },
        { topicNo: 8, name: "Colour & Stability of complexes" },
        { topicNo: 9, name: "Carbonyl Group & application of coordination compounds" }
      ]
    },
    {
      chapterNo: 6,
      name: "Haloalkanes and Haloarenes",
      marks: 6,
      topics: [
        { topicNo: 1, name: "Classification, Nomenclature & Nature of carbon-halogen (C–X) bond" },
        { topicNo: 2, name: "Methods of preparation of Haloalkanes (from alcohols, Swartz, Finkelstein, etc.)" },
        { topicNo: 3, name: "Physical properties (Melting point, Boiling point, etc.)" },
        { topicNo: 4, name: "Chemical reactions - Nucleophilic substitution" },
        { topicNo: 5, name: "SN1 & SN2 mechanism" },
        { topicNo: 6, name: "Elimination reactions & Substitution vs Elimination" },
        { topicNo: 7, name: "Reaction with metals (Wurtz reaction, Fittig reaction, etc.)" },
        { topicNo: 8, name: "Preparation of Haloarenes" },
        { topicNo: 9, name: "Chemical Reactions of Haloarenes" },
        { topicNo: 10, name: "Polyhalogen compounds" },
        { topicNo: 11, name: "Practice Questions" }
      ]
    },
    {
      chapterNo: 7,
      name: "Alcohols, Phenols and Ethers",
      marks: 6,
      topics: [
        { topicNo: 1, name: "Classification of Alcohol, Phenol & Ethers" },
        { topicNo: 2, name: "Nomenclature of Alcohol, Phenol & Ethers" },
        { topicNo: 3, name: "Preparation of Alcohols (From Alkenes, Carbonyl, Grignard)" },
        { topicNo: 4, name: "Physical properties of Alcohols" },
        { topicNo: 5, name: "Chemical reactions of alcohols (Dehydration, Oxidation, Esterification, etc.)" },
        { topicNo: 6, name: "Preparation of Phenols" },
        { topicNo: 7, name: "Chemical Reactions of Phenol (Acidic Nature, Reimer-Tiemann, Nitration, etc.)" },
        { topicNo: 8, name: "Preparation of Ethers" },
        { topicNo: 9, name: "Chemical Reaction of Ethers" },
        { topicNo: 10, name: "Practice Questions" }
      ]
    },
    {
      chapterNo: 8,
      name: "Aldehydes, Ketones and Carboxylic Acids",
      marks: 8,
      topics: [
        { topicNo: 1, name: "Nomenclature of Aldehyde, Ketones" },
        { topicNo: 2, name: "Structure and Preparation of carbonyl group" },
        { topicNo: 3, name: "Preparation of aldehyde Only" },
        { topicNo: 4, name: "Preparation of ketones only" },
        { topicNo: 5, name: "Chemical reactions of aldehydes and ketones - Nucleophilic addition reactions" },
        { topicNo: 6, name: "Reduction (Clemensson, etc.) and Oxidation (Tollens, etc.) Reactions" },
        { topicNo: 7, name: "Aldol condensation & Cannizzaro reaction" },
        { topicNo: 8, name: "Electrophilic substitution in aromatic aldehydes and ketones" },
        { topicNo: 9, name: "Preparation of Carboxylic acids" },
        { topicNo: 10, name: "Chemical Reactions of Carboxylic Acid" },
        { topicNo: 11, name: "Practice Questions" }
      ]
    },
    {
      chapterNo: 9,
      name: "Amines",
      marks: 6,
      topics: [
        { topicNo: 1, name: "Structure, Nomenclature & Classification of amines" },
        { topicNo: 2, name: "Preparation of Amines (Reduction, Gabriel phthalimide synthesis, Hoffmann bromamide, etc.)" },
        { topicNo: 3, name: "Physical properties and Basic character of amines" },
        { topicNo: 4, name: "Chemical reactions (Alkylation, Acylation, Benzoylation, etc.)" },
        { topicNo: 5, name: "Aromatic Amines Reactions (Nitration, Sulphonation, etc.)" },
        { topicNo: 6, name: "Distinguish Reactions (Hinsberg, Carbylamine, nitrous acid, Coupling Reaction)" },
        { topicNo: 7, name: "Reactions of Benzene Diazonium Halide" }
      ]
    },
    {
      chapterNo: 10,
      name: "Biomolecules",
      marks: 7,
      topics: [
        { topicNo: 1, name: "Carbohydrates - Classification" },
        { topicNo: 2, name: "Preparation & Structure of glucose" },
        { topicNo: 3, name: "Cyclic form of Glucose" },
        { topicNo: 4, name: "Disaccharides and Polysaccharides" },
        { topicNo: 5, name: "Amino Acids & Proteins" },
        { topicNo: 6, name: "Classification (Primary, Secondary, etc.) & Denaturation of Proteins" },
        { topicNo: 7, name: "Enzymes & Vitamins" },
        { topicNo: 8, name: "Nucleic acids (DNA, RNA)" }
      ]
    }
  ];
  
  // Create chapters and topics
  for (const chapterData of chaptersData) {
    const chapterRef = doc(collection(db, COLLECTIONS.CHAPTERS));
    await setDoc(chapterRef, {
      chapterNo: chapterData.chapterNo,
      name: chapterData.name,
      marks: chapterData.marks
    });
    
    // Create topics as subcollection
    for (const topicData of chapterData.topics) {
      const topicRef = doc(collection(db, COLLECTIONS.CHAPTERS, chapterRef.id, 'topics'));
      await setDoc(topicRef, topicData);
    }
  }
  
  console.log('Force re-seed completed successfully!');
};

// Helper to check if Firebase is properly initialized
export const checkFirebaseConnection = async (): Promise<boolean> => {
  try {
    const testRef = doc(db, '_test', 'connection');
    await setDoc(testRef, { test: true, timestamp: Timestamp.now() });
    await deleteDoc(testRef);
    return true;
  } catch (error) {
    console.error('Firebase connection error:', error);
    return false;
  }
};
