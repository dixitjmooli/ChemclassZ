'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore, useAppStore } from '@/lib/store';
import { 
  updateInstitute, 
  createUser, 
  deleteUser,
  subscribeToAllTeachers,
  subscribeToAllStudents,
  updateUserPassword
} from '@/lib/firebase-service';
import { InstituteTeacherProgress } from '@/components/app/InstituteTeacherProgress';
import { User } from '@/lib/store';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Building2,
  Users,
  GraduationCap,
  BookOpen,
  Plus,
  X,
  Copy,
  Check,
  Trash2,
  Loader2,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  KeyRound,
  Eye,
  EyeOff
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

// Class entry structure for created classes
interface ClassEntry {
  id: string;
  classNumber: number;
  stream: string | null;
  subjectName: string;
  nickname: string | null;
  name: string; // Display name like "Physics (Class 11 Science)"
  teacherId: string | null;
  teacherName?: string;
}

export function InstituteOwnerDashboard() {
  const { user } = useAuthStore();
  const { 
    institute, 
    setInstitute,
    allTeachers,
    allStudents,
    setAllTeachers,
    setAllStudents
  } = useAppStore();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'teacherProgress' | 'teachers' | 'classes' | 'students'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Confirmation dialog state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'class' | 'teacher' | null;
    id: string;
    name: string;
  }>({ type: null, id: '', name: '' });

  // Teacher form states
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [newTeacherPassword, setNewTeacherPassword] = useState('');
  
  // Password change dialog state
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<{ id: string; name: string; email: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Class creation step-based form
  const [classStep, setClassStep] = useState<1 | 2 | 3>(1);
  const [selectedClassNumber, setSelectedClassNumber] = useState<string>('');
  const [selectedStream, setSelectedStream] = useState<string>('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [classNickname, setClassNickname] = useState<string>('');
  // Teacher assignment per subject: { subjectName: teacherId }
  const [subjectTeacherAssignments, setSubjectTeacherAssignments] = useState<Record<string, string>>({});

  useEffect(() => {
    if (institute) {
      const unsubTeachers = subscribeToAllTeachers((teachers) => {
        setAllTeachers(teachers);
      }, institute.id);
      
      const unsubStudents = subscribeToAllStudents((students) => {
        setAllStudents(students);
      }, institute.id);

      return () => {
        unsubTeachers();
        unsubStudents();
      };
    }
  }, [institute]);

  const copyReferralCode = () => {
    if (institute?.referralCode) {
      navigator.clipboard.writeText(institute.referralCode);
      setCopied(true);
      toast({ title: 'Copied!', description: 'Referral code copied to clipboard' });
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
    setSubjectTeacherAssignments({});
  };

  // Add teacher (simplified - no assignments)
  const addTeacher = async () => {
    if (!institute || !newTeacherName || !newTeacherEmail || !newTeacherPassword) {
      toast({ title: 'Error', description: 'Fill all fields', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      await createUser(
        newTeacherName,
        newTeacherEmail,
        newTeacherEmail.split('@')[0],
        newTeacherPassword,
        'teacher',
        {
          instituteId: institute.id,
          assignments: [] // No assignments initially
        }
      );
      setNewTeacherName('');
      setNewTeacherEmail('');
      setNewTeacherPassword('');
      toast({ title: 'Teacher Added', description: `${newTeacherName} has been added` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const removeTeacher = async (teacherId: string, teacherName: string) => {
    setDeleteConfirm({ type: 'teacher', id: teacherId, name: teacherName });
  };

  const confirmRemoveTeacher = async () => {
    if (deleteConfirm.type !== 'teacher') return;
    
    try {
      await deleteUser(deleteConfirm.id);
      toast({ title: 'Teacher Removed', description: `${deleteConfirm.name} has been removed` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setDeleteConfirm({ type: null, id: '', name: '' });
    }
  };

  // Handle password change for teacher
  const handleOpenPasswordDialog = (teacher: { id: string; name: string; email: string }) => {
    setSelectedTeacher(teacher);
    setNewPassword('');
    setShowPasswordDialog(true);
  };

  const handleChangePassword = async () => {
    if (!selectedTeacher || !newPassword.trim()) {
      toast({ title: 'Error', description: 'Please enter a new password', variant: 'destructive' });
      return;
    }
    
    if (newPassword.length < 4) {
      toast({ title: 'Error', description: 'Password must be at least 4 characters', variant: 'destructive' });
      return;
    }
    
    setChangingPassword(true);
    try {
      await updateUserPassword(selectedTeacher.id, newPassword);
      toast({ 
        title: 'Password Updated', 
        description: `Password changed for ${selectedTeacher.name}` 
      });
      setShowPasswordDialog(false);
      setSelectedTeacher(null);
      setNewPassword('');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setChangingPassword(false);
    }
  };

  // Create classes with subjects and assign teachers
  const createClasses = async () => {
    if (!institute || selectedSubjects.length === 0) {
      toast({ title: 'Error', description: 'Select at least one subject', variant: 'destructive' });
      return;
    }

    // Check all subjects have teachers assigned
    const unassignedSubjects = selectedSubjects.filter(s => !subjectTeacherAssignments[s]);
    if (unassignedSubjects.length > 0) {
      toast({ title: 'Error', description: `Assign teachers to: ${unassignedSubjects.join(', ')}`, variant: 'destructive' });
      return;
    }

    if (allTeachers.length === 0) {
      toast({ title: 'Error', description: 'Create teachers first before assigning classes', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const classNum = parseInt(selectedClassNumber);
      const newClasses: ClassEntry[] = [];
      const newSubjects: { id: string; name: string; subjectName: string; classNumber: number; stream: string | null; classIds: string[] }[] = [];
      
      for (const subject of selectedSubjects) {
        const classId = `class_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const subjectId = `subject_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const teacherId = subjectTeacherAssignments[subject];
        const teacher = allTeachers.find(t => t.id === teacherId);
        
        // Build display name
        let displayName = classNickname || (selectedStream ? `${classNum} ${selectedStream}` : `${classNum}`);
        displayName = `${subject} (${displayName})`;
        
        newClasses.push({
          id: classId,
          classNumber: classNum,
          stream: selectedStream || null,
          subjectName: subject,
          nickname: classNickname || null,
          name: displayName,
          teacherId: teacherId,
          teacherName: teacher?.name || null
        });
        
        newSubjects.push({
          id: subjectId,
          name: displayName,
          subjectName: subject,
          classNumber: classNum,
          stream: selectedStream || null,
          classIds: [classId]
        });
        
        // Update teacher assignments in Firebase
        if (teacherId && teacher) {
          const currentAssignments = teacher.assignments || [];
          const updatedAssignments = [...currentAssignments, { classId, subjectId }];
          const { updateDoc, doc } = await import('firebase/firestore');
          const { db } = await import('@/lib/firebase');
          await updateDoc(doc(db, 'users', teacherId), {
            assignments: updatedAssignments
          });
        }
      }
      
      // Update institute with new classes and subjects
      const updatedClasses = [...(institute.classes || []), ...newClasses];
      const updatedSubjects = [...(institute.subjects || []), ...newSubjects];
      
      await updateInstitute(institute.id, { 
        classes: updatedClasses, 
        subjects: updatedSubjects 
      });
      setInstitute({ ...institute, classes: updatedClasses, subjects: updatedSubjects });
      
      toast({ 
        title: 'Classes Created', 
        description: `Created ${selectedSubjects.length} class-subject combinations` 
      });
      
      resetClassForm();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Remove a class
  const removeClass = async (classId: string, className: string) => {
    if (!institute) return;
    
    // Check if any students are in this class
    const studentsInClass = allStudents.filter(s => s.classId === classId);
    if (studentsInClass.length > 0) {
      toast({ 
        title: 'Cannot Remove', 
        description: `${studentsInClass.length} student(s) are in this class`, 
        variant: 'destructive' 
      });
      return;
    }
    
    setDeleteConfirm({ type: 'class', id: classId, name: className });
  };

  const confirmRemoveClass = async () => {
    if (!institute || deleteConfirm.type !== 'class') return;
    
    const updatedClasses = institute.classes.filter(c => c.id !== deleteConfirm.id);
    const updatedSubjects = institute.subjects.filter(s => !s.classIds.includes(deleteConfirm.id));
    
    try {
      await updateInstitute(institute.id, { classes: updatedClasses, subjects: updatedSubjects });
      setInstitute({ ...institute, classes: updatedClasses, subjects: updatedSubjects });
      toast({ title: 'Class Removed', description: `${deleteConfirm.name} has been removed` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setDeleteConfirm({ type: null, id: '', name: '' });
    }
  };

  const getClassName = (classId: string) => {
    return institute?.classes.find(c => c.id === classId)?.name || classId;
  };

  const getSubjectName = (subjectId: string) => {
    return institute?.subjects.find(s => s.id === subjectId)?.name || subjectId;
  };

  // Get unique class names for display (combine subject entries)
  const getUniqueClassGroups = () => {
    if (!institute?.classes) return [];
    
    const groups: Record<string, { 
      displayName: string; 
      classNumber: number;
      stream: string | null;
      subjects: { id: string; name: string; subjectName: string; teacherName?: string }[] 
    }> = {};
    
    institute.classes.forEach((cls: any) => {
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
        subjectName: cls.subjectName || cls.name.split(' (')[0],
        teacherName: cls.teacherName
      });
    });
    
    return Object.values(groups);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'teacherProgress', label: 'Teacher Progress', icon: TrendingUp },
    { id: 'teachers', label: 'Teachers', icon: Users },
    { id: 'classes', label: 'Classes', icon: BookOpen },
    { id: 'students', label: 'Students', icon: GraduationCap },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{institute?.name || 'Institute Dashboard'}</h1>
          <p className="text-muted-foreground">Manage your institute, teachers, and students</p>
        </div>
        
        {/* Referral Code */}
        {institute && (
          <Card className="bg-gradient-to-r from-purple-500 to-purple-700 text-white">
            <CardContent className="p-4">
              <p className="text-sm opacity-80">Student Referral Code</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold tracking-wider">{institute.referralCode}</span>
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
              <p className="text-3xl font-bold text-purple-600">{allStudents.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total Teachers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{allTeachers.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Class Groups</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{getUniqueClassGroups().length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Subject Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">{institute?.classes?.length || 0}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Teacher Progress Tab */}
      {activeTab === 'teacherProgress' && institute && (
        <InstituteTeacherProgress 
          instituteId={institute.id} 
          subjects={institute.subjects} 
        />
      )}

      {/* Teachers Tab - Create teachers FIRST */}
      {activeTab === 'teachers' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Manage Teachers
            </CardTitle>
            <p className="text-sm text-muted-foreground">Create teachers first, then assign them to classes in the Classes tab</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Teacher Form */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <h4 className="font-medium">Add New Teacher</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Input
                  placeholder="Name"
                  value={newTeacherName}
                  onChange={(e) => setNewTeacherName(e.target.value)}
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={newTeacherEmail}
                  onChange={(e) => setNewTeacherEmail(e.target.value)}
                />
                <Input
                  placeholder="Password"
                  type="password"
                  value={newTeacherPassword}
                  onChange={(e) => setNewTeacherPassword(e.target.value)}
                />
              </div>
              
              <Button onClick={addTeacher} disabled={isLoading || !newTeacherName || !newTeacherEmail || !newTeacherPassword}>
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Add Teacher
              </Button>
            </div>

            {/* Teachers List */}
            <div className="space-y-2">
              {allTeachers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No teachers added yet. Add teachers first before creating classes.
                </p>
              ) : (
                allTeachers.map((teacher) => {
                  // Get assignments from both teacher.assignments AND institute.classes
                  const assignmentsFromUser = teacher.assignments || [];
                  const assignmentsFromInstitute = (institute?.classes || [])
                    .filter((cls: any) => cls.teacherId === teacher.id)
                    .map((cls: any) => {
                      const subject = institute?.subjects.find((s: any) => s.classIds?.includes(cls.id));
                      return { classId: cls.id, subjectId: subject?.id || '' };
                    });
                  
                  // Merge and deduplicate
                  const allAssignments = [...assignmentsFromUser];
                  assignmentsFromInstitute.forEach((a: any) => {
                    if (!allAssignments.some(existing => existing.classId === a.classId && existing.subjectId === a.subjectId)) {
                      allAssignments.push(a);
                    }
                  });
                  
                  return (
                    <div key={teacher.id} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium">{teacher.name}</p>
                          <p className="text-sm text-muted-foreground">{teacher.email}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-purple-500 hover:text-purple-700 hover:bg-purple-50"
                            onClick={() => handleOpenPasswordDialog({ id: teacher.id, name: teacher.name, email: teacher.email || '' })}
                            title="Change Password"
                          >
                            <KeyRound className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => removeTeacher(teacher.id, teacher.name)}
                            title="Remove Teacher"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      {/* Show all assignments */}
                      <div className="flex flex-wrap gap-1">
                        {allAssignments.length > 0 ? (
                          allAssignments.map((a, index) => (
                            <Badge key={index} variant="outline" className="text-xs bg-purple-50">
                              {getClassName(a.classId)} - {getSubjectName(a.subjectId)}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">No classes assigned yet</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Classes Tab - Step-based class creation */}
      {activeTab === 'classes' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              Manage Classes
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Select class → Select subjects → Assign teacher
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing Classes Grouped */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">Created Classes:</h4>
              {getUniqueClassGroups().length === 0 ? (
                <p className="text-muted-foreground">No classes created yet. Use the form below to create classes.</p>
              ) : (
                getUniqueClassGroups().map((group) => (
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
                            {subj.teacherName && (
                              <p className="text-xs text-muted-foreground">Teacher: {subj.teacherName}</p>
                            )}
                          </div>
                          <X 
                            className="w-4 h-4 cursor-pointer hover:text-red-500" 
                            onClick={() => removeClass(subj.id, subj.name)} 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Step-based Class Creation */}
            <div className="border rounded-lg p-4 bg-blue-50/50">
              <h4 className="font-medium mb-4">Create New Classes</h4>
              
              {/* Step Indicators */}
              <div className="flex items-center gap-2 mb-4">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      classStep >= step ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {step}
                    </div>
                    {step < 3 && <div className={`w-12 h-1 ${classStep > step ? 'bg-purple-600' : 'bg-gray-200'}`} />}
                  </div>
                ))}
              </div>
              
              <div className="text-sm text-muted-foreground mb-4">
                Step {classStep}: {classStep === 1 ? 'Select Class & Subjects' : classStep === 2 ? 'Optional Nickname' : 'Assign Teacher'}
              </div>
              
              {/* Step 1: Select Class and Subjects */}
              {classStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Class Dropdown */}
                    <div className="space-y-2">
                      <Label>Select Class *</Label>
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
                      <Label>Stream {parseInt(selectedClassNumber) >= 11 ? '*' : ''}</Label>
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
                      <Label>Select Subjects * (click to toggle selection)</Label>
                      <div className="flex flex-wrap gap-2">
                        {getAvailableSubjects().map((subject) => (
                          <Badge
                            key={subject}
                            variant={selectedSubjects.includes(subject) ? "default" : "outline"}
                            className={`cursor-pointer px-4 py-2 text-sm transition-all ${
                              selectedSubjects.includes(subject) 
                                ? 'bg-purple-600 hover:bg-purple-700' 
                                : 'hover:bg-purple-100'
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
                  >
                    Next: Add Nickname
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
              
              {/* Step 2: Optional Nickname */}
              {classStep === 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Class Nickname (Optional)</Label>
                    <Input
                      placeholder="e.g., Section A, Batch 2024"
                      value={classNickname}
                      onChange={(e) => setClassNickname(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Preview: {classNickname || (selectedStream ? `Class ${selectedClassNumber} ${selectedStream}` : `Class ${selectedClassNumber}`)}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setClassStep(1)}>
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button onClick={() => setClassStep(3)}>
                      Next: Assign Teacher
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Step 3: Assign Teacher to EACH Subject */}
              {classStep === 3 && (
                <div className="space-y-4">
                  {allTeachers.length === 0 ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-amber-800 font-medium">No teachers available</p>
                      <p className="text-sm text-amber-600 mb-3">Create teachers first in the Teachers tab before assigning them to classes.</p>
                      <Button variant="outline" onClick={() => setActiveTab('teachers')}>
                        Go to Teachers Tab
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Label className="text-red-600">Assign Teacher to Each Subject (Required)</Label>
                      {selectedSubjects.map((subject) => (
                        <div key={subject} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                          <div className="flex-1">
                            <p className="font-medium">{subject}</p>
                            <p className="text-xs text-muted-foreground">
                              {selectedStream ? `Class ${selectedClassNumber} ${selectedStream}` : `Class ${selectedClassNumber}`}
                              {classNickname && ` (${classNickname})`}
                            </p>
                          </div>
                          <Select 
                            value={subjectTeacherAssignments[subject] || ''} 
                            onValueChange={(teacherId) => {
                              setSubjectTeacherAssignments({
                                ...subjectTeacherAssignments,
                                [subject]: teacherId
                              });
                            }}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Select teacher *" />
                            </SelectTrigger>
                            <SelectContent>
                              {allTeachers.map((teacher) => (
                                <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Summary */}
                  <div className="bg-white p-4 rounded-lg border">
                    <h5 className="font-medium mb-2">Summary:</h5>
                    <p className="text-sm">Class: <strong>{selectedStream ? `Class ${selectedClassNumber} ${selectedStream}` : `Class ${selectedClassNumber}`}</strong></p>
                    <p className="text-sm">Nickname: <strong>{classNickname || 'None'}</strong></p>
                    <div className="text-sm mt-2">
                      <p className="font-medium">Subject-Teacher Assignments:</p>
                      <ul className="mt-1 space-y-1">
                        {selectedSubjects.map((subject) => {
                          const teacherId = subjectTeacherAssignments[subject];
                          const teacher = teacherId ? allTeachers.find(t => t.id === teacherId) : null;
                          return (
                            <li key={subject} className="flex items-center gap-2">
                              <span>{subject}:</span>
                              {teacher ? (
                                <Badge variant="secondary" className="bg-green-100 text-green-800">{teacher.name}</Badge>
                              ) : (
                                <Badge variant="destructive" className="text-xs">No teacher assigned</Badge>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      This will create {selectedSubjects.length} class-subject combinations
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setClassStep(2)}>
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button 
                      onClick={createClasses} 
                      disabled={isLoading || selectedSubjects.some(s => !subjectTeacherAssignments[s])}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                      Create {selectedSubjects.length} Classes
                    </Button>
                  </div>
                </div>
              )}
            </div>
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
              <p className="text-center text-muted-foreground py-8">
                No students registered yet. Share your referral code: <strong>{institute?.referralCode}</strong>
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Name</th>
                      <th className="text-left py-2 px-4">Username</th>
                      <th className="text-left py-2 px-4">Class</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allStudents.map((student) => (
                      <tr key={student.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-4">{student.name}</td>
                        <td className="py-2 px-4">{student.username}</td>
                        <td className="py-2 px-4">
                          <Badge variant="outline">{getClassName(student.classId || '')}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirm.type !== null} onOpenChange={(open) => !open && setDeleteConfirm({ type: null, id: '', name: '' })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <AlertDialogTitle>
                Remove {deleteConfirm.type === 'class' ? 'Class' : 'Teacher'}?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pl-13">
              Are you sure you want to remove <strong>{deleteConfirm.name}</strong>? 
              {deleteConfirm.type === 'teacher' && ' This action cannot be undone.'}
              {deleteConfirm.type === 'class' && ' Teachers assigned to this class will lose access.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deleteConfirm.type === 'class') {
                  confirmRemoveClass();
                } else if (deleteConfirm.type === 'teacher') {
                  confirmRemoveTeacher();
                }
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Password Change Dialog for Teachers */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-purple-600" />
              Change Teacher Password
            </DialogTitle>
            <DialogDescription>
              Change password for <strong>{selectedTeacher?.name}</strong> ({selectedTeacher?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password-inst">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password-inst"
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
