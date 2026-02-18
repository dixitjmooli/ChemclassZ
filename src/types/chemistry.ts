// Chapter structure
export interface Topic {
  id: string;
  name: string;
  subTopics?: string[];
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  topics: Topic[];
  totalMilestones: number;
}

// User types
export type UserRole = 'student' | 'admin';

export interface Student {
  id: string;
  username: string;
  password: string; // In production, this should be hashed
  name: string;
  school?: string;
  role: 'student';
  createdAt: Date;
}

export interface Admin {
  id: string;
  username: string;
  password: string; // In production, this should be hashed
  name: string;
  role: 'admin';
  createdAt: Date;
}

export type User = Student | Admin;

// Progress tracking
export interface TopicProgress {
  id: string;
  lectureCompleted: boolean;
  ncertCompleted: boolean;
  level1Completed: boolean;
  level2Completed: boolean;
  notesCompleted: boolean;
}

export interface ChapterProgress {
  chapterId: string;
  topicsProgress: { [topicId: string]: TopicProgress };
  hotsCompleted: boolean;
  notesCompleted: boolean;
  testMarks?: number;
}

export interface StudentProgress {
  studentId: string;
  chapters: { [chapterId: string]: ChapterProgress };
  overallProgress: number;
  lastUpdated: Date;
}

// PDF links
export interface ChapterPdf {
  chapterId: string;
  topicPdfs: { [topicId: string]: string }; // topicId -> Google Drive preview link
  hotsPdf?: string; // HOTS questions PDF link
}

// Test marks
export interface TestResult {
  studentId: string;
  chapterId: string;
  marks: number;
  maxMarks: number;
  date: Date;
}
