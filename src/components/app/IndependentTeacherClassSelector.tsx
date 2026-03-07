'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthStore, useAppStore } from '@/lib/store';
import { 
  subscribeToAllStudents,
  updateIndependentTeacher,
  TaughtProgress,
  subscribeToAllTaughtProgressForTeacher,
  getSubjects,
  Subject
} from '@/lib/firebase-service';
import { TodoList } from '@/components/app/TodoList';
import { useToast } from '@/hooks/use-toast';
import { 
  BookOpen, 
  ChevronRight, 
  Users,
  GraduationCap,
  Loader2,
  CheckCircle2,
  Plus,
  KeyRound,
  X,
  Check,
  Trash2,
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

// Standard CBSE Classes
const CBSE_CLASSES = [6, 7, 8, 9, 10, 11, 12];

// Streams for Class 11 and 12
const STREAMS = ['Science', 'Commerce', 'Arts'];

// Subjects by class and stream
const SUBJECTS_BY_CLASS: Record<number, string[]> = {
  6: ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi'],
  7: ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi'],
  8: ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi'],
  9: ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi'],
  10: ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi'],
  11: [], // Depends on stream
  12: [], // Depends on stream
};

const SUBJECTS_BY_STREAM: Record<string, string[]> = {
  'Science': ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English'],
  'Commerce': ['Accountancy', 'Business Studies', 'Economics', 'English'],
  'Arts': ['History', 'Political Science', 'Geography', 'Psychology', 'English'],
};

interface ClassSubjectAssignment {
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
}

interface IndependentTeacherClassSelectorProps {
  onSelect: (assignment: ClassSubjectAssignment) => void;
}

export function IndependentTeacherClassSelector({ onSelect }: IndependentTeacherClassSelectorProps) {
  const { user, updateUser } = useAuthStore();
  const { 
    allStudents,
    setAllStudents
  } = useAppStore();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [taughtProgress, setTaughtProgress] = useState<TaughtProgress[]>([]);
  const [predefinedSubjects, setPredefinedSubjects] = useState<Subject[]>([]);
  
  // Class creation step-based form
  const [classStep, setClassStep] = useState<1 | 2>(1);
  const [selectedClassNumber, setSelectedClassNumber] = useState<string>('');
  const [selectedStream, setSelectedStream] = useState<string>('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [classNickname, setClassNickname] = useState<string>('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation states
  const [deleteClassDialog, setDeleteClassDialog] = useState<{ open: boolean; classId: string; className: string }>({ 
    open: false, 
    classId: '', 
    className: '' 
  });

  // Classes and subjects from user document
  const classes = user?.classes || [];
  const subjects = user?.subjects || [];

  useEffect(() => {
    let isMounted = true;
    let unsubStudents: (() => void) | undefined;
    let unsubProgress: (() => void) | undefined;
    
    const initialize = async () => {
      if (user?.id) {
        unsubStudents = subscribeToAllStudents((students) => {
          if (isMounted) setAllStudents(students.filter(s => s.independentTeacherId === user.id));
        });
        
        unsubProgress = subscribeToAllTaughtProgressForTeacher(user.id, (progress) => {
          if (isMounted) setTaughtProgress(progress);
        });
        
        // Load predefined subjects
        const subjects = await getSubjects(null);
        if (isMounted) setPredefinedSubjects(subjects);
        
        // Simulate loading
        setTimeout(() => {
          if (isMounted) setLoading(false);
        }, 500);
      }
    };

    initialize();

    return () => {
      isMounted = false;
      if (unsubStudents) unsubStudents();
      if (unsubProgress) unsubProgress();
    };
  }, [user?.id]);

  // Build class-subject combinations
  const assignments: ClassSubjectAssignment[] = [];
  subjects.forEach(subject => {
    subject.classIds.forEach(classId => {
      const className = classes.find(c => c.id === classId)?.name || classId;
      assignments.push({
        classId,
        className,
        subjectId: subject.id,
        subjectName: subject.name
      });
    });
  });

  // Get students count for a class
  const getStudentCount = (classId: string) => {
    return allStudents.filter(s => s.classId === classId).length;
  };

  // Get progress for a subject
  const getProgress = (subjectId: string): { percent: number; taught: number; total: number } => {
    const progress = taughtProgress.find(p => p.subjectId === subjectId);
    if (!progress) return { percent: 0, taught: 0, total: 0 };
    
    const taught = progress.items.filter(i => i.taught).length;
    const total = progress.items.length;
    const percent = total > 0 ? Math.round((taught / total) * 100) : 0;
    
    return { percent, taught, total };
  };

  // Get progress color
  const getProgressColor = (percent: number): string => {
    if (percent >= 80) return 'text-green-600';
    if (percent >= 50) return 'text-yellow-600';
    if (percent >= 25) return 'text-orange-600';
    return 'text-red-600';
  };

  const getProgressBgColor = (percent: number): string => {
    if (percent >= 80) return 'bg-green-500';
    if (percent >= 50) return 'bg-yellow-500';
    if (percent >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Calculate overall stats - inline calculation to avoid dependency issues
  const totalClasses = getUniqueClassGroups().length;
  const totalSubjects = subjects.length;
  const totalStudents = allStudents.length;
  const avgProgress = (() => {
    if (assignments.length === 0) return 0;
    let totalPercent = 0;
    assignments.forEach(a => {
      const progress = taughtProgress.find(p => p.subjectId === a.subjectId);
      if (progress && progress.items.length > 0) {
        const taught = progress.items.filter(i => i.taught).length;
        totalPercent += Math.round((taught / progress.items.length) * 100);
      }
    });
    return Math.round(totalPercent / assignments.length);
  })();

  const copyReferralCode = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Get available subjects based on selected class and stream
  const getAvailableSubjects = () => {
    if (!selectedClassNumber) return [];
    const classNum = parseInt(selectedClassNumber);
    
    if ((classNum === 11 || classNum === 12) && selectedStream) {
      return SUBJECTS_BY_STREAM[selectedStream] || [];
    }
    
    return SUBJECTS_BY_CLASS[classNum] || [];
  };

  // Toggle subject selection
  const toggleSubject = (subject: string) => {
    if (selectedSubjects.includes(subject)) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== subject));
    } else {
      setSelectedSubjects([...selectedSubjects, subject]);
    }
  };

  // Reset class form
  const resetClassForm = () => {
    setClassStep(1);
    setSelectedClassNumber('');
    setSelectedStream('');
    setSelectedSubjects([]);
    setClassNickname('');
  };

  // Create classes with subjects (auto-assign to self)
  const createClasses = async () => {
    if (!user || selectedSubjects.length === 0) {
      toast({ title: 'Error', description: 'Select at least one subject', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const classNum = parseInt(selectedClassNumber);
      const newClasses: { id: string; name: string; classNumber: number; stream: string | null; subjectName: string }[] = [];
      const newSubjects: { id: string; name: string; subjectName: string; classNumber: number; stream: string | null; classIds: string[] }[] = [];
      
      for (const subject of selectedSubjects) {
        const classId = `class_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const subjectId = `subject_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Build display name
        let displayName = classNickname || (selectedStream ? `${classNum} ${selectedStream}` : `${classNum}`);
        displayName = `${subject} (${displayName})`;
        
        newClasses.push({
          id: classId,
          name: displayName,
          classNumber: classNum,
          stream: selectedStream || null,
          subjectName: subject
        });
        
        newSubjects.push({
          id: subjectId,
          name: displayName,
          subjectName: subject,
          classNumber: classNum,
          stream: selectedStream || null,
          classIds: [classId]
        });
      }
      
      const updatedClasses = [...classes, ...newClasses];
      const updatedSubjects = [...subjects, ...newSubjects];
      
      await updateIndependentTeacher(user.id, { classes: updatedClasses, subjects: updatedSubjects });
      updateUser({ classes: updatedClasses, subjects: updatedSubjects });
      
      toast({ 
        title: 'Classes Created', 
        description: `Created ${selectedSubjects.length} class-subject combinations` 
      });
      
      resetClassForm();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm delete class
  const confirmDeleteClass = (classId: string, className: string) => {
    const studentsInClass = allStudents.filter(s => s.classId === classId);
    if (studentsInClass.length > 0) {
      toast({ 
        title: 'Cannot Remove', 
        description: `${studentsInClass.length} student(s) are in this class`, 
        variant: 'destructive' 
      });
      return;
    }
    setDeleteClassDialog({ open: true, classId, className });
  };

  const removeClass = async () => {
    const { classId, className } = deleteClassDialog;
    if (!user) return;
    
    setIsSubmitting(true);
    const updatedClasses = classes.filter(c => c.id !== classId);
    const updatedSubjects = subjects.filter(s => !s.classIds.includes(classId));
    
    try {
      await updateIndependentTeacher(user.id, { classes: updatedClasses, subjects: updatedSubjects });
      updateUser({ classes: updatedClasses, subjects: updatedSubjects });
      toast({ title: 'Class Removed', description: `${className} has been removed` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
      setDeleteClassDialog({ open: false, classId: '', className: '' });
    }
  };

  // Get unique class groups for display
  const getUniqueClassGroups = () => {
    if (!classes) return [];
    
    const groups: Record<string, { 
      displayName: string; 
      classNumber: number;
      stream: string | null;
      subjects: { id: string; name: string; subjectName: string }[] 
    }> = {};
    
    classes.forEach((cls: any) => {
      const groupKey = cls.nickname || (cls.stream ? `${cls.classNumber} ${cls.stream}` : `${cls.classNumber}`);
      
      if (!groups[groupKey]) {
        groups[groupKey] = {
          displayName: groupKey,
          classNumber: cls.classNumber,
          stream: cls.stream,
          subjects: []
        };
      }
      
      groups[groupKey].subjects.push({
        id: cls.id,
        name: cls.name,
        subjectName: cls.subjectName || cls.name.split(' (')[0]
      });
    });
    
    return Object.values(groups);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-green-600 mb-4" />
        <p className="text-muted-foreground">Loading your classes...</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-green-700 mb-4"
          >
            <GraduationCap className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold mb-2">
            Welcome, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground">
            Select a class and subject to get started
          </p>
        </div>

        {/* Referral Code Card */}
        {user?.referralCode && (
          <Card className="max-w-md mx-auto bg-gradient-to-r from-green-500 to-green-700 text-white">
            <CardContent className="p-4 text-center">
              <p className="text-sm opacity-80 mb-1">Your Student Referral Code</p>
              <div className="flex items-center justify-center gap-2">
                <KeyRound className="w-5 h-5" />
                <span className="text-2xl font-bold tracking-wider">{user.referralCode}</span>
                <Button size="sm" variant="ghost" className="text-white hover:bg-white/20" onClick={copyReferralCode}>
                  {copied ? <CheckCircle2 className="w-4 h-4" /> : 'Copy'}
                </Button>
              </div>
              <p className="text-xs opacity-80 mt-2">Share this code with students to join your class</p>
            </CardContent>
          </Card>
        )}

        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-4 max-w-lg mx-auto">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{totalClasses}</p>
            <p className="text-xs text-muted-foreground">Classes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{totalSubjects}</p>
            <p className="text-xs text-muted-foreground">Subjects</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{totalStudents}</p>
            <p className="text-xs text-muted-foreground">Students</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold ${getProgressColor(avgProgress)}`}>{avgProgress}%</p>
            <p className="text-xs text-muted-foreground">Progress</p>
          </div>
        </div>

        {/* Progress Overview Card */}
        {assignments.length > 0 && (
          <Card className="max-w-md mx-auto bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-700 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  Overall Syllabus Progress
                </span>
                <span className={`text-xl font-bold ${getProgressColor(avgProgress)}`}>
                  {avgProgress}%
                </span>
              </div>
              <Progress value={avgProgress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                Average completion across all your subjects
              </p>
            </CardContent>
          </Card>
        )}

        {/* Existing Classes Grouped */}
        {getUniqueClassGroups().length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">Your Classes:</h4>
            {getUniqueClassGroups().map((group) => (
              <div key={group.displayName} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{group.displayName}</h4>
                  <Badge variant="outline">Class {group.classNumber}{group.stream ? ` ${group.stream}` : ''}</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {group.subjects.map((subj) => (
                    <div key={subj.id} className="bg-white p-2 rounded border flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{subj.subjectName}</p>
                      </div>
                      <X 
                        className="w-4 h-4 cursor-pointer hover:text-red-500" 
                        onClick={() => confirmDeleteClass(subj.id, subj.name)} 
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step-based Class Creation */}
        <Card className="border-green-200 bg-green-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="w-5 h-5 text-green-600" />
              Create New Classes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step Indicators */}
            <div className="flex items-center gap-2 mb-4">
              {[1, 2].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    classStep >= step ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step}
                  </div>
                  {step < 2 && <div className={`w-12 h-1 ${classStep > step ? 'bg-green-600' : 'bg-gray-200'}`} />}
                </div>
              ))}
            </div>
            
            <div className="text-sm text-muted-foreground mb-4">
              Step {classStep}: {classStep === 1 ? 'Select Class & Subjects' : 'Add Nickname & Create'}
            </div>
            
            {/* Step 1: Select Class and Subjects */}
            {classStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Class Dropdown */}
                  <div className="space-y-2">
                    <Label className="text-sm">Select Class *</Label>
                    <Select value={selectedClassNumber} onValueChange={(v) => { setSelectedClassNumber(v); setSelectedStream(''); setSelectedSubjects([]); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select class..." />
                      </SelectTrigger>
                      <SelectContent>
                        {CBSE_CLASSES.map((c) => (
                          <SelectItem key={c} value={c.toString()}>Class {c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Stream Dropdown (only for 11, 12) */}
                  <div className="space-y-2">
                    <Label className="text-sm">Stream {parseInt(selectedClassNumber) >= 11 ? '*' : ''}</Label>
                    <Select 
                      value={selectedStream} 
                      onValueChange={(v) => { setSelectedStream(v); setSelectedSubjects([]); }}
                      disabled={!selectedClassNumber || (parseInt(selectedClassNumber) < 11)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={parseInt(selectedClassNumber) >= 11 ? "Select stream..." : "Not applicable"} />
                      </SelectTrigger>
                      <SelectContent>
                        {STREAMS.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Subject Multi-select */}
                {getAvailableSubjects().length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm">Select Subjects * (click to toggle selection)</Label>
                    <div className="flex flex-wrap gap-2">
                      {getAvailableSubjects().map((subject) => (
                        <Badge
                          key={subject}
                          variant={selectedSubjects.includes(subject) ? "default" : "outline"}
                          className={`cursor-pointer px-4 py-2 text-sm transition-all ${
                            selectedSubjects.includes(subject) 
                              ? 'bg-green-600 hover:bg-green-700' 
                              : 'hover:bg-green-100'
                          }`}
                          onClick={() => toggleSubject(subject)}
                        >
                          {subject}
                          {selectedSubjects.includes(subject) && <Check className="w-3 h-3 ml-2" />}
                        </Badge>
                      ))}
                    </div>
                    {selectedSubjects.length > 0 && (
                      <p className="text-sm text-green-600">{selectedSubjects.length} subject(s) selected</p>
                    )}
                  </div>
                )}
                
                <Button 
                  onClick={() => setClassStep(2)} 
                  disabled={!selectedClassNumber || selectedSubjects.length === 0 || (parseInt(selectedClassNumber) >= 11 && !selectedStream)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Next: Add Nickname
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
            
            {/* Step 2: Nickname and Create */}
            {classStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">Class Nickname (Optional)</Label>
                  <Input
                    placeholder="e.g., Section A, Batch 2024"
                    value={classNickname}
                    onChange={(e) => setClassNickname(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Preview: {classNickname || (selectedStream ? `Class ${selectedClassNumber} ${selectedStream}` : `Class ${selectedClassNumber}`)}
                  </p>
                </div>
                
                {/* Summary */}
                <div className="bg-white p-4 rounded-lg border">
                  <h5 className="font-medium mb-2">Summary:</h5>
                  <p className="text-sm">Class: <strong>{selectedStream ? `Class ${selectedClassNumber} ${selectedStream}` : `Class ${selectedClassNumber}`}</strong></p>
                  <p className="text-sm">Nickname: <strong>{classNickname || 'None'}</strong></p>
                  <p className="text-sm">Subjects: <strong>{selectedSubjects.join(', ')}</strong></p>
                  <p className="text-xs text-muted-foreground mt-2">
                    This will create {selectedSubjects.length} class-subject combinations. You will be automatically assigned as the teacher.
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setClassStep(1)}>
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button 
                    onClick={createClasses} 
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                    Create {selectedSubjects.length} Classes
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Class-Subject Cards for Selection */}
        {assignments.length > 0 && (
          <>
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-sm text-muted-foreground">Select a class to view dashboard</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignments.map((assignment, index) => {
                const studentCount = getStudentCount(assignment.classId);
                const progress = getProgress(assignment.subjectId);

                return (
                  <motion.div
                    key={`${assignment.classId}_${assignment.subjectId}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      className="cursor-pointer hover:border-green-500 hover:shadow-lg transition-all group overflow-hidden"
                      onClick={() => onSelect(assignment)}
                    >
                      {/* Color bar at top based on progress */}
                      <div className={`h-1.5 ${
                        progress.percent >= 80 
                          ? 'bg-gradient-to-r from-green-400 to-green-600'
                          : progress.percent >= 50
                            ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                            : progress.percent >= 25
                              ? 'bg-gradient-to-r from-orange-400 to-orange-600'
                              : 'bg-gradient-to-r from-green-400 to-green-600'
                      }`} />
                      
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                              <BookOpen className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{assignment.className}</h3>
                              <p className="text-sm text-muted-foreground">{assignment.subjectName}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
                        </div>

                        {/* Progress Bar */}
                        {progress.total > 0 && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-muted-foreground">
                                {progress.taught} of {progress.total} topics taught
                              </span>
                              <span className={`text-sm font-bold ${getProgressColor(progress.percent)}`}>
                                {progress.percent}%
                              </span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${getProgressBgColor(progress.percent)} transition-all duration-300`}
                                style={{ width: `${progress.percent}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Status badges */}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
                          <Badge variant="secondary" className="text-xs">
                            <Users className="w-3 h-3 mr-1" />
                            {studentCount} students
                          </Badge>
                          <span className="text-xs text-green-600 font-medium group-hover:underline">
                            Open →
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
        
        {/* To-Do List */}
        <div className="mt-8">
          <TodoList maxItems={5} />
        </div>
      </div>

      {/* Delete Class Confirmation Dialog */}
      <AlertDialog open={deleteClassDialog.open} onOpenChange={(open) => setDeleteClassDialog({ ...deleteClassDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Delete Class
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteClassDialog.className}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={removeClass}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
