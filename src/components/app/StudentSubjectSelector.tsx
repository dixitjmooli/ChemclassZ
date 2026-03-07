'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useAuthStore, useAppStore, StudentEnrollment } from '@/lib/store';
import { 
  subscribeToInstitute,
  getInstituteByReferralCode,
  getIndependentTeacherByReferralCode,
  updateUser,
  getUser,
  getTeachersForInstitute,
} from '@/lib/firebase-service';
import { useToast } from '@/hooks/use-toast';
import { 
  BookOpen, 
  ChevronRight, 
  Users,
  GraduationCap,
  Loader2,
  Plus,
  X,
  Trash2,
  AlertTriangle,
  User,
  Building2,
  KeyRound,
  Flame,
  Star,
  Mail
} from 'lucide-react';

// Helper function to format teacher name with "ji"
const formatTeacherName = (name: string | undefined | null): string => {
  if (!name) return 'Self Study';
  if (name === 'Self Study' || name === 'Unknown' || name === 'Teacher') return name;
  // Don't add "ji" if already present
  if (name.toLowerCase().endsWith(' ji')) return name;
  return `${name} ji`;
};

interface StudentSubjectSelectorProps {
  onSelect: (enrollment: StudentEnrollment) => void;
}

export function StudentSubjectSelector({ onSelect }: StudentSubjectSelectorProps) {
  const { user, updateUser: updateAuthUser } = useAuthStore();
  const { 
    institute,
    setInstitute,
    allStudents,
    streakData,
    disciplineStars
  } = useAppStore();
  const { toast } = useToast();

  // Helper function to get the actual teacher name from enrollment
  const getActualTeacherName = (enrollment: StudentEnrollment): string => {
    // If teacherName is set and different from instituteName, it's correct
    if (enrollment.teacherName && enrollment.teacherName !== enrollment.instituteName) {
      return enrollment.teacherName;
    }
    
    // If we have institute data loaded, look up from class's teacherId field
    if (institute?.classes && enrollment.classId) {
      const matchedClass = institute.classes.find(c => c.id === enrollment.classId);
      if (matchedClass && (matchedClass as any).teacherId) {
        const teacherIdValue = (matchedClass as any).teacherId;
        // Check if it's a Firebase ID (long alphanumeric string)
        if (teacherIdValue && teacherIdValue.length > 20 && /^[a-zA-Z0-9]+$/.test(teacherIdValue)) {
          // Look up teacher name from teachersMap
          if (teachersMap[teacherIdValue]) {
            return teachersMap[teacherIdValue];
          }
        } else if (teacherIdValue && !teacherIdValue.includes('@')) {
          // It's a name, use directly
          return teacherIdValue;
        } else if (teacherIdValue) {
          // It's an email, extract name part
          return teacherIdValue.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
      }
    }
    
    // If teacherName equals instituteName, that's incorrect - return 'Teacher' instead
    if (enrollment.teacherName && enrollment.teacherName === enrollment.instituteName) {
      return 'Teacher';
    }
    
    return enrollment.teacherName || 'Unknown';
  };

  const [loading, setLoading] = useState(true);
  const [showAddEnrollment, setShowAddEnrollment] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [newInstituteInfo, setNewInstituteInfo] = useState<{
    id: string;
    name: string;
    classes: { id: string; name: string; teacherId?: string | null }[];
    subjects: { id: string; name: string; classIds: string[] }[];
    isIndependentTeacher?: boolean;
    teacherName?: string;
  } | null>(null);
  
  // Teachers mapping for Firebase ID to name lookup
  const [teachersMap, setTeachersMap] = useState<Record<string, string>>({});

  // Delete confirmation state
  const [deleteEnrollmentDialog, setDeleteEnrollmentDialog] = useState<{ 
    open: boolean; 
    enrollment: StudentEnrollment | null 
  }>({ open: false, enrollment: null });

  // Get student's enrollments
  const enrollments = user?.enrollments || [];

  // Group enrollments by institute (for institutes) or teacher (for independent teachers)
  const groupedEnrollments = enrollments.reduce((acc, enrollment) => {
    // For institutes, group by instituteId; for teachers, group by teacherId
    const key = enrollment.instituteId || enrollment.teacherId || 'self';
    const instituteName = enrollment.instituteName;
    const teacherName = enrollment.teacherName;
    
    if (!acc[key]) {
      acc[key] = {
        name: instituteName || teacherName || 'Self Study',
        isInstitute: !!enrollment.instituteId,
        enrollments: []
      };
    }
    acc[key].enrollments.push(enrollment);
    return acc;
  }, {} as Record<string, { name: string; isInstitute: boolean; enrollments: StudentEnrollment[] }>);

  // Legacy support: Convert old single-teacher format to enrollments
  useEffect(() => {
    const convertLegacyEnrollments = async () => {
      if (!user) return;

      // Check if user has old format but no enrollments
      if (!user.enrollments || user.enrollments.length === 0) {
        const legacyEnrollments: StudentEnrollment[] = [];

        // Check for independent teacher
        if (user.independentTeacherId && user.classId) {
          try {
            const teacher = await getUser(user.independentTeacherId);
            if (teacher) {
              const classObj = teacher.classes?.find(c => c.id === user.classId);
              // For each subject the independent teacher has for this class
              teacher.subjects?.forEach(subject => {
                if (subject.classIds.includes(user.classId!)) {
                  legacyEnrollments.push({
                    id: `enrollment_${user.independentTeacherId}_${user.classId}_${subject.id}`,
                    teacherId: user.independentTeacherId,
                    classId: user.classId,
                    subjectId: subject.id,
                    teacherName: teacher.name,
                    subjectName: subject.name,
                    className: classObj?.name
                  });
                }
              });
            }
          } catch (e) {
            console.error('Error loading teacher info:', e);
          }
        }
        // Check for institute
        else if (user.instituteId && user.classId) {
          // Load institute and create enrollment
          try {
            const unsubInstitute = subscribeToInstitute(user.instituteId, (inst) => {
              setInstitute(inst);
              if (inst) {
                const classObj = inst.classes.find(c => c.id === user.classId);
                inst.subjects.forEach(subject => {
                  if (subject.classIds.includes(user.classId!)) {
                    // Get the actual teacher name from class's teacherId field
                    let actualTeacherName = inst.name;
                    if (classObj && (classObj as any).teacherId) {
                      const teacherIdValue = (classObj as any).teacherId;
                      if (teacherIdValue && !teacherIdValue.includes('@')) {
                        actualTeacherName = teacherIdValue;
                      } else if (teacherIdValue) {
                        actualTeacherName = teacherIdValue.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                      }
                    }
                    
                    legacyEnrollments.push({
                      id: `enrollment_${user.instituteId}_${user.classId}_${subject.id}`,
                      instituteId: user.instituteId,
                      classId: user.classId!,
                      subjectId: subject.id,
                      teacherName: actualTeacherName,
                      instituteName: inst.name,
                      subjectName: subject.name,
                      className: classObj?.name
                    });
                  }
                });

                // Update user with enrollments if found
                if (legacyEnrollments.length > 0) {
                  updateAuthUser({ enrollments: legacyEnrollments });
                }
              }
            });
            return () => unsubInstitute();
          } catch (e) {
            console.error('Error loading institute info:', e);
          }
        }

        // If we found legacy enrollments, update the user
        if (legacyEnrollments.length > 0) {
          updateAuthUser({ enrollments: legacyEnrollments });
        }
      }
    };

    convertLegacyEnrollments().finally(() => setLoading(false));
  }, [user, updateAuthUser, setInstitute]);

  // Subscribe to institute data for all institute enrollments (for getActualTeacherName fallback)
  useEffect(() => {
    if (!user?.enrollments) return;
    
    const unsubscribers: (() => void)[] = [];
    
    // Get unique institute IDs from enrollments
    const instituteIds = new Set<string>();
    user.enrollments.forEach(e => {
      if (e.instituteId) instituteIds.add(e.instituteId);
    });
    
    // Subscribe to each institute (we only need one since typically a student is in one institute)
    // We'll use the first one for the fallback
    const primaryInstituteId = Array.from(instituteIds)[0];
    if (primaryInstituteId && !institute) {
      const unsub = subscribeToInstitute(primaryInstituteId, (inst) => {
        setInstitute(inst);
      });
      unsubscribers.push(unsub);
    }
    
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [user?.enrollments, institute, setInstitute]);

  // Load teachers when institute is loaded (for Firebase ID to name mapping)
  useEffect(() => {
    if (!institute?.id) return;
    
    getTeachersForInstitute(institute.id).then(teachers => {
      const map: Record<string, string> = {};
      teachers.forEach(t => {
        map[t.id] = t.name;
      });
      setTeachersMap(map);
    }).catch(err => {
      console.error('Error loading teachers:', err);
    });
  }, [institute?.id]);

  // Verify referral code for adding new enrollment
  const verifyReferralCode = async () => {
    if (!referralCode) return;
    
    setVerifyingCode(true);
    try {
      // First check for institute
      const foundInstitute = await getInstituteByReferralCode(referralCode);
      if (foundInstitute) {
        setNewInstituteInfo({
          id: foundInstitute.id,
          name: foundInstitute.name,
          classes: foundInstitute.classes,
          subjects: foundInstitute.subjects,
          isIndependentTeacher: false
        });
        toast({
          title: 'Institute Found!',
          description: `Connected to ${foundInstitute.name}`,
        });
      } else {
        // Check for independent teacher
        const teacher = await getIndependentTeacherByReferralCode(referralCode);
        if (teacher) {
          setNewInstituteInfo({
            id: teacher.id,
            name: `${teacher.name}'s Class`,
            classes: teacher.classes || [],
            subjects: teacher.subjects || [],
            isIndependentTeacher: true,
            teacherName: teacher.name
          });
          toast({
            title: 'Teacher Found!',
            description: `Connected to ${teacher.name}`,
          });
        } else {
          toast({
            title: 'Invalid Code',
            description: 'No institute or teacher found with this referral code',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to verify referral code',
        variant: 'destructive',
      });
    } finally {
      setVerifyingCode(false);
    }
  };

  // Add new enrollment
  const addEnrollment = async () => {
    if (!newInstituteInfo || !selectedClassId || !selectedSubjectId || !user) return;

    // Get the selected class and subject
    const classObj = newInstituteInfo.classes.find(c => c.id === selectedClassId);
    const subjectObj = newInstituteInfo.subjects.find(s => s.id === selectedSubjectId);

    if (!subjectObj) {
      toast({ 
        title: 'Error', 
        description: 'Please select a valid subject', 
        variant: 'destructive' 
      });
      return;
    }

    // Get the actual teacher name from class's teacherId field
    let actualTeacherName = newInstituteInfo.teacherName || newInstituteInfo.name;
    
    // For institutes, extract teacher name from class's teacherId field
    if (!newInstituteInfo.isIndependentTeacher && classObj && (classObj as any).teacherId) {
      const teacherIdValue = (classObj as any).teacherId;
      if (teacherIdValue && !teacherIdValue.includes('@')) {
        // It's a name, use directly
        actualTeacherName = teacherIdValue;
      } else if (teacherIdValue) {
        // It's an email, extract name part
        actualTeacherName = teacherIdValue.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
    }

    // Create new enrollment - only include teacherId or instituteId, not both
    const newEnrollment: StudentEnrollment = {
      id: `enrollment_${Date.now()}`,
      classId: selectedClassId,
      subjectId: selectedSubjectId,
      teacherName: actualTeacherName,
      instituteName: newInstituteInfo.isIndependentTeacher ? undefined : newInstituteInfo.name,
      subjectName: subjectObj.name,
      className: classObj?.name || 'Unknown Class'
    };

    // Only add the relevant ID field
    if (newInstituteInfo.isIndependentTeacher) {
      newEnrollment.teacherId = newInstituteInfo.id;
    } else {
      newEnrollment.instituteId = newInstituteInfo.id;
    }

    const updatedEnrollments = [...enrollments, newEnrollment];

    try {
      await updateUser(user.id, { enrollments: updatedEnrollments });
      updateAuthUser({ enrollments: updatedEnrollments });
      
      toast({ 
        title: 'Enrollment Added', 
        description: `Added ${subjectObj.name} - ${classObj?.name}` 
      });

      // Reset form
      setNewInstituteInfo(null);
      setSelectedClassId('');
      setSelectedSubjectId('');
      setReferralCode('');
      setShowAddEnrollment(false);
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  };

  // Remove enrollment
  const confirmDeleteEnrollment = (enrollment: StudentEnrollment) => {
    setDeleteEnrollmentDialog({ open: true, enrollment });
  };

  const removeEnrollment = async () => {
    const enrollment = deleteEnrollmentDialog.enrollment;
    if (!enrollment || !user) return;

    const updatedEnrollments = enrollments.filter(e => e.id !== enrollment.id);

    try {
      await updateUser(user.id, { enrollments: updatedEnrollments });
      updateAuthUser({ enrollments: updatedEnrollments });
      toast({ title: 'Enrollment Removed', description: 'Subject has been removed' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setDeleteEnrollmentDialog({ open: false, enrollment: null });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-purple-600 mb-4" />
        <p className="text-muted-foreground">Loading your subjects...</p>
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
            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 mb-4"
          >
            <GraduationCap className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold mb-2">
            Welcome, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground">
            Select a subject to view your progress
          </p>
        </div>

        {/* Institute/Teacher Header Cards */}
        {Object.keys(groupedEnrollments).length > 0 && (
          <div className="space-y-3">
            {Object.entries(groupedEnrollments).map(([key, group]) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className={`overflow-hidden ${!group.isInstitute ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'}`}>
                  <div className={`h-2 ${!group.isInstitute ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-blue-400 to-indigo-500'}`} />
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${!group.isInstitute ? 'bg-green-100' : 'bg-blue-100'}`}>
                        {!group.isInstitute ? (
                          <User className="w-7 h-7 text-green-600" />
                        ) : (
                          <Building2 className="w-7 h-7 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-bold text-gray-900">{group.name}</h2>
                          <Badge variant="secondary" className={!group.isInstitute ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>
                            {!group.isInstitute ? 'Teacher' : 'Institute'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {group.isInstitute ? 'Learning at' : 'Learning with'} • {group.enrollments.length} subject{group.enrollments.length > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Stats Summary - includes streak and discipline stars which are global */}
        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{enrollments.length}</p>
            <p className="text-xs text-muted-foreground">Subjects Enrolled</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">
              {streakData?.currentStreak || 0}
            </p>
            <p className="text-xs text-muted-foreground">🔥 Day Streak</p>
          </div>
        </div>

        {/* Streak & Discipline Stars Cards */}
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className={`bg-gradient-to-br ${streakData?.currentStreak && streakData.currentStreak >= 7 ? 'from-orange-100 to-red-50 border-orange-300' : 'from-orange-50 to-white border-orange-200'}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${streakData?.currentStreak && streakData.currentStreak >= 7 ? 'bg-gradient-to-br from-orange-400 to-red-500' : 'bg-orange-100'}`}>
                    <Flame className={`w-6 h-6 ${streakData?.currentStreak && streakData.currentStreak >= 7 ? 'text-white' : 'text-orange-500'}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Streak</p>
                    <p className="text-xl font-bold text-orange-600">
                      {streakData?.currentStreak || 0} days
                    </p>
                    {streakData?.longestStreak && streakData.longestStreak > 0 && (
                      <p className="text-xs text-muted-foreground">Best: {streakData.longestStreak} days</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="bg-gradient-to-br from-yellow-50 to-white border-yellow-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Discipline Stars</p>
                    <p className="text-xl font-bold text-yellow-600">
                      {disciplineStars?.stars || 0} ⭐
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Add New Subject Button */}
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => setShowAddEnrollment(!showAddEnrollment)}
          >
            <Plus className="w-4 h-4" />
            Add New Subject
          </Button>
        </div>

        {/* Add Enrollment Form */}
        {showAddEnrollment && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-purple-200 bg-purple-50/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-purple-600" />
                  Add New Subject
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Enter Referral Code</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter teacher/institute referral code"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      onClick={verifyReferralCode} 
                      disabled={!referralCode || verifyingCode}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {verifyingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                    </Button>
                  </div>
                </div>

                {/* Class Selection after verifying code */}
                {newInstituteInfo && (
                  <div className="space-y-2 border-t pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      {newInstituteInfo.isIndependentTeacher ? (
                        <User className="w-4 h-4 text-green-600" />
                      ) : (
                        <Building2 className="w-4 h-4 text-blue-600" />
                      )}
                      <span className="font-medium">{newInstituteInfo.name}</span>
                    </div>
                    
                    <Label>Select Class</Label>
                    <select
                      className="w-full border rounded px-3 py-2"
                      value={selectedClassId}
                      onChange={(e) => {
                        setSelectedClassId(e.target.value);
                        setSelectedSubjectId(''); // Reset subject when class changes
                      }}
                    >
                      <option value="">Select a class</option>
                      {newInstituteInfo.classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                      ))}
                    </select>

                    {/* Subject Selection - shows subjects available for selected class */}
                    {selectedClassId && (
                      <>
                        <Label>Select Subject</Label>
                        <select
                          className="w-full border rounded px-3 py-2"
                          value={selectedSubjectId}
                          onChange={(e) => setSelectedSubjectId(e.target.value)}
                        >
                          <option value="">Select a subject</option>
                          {newInstituteInfo.subjects
                            .filter(s => s.classIds.includes(selectedClassId))
                            .map((subject) => (
                              <option key={subject.id} value={subject.id}>{subject.name}</option>
                            ))}
                        </select>
                      </>
                    )}

                    <Button 
                      onClick={addEnrollment} 
                      disabled={!selectedClassId || !selectedSubjectId}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Subject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Subject Cards - Grouped by Institute/Teacher */}
        {enrollments.length === 0 ? (
          <Card className="border-dashed border-2 border-orange-300 bg-orange-50/50">
            <CardContent className="py-8 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-orange-100 flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold text-orange-800 mb-2">No Subjects Enrolled</h3>
              <p className="text-muted-foreground mb-2">
                Add your first subject using a teacher's referral code.
              </p>
              <p className="text-sm text-muted-foreground">
                Click "Add New Subject" above to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedEnrollments).map(([key, group]) => (
              <div key={key}>
                {/* Section Header */}
                <div className="flex items-center gap-2 mb-3">
                  {!group.isInstitute ? (
                    <User className="w-4 h-4 text-green-600" />
                  ) : (
                    <Building2 className="w-4 h-4 text-blue-600" />
                  )}
                  <span className="font-medium text-gray-700">{group.name}</span>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>

                {/* Subject Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.enrollments.map((enrollment, index) => (
                    <motion.div
                      key={enrollment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card 
                        className={`cursor-pointer hover:shadow-lg transition-all group overflow-hidden ${!group.isInstitute ? 'hover:border-green-400' : 'hover:border-blue-400'}`}
                        onClick={() => onSelect(enrollment)}
                      >
                        {/* Color bar at top */}
                        <div className={`h-2 ${!group.isInstitute ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-blue-400 to-indigo-500'}`} />
                        
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${!group.isInstitute ? 'bg-green-100' : 'bg-blue-100'}`}>
                                <BookOpen className={`w-6 h-6 ${!group.isInstitute ? 'text-green-600' : 'text-blue-600'}`} />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">{enrollment.subjectName}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {enrollment.className || 'General'}
                                </p>
                              </div>
                            </div>
                            <ChevronRight className={`w-5 h-5 text-gray-400 transition-colors ${!group.isInstitute ? 'group-hover:text-green-600' : 'group-hover:text-blue-600'}`} />
                          </div>

                          {/* Teacher/Institute info - "Learning with" label */}
                          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">Learning with</span>
                              {enrollment.teacherId ? (
                                <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 rounded-full">
                                  <User className="w-3 h-3 text-green-600" />
                                  <span className="text-xs font-semibold text-green-700">
                                    {formatTeacherName(getActualTeacherName(enrollment))}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 rounded-full">
                                  <User className="w-3 h-3 text-blue-600" />
                                  <span className="text-xs font-semibold text-blue-700">
                                    {formatTeacherName(getActualTeacherName(enrollment))}
                                  </span>
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              className="text-gray-300 hover:text-red-500 transition-colors p-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmDeleteEnrollment(enrollment);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Enrollment Confirmation Dialog */}
      <AlertDialog 
        open={deleteEnrollmentDialog.open} 
        onOpenChange={(open) => setDeleteEnrollmentDialog({ ...deleteEnrollmentDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Remove Subject
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{deleteEnrollmentDialog.enrollment?.subjectName}</strong> 
              {' '}from <strong>{formatTeacherName(deleteEnrollmentDialog.enrollment?.teacherName)}</strong>?
              Your progress will still be saved but you won't see it in your dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={removeEnrollment}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
