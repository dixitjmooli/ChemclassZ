'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore, useAppStore } from '@/lib/store';
import {
  subscribeToChapters,
  subscribeToProgress,
  subscribeToAllStudents,
  subscribeToAllProgress,
  subscribeToTestMarks,
  subscribeToPdfs,
  updateProgressItem as updateProgressItemFirebase,
  updateHotsCompleted as updateHotsCompletedFirebase,
  seedChaptersAndAdmin,
  initializeProgress,
  checkFirebaseConnection
} from '@/lib/firebase-service';
import { LoginPage } from '@/components/app/LoginPage';
import { StudentDashboard } from '@/components/app/StudentDashboard';
import { ChapterList } from '@/components/app/ChapterList';
import { ChapterDetail } from '@/components/app/ChapterDetail';
import { AdminDashboard } from '@/components/app/AdminDashboard';
import { StudentsTable } from '@/components/app/StudentsTable';
import { TestMarksForm } from '@/components/app/TestMarksForm';
import { AnalysisView } from '@/components/app/AnalysisView';
import { PdfManager } from '@/components/app/PdfManager';
import {
  LogOut,
  LayoutDashboard,
  BookOpen,
  Users,
  FileCheck,
  BarChart3,
  FileText,
  FlaskConical,
  Menu,
  X,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const {
    currentView,
    setCurrentView,
    selectedChapterId,
    chapters,
    progress,
    allStudents,
    allProgress,
    allTestMarks,
    pdfs,
    setChapters,
    setProgress,
    setAllStudents,
    setAllProgress,
    setAllTestMarks,
    setPdfs,
    isLoading,
    setIsLoading,
    isDataLoaded,
    setIsDataLoaded,
    addUnsubscriber,
    cleanupSubscriptions,
    updateProgressItem,
    updateHotsCompleted,
  } = useAppStore();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const { toast } = useToast();

  // Handle progress update with Firebase sync
  // NOTE: We don't do optimistic update to avoid race condition with real-time listener
  const handleUpdateProgressItem = useCallback(async (
    topicId: string,
    field: 'lectureCompleted' | 'ncertCompleted' | 'level1Completed' | 'level2Completed' | 'notesCompleted',
    value: boolean
  ) => {
    if (!user) return;
    
    // Sync to Firebase - the real-time listener will update the UI
    try {
      await updateProgressItemFirebase(user.id, topicId, field, value);
    } catch (error) {
      console.error('Failed to sync progress:', error);
      toast({
        title: 'Sync Error',
        description: 'Failed to save progress. Please try again.',
        variant: 'destructive',
      });
    }
  }, [user, toast]);

  // Handle HOTS update with Firebase sync
  const handleUpdateHotsCompleted = useCallback(async (chapterId: string, value: boolean) => {
    if (!user) return;
    
    // Sync to Firebase - the real-time listener will update the UI
    try {
      await updateHotsCompletedFirebase(user.id, chapterId, value);
    } catch (error) {
      console.error('Failed to sync HOTS:', error);
      toast({
        title: 'Sync Error',
        description: 'Failed to save HOTS progress. Please try again.',
        variant: 'destructive',
      });
    }
  }, [user, toast]);

  // Initialize Firebase and set up real-time listeners
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const initializeFirebase = async () => {
      setIsLoading(true);
      
      // Check Firebase connection
      const isConnected = await checkFirebaseConnection();
      setIsOnline(isConnected);
      
      if (!isConnected) {
        toast({
          title: 'Connection Issue',
          description: 'Unable to connect to Firebase. Please check your internet.',
          variant: 'destructive',
        });
      }
      
      // Seed chapters for ALL users (only if not already seeded)
      setIsSeeding(true);
      try {
        await seedChaptersAndAdmin();
      } catch (error) {
        console.log('Seed error:', error);
      }
      setIsSeeding(false);
      
      // Set up real-time listeners
      
      // Chapters listener
      const unsubChapters = subscribeToChapters((chaptersData) => {
        setChapters(chaptersData);
      });
      addUnsubscriber(unsubChapters);
      
      if (user.role === 'admin') {
        // Admin listeners
        const unsubStudents = subscribeToAllStudents((students) => {
          setAllStudents(students);
        });
        addUnsubscriber(unsubStudents);
        
        const unsubProgress = subscribeToAllProgress((progress) => {
          setAllProgress(progress);
        });
        addUnsubscriber(unsubProgress);
        
        const unsubTestMarks = subscribeToTestMarks((marks) => {
          setAllTestMarks(marks);
        });
        addUnsubscriber(unsubTestMarks);
        
        const unsubPdfs = subscribeToPdfs((pdfs) => {
          setPdfs(pdfs);
        });
        addUnsubscriber(unsubPdfs);
      } else {
        // Student listeners - ensure progress is initialized
        try {
          await initializeProgress(user.id);
        } catch (error) {
          console.log('Progress may already exist:', error);
        }
        
        const unsubProgress = subscribeToProgress(user.id, (progressData) => {
          setProgress(progressData);
        });
        addUnsubscriber(unsubProgress);
        
        const unsubTestMarks = subscribeToTestMarks((marks) => {
          setAllTestMarks(marks);
        });
        addUnsubscriber(unsubTestMarks);
        
        const unsubPdfs = subscribeToPdfs((pdfs) => {
          setPdfs(pdfs);
        });
        addUnsubscriber(unsubPdfs);
      }
      
      setIsDataLoaded(true);
      setIsLoading(false);
    };
    
    initializeFirebase();
    
    // Cleanup on unmount
    return () => {
      cleanupSubscriptions();
    };
  }, [isAuthenticated, user]);

  const handleLogout = async () => {
    cleanupSubscriptions();
    logout();
    setIsDataLoaded(false);
  };

  const handleLoginSuccess = () => {
    setCurrentView('dashboard');
  };

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Loading state
  if (isLoading || isSeeding || (!isDataLoaded && chapters.length === 0)) {
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

  const isAdmin = user?.role === 'admin';

  // Navigation items
  const studentNavItems = [
    { value: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { value: 'chapters', label: 'Chapters', icon: BookOpen },
  ];

  const adminNavItems = [
    { value: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { value: 'students', label: 'Students', icon: Users },
    { value: 'test-marks', label: 'Test Marks', icon: FileCheck },
    { value: 'analysis', label: 'Analysis', icon: BarChart3 },
    { value: 'pdfs', label: 'PDFs', icon: FileText },
  ];

  const navItems = isAdmin ? adminNavItems : studentNavItems;

  // Get current view for tabs
  const getTabValue = () => {
    if (currentView === 'chapter-detail') return 'chapters';
    return currentView;
  };

  // Create enhanced props for ChapterDetail
  const chapterDetailProps = {
    onUpdateProgressItem: handleUpdateProgressItem,
    onUpdateHotsCompleted: handleUpdateHotsCompleted,
  };

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
                <p className="text-xs text-muted-foreground">CBSE Class 12 Chemistry</p>
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
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium">{user?.name}</p>
                <Badge variant="secondary" className="text-xs">
                  {isAdmin ? 'Admin' : 'Student'}
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
                {/* Mobile Connection Status */}
                <div className="flex items-center justify-center mb-2">
                  {isOnline ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <Wifi className="w-3 h-3 mr-1" />
                      Live Sync
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      <WifiOff className="w-3 h-3 mr-1" />
                      Offline
                    </Badge>
                  )}
                </div>
                
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
          {isAdmin ? (
            // Admin Views
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {currentView === 'dashboard' && <AdminDashboard />}
              {currentView === 'students' && <StudentsTable />}
              {currentView === 'test-marks' && <TestMarksForm />}
              {currentView === 'analysis' && <AnalysisView />}
              {currentView === 'pdfs' && <PdfManager />}
            </motion.div>
          ) : (
            // Student Views
            <motion.div
              key={currentView + (selectedChapterId || '')}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {currentView === 'dashboard' && user && <StudentDashboard user={user} />}
              {currentView === 'chapters' && <ChapterList />}
              {currentView === 'chapter-detail' && (
                <ChapterDetail {...chapterDetailProps} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
            <p>ChemClass Pro - CBSE Class 12 Chemistry Progress Tracker</p>
            <div className="flex items-center gap-2">
              <span className="text-xs">Real-time sync by Firebase</span>
              {isOnline && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
