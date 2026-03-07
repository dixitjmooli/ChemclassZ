'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore, useAppStore } from '@/lib/store';
import { 
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
  getSubjects,
  subscribeToCustomSubjectsForTeacher,
  Subject,
  CustomSubject
} from '@/lib/firebase-service';
import { SyllabusManager } from '@/components/app/SyllabusManager';
import { TeacherSyllabusProgress } from '@/components/app/TeacherSyllabusProgress';
import { IndependentTeacherClassSelector } from '@/components/app/IndependentTeacherClassSelector';
import { TrendingUp, BarChart3, FileText, Star, ArrowLeft, Loader2, User, Trash2 } from 'lucide-react';
import {
  Users,
  GraduationCap,
  BookOpen,
  Plus,
  Copy,
  Check,
  KeyRound
} from 'lucide-react';

// Interface for selected class-subject
interface ClassSubjectSelection {
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
}

export function IndependentTeacherDashboard() {
  const { user } = useAuthStore();
  const { 
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

  const [activeTab, setActiveTab] = useState<'overview' | 'myProgress' | 'syllabus' | 'studentProgress' | 'tests' | 'discipline' | 'classes' | 'subjects' | 'students'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Subjects with chapters for syllabus progress tracking
  const [predefinedSubjects, setPredefinedSubjects] = useState<Subject[]>([]);
  const [customSubjects, setCustomSubjects] = useState<CustomSubject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  
  // Selected class/subject for managing students (from class selector)
  const [selectedClass, setSelectedClass] = useState<ClassSubjectSelection | null>(null);
  
  // New test form
  const [newTestName, setNewTestName] = useState('');
  const [newTestMaxMarks, setNewTestMaxMarks] = useState('');
  const [newTestChapterId, setNewTestChapterId] = useState('');

  // Classes and subjects from user document
  const classes = user?.classes || [];
  const subjects = user?.subjects || [];
  
  // Use selected class/subject or fallback to local state
  const selectedClassId = selectedClass?.classId || null;
  const selectedSubjectId = selectedClass?.subjectId || null;
  
  // Determine which subjects to use for progress tracking
  const usePredefined = user?.usePredefinedSyllabus ?? false;
  const subjectsForProgress = usePredefined 
    ? predefinedSubjects 
    : customSubjects;

  // Handle class selection from selector
  const handleClassSelect = (assignment: ClassSubjectSelection) => {
    setSelectedClass(assignment);
    setActiveTab('overview');
  };

  // Handle going back to selector
  const handleBackToSelector = () => {
    setSelectedClass(null);
  };

  useEffect(() => {
    if (user?.id) {
      const unsubStudents = subscribeToAllStudents((students) => {
        setAllStudents(students.filter(s => s.independentTeacherId === user.id));
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
        unsubStudents();
        unsubProgress();
        unsubTests();
        unsubTestMarks();
        unsubDiscipline();
      };
    }
  }, [user?.id]);

  // Load subjects with chapters for progress tracking
  useEffect(() => {
    if (!user?.id) return;
    
    let unsubCustom: (() => void) | undefined;
    
    const loadSubjects = async () => {
      setLoadingSubjects(true);
      try {
        // Load predefined subjects
        const predefined = await getSubjects(null);
        setPredefinedSubjects(predefined);
        
        // Subscribe to custom subjects
        unsubCustom = subscribeToCustomSubjectsForTeacher(user.id, (subjects) => {
          setCustomSubjects(subjects);
        });
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
  }, [user?.id]);

  const copyReferralCode = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      setCopied(true);
      toast({ title: 'Copied!', description: 'Referral code copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Get students for selected class
  const classStudents = selectedClassId 
    ? allStudents.filter(s => s.classId === selectedClassId)
    : allStudents;

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

  // Get tests for selected subject
  const subjectTests = selectedSubjectId 
    ? allTests.filter(t => t.subjectId === selectedSubjectId)
    : [];

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

  // Handle delete test
  const handleDeleteTest = async (testId: string) => {
    try {
      await deleteTest(testId);
      toast({ title: 'Test Deleted', description: 'Test has been removed' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  // Handle enter marks
  const handleEnterMarks = async (testId: string, studentId: string, chapterId: string, marks: number, maxMarks: number) => {
    if (!selectedSubjectId) return;
    try {
      await enterTestMarks(testId, studentId, chapterId, selectedSubjectId, marks, maxMarks);
      toast({ title: 'Marks Saved', description: 'Student marks have been recorded' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  // Handle discipline update
  const handleDisciplineUpdate = async (studentId: string, change: number, reason: string) => {
    try {
      await updateDisciplineStars(studentId, change, reason);
      toast({ title: 'Stars Updated', description: `${change > 0 ? '+' : ''}${change} stars ${reason}` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const getClassName = (classId: string) => {
    return classes.find(c => c.id === classId)?.name || classId;
  };

  const getSubjectName = (subjectId: string) => {
    return subjects.find(s => s.id === subjectId)?.name || subjectId;
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

  // Always show class selector first if no class is selected
  // This allows teacher to manage classes/subjects from the first screen
  if (!selectedClass) {
    return <IndependentTeacherClassSelector onSelect={handleClassSelect} />;
  }

  return (
    <div className="space-y-6">
      {/* Back to Class Selector Button */}
      {selectedClass && selectedClass.classId && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleBackToSelector}
          className="text-muted-foreground mb-2"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Change Class
        </Button>
      )}
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {selectedClass && selectedClass.classId 
              ? `${selectedClass.className} - ${selectedClass.subjectName}` 
              : `${user?.name}'s Dashboard`}
          </h1>
          <p className="text-muted-foreground">
            {selectedClass && selectedClass.classId 
              ? `${classStudents.length} students`
              : 'Manage your classes, subjects, and students'}
          </p>
        </div>
        
        {/* Referral Code */}
        {user?.referralCode && (
          <Card className="bg-gradient-to-r from-green-500 to-green-700 text-white">
            <CardContent className="p-4">
              <p className="text-sm opacity-80">Student Referral Code</p>
              <div className="flex items-center gap-2 mt-1">
                <KeyRound className="w-5 h-5" />
                <span className="text-2xl font-bold tracking-wider">{user.referralCode}</span>
                <Button size="sm" variant="ghost" className="text-white hover:bg-white/20" onClick={copyReferralCode}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'outline'}
            className={activeTab === tab.id ? 'bg-green-600' : ''}
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
              <p className="text-3xl font-bold text-green-600">{allStudents.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{classes.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Subjects</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">{subjects.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Referral Code</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-orange-600">{user?.referralCode}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* My Progress Tab - Teacher's syllabus completion */}
      {activeTab === 'myProgress' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Syllabus Completion Progress</h2>
          <p className="text-muted-foreground">
            Track what you've taught in class
            {usePredefined ? ' (Using Predefined Syllabus)' : ' (Using Custom Syllabus)'}
          </p>
          
          {loadingSubjects ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-gray-400 mb-4" />
                <p className="text-muted-foreground">Loading subjects...</p>
              </CardContent>
            </Card>
          ) : subjectsForProgress.length > 0 ? (
            subjectsForProgress.map((subject) => (
              <TeacherSyllabusProgress key={subject.id} subject={subject as any} />
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-muted-foreground mb-2">
                  {usePredefined 
                    ? 'No predefined subjects available.' 
                    : 'No custom subjects created yet.'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {usePredefined 
                    ? 'Contact admin or switch to custom syllabus in Syllabus tab.' 
                    : 'Go to Syllabus tab to create your custom subjects.'}
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
        <div className="space-y-4">
          {/* Class/Subject Selector */}
          <div className="flex flex-wrap gap-4">
            <div>
              <Label>Select Class</Label>
              <select
                className="border rounded px-3 py-2 mt-1"
                value={selectedClassId || ''}
                onChange={(e) => setSelectedClassId(e.target.value || null)}
              >
                <option value="">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Select Subject</Label>
              <select
                className="border rounded px-3 py-2 mt-1"
                value={selectedSubjectId || ''}
                onChange={(e) => setSelectedSubjectId(e.target.value || null)}
              >
                <option value="">Select Subject</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>
          </div>

          {selectedSubjectId ? (
            <Card>
              <CardHeader>
                <CardTitle>Track Student Progress - {getSubjectName(selectedSubjectId)}</CardTitle>
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
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <BarChart3 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-muted-foreground">Select a subject to track student progress</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Tests Tab */}
      {activeTab === 'tests' && (
        <div className="space-y-4">
          {/* Subject Selector */}
          <div>
            <Label>Select Subject</Label>
            <select
              className="border rounded px-3 py-2 mt-1"
              value={selectedSubjectId || ''}
              onChange={(e) => setSelectedSubjectId(e.target.value || null)}
            >
              <option value="">Select Subject</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          </div>

          {selectedSubjectId && (
            <>
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
                            <th className="text-left py-2">Class</th>
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
                                <td className="py-2">{getClassName(student.classId || '')}</td>
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
            </>
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
            {allStudents.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No students</p>
            ) : (
              <div className="space-y-2">
                {allStudents.map((student) => (
                  <div key={student.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-muted-foreground">{getClassName(student.classId || '')}</p>
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
              All Students ({allStudents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {allStudents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-2">No students registered yet</p>
                <p className="text-sm text-muted-foreground">
                  Share your referral code: <strong className="text-green-600">{user?.referralCode}</strong>
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Name</th>
                      <th className="text-left py-2 px-4">Username</th>
                      <th className="text-left py-2 px-4">Class</th>
                      <th className="text-left py-2 px-4">Progress</th>
                      <th className="text-left py-2 px-4">Stars</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allStudents.map((student) => {
                      const progress = getStudentProgress(student.id);
                      const percentage = getProgressPercentage(progress);
                      return (
                        <tr key={student.id} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-4">{student.name}</td>
                          <td className="py-2 px-4">{student.username}</td>
                          <td className="py-2 px-4">
                            <Badge variant="outline">{getClassName(student.classId || '')}</Badge>
                          </td>
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
    </div>
  );
}
