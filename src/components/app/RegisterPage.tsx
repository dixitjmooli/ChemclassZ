'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { createUser, createInstituteWithClasses, getInstituteByReferralCode, updateUserInstitute, createIndependentTeacherWithClasses, getIndependentTeacherByReferralCode, checkUsernameAvailability, validateUsername } from '@/lib/firebase-service';
import { useAuthStore } from '@/lib/store';
import { 
  FlaskConical, 
  ArrowLeft, 
  Building2, 
  GraduationCap, 
  Loader2, 
  Plus, 
  X,
  Users,
  BookOpen,
  Check,
  User,
  ArrowRight,
  ChevronLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trash2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

// Helper function to send credentials email via API
async function sendCredentialsEmail(params: {
  to: string;
  userName: string;
  email: string;
  username: string;
  password: string;
  role: 'student' | 'teacher' | 'independent_teacher' | 'institute_owner';
  instituteName?: string;
  referralCode?: string;
  teacherReferralCode?: string;
  studentReferralCode?: string;
}): Promise<boolean> {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

// Class entry structure
interface ClassEntry {
  classNumber: number;
  stream: string | null;
  subjectName: string;
  nickname: string | null;
  teacherId: string | null;
}

interface RegisterPageProps {
  onBack: () => void;
}

export function RegisterPage({ onBack }: RegisterPageProps) {
  const [userType, setUserType] = useState<'institute_owner' | 'student' | 'independent_teacher' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const { toast } = useToast();

  // Institute Owner Form State
  const [instituteName, setInstituteName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  
  // Teachers state (created first, no assignments during registration)
  const [teachers, setTeachers] = useState<{ name: string; email: string; password: string }[]>([]);
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [newTeacherPassword, setNewTeacherPassword] = useState('');
  const [teacherUsernameStatus, setTeacherUsernameStatus] = useState<'checking' | 'available' | 'taken' | null>(null);
  
  // Class creation state (step-based)
  const [classStep, setClassStep] = useState<1 | 2 | 3>(1);
  const [selectedClassNumber, setSelectedClassNumber] = useState<string>('');
  const [selectedStream, setSelectedStream] = useState<string>('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [classNickname, setClassNickname] = useState<string>('');
  // Teacher assignment per subject: { subjectName: teacherEmail }
  const [subjectTeacherAssignments, setSubjectTeacherAssignments] = useState<Record<string, string>>({});
  const [createdClasses, setCreatedClasses] = useState<ClassEntry[]>([]);

  // Student Form State
  const [studentName, setStudentName] = useState('');
  const [studentUsername, setStudentUsername] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [selectedClassGroup, setSelectedClassGroup] = useState<string>(''); // Changed: now stores class group key
  const [instituteInfo, setInstituteInfo] = useState<{ 
    id: string; 
    name: string; 
    classes: { id: string; name: string; classNumber?: number; stream?: string; nickname?: string; subjectName?: string; teacherId?: string | null }[]; 
    subjects: { id: string; name: string; classIds: string[] }[];
    isIndependentTeacher?: boolean;
    teacherName?: string;
  } | null>(null);
  const [verifyingCode, setVerifyingCode] = useState(false);

  // Independent Teacher Form State
  const [indTeacherName, setIndTeacherName] = useState('');
  const [indTeacherEmail, setIndTeacherEmail] = useState('');
  const [indTeacherPassword, setIndTeacherPassword] = useState('');
  const [indClassStep, setIndClassStep] = useState<1 | 2>(1);
  const [indSelectedClassNumber, setIndSelectedClassNumber] = useState<string>('');
  const [indSelectedStream, setIndSelectedStream] = useState<string>('');
  const [indSelectedSubjects, setIndSelectedSubjects] = useState<string[]>([]);
  const [indClassNickname, setIndClassNickname] = useState<string>('');
  const [indCreatedClasses, setIndCreatedClasses] = useState<ClassEntry[]>([]);

  // Get available subjects based on selected class and stream
  const getAvailableSubjects = (classNum: string, stream: string) => {
    if (!classNum) return [];
    const num = parseInt(classNum);
    
    if ((num === 11 || num === 12) && stream) {
      return SUBJECTS_BY_STREAM[stream] || [];
    }
    
    return SUBJECTS_BY_CLASS[num] || [];
  };

  // Toggle subject selection for institute
  const toggleSubject = (subject: string) => {
    if (selectedSubjects.includes(subject)) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== subject));
    } else {
      setSelectedSubjects([...selectedSubjects, subject]);
    }
  };

  // Toggle subject selection for independent teacher
  const toggleIndSubject = (subject: string) => {
    if (indSelectedSubjects.includes(subject)) {
      setIndSelectedSubjects(indSelectedSubjects.filter(s => s !== subject));
    } else {
      setIndSelectedSubjects([...indSelectedSubjects, subject]);
    }
  };

  // Check teacher email availability with debounce
  useEffect(() => {
    if (!newTeacherEmail || !newTeacherEmail.includes('@')) {
      setTeacherUsernameStatus(null);
      return;
    }

    const checkEmail = async () => {
      setTeacherUsernameStatus('checking');
      const username = newTeacherEmail.split('@')[0].toLowerCase();
      const isAvailable = await checkUsernameAvailability(username);
      setTeacherUsernameStatus(isAvailable ? 'available' : 'taken');
    };

    const timer = setTimeout(checkEmail, 500);
    return () => clearTimeout(timer);
  }, [newTeacherEmail]);

  // Add teacher (simplified - no assignments)
  const addTeacher = () => {
    if (!newTeacherName || !newTeacherEmail || !newTeacherPassword) {
      toast({ title: 'Error', description: 'Fill all teacher fields', variant: 'destructive' });
      return;
    }
    
    // Check if email is already used by another teacher in the list
    if (teachers.some(t => t.email.toLowerCase() === newTeacherEmail.toLowerCase())) {
      toast({ title: 'Error', description: 'Teacher with this email already added', variant: 'destructive' });
      return;
    }
    
    // Check if username is available
    if (teacherUsernameStatus === 'taken') {
      toast({ title: 'Error', description: 'Username from this email is already taken. Use a different email.', variant: 'destructive' });
      return;
    }
    
    const teacherName = newTeacherName; // Store before clearing
    setTeachers([...teachers, { name: newTeacherName, email: newTeacherEmail, password: newTeacherPassword }]);
    setNewTeacherName('');
    setNewTeacherEmail('');
    setNewTeacherPassword('');
    setTeacherUsernameStatus(null);
    toast({ title: 'Teacher Added', description: `${teacherName} has been added to the list` });
  };

  const removeTeacher = (index: number) => {
    const teacherToRemove = teachers[index];
    setTeachers(teachers.filter((_, i) => i !== index));
    toast({ title: 'Teacher Removed', description: `${teacherToRemove.name} has been removed` });
  };

  // Add class entry for institute
  const addClassEntry = () => {
    if (selectedSubjects.length === 0) {
      toast({ title: 'Error', description: 'Select at least one subject', variant: 'destructive' });
      return;
    }
    
    // Check all subjects have teachers assigned
    const unassignedSubjects = selectedSubjects.filter(s => !subjectTeacherAssignments[s]);
    if (unassignedSubjects.length > 0) {
      toast({ title: 'Error', description: `Assign teachers to: ${unassignedSubjects.join(', ')}`, variant: 'destructive' });
      return;
    }
    
    const newEntries: ClassEntry[] = [];
    for (const subject of selectedSubjects) {
      newEntries.push({
        classNumber: parseInt(selectedClassNumber),
        stream: selectedStream || null,
        subjectName: subject,
        nickname: classNickname || null,
        teacherId: subjectTeacherAssignments[subject] // Store teacher email
      });
    }
    
    setCreatedClasses([...createdClasses, ...newEntries]);
    
    // Reset form
    setSelectedClassNumber('');
    setSelectedStream('');
    setSelectedSubjects([]);
    setClassNickname('');
    setSubjectTeacherAssignments({});
    setClassStep(1);
    
    toast({ title: 'Added', description: `Added ${selectedSubjects.length} class-subject combination(s)` });
  };

  // Add class entry for independent teacher
  const addIndClassEntry = () => {
    if (indSelectedSubjects.length === 0) {
      toast({ title: 'Error', description: 'Select at least one subject', variant: 'destructive' });
      return;
    }
    
    for (const subject of indSelectedSubjects) {
      setIndCreatedClasses([...indCreatedClasses, {
        classNumber: parseInt(indSelectedClassNumber),
        stream: indSelectedStream || null,
        subjectName: subject,
        nickname: indClassNickname || null,
        teacherId: null // Self-assigned
      }]);
    }
    
    // Reset form
    setIndSelectedClassNumber('');
    setIndSelectedStream('');
    setIndSelectedSubjects([]);
    setIndClassNickname('');
    setIndClassStep(1);
    
    toast({ title: 'Added', description: `Added ${indSelectedSubjects.length} class-subject combination(s)` });
  };

  const verifyReferralCode = async () => {
    if (!referralCode) return;
    
    setVerifyingCode(true);
    try {
      const institute = await getInstituteByReferralCode(referralCode);
      if (institute) {
        setInstituteInfo({
          id: institute.id,
          name: institute.name,
          classes: institute.classes as { id: string; name: string; classNumber?: number; stream?: string; nickname?: string; subjectName?: string }[],
          subjects: institute.subjects as { id: string; name: string; classIds: string[] }[],
          isIndependentTeacher: false
        });
        toast({ title: 'Institute Found!', description: `Connected to ${institute.name}` });
      } else {
        const teacher = await getIndependentTeacherByReferralCode(referralCode);
        if (teacher) {
          setInstituteInfo({
            id: teacher.id,
            name: `${teacher.name}'s Class`,
            classes: (teacher.classes || []) as { id: string; name: string; classNumber?: number; stream?: string; nickname?: string; subjectName?: string }[],
            subjects: (teacher.subjects || []) as { id: string; name: string; classIds: string[] }[],
            isIndependentTeacher: true
          });
          toast({ title: 'Teacher Found!', description: `Connected to ${teacher.name}` });
        } else {
          toast({ title: 'Invalid Code', description: 'No institute or teacher found with this referral code', variant: 'destructive' });
        }
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to verify referral code', variant: 'destructive' });
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleInstituteOwnerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createdClasses.length === 0) {
      toast({ title: 'Error', description: 'Add at least one class-subject combination', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      // Create institute owner
      const owner = await createUser(
        ownerName,
        ownerEmail,
        ownerEmail.split('@')[0],
        ownerPassword,
        'institute_owner'
      );

      // Create institute with new class structure
      const institute = await createInstituteWithClasses(instituteName, owner.id, createdClasses, teachers);

      // Update owner with institute ID
      await updateUserInstitute(owner.id, institute.id);

      login({ ...owner, instituteId: institute.id });
      
      // Send email to institute owner
      if (ownerEmail) {
        await sendCredentialsEmail({
          to: ownerEmail,
          userName: ownerName,
          email: ownerEmail,
          username: ownerEmail.split('@')[0],
          password: ownerPassword,
          role: 'institute_owner',
          instituteName: instituteName,
          studentReferralCode: institute.referralCode,
        });
      }
      
      // Send emails to teachers
      for (const teacher of teachers) {
        if (teacher.email) {
          await sendCredentialsEmail({
            to: teacher.email,
            userName: teacher.name,
            email: teacher.email,
            username: teacher.email.split('@')[0],
            password: teacher.password,
            role: 'teacher',
            instituteName: instituteName,
          });
        }
      }
      
      toast({
        title: 'Registration Successful!',
        description: `Your institute "${instituteName}" has been created! Referral Code: ${institute.referralCode}`,
      });
      
    } catch (error: any) {
      toast({ title: 'Registration Failed', description: error.message || 'Something went wrong', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudentRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instituteInfo) {
      toast({ title: 'Error', description: 'Please verify referral code first', variant: 'destructive' });
      return;
    }
    if (!selectedClassGroup) {
      toast({ title: 'Error', description: 'Please select a class', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      const isIndependentTeacher = instituteInfo.isIndependentTeacher === true;

      // Parse the class group key (format: "classNumber|stream|nickname")
      const [classNumStr, stream, nickname] = selectedClassGroup.split('|');
      const classNumber = parseInt(classNumStr);

      // Find all classes that match this group
      const groupClasses = instituteInfo.classes.filter(cls => {
        const clsClassNumber = cls.classNumber || parseInt(cls.name.match(/\d+/)?.[0] || '0');
        const clsStream = cls.stream || null;
        const clsNickname = cls.nickname || null;

        return clsClassNumber === classNumber &&
               (clsStream || '') === (stream || '') &&
               (clsNickname || '') === (nickname || '');
      });

      // Get all class IDs for this group
      const groupClassIds = groupClasses.map(c => c.id);

      // Get all subjects for these classes from the institute/teacher data
      const groupSubjects = instituteInfo.subjects.filter(s =>
        s.classIds.some((cid: string) => groupClassIds.includes(cid))
      );

      // Create enrollments for ALL subjects in the selected class group
      const enrollments = groupSubjects.map((subject, index) => {
        const classId = subject.classIds.find((cid: string) => groupClassIds.includes(cid)) || groupClassIds[0];
        const matchedClass = groupClasses.find(c => subject.classIds.includes(c.id));

        // Get the teacher name - for institutes, get from class's teacherId field
        let subjectTeacherName = instituteInfo.name;
        if (!isIndependentTeacher && matchedClass?.teacherId) {
          // teacherId could be email or name - use it directly if it looks like a name
          const teacherIdValue = matchedClass.teacherId;
          if (teacherIdValue && !teacherIdValue.includes('@')) {
            subjectTeacherName = teacherIdValue;
          } else if (teacherIdValue) {
            // It's an email, extract name part
            subjectTeacherName = teacherIdValue.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          }
        }

        return {
          id: `enrollment_${Date.now()}_${index}`,
          teacherId: isIndependentTeacher ? instituteInfo.id : undefined,
          instituteId: isIndependentTeacher ? undefined : instituteInfo.id,
          classId: classId,
          subjectId: subject.id,
          teacherName: subjectTeacherName,
          instituteName: isIndependentTeacher ? undefined : instituteInfo.name,
          subjectName: subject.name,
          className: matchedClass?.name || `Class ${classNumber}`
        };
      });

      const student = await createUser(
        studentName,
        '',
        studentUsername,
        studentPassword,
        'student',
        {
          instituteId: isIndependentTeacher ? undefined : instituteInfo.id,
          independentTeacherId: isIndependentTeacher ? instituteInfo.id : undefined,
          classId: groupClassIds[0], // Primary class ID
          enrollments // Auto-enroll in all subjects for this class group
        }
      );

      login(student);
      
      toast({ 
        title: 'Registration Successful!', 
        description: `Welcome to ${instituteInfo.name}! You have been enrolled in ${enrollments.length} subject(s).` 
      });
      
    } catch (error: any) {
      toast({ title: 'Registration Failed', description: error.message || 'Something went wrong', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleIndependentTeacherRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (indCreatedClasses.length === 0) {
      toast({ title: 'Error', description: 'Add at least one class-subject combination', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      const teacher = await createIndependentTeacherWithClasses(
        indTeacherName,
        indTeacherEmail,
        indTeacherEmail.split('@')[0],
        indTeacherPassword,
        indCreatedClasses
      );

      if (indTeacherEmail) {
        await sendCredentialsEmail({
          to: indTeacherEmail,
          userName: indTeacherName,
          email: indTeacherEmail,
          username: indTeacherEmail.split('@')[0],
          password: indTeacherPassword,
          role: 'independent_teacher',
          referralCode: teacher.referralCode,
        });
      }

      login(teacher);
      
      toast({ title: 'Registration Successful!', description: `Your referral code is: ${teacher.referralCode}` });
      
    } catch (error: any) {
      toast({ title: 'Registration Failed', description: error.message || 'Something went wrong', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl">
        <Card className="border-0 shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.1 }}
              className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center"
            >
              <FlaskConical className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <CardTitle className="text-2xl bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                Create Account
              </CardTitle>
              <CardDescription>Join ChemClass Pro</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {/* User Type Selection */}
            {!userType && (
              <div className="space-y-4">
                <p className="text-center text-muted-foreground mb-4">I am a:</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-32 flex-col gap-2 border-2 hover:border-purple-500 hover:bg-purple-50" onClick={() => setUserType('institute_owner')}>
                    <Building2 className="w-8 h-8 text-purple-600" />
                    <span className="font-semibold">Institute Owner</span>
                    <span className="text-xs text-muted-foreground">Create & manage institute</span>
                  </Button>
                  <Button variant="outline" className="h-32 flex-col gap-2 border-2 hover:border-green-500 hover:bg-green-50" onClick={() => setUserType('independent_teacher')}>
                    <User className="w-8 h-8 text-green-600" />
                    <span className="font-semibold">Independent Teacher</span>
                    <span className="text-xs text-muted-foreground">Manage your students</span>
                  </Button>
                  <Button variant="outline" className="h-32 flex-col gap-2 border-2 hover:border-purple-500 hover:bg-purple-50" onClick={() => setUserType('student')}>
                    <GraduationCap className="w-8 h-8 text-purple-600" />
                    <span className="font-semibold">Student</span>
                    <span className="text-xs text-muted-foreground">Join with referral code</span>
                  </Button>
                </div>
                <Button variant="ghost" onClick={onBack} className="w-full mt-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />Back to Login
                </Button>
              </div>
            )}

            {/* Institute Owner Registration Form */}
            {userType === 'institute_owner' && (
              <form onSubmit={handleInstituteOwnerRegister} className="space-y-4">
                <Button type="button" variant="ghost" onClick={() => setUserType(null)} className="mb-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />Back
                </Button>

                {/* Step 1: Institute Details */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-purple-600" />
                    Institute Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Institute Name <span className="text-red-500">*</span></Label>
                      <Input placeholder="e.g., ABC Coaching" value={instituteName} onChange={(e) => setInstituteName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Your Name <span className="text-red-500">*</span></Label>
                      <Input placeholder="Owner name" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Email <span className="text-red-500">*</span></Label>
                      <Input type="email" placeholder="owner@email.com" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Password <span className="text-red-500">*</span></Label>
                      <Input type="password" placeholder="Create password" value={ownerPassword} onChange={(e) => setOwnerPassword(e.target.value)} required />
                    </div>
                  </div>
                </div>

                {/* Step 2: Teachers (Create First) */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Teachers (Add teachers first, then assign to classes)
                  </Label>
                  
                  {teachers.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {teachers.map((teacher, index) => (
                        <Badge key={index} variant="secondary" className="px-3 py-1.5 flex items-center gap-2">
                          <span>{teacher.name} ({teacher.email})</span>
                          <button 
                            type="button"
                            className="ml-1 w-5 h-5 flex items-center justify-center hover:bg-red-500 hover:text-white rounded-full transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              removeTeacher(index);
                            }}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <div className="border rounded-lg p-3 bg-blue-50/50">
                    <div className="grid grid-cols-3 gap-2">
                      <Input placeholder="Name" value={newTeacherName} onChange={(e) => setNewTeacherName(e.target.value)} className="text-sm" />
                      <div className="relative">
                        <Input 
                          placeholder="Email" 
                          type="email" 
                          value={newTeacherEmail} 
                          onChange={(e) => setNewTeacherEmail(e.target.value)} 
                          className={`text-sm pr-8 ${
                            teacherUsernameStatus === 'taken' ? 'border-red-500 focus:border-red-500' : 
                            teacherUsernameStatus === 'available' ? 'border-green-500 focus:border-green-500' : ''
                          }`}
                        />
                        {teacherUsernameStatus === 'checking' && (
                          <Loader2 className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />
                        )}
                        {teacherUsernameStatus === 'available' && (
                          <CheckCircle className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-green-500" />
                        )}
                        {teacherUsernameStatus === 'taken' && (
                          <XCircle className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-red-500" />
                        )}
                      </div>
                      <Input placeholder="Password" type="password" value={newTeacherPassword} onChange={(e) => setNewTeacherPassword(e.target.value)} className="text-sm" />
                    </div>
                    {teacherUsernameStatus === 'taken' && (
                      <p className="text-xs text-red-500 mt-1">Username already taken. Use a different email.</p>
                    )}
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={addTeacher} 
                      className="mt-2 w-full"
                      disabled={teacherUsernameStatus === 'taken' || teacherUsernameStatus === 'checking'}
                    >
                      <Plus className="w-4 h-4 mr-2" />Add Teacher
                    </Button>
                  </div>
                </div>

                {/* Step 3: Classes with Subjects */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Classes (Select class → subjects → assign teacher)
                  </Label>
                  
                  {/* Created Classes List */}
                  {createdClasses.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {createdClasses.map((cls, index) => {
                        const displayName = cls.nickname || (cls.stream ? `${cls.classNumber} ${cls.stream}` : `${cls.classNumber}`);
                        const teacherName = cls.teacherId ? teachers.find(t => t.email === cls.teacherId || t.name === cls.teacherId)?.name : null;
                        return (
                          <Badge key={index} variant="outline" className="px-3 py-1 bg-purple-50 flex items-center gap-2">
                            <span>{cls.subjectName} ({displayName}){teacherName && ` - ${teacherName}`}</span>
                            <button 
                              type="button"
                              className="hover:bg-red-100 rounded p-0.5 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCreatedClasses(createdClasses.filter((_, i) => i !== index));
                              }}
                            >
                              <X className="w-3 h-3 hover:text-red-500" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Step-based Class Creation */}
                  <div className="border rounded-lg p-3 bg-gray-50">
                    {/* Step Indicators */}
                    <div className="flex items-center gap-2 mb-3">
                      {[1, 2, 3].map((step) => (
                        <div key={step} className="flex items-center">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${classStep >= step ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                            {step}
                          </div>
                          {step < 3 && <div className={`w-8 h-0.5 ${classStep > step ? 'bg-purple-600' : 'bg-gray-200'}`} />}
                        </div>
                      ))}
                    </div>
                    
                    {/* Step 1: Select Class & Subjects */}
                    {classStep === 1 && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <Select value={selectedClassNumber} onValueChange={(v) => { setSelectedClassNumber(v); setSelectedStream(''); setSelectedSubjects([]); }}>
                            <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                            <SelectContent>
                              {CBSE_CLASSES.map((c) => (<SelectItem key={c} value={c.toString()}>Class {c}</SelectItem>))}
                            </SelectContent>
                          </Select>
                          <Select value={selectedStream} onValueChange={(v) => { setSelectedStream(v); setSelectedSubjects([]); }} disabled={!selectedClassNumber || parseInt(selectedClassNumber) < 11}>
                            <SelectTrigger><SelectValue placeholder={parseInt(selectedClassNumber) >= 11 ? "Stream" : "N/A"} /></SelectTrigger>
                            <SelectContent>
                              {STREAMS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {getAvailableSubjects(selectedClassNumber, selectedStream).length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">Select subjects:</p>
                            <div className="flex flex-wrap gap-1">
                              {getAvailableSubjects(selectedClassNumber, selectedStream).map((subject) => (
                                <Badge key={subject} variant={selectedSubjects.includes(subject) ? "default" : "outline"} className={`cursor-pointer ${selectedSubjects.includes(subject) ? 'bg-purple-600' : ''}`} onClick={() => toggleSubject(subject)}>
                                  {subject}{selectedSubjects.includes(subject) && <Check className="w-3 h-3 ml-1" />}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <Button type="button" size="sm" onClick={() => setClassStep(2)} disabled={!selectedClassNumber || selectedSubjects.length === 0 || (parseInt(selectedClassNumber) >= 11 && !selectedStream)}>
                          Next <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    )}
                    
                    {/* Step 2: Nickname */}
                    {classStep === 2 && (
                      <div className="space-y-3">
                        <Input placeholder="Optional nickname (e.g., Section A)" value={classNickname} onChange={(e) => setClassNickname(e.target.value)} />
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => setClassStep(1)}><ChevronLeft className="w-3 h-3 mr-1" />Back</Button>
                          <Button type="button" size="sm" onClick={() => setClassStep(3)}>Next <ArrowRight className="w-3 h-3 ml-1" /></Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Step 3: Assign Teacher to EACH Subject */}
                    {classStep === 3 && (
                      <div className="space-y-3">
                        {teachers.length === 0 ? (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <p className="text-amber-800 font-medium text-sm">No teachers added. Add teachers above first.</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-red-600">Assign Teacher to Each Subject (Required)</p>
                            {selectedSubjects.map((subject) => (
                              <div key={subject} className="flex items-center gap-2 p-2 bg-white rounded border">
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{subject}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {selectedStream ? `Class ${selectedClassNumber} ${selectedStream}` : `Class ${selectedClassNumber}`}
                                    {classNickname && ` (${classNickname})`}
                                  </p>
                                </div>
                                <Select 
                                  value={subjectTeacherAssignments[subject] || ''} 
                                  onValueChange={(teacherEmail) => {
                                    setSubjectTeacherAssignments({
                                      ...subjectTeacherAssignments,
                                      [subject]: teacherEmail
                                    });
                                  }}
                                >
                                  <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Select teacher *" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {teachers.map((t, i) => (<SelectItem key={i} value={t.email}>{t.name}</SelectItem>))}
                                  </SelectContent>
                                </Select>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => setClassStep(2)}><ChevronLeft className="w-3 h-3 mr-1" />Back</Button>
                          <Button 
                            type="button" 
                            size="sm" 
                            onClick={addClassEntry} 
                            className="bg-purple-600 hover:bg-purple-700"
                            disabled={teachers.length === 0 || selectedSubjects.some(s => !subjectTeacherAssignments[s])}
                          >
                            <Plus className="w-3 h-3 mr-1" />Add {selectedSubjects.length} Classes
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={isLoading || createdClasses.length === 0}>
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Building2 className="w-4 h-4 mr-2" />}
                  Create Institute ({createdClasses.length} classes)
                </Button>
              </form>
            )}

            {/* Independent Teacher Registration Form */}
            {userType === 'independent_teacher' && (
              <form onSubmit={handleIndependentTeacherRegister} className="space-y-4">
                <Button type="button" variant="ghost" onClick={() => setUserType(null)} className="mb-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />Back
                </Button>

                <div className="space-y-2">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <User className="w-5 h-5 text-green-600" />
                    Independent Teacher Registration
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Your Name <span className="text-red-500">*</span></Label>
                      <Input placeholder="Your full name" value={indTeacherName} onChange={(e) => setIndTeacherName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Email <span className="text-red-500">*</span></Label>
                      <Input type="email" placeholder="your@email.com" value={indTeacherEmail} onChange={(e) => setIndTeacherEmail(e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Password <span className="text-red-500">*</span></Label>
                    <Input type="password" placeholder="Create password" value={indTeacherPassword} onChange={(e) => setIndTeacherPassword(e.target.value)} required />
                  </div>
                </div>

                {/* Classes with Subjects */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Classes (You will be auto-assigned as teacher)
                  </Label>
                  
                  {/* Created Classes List */}
                  {indCreatedClasses.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {indCreatedClasses.map((cls, index) => {
                        const displayName = cls.nickname || (cls.stream ? `${cls.classNumber} ${cls.stream}` : `${cls.classNumber}`);
                        return (
                          <Badge key={index} variant="outline" className="px-3 py-1 bg-green-50">
                            {cls.subjectName} ({displayName})
                            <X className="w-3 h-3 ml-2 cursor-pointer hover:text-red-500" onClick={() => setIndCreatedClasses(indCreatedClasses.filter((_, i) => i !== index))} />
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Step-based Class Creation */}
                  <div className="border rounded-lg p-3 bg-green-50/50">
                    <div className="flex items-center gap-2 mb-3">
                      {[1, 2].map((step) => (
                        <div key={step} className="flex items-center">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${indClassStep >= step ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                            {step}
                          </div>
                          {step < 2 && <div className={`w-8 h-0.5 ${indClassStep > step ? 'bg-green-600' : 'bg-gray-200'}`} />}
                        </div>
                      ))}
                    </div>
                    
                    {indClassStep === 1 && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <Select value={indSelectedClassNumber} onValueChange={(v) => { setIndSelectedClassNumber(v); setIndSelectedStream(''); setIndSelectedSubjects([]); }}>
                            <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                            <SelectContent>
                              {CBSE_CLASSES.map((c) => (<SelectItem key={c} value={c.toString()}>Class {c}</SelectItem>))}
                            </SelectContent>
                          </Select>
                          <Select value={indSelectedStream} onValueChange={(v) => { setIndSelectedStream(v); setIndSelectedSubjects([]); }} disabled={!indSelectedClassNumber || parseInt(indSelectedClassNumber) < 11}>
                            <SelectTrigger><SelectValue placeholder={parseInt(indSelectedClassNumber) >= 11 ? "Stream" : "N/A"} /></SelectTrigger>
                            <SelectContent>
                              {STREAMS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {getAvailableSubjects(indSelectedClassNumber, indSelectedStream).length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">Select subjects:</p>
                            <div className="flex flex-wrap gap-1">
                              {getAvailableSubjects(indSelectedClassNumber, indSelectedStream).map((subject) => (
                                <Badge key={subject} variant={indSelectedSubjects.includes(subject) ? "default" : "outline"} className={`cursor-pointer ${indSelectedSubjects.includes(subject) ? 'bg-green-600' : ''}`} onClick={() => toggleIndSubject(subject)}>
                                  {subject}{indSelectedSubjects.includes(subject) && <Check className="w-3 h-3 ml-1" />}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <Button type="button" size="sm" onClick={() => setIndClassStep(2)} disabled={!indSelectedClassNumber || indSelectedSubjects.length === 0 || (parseInt(indSelectedClassNumber) >= 11 && !indSelectedStream)} className="bg-green-600 hover:bg-green-700">
                          Next <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    )}
                    
                    {indClassStep === 2 && (
                      <div className="space-y-3">
                        <Input placeholder="Optional nickname (e.g., Section A)" value={indClassNickname} onChange={(e) => setIndClassNickname(e.target.value)} />
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => setIndClassStep(1)}><ChevronLeft className="w-3 h-3 mr-1" />Back</Button>
                          <Button type="button" size="sm" onClick={addIndClassEntry} className="bg-green-600 hover:bg-green-700">
                            <Plus className="w-3 h-3 mr-1" />Add {indSelectedSubjects.length} Classes
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading || indCreatedClasses.length === 0}>
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <User className="w-4 h-4 mr-2" />}
                  Create Account ({indCreatedClasses.length} classes)
                </Button>
              </form>
            )}

            {/* Student Registration Form */}
            {userType === 'student' && (
              <form onSubmit={handleStudentRegister} className="space-y-4">
                <Button type="button" variant="ghost" onClick={() => setUserType(null)} className="mb-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />Back
                </Button>

                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Student Registration</h3>
                  
                  <div className="space-y-2">
                    <Label>Referral Code <span className="text-red-500">*</span></Label>
                    <div className="flex gap-2">
                      <Input placeholder="Enter code from your teacher" value={referralCode} onChange={(e) => setReferralCode(e.target.value.toUpperCase())} />
                      <Button type="button" variant="outline" onClick={verifyReferralCode} disabled={verifyingCode}>
                        {verifyingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                      </Button>
                    </div>
                  </div>
                  
                  {instituteInfo && (
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="font-medium text-green-800">{instituteInfo.name}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Your Name <span className="text-red-500">*</span></Label>
                      <Input placeholder="Full name" value={studentName} onChange={(e) => setStudentName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Username <span className="text-red-500">*</span></Label>
                      <Input placeholder="Choose username" value={studentUsername} onChange={(e) => setStudentUsername(e.target.value.toLowerCase())} required />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Password <span className="text-red-500">*</span></Label>
                    <Input type="password" placeholder="Create password" value={studentPassword} onChange={(e) => setStudentPassword(e.target.value)} required />
                  </div>
                  
                  {instituteInfo && instituteInfo.classes.length > 0 && (
                    <div className="space-y-2">
                      <Label>Select Class <span className="text-red-500">*</span></Label>
                      <p className="text-xs text-muted-foreground">You will be enrolled in ALL subjects for the selected class</p>
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          // Group classes by classNumber + stream + nickname
                          const groups: Record<string, { 
                            key: string; 
                            displayName: string; 
                            classNumber: number;
                            stream: string | null;
                            nickname: string | null;
                            subjectCount: number;
                          }> = {};
                          
                          instituteInfo.classes.forEach((cls) => {
                            const classNumber = cls.classNumber || parseInt(cls.name.match(/\d+/)?.[0] || '0');
                            const stream = cls.stream || null;
                            const nickname = cls.nickname || null;
                            const key = `${classNumber}|${stream || ''}|${nickname || ''}`;
                            
                            if (!groups[key]) {
                              const displayName = nickname || (stream ? `Class ${classNumber} (${stream})` : `Class ${classNumber}`);
                              groups[key] = {
                                key,
                                displayName,
                                classNumber,
                                stream,
                                nickname,
                                subjectCount: 0
                              };
                            }
                            groups[key].subjectCount++;
                          });
                          
                          return Object.values(groups).map((group) => (
                            <Badge 
                              key={group.key} 
                              variant={selectedClassGroup === group.key ? "default" : "outline"} 
                              className={`cursor-pointer py-2 px-3 ${selectedClassGroup === group.key ? 'bg-purple-600' : 'hover:bg-purple-50'}`} 
                              onClick={() => setSelectedClassGroup(group.key)}
                            >
                              <GraduationCap className="w-3 h-3 mr-1" />
                              {group.displayName}
                              <span className="ml-2 text-xs opacity-75">({group.subjectCount} subjects)</span>
                            </Badge>
                          ));
                        })()}
                      </div>
                    </div>
                  )}
                </div>

                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={isLoading || !instituteInfo || !selectedClassGroup}>
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <GraduationCap className="w-4 h-4 mr-2" />}
                  Register
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
