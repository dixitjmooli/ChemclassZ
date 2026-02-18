'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CBSE_CHAPTERS } from '@/data/chapters';
import type { Chapter, User, StudentProgress, ChapterProgress, TopicProgress, ChapterPdf } from '@/types/chemistry';
import { 
  FlaskConical, 
  GraduationCap, 
  BookOpen, 
  Brain, 
  Shield, 
  FileText, 
  ClipboardCheck, 
  LogOut, 
  ArrowLeft, 
  Save, 
  X,
  CheckCircle2,
  Circle,
  Users,
  BarChart3,
  LayoutDashboard,
  Menu
} from 'lucide-react';

type View = 'login' | 'studentHome' | 'studentDashboard' | 'chapterDetail' | 'adminDashboard' | 'adminStudents' | 'adminTestMarks' | 'adminPdf';

export default function Home() {
  const [view, setView] = useState<View>('login');
  const [loginType, setLoginType] = useState<'student' | 'admin'>('student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [studentProgress, setStudentProgress] = useState<StudentProgress | null>(null);
  const [allStudents, setAllStudents] = useState<User[]>([]);
  const [allStudentsProgress, setAllStudentsProgress] = useState<Record<string, StudentProgress>>({});
  const [pdfManagerOpen, setPdfManagerOpen] = useState(false);
  const [testMarksModalOpen, setTestMarksModalOpen] = useState(false);
  const [selectedStudentForMarks, setSelectedStudentForMarks] = useState<User | null>(null);
  const [testMarksInputs, setTestMarksInputs] = useState<Record<string, string>>({});
  const [pdfInputs, setPdfInputs] = useState<Record<string, string>>({});
  const [hotsPdfInput, setHotsPdfInput] = useState('');
  const [chapterPdfs, setChapterPdfs] = useState<Record<string, ChapterPdf>>({});
  const [isLoading, setIsLoading] = useState(false);
  
  // Add Student Modal
  const [addStudentModalOpen, setAddStudentModalOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentUsername, setNewStudentUsername] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('');
  const [newStudentSchool, setNewStudentSchool] = useState('');
  
  // Student Detail View Modal
  const [studentDetailViewOpen, setStudentDetailViewOpen] = useState(false);
  const [selectedStudentForView, setSelectedStudentForView] = useState<User | null>(null);

  // Test Marks - Chapter Selection
  const [selectedChapterForMarks, setSelectedChapterForMarks] = useState<Chapter | null>(null);
  const [chapterMarksInputs, setChapterMarksInputs] = useState<Record<string, string>>({});

  // Handle login
  const handleLogin = async () => {
    setIsLoading(true);
    setLoginError('');
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          role: loginType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setLoginError(data.error || 'Login failed');
        setIsLoading(false);
        return;
      }

      const user = data.user;
      setCurrentUser(user);
      
      if (loginType === 'student') {
        console.log('Student login, user ID:', user.id);
        // Load student's saved progress from Firebase
        const progressResponse = await fetch(`/api/student/progress?studentId=${user.id}`);
        const progressData = await progressResponse.json();

        if (progressData.success && progressData.progress) {
          setStudentProgress(progressData.progress);
        } else {
          const initialProgress = initializeStudentProgress(user.id);
          setStudentProgress(initialProgress);
        }
        setView('studentHome');
      } else {
        // Load all students BEFORE showing admin panel
        await loadAllStudents();
        setView('adminDashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('An error occurred. Please try again.');
    }

    setIsLoading(false);
  };

  // Load student progress from Firebase
  const loadStudentProgress = async (studentId: string): Promise<StudentProgress> => {
    try {
      const response = await fetch(`/api/student/progress/${studentId}`);
      const data = await response.json();

      if (response.ok && data.progress) {
        console.log('Loaded existing progress for student:', studentId);
        return data.progress;
      } else {
        console.log('No existing progress found, initializing new progress for student:', studentId);
        return initializeStudentProgress(studentId);
      }
    } catch (error) {
      console.error('Error loading student progress:', error);
      return initializeStudentProgress(studentId);
    }
  };

  // Load all students for admin
  const loadAllStudents = async () => {
    try {
      const response = await fetch('/api/admin/students/progress');
      const data = await response.json();

      if (response.ok) {
        setAllStudents(data.students || []);
        setAllStudentsProgress(data.progress || {});

        // Show alert with data
        const studentsWithProgress = (data.students || []).filter((s: any) => data.progress[s.id]);
        const studentNames = (data.students || []).map((s: any) => s.name).join(', ');
        const studentsWithoutProgress = (data.students || []).filter((s: any) => !data.progress[s.id]).map((s: any) => s.name).join(', ');

        alert(`ADMIN DATA LOADED:\n\nTotal Students: ${data.students?.length || 0}\nStudents WITH Progress: ${studentsWithProgress.length}\nStudents WITHOUT Progress: ${(data.students?.length || 0) - studentsWithProgress.length}\n\nAll Students: ${studentNames}\n\nNo Progress: ${studentsWithoutProgress || 'none'}`);
      }
    } catch (error) {
      console.error('Error loading students:', error);
      alert(`ERROR: ${error}`);
    }
  };

  // Initialize student progress
  const initializeStudentProgress = (studentId: string): StudentProgress => {
    const chapters: Record<string, ChapterProgress> = {};
    CBSE_CHAPTERS.forEach((chapter) => {
      const topicsProgress: Record<string, TopicProgress> = {};
      chapter.topics.forEach((topic) => {
        topicsProgress[topic.id] = {
          id: topic.id,
          lectureCompleted: false,
          ncertCompleted: false,
          level1Completed: false,
          level2Completed: false,
          notesCompleted: false
        };
      });
      chapters[chapter.id] = {
        chapterId: chapter.id,
        topicsProgress,
        hotsCompleted: false,
        notesCompleted: false
      };
    });
    
    return {
      studentId,
      chapters,
      overallProgress: 0,
      lastUpdated: new Date()
    };
  };

  // Calculate overall progress
  const calculateOverallProgress = (progress: StudentProgress): number => {
    let totalMilestones = 0;
    let completedMilestones = 0;
    
    CBSE_CHAPTERS.forEach((chapter) => {
      const chapterProgress = progress.chapters[chapter.id];
      if (chapterProgress) {
        chapter.topics.forEach((topic) => {
          const topicProgress = chapterProgress.topicsProgress[topic.id];
          if (topicProgress) {
            totalMilestones += 4; // lecture, ncert, level1, level2
            if (topicProgress.lectureCompleted) completedMilestones++;
            if (topicProgress.ncertCompleted) completedMilestones++;
            if (topicProgress.level1Completed) completedMilestones++;
            if (topicProgress.level2Completed) completedMilestones++;
          }
        });
        totalMilestones += 2; // hots, notes
        if (chapterProgress.hotsCompleted) completedMilestones++;
        if (chapterProgress.notesCompleted) completedMilestones++;
      }
    });
    
    return totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
  };

  // Calculate chapter progress
  const calculateChapterProgress = (chapterId: string, progress: StudentProgress): number => {
    const chapter = CBSE_CHAPTERS.find((c) => c.id === chapterId);
    if (!chapter || !progress.chapters[chapterId]) return 0;
    
    const chapterProgress = progress.chapters[chapterId];
    let totalMilestones = 0;
    let completedMilestones = 0;
    
    chapter.topics.forEach((topic) => {
      const topicProgress = chapterProgress.topicsProgress[topic.id];
      if (topicProgress) {
        totalMilestones += 4;
        if (topicProgress.lectureCompleted) completedMilestones++;
        if (topicProgress.ncertCompleted) completedMilestones++;
        if (topicProgress.level1Completed) completedMilestones++;
        if (topicProgress.level2Completed) completedMilestones++;
      }
    });
    totalMilestones += 2;
    if (chapterProgress.hotsCompleted) completedMilestones++;
    if (chapterProgress.notesCompleted) completedMilestones++;
    
    return totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
  };

  // Update checkbox
  const updateCheckbox = async (topicId: string, field: keyof TopicProgress, value: boolean) => {
    if (!selectedChapter || !currentUser) return;

    const newProgress = { ...studentProgress, chapters: { ...studentProgress.chapters } };
    if (!newProgress.chapters[selectedChapter.id]) {
      newProgress.chapters[selectedChapter.id] = {
        chapterId: selectedChapter.id,
        topicsProgress: {},
        hotsCompleted: false,
        notesCompleted: false
      };
    }
    if (!newProgress.chapters[selectedChapter.id].topicsProgress[topicId]) {
      newProgress.chapters[selectedChapter.id].topicsProgress[topicId] = {
        id: topicId,
        lectureCompleted: false,
        ncertCompleted: false,
        level1Completed: false,
        level2Completed: false,
        notesCompleted: false
      };
    }
    newProgress.chapters[selectedChapter.id].topicsProgress[topicId][field] = value;
    newProgress.overallProgress = calculateOverallProgress(newProgress);
    newProgress.lastUpdated = new Date();

    setStudentProgress(newProgress);

    try {
      const response = await fetch('/api/student/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: currentUser.id,
          chapterId: selectedChapter.id,
          topicId,
          field,
          value,
        }),
      });

      if (!response.ok) {
        alert('Failed to save progress. Please try again.');
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      alert('Error saving progress. Please try again.');
    }
  };

  // Update chapter-level checkbox
  const updateChapterCheckbox = async (field: 'hotsCompleted' | 'notesCompleted', value: boolean) => {
    if (!selectedChapter || !currentUser) return;

    const newProgress = { ...studentProgress, chapters: { ...studentProgress.chapters } };
    if (!newProgress.chapters[selectedChapter.id]) {
      newProgress.chapters[selectedChapter.id] = {
        chapterId: selectedChapter.id,
        topicsProgress: {},
        hotsCompleted: false,
        notesCompleted: false
      };
    }
    newProgress.chapters[selectedChapter.id][field] = value;
    newProgress.overallProgress = calculateOverallProgress(newProgress);
    newProgress.lastUpdated = new Date();

    setStudentProgress(newProgress);

    try {
      const response = await fetch('/api/student/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: currentUser.id,
          chapterId: selectedChapter.id,
          topicId: 'chapter',
          field,
          value,
        }),
      });

      if (!response.ok) {
        alert('Failed to save progress. Please try again.');
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      alert('Error saving progress. Please try again.');
    }
  };

  // Logout
  const handleLogout = () => {
    setCurrentUser(null);
    setStudentProgress(null);
    setAllStudents([]);
    setAllStudentsProgress({});
    setView('login');
    setUsername('');
    setPassword('');
  };

  // Open chapter detail
  const openChapterDetail = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setView('chapterDetail');
  };

  // Open PDF manager
  const openPdfManager = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    const chapterPdf = chapterPdfs[chapter.id] || { chapterId: chapter.id, topicPdfs: {} };
    const inputs: Record<string, string> = {};
    chapter.topics.forEach((topic) => {
      inputs[topic.id] = chapterPdf.topicPdfs[topic.id] || '';
    });
    setPdfInputs(inputs);
    setHotsPdfInput(chapterPdf.hotsPdf || '');
    setPdfManagerOpen(true);
  };

  // Save PDF links
  const savePdfLinks = async () => {
    if (!selectedChapter) return;
    
    const db = getDb();
    if (!db) return;
    
    const chapterPdf: ChapterPdf = {
      chapterId: selectedChapter.id,
      topicPdfs: pdfInputs,
      hotsPdf: hotsPdfInput || undefined
    };
    
    await setDoc(doc(db, 'pdfs', selectedChapter.id), chapterPdf);
    setChapterPdfs({ ...chapterPdfs, [selectedChapter.id]: chapterPdf });
    setPdfManagerOpen(false);
  };

  // Open test marks modal
  const openTestMarksModal = (student: User) => {
    setSelectedStudentForMarks(student);
    const inputs: Record<string, string> = {};
    const progress = allStudentsProgress[student.id];
    CBSE_CHAPTERS.forEach((chapter) => {
      if (progress?.chapters[chapter.id]?.testMarks !== undefined) {
        inputs[chapter.id] = progress.chapters[chapter.id].testMarks?.toString() || '';
      } else {
        inputs[chapter.id] = '';
      }
    });
    setTestMarksInputs(inputs);
    setTestMarksModalOpen(true);
  };

  // Save test marks
  const saveTestMarks = async () => {
    if (!selectedStudentForMarks) return;

    try {
      // Save marks for each chapter that has input
      for (const chapter of CBSE_CHAPTERS) {
        if (testMarksInputs[chapter.id] !== '') {
          const response = await fetch('/api/admin/marks', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              studentId: selectedStudentForMarks.id,
              chapterId: chapter.id,
              marks: testMarksInputs[chapter.id],
            }),
          });

          if (!response.ok) {
            console.error('Failed to save marks for chapter', chapter.id);
          }
        }
      }

      setTestMarksModalOpen(false);
      alert('Test marks saved successfully!');
      
      // Reload students progress
      loadAllStudents();
    } catch (error) {
      console.error('Error saving test marks:', error);
      alert('Failed to save test marks. Please try again.');
    }
  };

  // Save chapter marks for all students
  const saveChapterMarks = async () => {
    if (!selectedChapterForMarks) return;

    try {
      // Update each student's marks for the selected chapter
      for (const student of allStudents) {
        const marks = chapterMarksInputs[student.id];
        if (marks !== undefined && marks !== '') {
          const response = await fetch('/api/admin/marks', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              studentId: student.id,
              chapterId: selectedChapterForMarks.id,
              marks: marks,
            }),
          });

          if (!response.ok) {
            console.error('Failed to save marks for student', student.id);
          }
        }
      }
      
      alert('Test marks saved successfully!');
      
      // Reload students progress
      loadAllStudents();
    } catch (error) {
      console.error('Error saving test marks:', error);
      alert('Failed to save test marks. Please try again.');
    }
  };

  // Initialize chapter marks inputs when chapter is selected
  const initializeChapterMarks = (chapter: Chapter) => {
    setSelectedChapterForMarks(chapter);
    const inputs: Record<string, string> = {};
    allStudents.forEach((student) => {
      const progress = allStudentsProgress[student.id];
      const marks = progress?.chapters[chapter.id]?.testMarks;
      inputs[student.id] = marks !== undefined ? marks.toString() : '';
    });
    setChapterMarksInputs(inputs);
  };

  // Add new student
  const addStudent = async () => {
    if (!newStudentName || !newStudentUsername || !newStudentPassword) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/admin/students/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newStudentName,
          username: newStudentUsername,
          password: newStudentPassword,
          school: newStudentSchool || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to add student');
        return;
      }

      // Reset form and close modal
      setNewStudentName('');
      setNewStudentUsername('');
      setNewStudentPassword('');
      setNewStudentSchool('');
      setAddStudentModalOpen(false);

      alert('Student added successfully!');
      
      // Reload students list
      loadAllStudents();
    } catch (error) {
      console.error('Error adding student:', error);
      alert('Error adding student. Please try again.');
    }
  };

  // Calculate student rank based on overall progress and test marks
  const calculateStudentRank = (studentId: string): number => {
    const studentsWithScores = allStudents.map(student => {
      const progress = allStudentsProgress[student.id];
      const overallProgress = progress?.overallProgress || 0;
      
      // Calculate total test marks
      let totalMarks = 0;
      let totalTests = 0;
      CBSE_CHAPTERS.forEach(chapter => {
        if (progress?.chapters[chapter.id]?.testMarks !== undefined) {
          totalMarks += progress.chapters[chapter.id].testMarks!;
          totalTests++;
        }
      });

      // Score calculation: 70% progress + 30% test average
      const testAverage = totalTests > 0 ? (totalMarks / totalTests) : 0;
      const finalScore = (overallProgress * 0.7) + (testAverage * 0.3);
      
      return { studentId, score: finalScore };
    });

    // Sort by score (highest first)
    studentsWithScores.sort((a, b) => b.score - a.score);
    
    // Find rank (1-indexed)
    const rank = studentsWithScores.findIndex(s => s.studentId === studentId) + 1;
    return rank;
  };

  // Render functions
  const renderLogin = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-400 rounded-2xl mx-auto flex items-center justify-center">
            <FlaskConical className="text-white w-8 h-8" />
          </div>
          <CardTitle className="text-3xl">ChemClass Pro</CardTitle>
          <p className="text-gray-600">CBSE Class 12 Chemistry</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-1">
            <p className="text-xl font-semibold">Welcome Back</p>
            <p className="text-gray-600 text-sm">Sign in to continue your chemistry journey</p>
          </div>

          <Tabs value={loginType} onValueChange={(v) => setLoginType(v as 'student' | 'admin')}>
            <TabsList className="w-full">
              <TabsTrigger value="student" className="flex-1">Student</TabsTrigger>
              <TabsTrigger value="admin" className="flex-1">Admin</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Username</label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="h-12"
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>

            {loginError && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
                {loginError}
              </div>
            )}

            <Button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-lg font-semibold"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStudentHome = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">ChemClass Pro</h1>
              <p className="text-purple-100 text-sm">CBSE Class 12 Chemistry</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="secondary"
            className="bg-white/20 hover:bg-white/30 text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Card className="bg-gradient-to-br from-purple-100 to-indigo-100 border-0 p-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Master Chemistry</h2>
          <h3 className="text-2xl font-bold text-purple-600 mb-3">Step by Step</h3>
          <p className="text-gray-700 leading-relaxed max-w-2xl mx-auto">
            Comprehensive progress tracking for CBSE Class 12 Chemistry with 10 chapters, detailed topics, and milestone-based learning.
          </p>
        </Card>

        <div className="grid gap-4">
          <Card className="border-2 border-purple-100 p-6 hover:shadow-lg transition-all cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <GraduationCap className="text-purple-600 w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">10 Complete Chapters</h3>
                <p className="text-gray-600">Complete CBSE syllabus coverage with detailed topics and sub-topics</p>
              </div>
            </div>
          </Card>

          <Card 
            className="border-2 border-orange-200 p-6 hover:shadow-lg transition-all cursor-pointer"
            onClick={() => setView('studentDashboard')}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <BookOpen className="text-orange-600 w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Track Progress</h3>
                <p className="text-gray-600">Monitor lectures, NCERT reading, question practice & notes</p>
              </div>
            </div>
          </Card>

          <Card className="border-2 border-green-200 p-6 hover:shadow-lg transition-all cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <FlaskConical className="text-green-600 w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Real-time Analytics</h3>
                <p className="text-gray-600">Live progress calculation and performance insights</p>
              </div>
            </div>
          </Card>

          <Card className="border-2 border-blue-200 p-6 hover:shadow-lg transition-all cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="text-blue-600 w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Level-wise Practice</h3>
                <p className="text-gray-600">Level 1, Level 2, and HOTS questions for mastery</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );

  const renderStudentDashboard = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button
            onClick={() => setView('studentHome')}
            variant="secondary"
            className="bg-white/20 hover:bg-white/30 text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="text-center flex-1">
            <h1 className="text-lg font-bold">{currentUser?.name}</h1>
            <p className="text-purple-100 text-sm">{(currentUser as any)?.school}</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="secondary"
            className="bg-white/20 hover:bg-white/30 text-white"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="text-center">Overall Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="relative">
                <svg className="w-36 h-36 -rotate-90">
                  <circle cx="72" cy="72" r="64" stroke="#e5e7eb" strokeWidth="12" fill="none" />
                  <circle
                    cx="72" cy="72" r="64"
                    stroke="#7c3aed"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={402.12}
                    strokeDashoffset={402.12 - (402.12 * (studentProgress?.overallProgress || 0)) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-800">
                      {studentProgress?.overallProgress || 0}%
                    </div>
                    <div className="text-xs text-gray-500">Complete</div>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-center text-gray-600">
              Keep going! Complete all chapters to ace your exams.
            </p>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <BookOpen className="text-purple-600 w-5 h-5 mr-2" />
            CBSE Class 12 Chemistry
          </h2>
          <div className="space-y-3">
            {CBSE_CHAPTERS.map((chapter) => {
              const progress = calculateChapterProgress(chapter.id, studentProgress || initializeStudentProgress(''));
              return (
                <Card
                  key={chapter.id}
                  className="p-4 cursor-pointer hover:shadow-md transition-all"
                  onClick={() => openChapterDetail(chapter)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center font-bold text-purple-600">
                        {chapter.number}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{chapter.title}</h3>
                        <p className="text-sm text-gray-500">{chapter.topics.length} topics</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress value={progress} className="w-24 h-2" />
                      <span className="text-sm font-semibold text-gray-700 w-12 text-right">{progress}%</span>
                      <ArrowLeft className="w-4 h-4 text-gray-400 rotate-180" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  const renderChapterDetail = () => {
    if (!selectedChapter || !studentProgress) return null;

    const chapterProgress = studentProgress.chapters[selectedChapter.id] || {
      topicsProgress: {},
      hotsCompleted: false,
      notesCompleted: false
    };
    const chapterProgressPercent = calculateChapterProgress(selectedChapter.id, studentProgress);
    const chapterPdf = chapterPdfs[selectedChapter.id];

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white p-4 shadow-lg">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Button
              onClick={() => setView('studentDashboard')}
              variant="secondary"
              className="bg-white/20 hover:bg-white/30 text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h2 className="font-semibold">Chapter {selectedChapter.number}</h2>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-4 space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{selectedChapter.title}</h1>
                <p className="text-sm text-gray-500">{selectedChapter.topics.length} topics</p>
              </div>
              <div className="relative">
                <svg className="w-20 h-20 -rotate-90">
                  <circle cx="40" cy="40" r="32" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                  <circle
                    cx="40" cy="40" r="32"
                    stroke="#7c3aed"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={201.06}
                    strokeDashoffset={201.06 - (201.06 * chapterProgressPercent) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-xl font-bold text-gray-800">{chapterProgressPercent}%</div>
                </div>
              </div>
            </div>
          </Card>

          <ScrollArea className="h-[calc(100vh-500px)]">
            <div className="space-y-4">
              {selectedChapter.topics.map((topic) => {
                const topicProgress = chapterProgress.topicsProgress[topic.id];
                return (
                  <Card key={topic.id} className="p-4">
                    <div className="space-y-3">
                      <h3 className="font-semibold text-gray-900">{topic.name}</h3>
                      
                      {topic.subTopics && topic.subTopics.length > 0 && (
                        <div className="text-sm text-gray-500 space-y-1 ml-2">
                          {topic.subTopics.map((subTopic, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="text-purple-600">•</span>
                              {subTopic}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                        <label className="flex items-center gap-2 p-3 rounded-lg border-2 border-gray-200 hover:bg-gray-50 cursor-pointer transition">
                          <Checkbox
                            checked={topicProgress?.lectureCompleted || false}
                            onCheckedChange={(checked) => updateCheckbox(topic.id, 'lectureCompleted', checked as boolean)}
                          />
                          <span className="text-sm font-medium text-gray-700">Lecture</span>
                        </label>
                        <label className="flex items-center gap-2 p-3 rounded-lg border-2 border-gray-200 hover:bg-gray-50 cursor-pointer transition">
                          <Checkbox
                            checked={topicProgress?.ncertCompleted || false}
                            onCheckedChange={(checked) => updateCheckbox(topic.id, 'ncertCompleted', checked as boolean)}
                          />
                          <span className="text-sm font-medium text-gray-700">NCERT</span>
                        </label>
                        <label className="flex items-center gap-2 p-3 rounded-lg border-2 border-gray-200 hover:bg-gray-50 cursor-pointer transition">
                          <Checkbox
                            checked={topicProgress?.level1Completed || false}
                            onCheckedChange={(checked) => updateCheckbox(topic.id, 'level1Completed', checked as boolean)}
                          />
                          <span className="text-sm font-medium text-gray-700">Level 1</span>
                        </label>
                        <label className="flex items-center gap-2 p-3 rounded-lg border-2 border-gray-200 hover:bg-gray-50 cursor-pointer transition">
                          <Checkbox
                            checked={topicProgress?.level2Completed || false}
                            onCheckedChange={(checked) => updateCheckbox(topic.id, 'level2Completed', checked as boolean)}
                          />
                          <span className="text-sm font-medium text-gray-700">Level 2</span>
                        </label>
                      </div>

                      {chapterPdf?.topicPdfs[topic.id] && (
                        <div className="mt-2">
                          <a
                            href={chapterPdf.topicPdfs[topic.id]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                          >
                            <FileText className="w-4 h-4" />
                            View Study Material
                          </a>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>

          <Card className="p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Additional Tasks</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-4 rounded-xl cursor-pointer border-2 border-gray-200 hover:bg-gray-50 transition">
                <Checkbox
                  checked={chapterProgress.hotsCompleted}
                  onCheckedChange={(checked) => updateChapterCheckbox('hotsCompleted', checked as boolean)}
                />
                <span className="font-medium text-gray-700 flex items-center gap-2">
                  <Brain className="text-purple-600 w-4 h-4" />
                  HOTS Questions
                </span>
              </label>
              {chapterPdf?.hotsPdf && (
                <div className="ml-14 mb-2">
                  <a
                    href={chapterPdf.hotsPdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 bg-purple-50 px-3 py-2 rounded-lg"
                  >
                    <FileText className="w-4 h-4" />
                    View HOTS Questions PDF
                  </a>
                </div>
              )}
              <label className="flex items-center gap-3 p-4 rounded-xl cursor-pointer border-2 border-gray-200 hover:bg-gray-50 transition">
                <Checkbox
                  checked={chapterProgress.notesCompleted}
                  onCheckedChange={(checked) => updateChapterCheckbox('notesCompleted', checked as boolean)}
                />
                <span className="font-medium text-gray-700 flex items-center gap-2">
                  <BookOpen className="text-blue-600 w-4 h-4" />
                  Short Notes
                </span>
              </label>
            </div>
          </Card>

          {chapterProgress.testMarks !== undefined && (
            <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ClipboardCheck className="text-blue-600 w-5 h-5" />
                  <div>
                    <h3 className="font-semibold text-gray-800">Test Performance</h3>
                    <p className="text-sm text-gray-600">Your marks for this chapter test</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-blue-600">{chapterProgress.testMarks}/100</div>
              </div>
            </Card>
          )}
        </div>
      </div>
    );
  };

  const renderAdminDashboard = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white p-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold">ChemClass Pro - Admin</h1>
              <p className="text-purple-100 text-sm">Dashboard</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="secondary"
            className="bg-white/20 hover:bg-white/30 text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
      {renderAdminNav()}
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Users className="text-purple-600 w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{allStudents.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="text-green-600 w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Chapters</p>
                <p className="text-2xl font-bold text-gray-900">{CBSE_CHAPTERS.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="text-blue-600 w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">PDFs Added</p>
                <p className="text-2xl font-bold text-gray-900">{Object.keys(chapterPdfs).length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Debug & Refresh Section */}
        <Card className="p-4 bg-blue-50 border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">Debug Info</p>
              <p className="text-xs text-blue-700">
                Loaded {allStudents.length} students • {Object.keys(allStudentsProgress).length} progress records
              </p>
            </div>
            <Button
              onClick={loadAllStudents}
              variant="outline"
              className="bg-white hover:bg-blue-100 border-blue-300 text-blue-700"
              size="sm"
            >
              Refresh Students
            </Button>
          </div>
        </Card>

        {/* Test Marks Analysis */}
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Test Marks Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="space-y-6">
                {CBSE_CHAPTERS.map((chapter) => {
                  // Calculate statistics for this chapter
                  const marksList: number[] = [];
                  allStudents.forEach((student) => {
                    const progress = allStudentsProgress[student.id];
                    if (progress?.chapters[chapter.id]?.testMarks !== undefined) {
                      marksList.push(progress.chapters[chapter.id].testMarks!);
                    }
                  });

                  if (marksList.length === 0) return null;

                  const average = marksList.reduce((a, b) => a + b, 0) / marksList.length;
                  const highest = Math.max(...marksList);
                  const lowest = Math.min(...marksList);
                  const passed = marksList.filter(m => m >= 10).length; // Assuming 10 is passing (out of 20)
                  const passPercentage = Math.round((passed / marksList.length) * 100);

                  return (
                    <Card key={chapter.id} className="p-4 border-2 border-blue-100">
                      <div className="mb-3">
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                          <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                            {chapter.number}
                          </span>
                          {chapter.title}
                        </h4>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-green-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Average</p>
                          <p className="text-xl font-bold text-green-600">{average.toFixed(1)}/100</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Highest</p>
                          <p className="text-xl font-bold text-blue-600">{highest}/100</p>
                        </div>
                        <div className="bg-red-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Lowest</p>
                          <p className="text-xl font-bold text-red-600">{lowest}/100</p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Pass Rate</p>
                          <p className="text-xl font-bold text-purple-600">{passPercentage}%</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">Student Performance:</p>
                        {allStudents.map((student) => {
                          const progress = allStudentsProgress[student.id];
                          const marks = progress?.chapters[chapter.id]?.testMarks;
                          
                          if (marks === undefined) return null;

                          const percentage = (marks / 20) * 100;
                          let progressColor = 'bg-red-500';
                          if (percentage >= 80) progressColor = 'bg-green-500';
                          else if (percentage >= 60) progressColor = 'bg-yellow-500';
                          else if (percentage >= 40) progressColor = 'bg-orange-500';

                          return (
                            <div key={student.id} className="flex items-center gap-3 text-sm">
                              <div className="w-32 truncate text-gray-700">{student.name}</div>
                              <Progress value={percentage} className="flex-1 h-2">
                                <div className={`h-full ${progressColor} transition-all`} style={{ width: `${percentage}%` }} />
                              </Progress>
                              <div className="w-16 text-right font-semibold text-gray-900">
                                {marks}/100
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Admin Navigation Component
  const renderAdminNav = () => (
    <div className="bg-white border-b shadow-sm sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4">
        <nav className="flex gap-2 py-3 overflow-x-auto">
          <Button
            onClick={() => setView('adminDashboard')}
            variant={view === 'adminDashboard' ? 'default' : 'ghost'}
            className={`flex items-center gap-2 ${view === 'adminDashboard' ? 'bg-purple-600 text-white' : 'text-gray-700'}`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Button>
          <Button
            onClick={() => setView('adminStudents')}
            variant={view === 'adminStudents' ? 'default' : 'ghost'}
            className={`flex items-center gap-2 ${view === 'adminStudents' ? 'bg-purple-600 text-white' : 'text-gray-700'}`}
          >
            <Users className="w-4 h-4" />
            Students
          </Button>
          <Button
            onClick={() => setView('adminTestMarks')}
            variant={view === 'adminTestMarks' ? 'default' : 'ghost'}
            className={`flex items-center gap-2 ${view === 'adminTestMarks' ? 'bg-purple-600 text-white' : 'text-gray-700'}`}
          >
            <ClipboardCheck className="w-4 h-4" />
            Test Marks
          </Button>
          <Button
            onClick={() => setView('adminPdf')}
            variant={view === 'adminPdf' ? 'default' : 'ghost'}
            className={`flex items-center gap-2 ${view === 'adminPdf' ? 'bg-purple-600 text-white' : 'text-gray-700'}`}
          >
            <FileText className="w-4 h-4" />
            PDFs
          </Button>
        </nav>
      </div>
    </div>
  );

  // Admin Students Section
  const renderAdminStudents = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white p-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Students</h1>
              <p className="text-purple-100 text-sm">Manage student accounts</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="secondary"
            className="bg-white/20 hover:bg-white/30 text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
      {renderAdminNav()}
      <div className="max-w-6xl mx-auto p-6">
        <Card className="p-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Students & Progress
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/admin/students/progress');
                      const data = await res.json();
                      const info = `
Students: ${data.students?.length}
Progress Records: ${Object.keys(data.progress || {}).length}

STUDENT IDs:
${data.students?.map((s: any) => s.name + ' = ' + s.id).join('\n')}

PROGRESS IDs:
${Object.keys(data.progress || {}).join('\n')}
                      `;
                      prompt(info);
                    } catch (e) {
                      alert('Error: ' + e);
                    }
                  }}
                  size="sm"
                  variant="outline"
                >
                  Show Debug Info
                </Button>
                <Button
                  onClick={() => setAddStudentModalOpen(true)}
                  size="sm"
                  className="bg-gradient-to-r from-purple-600 to-purple-500"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Add Student
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="space-y-3">
                {allStudents.map((student) => {
                  const progress = allStudentsProgress[student.id];
                  const overallProgress = progress?.overallProgress || 0;

                  const rank = calculateStudentRank(student.id);
                  const rankColor = rank === 1 ? 'text-yellow-600' : rank === 2 ? 'text-gray-600' : rank === 3 ? 'text-orange-600' : 'text-gray-700';
                  const rankBg = rank === 1 ? 'bg-yellow-100' : rank === 2 ? 'bg-gray-200' : rank === 3 ? 'bg-orange-100' : 'bg-gray-100';
                  
                  return (
                    <Card
                      key={student.id}
                      className="p-4 cursor-pointer hover:shadow-md transition-all"
                      onClick={() => {
                        const progressData = allStudentsProgress[student.id];
                        alert(`Student: ${student.name}\nStudent ID: ${student.id}\nHas Progress: ${!!progressData}\nProgress Value: ${progressData?.overallProgress || 0}%`);
                        setSelectedStudentForView(student);
                        setStudentDetailViewOpen(true);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 ${rankBg} rounded-full flex items-center justify-center font-bold ${rankColor} text-sm flex-shrink-0`}>
                            {rank}
                          </div>
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center font-bold text-purple-600">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{student.name}</h3>
                            <p className="text-sm text-gray-500">{(student as any)?.school || 'No school'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm font-semibold text-gray-700">{overallProgress}%</div>
                            <div className="text-xs text-gray-500">Progress</div>
                          </div>
                          <Progress value={overallProgress} className="w-16 h-2" />
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              openTestMarksModal(student);
                            }}
                            size="sm"
                            variant="outline"
                          >
                            <ClipboardCheck className="w-4 h-4 mr-1" />
                            Marks
                          </Button>
                          <ArrowLeft className="w-4 h-4 text-gray-400 rotate-180" />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Admin Test Marks Section
  const renderAdminTestMarks = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white p-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Test Marks</h1>
              <p className="text-purple-100 text-sm">Enter test marks by chapter</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="secondary"
            className="bg-white/20 hover:bg-white/30 text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
      {renderAdminNav()}
      <div className="max-w-6xl mx-auto p-6">
        {!selectedChapterForMarks ? (
          <Card className="p-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Select Chapter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">Choose a chapter to enter test marks for all students:</p>
              <div className="grid gap-3 md:grid-cols-2">
                {CBSE_CHAPTERS.map((chapter) => {
                  const chapterId = chapter.id;
                  const marksCount = allStudents.filter(s => 
                    allStudentsProgress[s.id]?.chapters[chapterId]?.testMarks !== undefined
                  ).length;
                  
                  return (
                    <Card
                      key={chapter.id}
                      className="p-4 cursor-pointer hover:shadow-md transition-all border-2 hover:border-purple-300"
                      onClick={() => initializeChapterMarks(chapter)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center font-bold text-purple-600">
                            {chapter.number}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{chapter.title}</h3>
                            <p className="text-xs text-gray-500">
                              {marksCount} of {allStudents.length} students graded
                            </p>
                          </div>
                        </div>
                        <ArrowLeft className="w-4 h-4 text-gray-400 rotate-180" />
                      </div>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="p-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5" />
                  Chapter {selectedChapterForMarks.number}: {selectedChapterForMarks.title}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedChapterForMarks(null)}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={saveChapterMarks}
                    className="bg-gradient-to-r from-purple-600 to-purple-500"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Marks
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {allStudents.map((student) => {
                    const currentMarks = chapterMarksInputs[student.id] || '';
                    return (
                      <Card key={student.id} className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center font-bold text-purple-600 flex-shrink-0">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{student.name}</h3>
                            <p className="text-xs text-gray-500">{(student as any)?.school || 'No school'}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="Marks"
                              value={currentMarks}
                              onChange={(e) => setChapterMarksInputs({
                                ...chapterMarksInputs,
                                [student.id]: e.target.value
                              })}
                              className="w-24 h-10 text-center"
                            />
                            <span className="text-sm text-gray-500">/100</span>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  // Admin PDF Section
  const renderAdminPdf = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white p-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold">PDF Management</h1>
              <p className="text-purple-100 text-sm">Manage study materials</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="secondary"
            className="bg-white/20 hover:bg-white/30 text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
      {renderAdminNav()}
      <div className="max-w-6xl mx-auto p-6">
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Manage PDF Links
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {CBSE_CHAPTERS.map((chapter) => (
                <Card
                  key={chapter.id}
                  className="p-4 cursor-pointer hover:shadow-md transition-all"
                  onClick={() => openPdfManager(chapter)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <FileText className="text-red-600 w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Chapter {chapter.number}</h3>
                        <p className="text-sm text-gray-500 truncate">{chapter.title}</p>
                      </div>
                    </div>
                    <ArrowLeft className="w-4 h-4 text-gray-400 rotate-180" />
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <>
      {view === 'login' && renderLogin()}
      {view === 'studentHome' && renderStudentHome()}
      {view === 'studentDashboard' && renderStudentDashboard()}
      {view === 'chapterDetail' && renderChapterDetail()}
      {view === 'adminDashboard' && renderAdminDashboard()}
      {view === 'adminStudents' && renderAdminStudents()}
      {view === 'adminTestMarks' && renderAdminTestMarks()}
      {view === 'adminPdf' && renderAdminPdf()}

      {/* PDF Manager Modal */}
      <Dialog open={pdfManagerOpen} onOpenChange={setPdfManagerOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="text-red-500" />
              PDF Manager - {selectedChapter?.title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-xl mb-4">
            <p className="text-blue-900 font-semibold mb-2">📁 How to Add PDFs:</p>
            <ol className="text-blue-800 text-sm space-y-1 ml-4 list-decimal">
              <li>Upload PDF to Google Drive</li>
              <li>Right-click → Share → "Anyone with the link can view"</li>
              <li>Copy link</li>
              <li>Paste below and change <code className="bg-blue-100 px-1 rounded">/view</code> to <code className="bg-blue-100 px-1 rounded">/preview</code></li>
              <li>Click "Save PDF Links"</li>
            </ol>
          </div>

          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {/* Topic PDFs */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  Topic-wise PDFs
                </h4>
                {selectedChapter?.topics.map((topic) => (
                  <div key={topic.id} className="space-y-2 mb-4">
                    <label className="text-sm font-medium text-gray-700">{topic.name}</label>
                    <Input
                      value={pdfInputs[topic.id] || ''}
                      onChange={(e) => setPdfInputs({ ...pdfInputs, [topic.id]: e.target.value })}
                      placeholder="https://drive.google.com/file/d/.../preview"
                    />
                  </div>
                ))}
              </div>

              {/* HOTS PDF */}
              <div className="border-t-2 pt-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-500" />
                  HOTS Questions PDF
                </h4>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Higher Order Thinking Skills Questions
                  </label>
                  <Input
                    value={hotsPdfInput}
                    onChange={(e) => setHotsPdfInput(e.target.value)}
                    placeholder="https://drive.google.com/file/d/.../preview"
                  />
                  <p className="text-xs text-gray-500">
                    Upload PDF with practice HOTS questions for this chapter
                  </p>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPdfManagerOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={savePdfLinks} className="bg-gradient-to-r from-purple-600 to-purple-500">
              <Save className="w-4 h-4 mr-2" />
              Save PDF Links
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Marks Modal */}
      <Dialog open={testMarksModalOpen} onOpenChange={setTestMarksModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="text-blue-500" />
              Test Marks - {selectedStudentForMarks?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-xl mb-4">
            <p className="text-blue-900 font-semibold mb-1">📝 Enter Test Marks</p>
            <p className="text-blue-800 text-sm">Add marks for each chapter test (out of 100). Leave blank if test not taken yet.</p>
          </div>

          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {CBSE_CHAPTERS.map((chapter) => (
                <div key={chapter.id} className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center font-bold text-purple-600 text-sm flex-shrink-0">
                    {chapter.number}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">{chapter.title}</p>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={testMarksInputs[chapter.id] || ''}
                    onChange={(e) => setTestMarksInputs({ ...testMarksInputs, [chapter.id]: e.target.value })}
                    placeholder="0-100"
                    className="w-24"
                  />
                </div>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTestMarksModalOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={saveTestMarks} className="bg-gradient-to-r from-blue-600 to-blue-500">
              <Save className="w-4 h-4 mr-2" />
              Save Test Marks
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Student Modal */}
      <Dialog open={addStudentModalOpen} onOpenChange={setAddStudentModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="text-purple-500" />
              Add New Student
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Full Name *</label>
              <Input
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                placeholder="Enter student's full name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Username *</label>
              <Input
                value={newStudentUsername}
                onChange={(e) => setNewStudentUsername(e.target.value)}
                placeholder="Enter unique username"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Password *</label>
              <Input
                type="password"
                value={newStudentPassword}
                onChange={(e) => setNewStudentPassword(e.target.value)}
                placeholder="Enter password"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">School (Optional)</label>
              <Input
                value={newStudentSchool}
                onChange={(e) => setNewStudentSchool(e.target.value)}
                placeholder="Enter school name"
              />
            </div>

            <p className="text-xs text-gray-500">
              * Required fields
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddStudentModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addStudent} className="bg-gradient-to-r from-purple-600 to-purple-500">
              Add Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student Detail View Modal */}
      <Dialog open={studentDetailViewOpen} onOpenChange={setStudentDetailViewOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] w-full max-w-[95vw] md:max-w-5xl p-4 md:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg md:text-xl">
              <Users className="text-blue-500 w-5 h-5" />
              Student Details - {selectedStudentForView?.name}
            </DialogTitle>
          </DialogHeader>

          {selectedStudentForView && (
            <ScrollArea className="h-[75vh]">
              <div className="space-y-4">
                {/* Student Info Card - Mobile Friendly */}
                <Card className="p-4 md:p-6 bg-gradient-to-r from-purple-50 to-blue-50">
                  <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 text-center md:text-left">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl md:text-3xl font-bold flex-shrink-0">
                      {selectedStudentForView.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 w-full">
                      <h3 className="text-xl md:text-2xl font-bold text-gray-900">{selectedStudentForView.name}</h3>
                      <p className="text-gray-600 text-sm md:text-base">{(selectedStudentForView as any)?.school || 'No school'}</p>
                      <p className="text-xs md:text-sm text-gray-500">Username: {selectedStudentForView.username}</p>
                    </div>
                    <div className="text-center md:text-right w-full md:w-auto">
                      <div className="text-xs md:text-sm text-gray-500">Class Rank</div>
                      <div className={`text-3xl md:text-4xl font-bold ${
                        calculateStudentRank(selectedStudentForView.id) === 1 ? 'text-yellow-600' :
                        calculateStudentRank(selectedStudentForView.id) === 2 ? 'text-gray-600' :
                        calculateStudentRank(selectedStudentForView.id) === 3 ? 'text-orange-600' :
                        'text-purple-600'
                      }`}>
                        #{calculateStudentRank(selectedStudentForView.id)}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Overall Progress - Mobile Friendly */}
                <Card className="p-4 md:p-6">
                  <h4 className="font-semibold text-gray-900 mb-3 md:mb-4 text-base md:text-lg">Overall Progress</h4>
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="flex-1">
                      <Progress
                        value={allStudentsProgress[selectedStudentForView.id]?.overallProgress || 0}
                        className="h-3 md:h-4"
                      />
                    </div>
                    <div className="text-xl md:text-2xl font-bold text-purple-600 w-16 md:w-20 text-right">
                      {allStudentsProgress[selectedStudentForView.id]?.overallProgress || 0}%
                    </div>
                  </div>
                </Card>

                {/* Chapter-wise Progress and Test Marks - Mobile Friendly */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 md:mb-4 text-base md:text-lg">Chapter-wise Progress & Test Marks</h4>
                  <div className="space-y-3">
                    {CBSE_CHAPTERS.map((chapter) => {
                      const progress = allStudentsProgress[selectedStudentForView.id];
                      const chapterProgress = progress?.chapters[chapter.id];
                      const chapterPercent = calculateChapterProgress(chapter.id, progress || initializeStudentProgress(selectedStudentForView.id));
                      const testMarks = chapterProgress?.testMarks;

                      return (
                        <Card key={chapter.id} className="p-3 md:p-4">
                          <div className="flex flex-col gap-2 mb-2 md:mb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 pr-2">
                                <h5 className="font-semibold text-gray-900 mb-1 text-sm md:text-base">
                                  Ch {chapter.number}: {chapter.title}
                                </h5>
                                <p className="text-xs text-gray-500">{chapter.topics.length} topics</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="text-base md:text-lg font-bold text-purple-600">{chapterPercent}%</div>
                                <div className="text-xs text-gray-500">Complete</div>
                              </div>
                            </div>
                          </div>

                          <Progress value={chapterPercent} className="h-2 mb-2 md:mb-3" />

                          <div className="flex flex-col md:flex-row md:items-center justify-between mt-2 md:mt-3 pt-2 md:pt-3 border-t gap-2">
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Test Marks:</span>
                            </div>
                            {testMarks !== undefined ? (
                              <div className="flex items-center justify-end gap-2">
                                <span className={`text-lg md:text-xl font-bold ${
                                  testMarks >= 80 ? 'text-green-600' :
                                  testMarks >= 60 ? 'text-blue-600' :
                                  testMarks >= 40 ? 'text-yellow-600' :
                                  'text-red-600'
                                }`}>
                                  {testMarks}/100
                                </span>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  testMarks >= 40 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  {testMarks >= 40 ? 'Pass' : 'Fail'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">Not taken yet</span>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                {/* Test Summary - Mobile Friendly */}
                <Card className="p-4 md:p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <h4 className="font-semibold text-gray-900 mb-3 md:mb-4 text-base md:text-lg">Test Performance Summary</h4>
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    {(() => {
                      const progress = allStudentsProgress[selectedStudentForView.id];
                      let totalMarks = 0;
                      let totalTests = 0;
                      let passedTests = 0;

                      CBSE_CHAPTERS.forEach((chapter) => {
                        const marks = progress?.chapters[chapter.id]?.testMarks;
                        if (marks !== undefined) {
                          totalMarks += marks;
                          totalTests++;
                          if (marks >= 40) passedTests++;
                        }
                      });

                      const average = totalTests > 0 ? (totalMarks / totalTests).toFixed(1) : '0';
                      const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

                      return (
                        <>
                          <div className="bg-white p-3 md:p-4 rounded-lg shadow-sm text-center">
                            <p className="text-xs text-gray-500 mb-1">Tests Taken</p>
                            <p className="text-xl md:text-2xl font-bold text-gray-900">{totalTests}/10</p>
                          </div>
                          <div className="bg-white p-3 md:p-4 rounded-lg shadow-sm text-center">
                            <p className="text-xs text-gray-500 mb-1">Average Score</p>
                            <p className="text-xl md:text-2xl font-bold text-blue-600">{average}</p>
                          </div>
                          <div className="bg-white p-3 md:p-4 rounded-lg shadow-sm text-center">
                            <p className="text-xs text-gray-500 mb-1">Total Marks</p>
                            <p className="text-xl md:text-2xl font-bold text-green-600">{totalMarks}</p>
                          </div>
                          <div className="bg-white p-3 md:p-4 rounded-lg shadow-sm text-center">
                            <p className="text-xs text-gray-500 mb-1">Pass Rate</p>
                            <p className="text-xl md:text-2xl font-bold text-purple-600">{passRate}%</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </Card>
              </div>
            </ScrollArea>
          )}

          <DialogFooter>
            <Button
              onClick={() => {
                setStudentDetailViewOpen(false);
                setSelectedStudentForView(null);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
