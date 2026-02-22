import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Types
export interface User {
  id: string;
  name: string;
  username: string;
  role: 'student' | 'admin';
  school: string;
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

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

interface AppState {
  // Navigation
  currentView: 'dashboard' | 'chapters' | 'chapter-detail' | 'students' | 'test-marks' | 'analysis' | 'pdfs';
  selectedChapterId: string | null;
  selectedStudentId: string | null;
  
  // Data
  chapters: Chapter[];
  progress: Progress | null;
  allStudents: User[];
  allProgress: Progress[];
  allTestMarks: TestMarks[];
  pdfs: PdfData[];
  
  // Loading states
  isLoading: boolean;
  isDataLoaded: boolean;
  
  // Unsubscribe functions for real-time listeners
  _unsubscribers: (() => void)[];
  
  // Actions
  setCurrentView: (view: AppState['currentView']) => void;
  setSelectedChapterId: (id: string | null) => void;
  setSelectedStudentId: (id: string | null) => void;
  setChapters: (chapters: Chapter[]) => void;
  setProgress: (progress: Progress | null) => void;
  setAllStudents: (students: User[]) => void;
  setAllProgress: (progress: Progress[]) => void;
  setAllTestMarks: (marks: TestMarks[]) => void;
  setPdfs: (pdfs: PdfData[]) => void;
  setIsLoading: (loading: boolean) => void;
  setIsDataLoaded: (loaded: boolean) => void;
  addUnsubscriber: (unsub: () => void) => void;
  cleanupSubscriptions: () => void;
  updateProgressItem: (topicId: string, field: keyof ProgressItem, value: boolean) => void;
  updateHotsCompleted: (chapterId: string, value: boolean) => void;
}

// Auth store with session storage persistence
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
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
  
  // Data
  chapters: [],
  progress: null,
  allStudents: [],
  allProgress: [],
  allTestMarks: [],
  pdfs: [],
  
  // Loading states
  isLoading: false,
  isDataLoaded: false,
  
  // Unsubscribers
  _unsubscribers: [],
  
  // Actions
  setCurrentView: (view) => set({ currentView: view }),
  setSelectedChapterId: (id) => set({ selectedChapterId: id }),
  setSelectedStudentId: (id) => set({ selectedStudentId: id }),
  setChapters: (chapters) => set({ chapters }),
  setProgress: (progress) => set({ progress }),
  setAllStudents: (students) => set({ allStudents: students }),
  setAllProgress: (progress) => set({ allProgress: progress }),
  setAllTestMarks: (marks) => set({ allTestMarks: marks }),
  setPdfs: (pdfs) => set({ pdfs }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsDataLoaded: (loaded) => set({ isDataLoaded: loaded }),
  
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
}));
