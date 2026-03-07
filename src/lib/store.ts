import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Types
export interface TeacherAssignment {
  classId: string;
  subjectId: string;
}

// Syllabus assignment for each class-subject combination
export interface SyllabusAssignment {
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  syllabusId: string | null;  // ID of predefined or custom syllabus
  syllabusType: 'predefined' | 'custom' | null;
  syllabusName?: string;  // Display name of the syllabus
}

// Student enrollment - represents a student's enrollment with a teacher/institute for a subject
export interface StudentEnrollment {
  id: string;  // Unique enrollment ID
  teacherId?: string;  // For independent teachers
  instituteId?: string;  // For institutes
  classId: string;
  subjectId: string;
  teacherName?: string;  // Name of the subject teacher
  instituteName?: string;  // Name of the institute (for institute students)
  subjectName: string;
  className?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: 'student' | 'teacher' | 'institute_owner' | 'superadmin' | 'independent_teacher';
  instituteId?: string;
  // Legacy fields (for backward compatibility)
  assignedClassId?: string;
  assignedSubjectId?: string;
  classId?: string;
  // New field for multiple teacher assignments
  assignments?: TeacherAssignment[];
  // Syllabus assignments per class-subject
  syllabusAssignments?: SyllabusAssignment[];
  // Student enrollments - multiple teachers/subjects
  enrollments?: StudentEnrollment[];
  // For independent teacher
  classes?: { id: string; name: string }[];
  subjects?: { id: string; name: string; classIds: string[] }[];
  referralCode?: string;
  independentTeacherId?: string; // For students of independent teacher
  // Syllabus preference
  usePredefinedSyllabus?: boolean;
  createdAt?: Date;
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
  chapters: Chapter[];
  isDefault: boolean;
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
}

export interface TestMarks {
  id: string;
  testId: string;
  userId: string;
  chapterId: string;
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

// Badge Celebration State
export interface BadgeCelebration {
  show: boolean;
  badgeId: string;
  badgeName: string;
  badgeIcon: string;
  badgeColor: string;
  badgeBgColor: string;
  type: 'overall' | 'chapter';
  chapterName?: string;
}

// Streak Data
export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
}

// Streak Celebration State
export interface StreakCelebration {
  show: boolean;
  days: number;
  message: string;
}

// App View State
export type AppView = 
  | 'dashboard' 
  | 'chapters' 
  | 'chapter-detail' 
  | 'students' 
  | 'test-marks' 
  | 'analysis' 
  | 'pdfs' 
  | 'discipline' 
  | 'activity' 
  | 'test-history'
  | 'teachers'
  | 'classes'
  | 'subjects'
  | 'institute-students';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

interface AppState {
  // Navigation
  currentView: AppView;
  selectedChapterId: string | null;
  selectedStudentId: string | null;
  selectedSubjectId: string | null;
  
  // Teacher's selected class-subject assignment
  teacherSelectedAssignment: TeacherAssignment | null;
  
  // Student's selected enrollment (for multiple teachers/subjects)
  studentSelectedEnrollment: StudentEnrollment | null;
  
  // Data
  institute: Institute | null;
  subjects: Subject[];
  chapters: Chapter[];
  progress: Progress | null;
  allStudents: User[];
  allTeachers: User[];
  allProgress: Progress[];
  allTests: Test[];
  allTestMarks: TestMarks[];
  pdfs: PdfData[];
  disciplineStars: DisciplineStars | null;
  allDisciplineStars: DisciplineStars[];
  activityLog: ActivityLog[];
  
  // Streak
  streakData: StreakData | null;
  
  // Badge Celebration
  badgeCelebration: BadgeCelebration | null;
  
  // Streak Celebration
  streakCelebration: StreakCelebration | null;
  
  // Loading states
  isLoading: boolean;
  isDataLoaded: boolean;
  
  // Unsubscribe functions for real-time listeners
  _unsubscribers: (() => void)[];
  
  // Actions
  setCurrentView: (view: AppView) => void;
  setSelectedChapterId: (id: string | null) => void;
  setSelectedStudentId: (id: string | null) => void;
  setSelectedSubjectId: (id: string | null) => void;
  setTeacherSelectedAssignment: (assignment: TeacherAssignment | null) => void;
  setInstitute: (institute: Institute | null) => void;
  setSubjects: (subjects: Subject[]) => void;
  setChapters: (chapters: Chapter[]) => void;
  setProgress: (progress: Progress | null) => void;
  setAllStudents: (students: User[]) => void;
  setAllTeachers: (teachers: User[]) => void;
  setAllProgress: (progress: Progress[]) => void;
  setAllTests: (tests: Test[]) => void;
  setAllTestMarks: (marks: TestMarks[]) => void;
  setPdfs: (pdfs: PdfData[]) => void;
  setDisciplineStars: (stars: DisciplineStars | null) => void;
  setAllDisciplineStars: (stars: DisciplineStars[]) => void;
  setActivityLog: (logs: ActivityLog[]) => void;
  setStreakData: (streak: StreakData | null) => void;
  setIsLoading: (loading: boolean) => void;
  setIsDataLoaded: (loaded: boolean) => void;
  addUnsubscriber: (unsub: () => void) => void;
  cleanupSubscriptions: () => void;
  setStudentSelectedEnrollment: (enrollment: StudentEnrollment | null) => void;
  updateProgressItem: (topicId: string, field: keyof ProgressItem, value: boolean) => void;
  updateHotsCompleted: (chapterId: string, value: boolean) => void;
  triggerBadgeCelebration: (celebration: Omit<BadgeCelebration, 'show'>) => void;
  closeBadgeCelebration: () => void;
  triggerStreakCelebration: (celebration: Omit<StreakCelebration, 'show'>) => void;
  closeStreakCelebration: () => void;
}

