'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore, useAppStore } from '@/lib/store';
import {
  subscribeToSubjects,
  subscribeToProgress,
  subscribeToAllStudents,
  subscribeToAllTeachers,
  subscribeToAllProgress,
  subscribeToTests,
  subscribeToTestMarks,
  subscribeToDisciplineStars,
  subscribeToAllDisciplineStars,
  subscribeToActivityLog,
  subscribeToInstitute,
  subscribeToCustomSubjectsForTeacher,
  subscribeToCustomSubjectsForInstitute,
  seedDefaultSubjects,
  seedSuperAdmin,
  initializeProgress,
  initializeDisciplineStars,
  checkFirebaseConnection,
  updateStreakOnLogin,
  subscribeToStreak,
  updateProgressItem as updateProgressItemFirebase,
  getInstitute,
  STREAK_MILESTONES
} from '@/lib/firebase-service';
import { LoginPage } from '@/components/app/LoginPage';
import { RegisterPage } from '@/components/app/RegisterPage';
import { StudentDashboard } from '@/components/app/StudentDashboard';
import { StudentSubjectSelector } from '@/components/app/StudentSubjectSelector';
import { ChapterList } from '@/components/app/ChapterList';
import { ChapterDetail } from '@/components/app/ChapterDetail';
import { AdminDashboard } from '@/components/app/AdminDashboard';
import { StudentsTable } from '@/components/app/StudentsTable';
import { TestMarksForm } from '@/components/app/TestMarksForm';
import { DisciplineManager } from '@/components/app/DisciplineManager';
import { BadgeCelebration } from '@/components/app/BadgeCelebration';
import { StreakCelebration } from '@/components/app/StreakCelebration';
import { SuperAdminDashboard } from '@/components/app/SuperAdminDashboard';
import { InstituteOwnerDashboard } from '@/components/app/InstituteOwnerDashboard';
import { TeacherDashboard } from '@/components/app/TeacherDashboard';
import { IndependentTeacherDashboard } from '@/components/app/IndependentTeacherDashboard';
import {
  LogOut,
  LayoutDashboard,
  BookOpen,
  Users,
  FileCheck,
  BarChart3,
  Menu,
  X,
  Wifi,
  WifiOff,
  Star,
  FileBarChart,
  FlaskConical,
  Settings,
  GraduationCap,
  Building2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type AuthView = 'login' | 'register';

export default function Home() {
  const { user, isAuthenticated, logout, login } = useAuthStore();
  const {
    currentView,
    setCurrentView,
    selectedChapterId,
    selectedSubjectId,
    setSelectedSubjectId,
    studentSelectedEnrollment,
    setStudentSelectedEnrollment,
    institute,
    setInstitute,
    subjects,
    setSubjects,
    chapters,
    setChapters,
    progress,
    setProgress,
    allStudents,
    allTeachers,
    setAllStudents,
    setAllTeachers,
    setAllProgress,
    allTests,
    allTestMarks,
    setAllTests,
    setAllTestMarks,
    setDisciplineStars,
    setAllDisciplineStars,
    setActivityLog,
    setStreakData,
    triggerStreakCelebration,
    isLoading,
    setIsLoading,
    isDataLoaded,
    setIsDataLoaded,
    addUnsubscriber,
    cleanupSubscriptions,
  } = useAppStore();

  const [authView, setAuthView] = useState<AuthView>('login');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const { toast } = useToast();

  // Handle progress update
  const handleUpdateProgressItem = useCallback(async (
    topicId: string,
    field: 'lectureCompleted' | 'ncertCompleted' | 'level1Completed' | 'level2Completed' | 'notesCompleted',
    value: boolean
  ) => {
    if (!user || !selectedSubjectId) return;
    
    try {
      await updateProgressItemFirebase(user.id, selectedSubjectId, topicId, field, value);
      
      if (value) {
        toast({
          title: '✅ Progress Saved',
          description: `${field.replace('Completed', '')} marked as complete`,
        });
      }
    } catch (error: any) {
      console.error('Failed to sync progress:', error);
      toast({
        title: 'Sync Error',
        description: `Failed to save progress: ${error?.message || 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  }, [user, selectedSubjectId, toast]);

  // Initialize Firebase and set up real-time listeners
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const initializeFirebase = async () => {
      setIsLoading(true);
      
      const isConnected = await checkFirebaseConnection();
      setIsOnline(isConnected);
      
      if (!isConnected) {
        toast({
          title: 'Connection Issue',
          description: 'Unable to connect to Firebase. Please check your internet.',
          variant: 'destructive',
        });
      }
      
      // Seed default subjects and superadmin
      setIsSeeding(true);
      try {
        await seedDefaultSubjects();
        await seedSuperAdmin();
      } catch (error) {
        console.log('Seed error:', error);
      }
      setIsSeeding(false);
      
      // Load institute data for institute owners and teachers
      if (user.instituteId) {
        const unsubInstitute = subscribeToInstitute(user.instituteId, (inst) => {
          setInstitute(inst);
        });
        addUnsubscriber(unsubInstitute);
      }
      
      // Set up real-time listeners based on role
      if (user.role === 'superadmin') {
        // Superadmin - minimal data needed
        const unsubSubjects = subscribeToSubjects(null, (subjectsData) => {
          setSubjects(subjectsData);
        });
        addUnsubscriber(unsubSubjects);
        
      } else if (user.role === 'institute_owner') {
        // Institute owner - subjects for their institute
        const unsubSubjects = subscribeToSubjects(user.instituteId || null, (subjectsData) => {
          setSubjects(subjectsData);
        });
        addUnsubscriber(unsubSubjects);
        
      } else if (user.role === 'teacher') {
        // Teacher - subjects for their institute
        const unsubSubjects = subscribeToSubjects(user.instituteId || null, (subjectsData) => {
          setSubjects(subjectsData);
        });
        addUnsubscriber(unsubSubjects);
        
        // Load ALL students for the institute (for multi-class teachers)
        const unsubStudents = subscribeToAllStudents((students) => {
          setAllStudents(students);
        }, user.instituteId);
        addUnsubscriber(unsubStudents);
        
        // Progress
        const unsubProgress = subscribeToAllProgress((progress) => {
          setAllProgress(progress);
        });
        addUnsubscriber(unsubProgress);
        
        // Tests
        const unsubTests = subscribeToTests((tests) => {
          setAllTests(tests);
        });
        addUnsubscriber(unsubTests);
        
        const unsubTestMarks = subscribeToTestMarks((marks) => {
          setAllTestMarks(marks);
        });
        addUnsubscriber(unsubTestMarks);
        
        // Discipline stars
        const unsubAllStars = subscribeToAllDisciplineStars((stars) => {
          setAllDisciplineStars(stars);
        });
        addUnsubscriber(unsubAllStars);
        
      } else if (user.role === 'student') {
        // Student - load their data
        try {
          await initializeProgress(user.id, selectedSubjectId || 'default');
          await initializeDisciplineStars(user.id);
        } catch (error) {
          console.log('Progress may already exist:', error);
        }
        
        // Update streak
        try {
          const { streak, milestone } = await updateStreakOnLogin(user.id);
          if (milestone && STREAK_MILESTONES[milestone]) {
            triggerStreakCelebration({
              days: milestone,
              message: STREAK_MILESTONES[milestone]
            });
          }
        } catch (error) {
          console.log('Streak update error:', error);
        }
        
        // Subscribe to streak
        const unsubStreak = subscribeToStreak(user.id, (streak) => {
          setStreakData(streak);
        });
        addUnsubscriber(unsubStreak);
        
        // Subjects - check for independent teacher first, then institute, then default
        // IMPORTANT: Filter subjects by student's classId to show only relevant subjects
        if (user.independentTeacherId) {
          // Student of independent teacher - load their custom subjects filtered by class
          const unsubCustomSubjects = subscribeToCustomSubjectsForTeacher(
            user.independentTeacherId, 
            (customSubjects) => {
              // Filter subjects that belong to student's class
              const filteredSubjects = customSubjects.filter(s => 
                !user.classId || s.classIds.includes(user.classId)
              );
              
              // Convert CustomSubject to Subject format for compatibility
              const formattedSubjects = filteredSubjects.map(s => ({
                id: s.id,
                name: s.name,
                instituteId: s.instituteId,
                isDefault: false,
                chapters: s.chapters.map(ch => ({
                  id: ch.id,
                  chapterNo: ch.chapterNo,
                  name: ch.name,
                  topics: ch.topics.map(t => ({
                    id: t.id,
                    topicNo: t.topicNo,
                    name: t.name,
                    chapterId: ch.id
                  }))
                }))
              }));
              setSubjects(formattedSubjects);
              if (formattedSubjects.length > 0 && !selectedSubjectId) {
                setSelectedSubjectId(formattedSubjects[0].id);
              }
            }
          );
          addUnsubscriber(unsubCustomSubjects);
        } else if (user.instituteId) {
          // Student of institute - check for custom subjects first, fall back to predefined
          const unsubCustomSubjects = subscribeToCustomSubjectsForInstitute(
            user.instituteId,
            (customSubjects) => {
              if (customSubjects.length > 0) {
                // Filter subjects that belong to student's class
                const filteredSubjects = customSubjects.filter(s => 
                  !user.classId || s.classIds.includes(user.classId)
                );
                
                // Institute has custom subjects - use them (filtered by class)
                const formattedSubjects = filteredSubjects.map(s => ({
                  id: s.id,
                  name: s.name,
                  instituteId: s.instituteId,
                  isDefault: false,
                  chapters: s.chapters.map(ch => ({
                    id: ch.id,
                    chapterNo: ch.chapterNo,
                    name: ch.name,
                    topics: ch.topics.map(t => ({
                      id: t.id,
                      topicNo: t.topicNo,
                      name: t.name,
                      chapterId: ch.id
                    }))
                  }))
                }));
                setSubjects(formattedSubjects);
                if (formattedSubjects.length > 0 && !selectedSubjectId) {
                  setSelectedSubjectId(formattedSubjects[0].id);
                }
              } else {
                // No custom subjects - use predefined (filtered by class if possible)
                const unsubPredefined = subscribeToSubjects(null, (subjectsData) => {
                  setSubjects(subjectsData);
                  if (subjectsData.length > 0 && !selectedSubjectId) {
                    setSelectedSubjectId(subjectsData[0].id);
                  }
                });
                addUnsubscriber(unsubPredefined);
              }
            }
          );
          addUnsubscriber(unsubCustomSubjects);
        } else {
          // No institute or teacher - use predefined subjects
          const unsubSubjects = subscribeToSubjects(null, (subjectsData) => {
            setSubjects(subjectsData);
            if (subjectsData.length > 0 && !selectedSubjectId) {
              setSelectedSubjectId(subjectsData[0].id);
            }
          });
          addUnsubscriber(unsubSubjects);
        }
        
        // Progress subscription
        if (selectedSubjectId) {
          const unsubProgress = subscribeToProgress(user.id, selectedSubjectId, (progressData) => {
            setProgress(progressData);
          });
          addUnsubscriber(unsubProgress);
        }
        
        // All students and progress for ranking
        const unsubAllStudents = subscribeToAllStudents((students) => {
          setAllStudents(students);
        }, user.instituteId, user.classId);
        addUnsubscriber(unsubAllStudents);
        
        const unsubAllProgress = subscribeToAllProgress((progress) => {
          setAllProgress(progress);
        });
        addUnsubscriber(unsubAllProgress);
        
        // Tests
        const unsubTests = subscribeToTests((tests) => {
          setAllTests(tests);
        });
        addUnsubscriber(unsubTests);
        
        const unsubTestMarks = subscribeToTestMarks((marks) => {
          setAllTestMarks(marks);
        });
        addUnsubscriber(unsubTestMarks);
        
        // Discipline stars
        const unsubStars = subscribeToDisciplineStars(user.id, (stars) => {
          setDisciplineStars(stars);
        });
        addUnsubscriber(unsubStars);
        
        // Activity log
        const unsubActivity = subscribeToActivityLog(user.id, (logs) => {
          setActivityLog(logs);
        });
        addUnsubscriber(unsubActivity);
      }
      
      setIsDataLoaded(true);
      setIsLoading(false);
    };
    
    initializeFirebase();
    
    return () => {
      cleanupSubscriptions();
    };
  }, [isAuthenticated, user, selectedSubjectId]);

  // Update progress when subject changes for students
  useEffect(() => {
    if (user?.role === 'student' && selectedSubjectId) {
      const unsubProgress = subscribeToProgress(user.id, selectedSubjectId, (progressData) => {
        setProgress(progressData);
      });
      addUnsubscriber(unsubProgress);
      
      return () => unsubProgress();
    }
  }, [user, selectedSubjectId]);

  const handleLogout = async () => {
    cleanupSubscriptions();
    logout();
    setIsDataLoaded(false);
    setAuthView('login');
  };

  const handleLoginSuccess = () => {
    setCurrentView('dashboard');
  };

  const handleRegisterSuccess = () => {
    setAuthView('login');
  };

  // Show login or register page if not authenticated
  if (!isAuthenticated) {
    if (authView === 'login') {
      return (
        <LoginPage 
          onLoginSuccess={handleLoginSuccess} 
          onShowRegister={() => setAuthView('register')} 
        />
      );
    } else {
      return (
        <RegisterPage 
          onBack={() => setAuthView('login')} 
        />
      );
    }
  }

  // Loading state
  if (isLoading || isSeeding || !isDataLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-purple-100">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 mx-auto mb-4"
          >
            <FlaskConical className="w-12 h-12 text-purple-600" />
          </motion.div>
          <p className="text-muted-foreground">
            {isSeeding ? 'Setting up database...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  const isStudent = user?.role === 'student';
  const isTeacher = user?.role === 'teacher';
  const isInstituteOwner = user?.role === 'institute_owner';
  const isSuperAdmin = user?.role === 'superadmin';
  const isIndependentTeacher = user?.role === 'independent_teacher';
  const isAdmin = isTeacher || isInstituteOwner || isSuperAdmin || isIndependentTeacher;

  // Navigation items based on role
  // For students, only show nav items after selecting a subject
  const studentNavItems = studentSelectedEnrollment ? [
    { value: 'dashboard', label: studentSelectedEnrollment.subjectName, icon: LayoutDashboard },
    { value: 'chapters', label: 'Chapters', icon: BookOpen },
    { value: 'test-history', label: 'Tests', icon: FileBarChart },
  ] : [];

  const teacherNavItems = [
    { value: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  const instituteOwnerNavItems = [
    { value: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  const superAdminNavItems = [
    { value: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  const independentTeacherNavItems = [
    { value: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  const getNavItems = () => {
    if (isSuperAdmin) return superAdminNavItems;
    if (isInstituteOwner) return instituteOwnerNavItems;
    if (isIndependentTeacher) return independentTeacherNavItems;
    if (isTeacher) return teacherNavItems;
    return studentNavItems;
  };

  const navItems = getNavItems();

  const getTabValue = () => {
    if (currentView === 'chapter-detail') return 'chapters';
    return currentView;
  };

  const getRoleBadge = () => {
    if (isSuperAdmin) return 'Super Admin';
    if (isInstituteOwner) return 'Institute Owner';
    if (isIndependentTeacher) return 'Independent Teacher';
    if (isTeacher) return 'Teacher';
    return 'Student';
  };

  // Get chapters from selected subject
  const currentChapters = selectedSubjectId 
    ? subjects.find(s => s.id === selectedSubjectId)?.chapters || []
    : chapters;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                  ChemClass Pro
                </h1>
                <p className="text-xs text-muted-foreground">
                  {institute?.name || 'Multi-Subject Progress Tracker'}
                </p>
              </div>
            </div>

            {/* Connection Status */}
            <div className="hidden md:flex items-center gap-2">
              {isOnline ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <Wifi className="w-3 h-3 mr-1" />
                  Live
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  <WifiOff className="w-3 h-3 mr-1" />
                  Offline
                </Badge>
              )}
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Button
                  key={item.value}
                  variant={getTabValue() === item.value ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentView(item.value as typeof currentView)}
                  className={getTabValue() === item.value ? 'bg-purple-600 hover:bg-purple-700' : ''}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Button>
              ))}
            </nav>

            {/* User Info & Logout */}
            <div className="flex items-center gap-3">
              {/* Change Subject Button for Students */}
              {isStudent && studentSelectedEnrollment && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStudentSelectedEnrollment(null)}
                  className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 hidden sm:flex"
                >
                  <BookOpen className="w-4 h-4 mr-1" />
                  Change Subject
                </Button>
              )}
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium">{user?.name}</p>
                <Badge variant="secondary" className="text-xs">
                  {getRoleBadge()}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut className="w-5 h-5" />
              </Button>

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t bg-white"
            >
              <div className="p-4 space-y-2">
                {/* Change Subject Button for Students - Mobile */}
                {isStudent && studentSelectedEnrollment && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-purple-600"
                    onClick={() => {
                      setStudentSelectedEnrollment(null);
                      setIsSidebarOpen(false);
                    }}
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Change Subject
                  </Button>
                )}
                {navItems.map((item) => (
                  <Button
                    key={item.value}
                    variant={getTabValue() === item.value ? 'default' : 'ghost'}
                    className={`w-full justify-start ${
                      getTabValue() === item.value ? 'bg-purple-600 hover:bg-purple-700' : ''
                    }`}
                    onClick={() => {
                      setCurrentView(item.value as typeof currentView);
                      setIsSidebarOpen(false);
                    }}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <AnimatePresence mode="wait">
          {/* SuperAdmin Views */}
          {isSuperAdmin && (
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {currentView === 'dashboard' && <SuperAdminDashboard />}
            </motion.div>
          )}

          {/* Institute Owner Views */}
          {isInstituteOwner && (
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {currentView === 'dashboard' && <InstituteOwnerDashboard />}
            </motion.div>
          )}

          {/* Teacher Views */}
          {isTeacher && (
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {currentView === 'dashboard' && <TeacherDashboard />}
            </motion.div>
          )}

          {/* Independent Teacher Views */}
          {isIndependentTeacher && (
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {currentView === 'dashboard' && <IndependentTeacherDashboard />}
            </motion.div>
          )}

          {/* Student Views */}
          {isStudent && (
            <motion.div
              key={currentView + (selectedChapterId || '') + (selectedSubjectId || '') + (studentSelectedEnrollment?.id || '')}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Show subject selector first if no enrollment selected */}
              {!studentSelectedEnrollment && currentView === 'dashboard' && (
                <StudentSubjectSelector 
                  onSelect={(enrollment) => {
                    setStudentSelectedEnrollment(enrollment);
                    setSelectedSubjectId(enrollment.subjectId);
                  }}
                />
              )}
              
              {/* Show dashboard after enrollment selection */}
              {studentSelectedEnrollment && currentView === 'dashboard' && user && (
                <StudentDashboard user={user} />
              )}
              
              {/* Chapters view - only accessible after selecting a subject */}
              {studentSelectedEnrollment && currentView === 'chapters' && (
                <ChapterList 
                  chapters={currentChapters}
                  subjectId={selectedSubjectId}
                />
              )}
              
              {/* Chapter detail view - only accessible after selecting a subject */}
              {studentSelectedEnrollment && currentView === 'chapter-detail' && (
                <ChapterDetail 
                  onUpdateProgressItem={handleUpdateProgressItem}
                />
              )}
              
              {/* Test history view - only accessible after selecting a subject */}
              {studentSelectedEnrollment && currentView === 'test-history' && user && (
                <TestMarksForm 
                  userId={user.id}
                  subjectId={selectedSubjectId || ''}
                  chapters={currentChapters}
                  tests={allTests.filter(t => t.subjectId === selectedSubjectId)}
                  testMarks={allTestMarks.filter(m => m.userId === user.id)}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
            <p>ChemClass Pro - Multi-Subject Progress Tracker</p>
            <div className="flex items-center gap-2">
              <span className="text-xs">Real-time sync by Firebase</span>
              {isOnline && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
            </div>
          </div>
        </div>
      </footer>

      {/* Badge Celebration - Only for students */}
      {isStudent && <BadgeCelebration />}
      
      {/* Streak Celebration - Only for students */}
      {isStudent && <StreakCelebration />}
    </div>
  );
}
