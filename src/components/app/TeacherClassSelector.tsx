'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuthStore, useAppStore, TeacherAssignment, SyllabusAssignment, User } from '@/lib/store';
import { 
  subscribeToInstitute,
  TaughtProgress,
  subscribeToAllTaughtProgressForTeacher,
  getUser,
  getStudentsForInstitute
} from '@/lib/firebase-service';
import { TodoList } from '@/components/app/TodoList';
import { 
  BookOpen, 
  ChevronRight, 
  Users,
  GraduationCap,
  Loader2,
  CheckCircle2,
  Building2,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface TeacherClassSelectorProps {
  onSelect: (assignment: TeacherAssignment) => void;
}

export function TeacherClassSelector({ onSelect }: TeacherClassSelectorProps) {
  const { user } = useAuthStore();
  const { 
    institute, 
    setInstitute
  } = useAppStore();

  const [loading, setLoading] = useState(true);
  const [syllabusAssignments, setSyllabusAssignments] = useState<SyllabusAssignment[]>([]);
  const [taughtProgress, setTaughtProgress] = useState<TaughtProgress[]>([]);
  const [students, setStudents] = useState<User[]>([]);

  // Get teacher's assignments
  const assignments = user?.assignments || [];

  useEffect(() => {
    let isMounted = true;
    let unsubInstitute: (() => void) | undefined;
    let unsubProgress: (() => void) | undefined;
    
    const initialize = async () => {
      if (user?.instituteId && user?.id) {
        // Subscribe to institute
        unsubInstitute = subscribeToInstitute(user.instituteId, (inst) => {
          if (isMounted) setInstitute(inst);
        });

        // Load syllabus assignments directly from Firebase
        try {
          const userData = await getUser(user.id);
          console.log('[TeacherClassSelector] Loaded userData from Firebase:', userData?.syllabusAssignments);
          if (userData?.syllabusAssignments && isMounted) {
            setSyllabusAssignments(userData.syllabusAssignments);
          }
        } catch (error) {
          console.error('Error loading syllabus assignments:', error);
        }
        
        // Subscribe to taught progress
        unsubProgress = subscribeToAllTaughtProgressForTeacher(user.id, (progress) => {
          console.log('[TeacherClassSelector] Received taughtProgress:', progress);
          console.log('[TeacherClassSelector] Progress subjectIds:', progress.map(p => ({ subjectId: p.subjectId, itemsCount: p.items?.length })));
          if (isMounted) setTaughtProgress(progress);
        });
        
        // Fetch students once (one-time fetch, not subscription for better performance)
        try {
          const instituteStudents = await getStudentsForInstitute(user.instituteId);
          console.log('[TeacherClassSelector] Fetched students:', instituteStudents.length);
          if (isMounted) setStudents(instituteStudents);
        } catch (error) {
          console.error('Error fetching students:', error);
        }
      }
      
      // Use a microtask to defer setState
      queueMicrotask(() => {
        if (isMounted) setLoading(false);
      });
    };

    initialize();

    return () => {
      isMounted = false;
      if (unsubInstitute) unsubInstitute();
      if (unsubProgress) unsubProgress();
    };
  }, [user, setInstitute]);

  // Get class name
  const getClassName = (classId: string) => {
    return institute?.classes.find(c => c.id === classId)?.name || classId;
  };

  // Get subject name
  const getSubjectName = (subjectId: string) => {
    return institute?.subjects.find(s => s.id === subjectId)?.name || subjectId;
  };

  // Get students count for a class-subject (checking both classId and enrollments)
  const getStudentCount = (classId: string, subjectId?: string) => {
    return students.filter(s => {
      // Check direct classId match
      if (s.classId === classId) return true;
      
      // Check enrollments array
      if (s.enrollments && s.enrollments.length > 0) {
        return s.enrollments.some(e => 
          e.classId === classId || (subjectId && e.subjectId === subjectId)
        );
      }
      
      return false;
    }).length;
  };

  // Check if syllabus is assigned
  const hasSyllabusAssigned = (classId: string, subjectId: string) => {
    const assignment = syllabusAssignments.find(
      a => a.classId === classId && a.subjectId === subjectId
    );
    return !!assignment?.syllabusId;
  };

  // Get syllabus name
  const getSyllabusName = (classId: string, subjectId: string) => {
    const assignment = syllabusAssignments.find(
      a => a.classId === classId && a.subjectId === subjectId
    );
    return assignment?.syllabusName;
  };

  // Get progress for a class-subject
  // The progress is stored with the syllabusId (predefined subject ID like 'class11_chemistry')
  // But the assignment has the institute's subjectId (UUID)
  const getProgress = (classId: string, subjectId: string): { percent: number; taught: number; total: number } => {
    // First, get the syllabusId for this class-subject
    const syllabusAssignment = syllabusAssignments.find(
      a => a.classId === classId && a.subjectId === subjectId
    );
    
    console.log('[TeacherClassSelector] getProgress called with:', { classId, subjectId });
    console.log('[TeacherClassSelector] syllabusAssignments:', syllabusAssignments);
    console.log('[TeacherClassSelector] taughtProgress:', taughtProgress.map(p => ({ subjectId: p.subjectId, itemsCount: p.items?.length })));
    
    if (!syllabusAssignment?.syllabusId) {
      console.log('[TeacherClassSelector] No syllabusId found for class-subject');
      return { percent: 0, taught: 0, total: 0 };
    }
    
    // Find progress using the syllabusId (predefined subject ID)
    // Try both formats: with underscores (class11_chemistry) and with spaces (class11 chemistry)
    let progress = taughtProgress.find(p => p.subjectId === syllabusAssignment.syllabusId);
    
    // If not found, try with underscores converted to spaces
    if (!progress && syllabusAssignment.syllabusId.includes('_')) {
      const alternateId = syllabusAssignment.syllabusId.replace(/_/g, ' ');
      progress = taughtProgress.find(p => p.subjectId === alternateId);
      console.log('[TeacherClassSelector] Trying alternate ID with spaces:', alternateId, 'found:', !!progress);
    }
    
    // If not found, try with spaces converted to underscores
    if (!progress && syllabusAssignment.syllabusId.includes(' ')) {
      const alternateId = syllabusAssignment.syllabusId.replace(/ /g, '_');
      progress = taughtProgress.find(p => p.subjectId === alternateId);
      console.log('[TeacherClassSelector] Trying alternate ID with underscores:', alternateId, 'found:', !!progress);
    }
    
    console.log('[TeacherClassSelector] Looking for progress with subjectId:', syllabusAssignment.syllabusId, 'found:', !!progress);
    
    if (!progress) return { percent: 0, taught: 0, total: 0 };
    
    const taught = progress.items.filter(i => i.taught).length;
    const total = progress.items.length;
    const percent = total > 0 ? Math.round((taught / total) * 100) : 0;
    
    console.log('[TeacherClassSelector] Progress calculated:', { taught, total, percent });
    
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

  // Calculate overall stats
  const totalClasses = assignments.length;
  const totalStudents = students.length;
  const avgProgress = (() => {
    if (assignments.length === 0) return 0;
    let totalPercent = 0;
    let countWithProgress = 0;
    assignments.forEach(a => {
      const prog = getProgress(a.classId, a.subjectId);
      if (prog.total > 0) {
        totalPercent += prog.percent;
        countWithProgress++;
      }
    });
    return countWithProgress > 0 ? Math.round(totalPercent / countWithProgress) : 0;
  })();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-purple-600 mb-4" />
        <p className="text-muted-foreground">Loading your classes...</p>
      </div>
    );
  }

  return (
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
          Select a class and subject to get started
        </p>
      </div>

      {/* Institute Info Card */}
      {institute && (
        <Card className="max-w-md mx-auto bg-gradient-to-r from-purple-500 to-purple-700 text-white">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Building2 className="w-5 h-5" />
              <span className="font-semibold">{institute.name}</span>
            </div>
            <p className="text-xs opacity-80">Your registered institute</p>
          </CardContent>
        </Card>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-600">{totalClasses}</p>
          <p className="text-xs text-muted-foreground">Classes</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">
            {new Set(assignments.map(a => a.subjectId)).size}
          </p>
          <p className="text-xs text-muted-foreground">Subjects</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{totalStudents}</p>
          <p className="text-xs text-muted-foreground">Students</p>
        </div>
      </div>

      {/* Class-Subject Cards */}
      {assignments.length === 0 ? (
        <div className="space-y-4">
          <Card className="border-dashed border-2 border-orange-300 bg-orange-50/50">
            <CardContent className="py-8 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-orange-100 flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold text-orange-800 mb-2">No Classes Assigned Yet</h3>
              <p className="text-muted-foreground mb-2">
                You haven't been assigned to any classes yet.
              </p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Contact your institute administrator to get assigned to classes and subjects.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-sm text-muted-foreground">Select a class to view dashboard</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignments.map((assignment, index) => {
              const className = getClassName(assignment.classId);
              const subjectName = getSubjectName(assignment.subjectId);
              const studentCount = getStudentCount(assignment.classId, assignment.subjectId);
              const hasSyllabus = hasSyllabusAssigned(assignment.classId, assignment.subjectId);
              const syllabusName = getSyllabusName(assignment.classId, assignment.subjectId);
              const progress = getProgress(assignment.classId, assignment.subjectId);

              return (
                <motion.div
                  key={`${assignment.classId}_${assignment.subjectId}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card 
                    className="cursor-pointer hover:border-purple-500 hover:shadow-lg transition-all group overflow-hidden"
                    onClick={() => onSelect(assignment)}
                  >
                    {/* Color bar at top */}
                    <div className={`h-1.5 ${
                      progress.percent >= 80 
                        ? 'bg-gradient-to-r from-green-400 to-green-600'
                        : progress.percent >= 50
                          ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                          : progress.percent >= 25
                            ? 'bg-gradient-to-r from-orange-400 to-orange-600'
                            : hasSyllabus 
                              ? 'bg-gradient-to-r from-purple-400 to-purple-600' 
                              : 'bg-gradient-to-r from-orange-400 to-orange-600'
                    }`} />
                    
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                            <BookOpen className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{className}</h3>
                            <p className="text-sm text-muted-foreground">{subjectName}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                      </div>

                      {/* Progress Bar - Show if syllabus is assigned */}
                      {hasSyllabus && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">
                              {progress.total > 0 ? `${progress.taught} of ${progress.total} topics taught` : 'Click to start tracking'}
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
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">
                          <Users className="w-3 h-3 mr-1" />
                          {studentCount} students
                        </Badge>
                        {hasSyllabus ? (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Syllabus Set
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            No Syllabus
                          </Badge>
                        )}
                      </div>

                      {/* Syllabus name if available */}
                      {syllabusName && (
                        <p className="text-xs text-muted-foreground truncate">
                          📚 {syllabusName}
                        </p>
                      )}

                      {/* Click to enter hint */}
                      <div className="mt-3 pt-3 border-t">
                        <span className="text-xs text-purple-600 font-medium group-hover:underline">
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

      {/* Help text */}
      {assignments.length > 1 && (
        <p className="text-center text-sm text-muted-foreground">
          You can switch between classes anytime from the dashboard
        </p>
      )}
    </div>
  );
}