// Auth store with session storage persistence
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => {
        // Reset teacher and student selection on new login
        useAppStore.getState().setTeacherSelectedAssignment(null);
        useAppStore.getState().setStudentSelectedEnrollment(null);
        set({ user, isAuthenticated: true });
      },
      logout: () => {
        // Reset teacher and student selection on logout
        useAppStore.getState().setTeacherSelectedAssignment(null);
        useAppStore.getState().setStudentSelectedEnrollment(null);
        set({ user: null, isAuthenticated: false });
      },
      updateUser: (userData) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...userData } });
        }
      },
    }),
    {
      name: 'chemclass-auth',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

// App store
export const useAppStore = create<AppState>()((set, get) => ({
  // Navigation
  currentView: 'dashboard',
  selectedChapterId: null,
  selectedStudentId: null,
  selectedSubjectId: null,
  
  // Teacher's selected class-subject assignment
  teacherSelectedAssignment: null,
  
  // Student's selected enrollment
  studentSelectedEnrollment: null,
  
  // Data
  institute: null,
  subjects: [],
  chapters: [],
  progress: null,
  allStudents: [],
  allTeachers: [],
  allProgress: [],
  allTests: [],
  allTestMarks: [],
  pdfs: [],
  disciplineStars: null,
  allDisciplineStars: [],
  activityLog: [],
  
  // Streak
  streakData: null,
  
  // Badge Celebration
  badgeCelebration: null,
  
  // Streak Celebration
  streakCelebration: null,
  
  // Loading states
  isLoading: false,
  isDataLoaded: false,
  
  // Unsubscribers
  _unsubscribers: [],
  
  // Actions
  setCurrentView: (view) => set({ currentView: view }),
  setSelectedChapterId: (id) => set({ selectedChapterId: id }),
  setSelectedStudentId: (id) => set({ selectedStudentId: id }),
  setSelectedSubjectId: (id) => set({ selectedSubjectId: id }),
  setTeacherSelectedAssignment: (assignment) => set({ teacherSelectedAssignment: assignment }),
  setInstitute: (institute) => set({ institute }),
  setSubjects: (subjects) => set({ subjects }),
  setChapters: (chapters) => set({ chapters }),
  setProgress: (progress) => set({ progress }),
  setAllStudents: (students) => set({ allStudents: students }),
  setAllTeachers: (teachers) => set({ allTeachers: teachers }),
  setAllProgress: (progress) => set({ allProgress: progress }),
  setAllTests: (tests) => set({ allTests: tests }),
  setAllTestMarks: (marks) => set({ allTestMarks: marks }),
  setPdfs: (pdfs) => set({ pdfs }),
  setDisciplineStars: (stars) => set({ disciplineStars: stars }),
  setAllDisciplineStars: (stars) => set({ allDisciplineStars: stars }),
  setActivityLog: (logs) => set({ activityLog: logs }),
  setStreakData: (streak) => set({ streakData: streak }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsDataLoaded: (loaded) => set({ isDataLoaded: loaded }),
  setStudentSelectedEnrollment: (enrollment) => set({ studentSelectedEnrollment: enrollment }),
  
  addUnsubscriber: (unsub) => set((state) => ({
    _unsubscribers: [...state._unsubscribers, unsub]
  })),
  
  cleanupSubscriptions: () => {
    const state = get();
    state._unsubscribers.forEach((unsub) => unsub());
    set({ _unsubscribers: [] });
  },
  
  updateProgressItem: (topicId, field, value) =>
    set((state) => {
      if (!state.progress) return state;
      const updatedItems = state.progress.items.map((item) =>
        item.topicId === topicId ? { ...item, [field]: value } : item
      );
      
      // Calculate overall progress
      const totalItems = updatedItems.length;
      let totalProgress = 0;
      updatedItems.forEach((item) => {
        const completed = [
          item.lectureCompleted,
          item.ncertCompleted,
          item.level1Completed,
          item.level2Completed,
          item.notesCompleted,
        ].filter(Boolean).length;
        totalProgress += (completed / 5) * 100;
      });
      const overallProgress = totalItems > 0 ? totalProgress / totalItems : 0;
      
      return {
        progress: {
          ...state.progress,
          items: updatedItems,
          overallProgress,
        },
      };
    }),
    
  updateHotsCompleted: (chapterId, value) =>
    set((state) => {
      if (!state.progress) return state;
      return {
        progress: {
          ...state.progress,
          hotsCompleted: {
            ...state.progress.hotsCompleted,
            [chapterId]: value
          }
        }
      };
    }),
    
  triggerBadgeCelebration: (celebration) =>
    set({ badgeCelebration: { ...celebration, show: true } }),
    
  closeBadgeCelebration: () =>
    set({ badgeCelebration: null }),
    
  triggerStreakCelebration: (celebration) =>
    set({ streakCelebration: { ...celebration, show: true } }),
    
  closeStreakCelebration: () =>
    set({ streakCelebration: null }),
}));
