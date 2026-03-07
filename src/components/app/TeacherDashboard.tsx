'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore, useAppStore, TeacherAssignment, SyllabusAssignment } from '@/lib/store';
import { 
  subscribeToInstitute,
  subscribeToAllStudents,
  subscribeToAllProgress,
  subscribeToTests,
  subscribeToTestMarks,
  subscribeToAllDisciplineStars,
  updateProgressItem,
  enterTestMarks,
  createTest,
  deleteTest,
  updateDisciplineStars,
  getPredefinedSubjectsForClasses,
  subscribeToCustomSubjectsForInstitute,
  getUser,
  Subject,
  CustomSubject,
  getStudentsForInstitute,
  updateUserPassword
} from '@/lib/firebase-service';
import { SyllabusManager } from '@/components/app/SyllabusManager';
import { TeacherSyllabusProgress } from '@/components/app/TeacherSyllabusProgress';
import { TeacherClassSelector } from '@/components/app/TeacherClassSelector';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  GraduationCap, 
  BookOpen, 
  Users, 
  BarChart3, 
  FileText, 
  Star,
  Trash2,
  Loader2,
  ArrowLeft,
  Plus,
  TrendingUp,
  User,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';

export function TeacherDashboard() {
  const { user } = useAuthStore();
  const { 
    institute, 
    setInstitute,
    allStudents,
    allProgress,
    allTests,
    allTestMarks,
    allDisciplineStars,
    setAllStudents,
    setAllProgress,
    setAllTests,
    setAllTestMarks,
    setAllDisciplineStars,
    teacherSelectedAssignment,
    setTeacherSelectedAssignment
  } = useAppStore();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'myProgress' | 'syllabus' | 'studentProgress' | 'tests' | 'discipline' | 'students'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  
  // Subjects with chapters for syllabus progress tracking
  const [predefinedSubjects, setPredefinedSubjects] = useState<Subject[]>([]);
  const [customSubjects, setCustomSubjects] = useState<CustomSubject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [syllabusAssignmentsLocal, setSyllabusAssignmentsLocal] = useState<SyllabusAssignment[]>([]);
  
  // New test form
  const [newTestName, setNewTestName] = useState('');
  const [newTestMaxMarks, setNewTestMaxMarks] = useState('');
  const [newTestChapterId, setNewTestChapterId] = useState('');
  
  // Password change dialog state
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<{ id: string; name: string; username: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Get teacher's assignments
  const assignments = user?.assignments || [];

  // Use selected class/subject from assignment
  const selectedClassId = teacherSelectedAssignment?.classId || null;
  const selectedSubjectId = teacherSelectedAssignment?.subjectId || null;
  
  console.log('[TeacherDashboard] teacherSelectedAssignment:', teacherSelectedAssignment);
  console.log('[TeacherDashboard] selectedClassId:', selectedClassId, 'selectedSubjectId:', selectedSubjectId);
  console.log('[TeacherDashboard] user?.syllabusAssignments:', user?.syllabusAssignments);
  console.log('[TeacherDashboard] predefinedSubjects count:', predefinedSubjects.length);
  console.log('[TeacherDashboard] predefinedSubjects IDs:', predefinedSubjects.map(s => s.id));
  
  // Get class number from selected class
  const selectedClassName = selectedClassId ? (institute?.classes.find(c => c.id === selectedClassId)?.name || '') : '';
  const selectedClassNumber = parseInt(selectedClassName.match(/\d+/)?.[0] || '0');
  
  // Get subject name from selected subject
  const selectedSubjectName = selectedSubjectId ? (institute?.subjects.find(s => s.id === selectedSubjectId)?.name || '') : '';
  
  // Get the syllabus assignment for the selected class-subject
  // Use local state (loaded from Firebase) first, then fallback to auth store
  const syllabusAssignment = syllabusAssignmentsLocal.find(
    a => a.classId === selectedClassId && a.subjectId === selectedSubjectId
  ) || user?.syllabusAssignments?.find(
    a => a.classId === selectedClassId && a.subjectId === selectedSubjectId
  );
  
  console.log('[TeacherDashboard] syllabusAssignmentsLocal:', syllabusAssignmentsLocal);
  console.log('[TeacherDashboard] user?.syllabusAssignments:', user?.syllabusAssignments);
  console.log('[TeacherDashboard] syllabusAssignment found:', syllabusAssignment);
  
  // Determine which subjects to use for progress tracking based on syllabus assignment
  // Only return subjects if syllabus is properly assigned
  const subjectsForProgress = (() => {
    // No syllabus assigned - return empty so user sees "Select syllabus first" message
    if (!syllabusAssignment?.syllabusId) {
      console.log('No syllabus assignment found for:', { selectedClassNumber, selectedSubjectName });
      return [];
    }
    
    if (syllabusAssignment.syllabusType === 'predefined') {
      // Find the predefined subject by syllabusId
      // Try both with underscores and spaces (handle both old and new format)
      let found = predefinedSubjects.find(s => s.id === syllabusAssignment.syllabusId);
      
      // Try with underscores if not found (new format)
      if (!found && syllabusAssignment.syllabusId.includes(' ')) {
        const normalizedId = syllabusAssignment.syllabusId.replace(/\s+/g, '_');
        found = predefinedSubjects.find(s => s.id === normalizedId);
        console.log('Trying normalized ID with underscores:', normalizedId, 'found:', !!found);
      }
      
      // Try with spaces if not found (old format)
      if (!found && syllabusAssignment.syllabusId.includes('_')) {
        const oldFormatId = syllabusAssignment.syllabusId.replace(/_/g, ' ');
        found = predefinedSubjects.find(s => s.id === oldFormatId);
        console.log('Trying old format ID with spaces:', oldFormatId, 'found:', !!found);
      }
      
      if (!found) {
        // Try to find by class number and name from syllabusName
        const classNum = parseInt(syllabusAssignment.syllabusName?.match(/Class (\d+)/)?.[1] || '0');
        const subjName = syllabusAssignment.syllabusName?.replace(/CBSE Class \d+ /, '').toLowerCase().trim();
        
        if (classNum && subjName) {
          found = predefinedSubjects.find(
            s => s.classNumber === classNum && 
                 (s.name.toLowerCase().trim() === subjName || 
                  s.name.toLowerCase().trim().includes(subjName) ||
                  subjName.includes(s.name.toLowerCase().trim()))
          );
          console.log('Fallback lookup for predefined:', { classNum, subjName, found: !!found, availableSubjects: predefinedSubjects.map(s => ({ id: s.id, name: s.name, classNumber: s.classNumber })) });
        }
      } else {
        console.log('Found predefined subject by ID:', found.name, found.id);
      }
      
      return found ? [found] : [];
    } else if (syllabusAssignment.syllabusType === 'custom') {
      // Find the custom subject by syllabusId
      const found = customSubjects.find(s => s.id === syllabusAssignment.syllabusId);
      console.log('Looking for custom subject:', syllabusAssignment.syllabusId, 'found:', !!found);
      return found ? [found] : [];
    }
    
    return [];
  })();

  useEffect(() => {
    if (user?.instituteId) {
      const unsubInstitute = subscribeToInstitute(user.instituteId, (inst) => {
        setInstitute(inst);
      });
      
      // Fetch students once (optimized)
      getStudentsForInstitute(user.instituteId).then(students => {
        setAllStudents(students);
      }).catch(err => {
        console.error('Error fetching students:', err);
      });

      const unsubProgress = subscribeToAllProgress((progress) => {
        setAllProgress(progress);
      });

      const unsubTests = subscribeToTests((tests) => {
        setAllTests(tests);
      });

      const unsubTestMarks = subscribeToTestMarks((marks) => {
        setAllTestMarks(marks);
      });
      
      const unsubDiscipline = subscribeToAllDisciplineStars((stars) => {
        setAllDisciplineStars(stars);
      });

      return () => {
        unsubInstitute();
        unsubProgress();
        unsubTests();
        unsubTestMarks();
        unsubDiscipline();
      };
    }
  }, [user]);

  // Load subjects with chapters for progress tracking - ONLY for assigned classes
  useEffect(() => {
    if (!user?.id) return;
    
    let unsubCustom: (() => void) | undefined;
    
    const loadSubjects = async () => {
      setLoadingSubjects(true);
      try {
        // Get unique class numbers from teacher's assignments
        const classNumbers = [...new Set(
          assignments
            .map(a => {
              const className = institute?.classes.find(c => c.id === a.classId)?.name || '';
              return parseInt(className.match(/\d+/)?.[0] || '0');
            })
            .filter(n => n > 0)
        )];
        
        console.log('[TeacherDashboard] Loading predefined subjects for classes:', classNumbers);
        
        // Load ONLY predefined subjects for teacher's assigned classes
        if (classNumbers.length > 0) {
          const predefined = await getPredefinedSubjectsForClasses(classNumbers);
          setPredefinedSubjects(predefined);
          console.log('[TeacherDashboard] Loaded predefined subjects:', predefined.length);
        } else {
          setPredefinedSubjects([]);
        }
        
        // Load syllabus assignments from Firebase
        const userData = await getUser(user.id);
        console.log('[TeacherDashboard] Loaded userData from Firebase:', userData?.syllabusAssignments);
        if (userData?.syllabusAssignments) {
          setSyllabusAssignmentsLocal(userData.syllabusAssignments);
        }
        
        // Subscribe to custom subjects for institute
        if (user.instituteId) {
          unsubCustom = subscribeToCustomSubjectsForInstitute(user.instituteId, (subjects) => {
            setCustomSubjects(subjects);
          });
        }
      } catch (error) {
        console.error('Error loading subjects:', error);
      } finally {
        setLoadingSubjects(false);
      }
    };
    
    loadSubjects();
    
    return () => {
      if (unsubCustom) unsubCustom();
    };
  }, [user?.id, user?.instituteId, assignments, institute?.classes]);

  // Refresh syllabus assignments when switching to myProgress tab
  useEffect(() => {
    if (activeTab === 'myProgress' && user?.id) {
      const refreshSyllabusAssignments = async () => {
        try {
          const userData = await getUser(user.id);
          console.log('[TeacherDashboard] Refreshed userData for myProgress tab:', userData?.syllabusAssignments);
          if (userData?.syllabusAssignments) {
            setSyllabusAssignmentsLocal(userData.syllabusAssignments);
          }
        } catch (error) {
          console.error('Error refreshing syllabus assignments:', error);
        }
      };
      refreshSyllabusAssignments();
    }
  }, [activeTab, user?.id]);

  // Handle class selection from selector
  const handleClassSelect = (assignment: TeacherAssignment) => {
    setTeacherSelectedAssignment(assignment);
    setActiveTab('overview');
  };

  // Handle going back to selector
  const handleBackToSelector = () => {
    setTeacherSelectedAssignment(null);
  };

  // Get students for selected class
  const classStudents = allStudents.filter(s => s.classId === selectedClassId);
  
  // Get subject info
  const getClassName = (classId: string) => institute?.classes.find(c => c.id === classId)?.name || classId;
  const getSubjectName = (subjectId: string) => institute?.subjects.find(s => s.id === subjectId)?.name || subjectId;

  // Get progress for a student
  const getStudentProgress = (studentId: string) => {
    return allProgress.find(p => p.userId === studentId && p.subjectId === selectedSubjectId);
  };

  // Calculate progress percentage
  const getProgressPercentage = (progress: { items: { lectureCompleted: boolean; ncertCompleted: boolean; level1Completed: boolean; level2Completed: boolean; notesCompleted: boolean }[] } | undefined) => {
    if (!progress || !progress.items || progress.items.length === 0) return 0;
    const total = progress.items.length * 5;
    let completed = 0;
    progress.items.forEach(item => {
      if (item.lectureCompleted) completed++;
      if (item.ncertCompleted) completed++;
      if (item.level1Completed) completed++;
      if (item.level2Completed) completed++;
      if (item.notesCompleted) completed++;
    });
    return Math.round((completed / total) * 100);
  };

  // Get tests for this subject
  const subjectTests = allTests.filter(t => t.subjectId === selectedSubjectId);

  // Handle progress update
  const handleProgressUpdate = async (studentId: string, topicId: string, field: string, value: boolean) => {
    if (!selectedSubjectId) return;
    try {
      await updateProgressItem(studentId, selectedSubjectId, topicId, field as any, value);
      toast({ title: 'Updated', description: 'Progress updated successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  // Handle add test
  const handleAddTest = async () => {
    if (!selectedSubjectId || !newTestName || !newTestMaxMarks || !newTestChapterId) {
      toast({ title: 'Error', description: 'Fill all test details', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      await createTest(newTestChapterId, selectedSubjectId, newTestName, parseInt(newTestMaxMarks));
      toast({ title: 'Test Created', description: `${newTestName} has been added` });
      setNewTestName('');
      setNewTestMaxMarks('');
      setNewTestChapterId('');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTest = async (testId: string) => {
    try {
      await deleteTest(testId);
      toast({ title: 'Test Deleted', description: 'Test has been removed' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleEnterMarks = async (testId: string, studentId: string, chapterId: string, marks: number, maxMarks: number) => {
    if (!selectedSubjectId) return;
    try {
      await enterTestMarks(testId, studentId, chapterId, selectedSubjectId, marks, maxMarks);
      toast({ title: 'Marks Saved', description: 'Student marks have been recorded' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDisciplineUpdate = async (studentId: string, change: number, reason: string) => {
    try {
      await updateDisciplineStars(studentId, change, reason);
      toast({ title: 'Stars Updated', description: `${change > 0 ? '+' : ''}${change} stars ${reason}` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  // Handle password change for student
  const handleOpenPasswordDialog = (student: { id: string; name: string; username: string }) => {
    setSelectedStudent(student);
    setNewPassword('');
    setShowPasswordDialog(true);
  };

  const handleChangePassword = async () => {
    if (!selectedStudent || !newPassword.trim()) {
      toast({ title: 'Error', description: 'Please enter a new password', variant: 'destructive' });
      return;
    }
    
    if (newPassword.length < 4) {
      toast({ title: 'Error', description: 'Password must be at least 4 characters', variant: 'destructive' });
      return;
    }
    
    setChangingPassword(true);
    try {
      await updateUserPassword(selectedStudent.id, newPassword);
      toast({ 
        title: 'Password Updated', 
        description: `Password changed for ${selectedStudent.name}` 
      });
      setShowPasswordDialog(false);
      setSelectedStudent(null);
      setNewPassword('');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setChangingPassword(false);
    }
  };

  // Get discipline stars for student
  const getStudentStars = (studentId: string) => {
    const stars = allDisciplineStars.find(s => s.userId === studentId);
    return stars?.stars || 0;
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'myProgress', label: 'My Progress', icon: TrendingUp },
    { id: 'syllabus', label: 'Syllabus', icon: BookOpen },
    { id: 'studentProgress', label: 'Student Progress', icon: BarChart3 },
    { id: 'tests', label: 'Tests', icon: FileText },
    { id: 'discipline', label: 'Discipline', icon: Star },
    { id: 'students', label: 'Students', icon: GraduationCap },
  ];

  // Always show class selector first if no assignment is selected
  if (!teacherSelectedAssignment) {
    return <TeacherClassSelector onSelect={handleClassSelect} />;
  }

  // Show dashboard for selected assignment
  return (
    <div className="space-y-6">
      {/* Back to Class Selector Button */}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleBackToSelector}
        className="text-muted-foreground mb-2"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Change Class
      </Button>
      
      {/* Header with assignment info */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{getClassName(teacherSelectedAssignment.classId)} - {getSubjectName(teacherSelectedAssignment.subjectId)}</h1>
          <p className="text-muted-foreground">{classStudents.length} students</p>
        </div>
        
        {/* Quick stats */}
        <div className="flex gap-4">
          <Card className="px-4 py-2">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{classStudents.length}</p>
              <p className="text-xs text-muted-foreground">Students</p>
            </div>
          </Card>
          <Card className="px-4 py-2">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{subjectTests.length}</p>
              <p className="text-xs text-muted-foreground">Tests</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'outline'}
            className={activeTab === tab.id ? 'bg-purple-600' : ''}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">{classStudents.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Class</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-blue-600">{getClassName(selectedClassId || '')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Subject</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-green-600">{getSubjectName(selectedSubjectId || '')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">{subjectTests.length}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* My Progress Tab - Teacher's syllabus completion */}
      {activeTab === 'myProgress' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Syllabus Completion Progress</h2>
          <p className="text-muted-foreground">
            Track what you've taught in {getClassName(selectedClassId || '')} - {getSubjectName(selectedSubjectId || '')}
          </p>
          
          {loadingSubjects ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-gray-400 mb-4" />
                <p className="text-muted-foreground">Loading syllabus...</p>
              </CardContent>
            </Card>
          ) : subjectsForProgress.length > 0 ? (
            subjectsForProgress.map((subject) => (
              <TeacherSyllabusProgress 
                key={subject.id} 
                subject={subject as any} 
                syllabusAssigned={!!syllabusAssignment?.syllabusId}
              />
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-muted-foreground mb-2">
                  No syllabus assigned yet
                </p>
                <p className="text-sm text-muted-foreground">
                  Go to Syllabus tab to load CBSE syllabus or create custom syllabus.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Syllabus Tab */}
      {activeTab === 'syllabus' && (
        <SyllabusManager />
      )}

      {/* Student Progress Tab */}
      {activeTab === 'studentProgress' && (
        <Card>
          <CardHeader>
            <CardTitle>Track Student Progress - {getSubjectName(selectedSubjectId || '')}</CardTitle>
          </CardHeader>
          <CardContent>
            {classStudents.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No students to track</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2">Student</th>
                      <th className="text-center py-2 px-2">Lecture</th>
                      <th className="text-center py-2 px-2">NCERT</th>
                      <th className="text-center py-2 px-2">Level 1</th>
                      <th className="text-center py-2 px-2">Level 2</th>
                      <th className="text-center py-2 px-2">Notes</th>
                      <th className="text-center py-2 px-2">Overall</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classStudents.map((student) => {
                      const progress = getStudentProgress(student.id);
                      const firstTopic = progress?.items?.[0];
                      const percentage = getProgressPercentage(progress);
                      return (
                        <tr key={student.id} className="border-b">
                          <td className="py-2 px-2 font-medium">{student.name}</td>
                          <td className="py-2 px-2 text-center">
                            <button
                              className={`w-6 h-6 rounded ${firstTopic?.lectureCompleted ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
                              onClick={() => firstTopic && handleProgressUpdate(student.id, firstTopic.topicId, 'lectureCompleted', !firstTopic.lectureCompleted)}
                            >
                              {firstTopic?.lectureCompleted ? '✓' : ''}
                            </button>
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              className={`w-6 h-6 rounded ${firstTopic?.ncertCompleted ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
                              onClick={() => firstTopic && handleProgressUpdate(student.id, firstTopic.topicId, 'ncertCompleted', !firstTopic.ncertCompleted)}
                            >
                              {firstTopic?.ncertCompleted ? '✓' : ''}
                            </button>
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              className={`w-6 h-6 rounded ${firstTopic?.level1Completed ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
                              onClick={() => firstTopic && handleProgressUpdate(student.id, firstTopic.topicId, 'level1Completed', !firstTopic.level1Completed)}
                            >
                              {firstTopic?.level1Completed ? '✓' : ''}
                            </button>
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              className={`w-6 h-6 rounded ${firstTopic?.level2Completed ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
                              onClick={() => firstTopic && handleProgressUpdate(student.id, firstTopic.topicId, 'level2Completed', !firstTopic.level2Completed)}
                            >
                              {firstTopic?.level2Completed ? '✓' : ''}
                            </button>
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              className={`w-6 h-6 rounded ${firstTopic?.notesCompleted ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
                              onClick={() => firstTopic && handleProgressUpdate(student.id, firstTopic.topicId, 'notesCompleted', !firstTopic.notesCompleted)}
                            >
                              {firstTopic?.notesCompleted ? '✓' : ''}
                            </button>
                          </td>
                          <td className="py-2 px-2 text-center">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-purple-600 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-xs">{percentage}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tests Tab */}
      {activeTab === 'tests' && (
        <div className="space-y-4">
          {/* Add Test Form */}
          <Card>
            <CardHeader>
              <CardTitle>Create New Test</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  placeholder="Test Name"
                  value={newTestName}
                  onChange={(e) => setNewTestName(e.target.value)}
                />
                <Input
                  placeholder="Max Marks"
                  type="number"
                  value={newTestMaxMarks}
                  onChange={(e) => setNewTestMaxMarks(e.target.value)}
                />
                <Input
                  placeholder="Chapter ID"
                  value={newTestChapterId}
                  onChange={(e) => setNewTestChapterId(e.target.value)}
                />
                <Button onClick={handleAddTest} disabled={isLoading || !newTestName || !newTestMaxMarks}>
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  Add Test
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tests List */}
          {subjectTests.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-muted-foreground">No tests created yet</p>
              </CardContent>
            </Card>
          ) : (
            subjectTests.map((test) => (
              <Card key={test.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{test.testName}</CardTitle>
                      <p className="text-sm text-muted-foreground">Max Marks: {test.maxMarks}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500"
                      onClick={() => handleDeleteTest(test.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Student</th>
                        <th className="text-left py-2">Marks</th>
                        <th className="text-left py-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classStudents.map((student) => {
                        const marks = allTestMarks.find(m => m.testId === test.id && m.userId === student.id);
                        return (
                          <tr key={student.id} className="border-b">
                            <td className="py-2">{student.name}</td>
                            <td className="py-2">
                              {marks ? `${marks.marks}/${test.maxMarks}` : 'Not entered'}
                            </td>
                            <td className="py-2">
                              <input
                                type="number"
                                min="0"
                                max={test.maxMarks}
                                placeholder="Enter marks"
                                className="border rounded px-2 py-1 w-24 text-sm"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    const value = parseInt((e.target as HTMLInputElement).value);
                                    if (!isNaN(value)) {
                                      handleEnterMarks(test.id, student.id, test.chapterId, value, test.maxMarks);
                                      (e.target as HTMLInputElement).value = '';
                                    }
                                  }
                                }}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Discipline Tab */}
      {activeTab === 'discipline' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Discipline Stars
            </CardTitle>
          </CardHeader>
          <CardContent>
            {classStudents.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No students</p>
            ) : (
              <div className="space-y-2">
                {classStudents.map((student) => (
                  <div key={student.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div>
                      <p className="font-medium">{student.name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">⭐</span>
                      <span className="font-bold text-lg">{getStudentStars(student.id)}</span>
                      <div className="flex gap-1 ml-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:bg-green-50"
                          onClick={() => handleDisciplineUpdate(student.id, 1, 'Good behavior')}
                        >
                          +1
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleDisciplineUpdate(student.id, -1, 'Misconduct')}
                        >
                          -1
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Students Tab */}
      {activeTab === 'students' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              Students ({classStudents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {classStudents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No students in this class yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Name</th>
                      <th className="text-left py-2 px-4">Username</th>
                      <th className="text-left py-2 px-4">Progress</th>
                      <th className="text-left py-2 px-4">Stars</th>
                      <th className="text-left py-2 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classStudents.map((student) => {
                      const progress = getStudentProgress(student.id);
                      const percentage = getProgressPercentage(progress);
                      return (
                        <tr key={student.id} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-4">{student.name}</td>
                          <td className="py-2 px-4">{student.username}</td>
                          <td className="py-2 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-purple-600 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-sm text-muted-foreground">{percentage}%</span>
                            </div>
                          </td>
                          <td className="py-2 px-4">
                            <span className="flex items-center gap-1">
                              <span>⭐</span>
                              <span>{getStudentStars(student.id)}</span>
                            </span>
                          </td>
                          <td className="py-2 px-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenPasswordDialog({ 
                                id: student.id, 
                                name: student.name, 
                                username: student.username || '' 
                              })}
                              className="gap-1"
                            >
                              <KeyRound className="w-3 h-3" />
                              Change Password
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-purple-600" />
              Change Student Password
            </DialogTitle>
            <DialogDescription>
              Change password for <strong>{selectedStudent?.name}</strong> ({selectedStudent?.username})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Password must be at least 4 characters</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleChangePassword} 
              disabled={changingPassword || !newPassword.trim() || newPassword.length < 4}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {changingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
