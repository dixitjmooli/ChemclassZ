'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAppStore, useAuthStore, type User, type Institute } from '@/lib/store';
import { getOverallBadge, getChapterBadge, getNextBadge, OVERALL_BADGES, CHAPTER_BADGES } from '@/lib/badges';
import { 
  subscribeToTaughtProgress, 
  subscribeToAllTaughtProgressForInstitute,
  subscribeToInstitute,
  TaughtProgress,
  getUser,
  getTeachersForInstitute
} from '@/lib/firebase-service';
import { StudentProgressComparison } from '@/components/app/StudentProgressComparison';
import { BookOpen, Trophy, Target, TrendingUp, Award, Star, Clock, CheckCircle2, Flame, Users, User as UserIcon, Building2, GraduationCap } from 'lucide-react';

// Helper function to format teacher name with "ji"
const formatTeacherName = (name: string | undefined | null): string => {
  if (!name) return 'Self Study';
  if (name === 'Self Study' || name === 'Unknown' || name === 'Teacher') return name;
  // Don't add "ji" if already present
  if (name.toLowerCase().endsWith(' ji')) return name;
  return `${name} ji`;
};

interface StudentDashboardProps {
  user: User;
}

export function StudentDashboard({ user }: StudentDashboardProps) {
  const progress = useAppStore((state) => state.progress);
  const chapters = useAppStore((state) => state.chapters);
  const subjects = useAppStore((state) => state.subjects);
  const selectedSubjectId = useAppStore((state) => state.selectedSubjectId);
  const setSelectedSubjectId = useAppStore((state) => state.setSelectedSubjectId);
  const allTestMarks = useAppStore((state) => state.allTestMarks);
  const allStudents = useAppStore((state) => state.allStudents);
  const allProgress = useAppStore((state) => state.allProgress);
  const disciplineStars = useAppStore((state) => state.disciplineStars);
  const activityLog = useAppStore((state) => state.activityLog);
  const streakData = useAppStore((state) => state.streakData);
  const authUser = useAuthStore((state) => state.user);
  const studentSelectedEnrollment = useAppStore((state) => state.studentSelectedEnrollment);

  // Teacher progress state
  const [teacherProgress, setTeacherProgress] = useState<TaughtProgress | null>(null);
  
  // Teacher/Institute info state
  const [teacherInfo, setTeacherInfo] = useState<User | null>(null);
  const [instituteInfo, setInstituteInfo] = useState<Institute | null>(null);
  const [className, setClassName] = useState<string>('');
  const [syllabusIdForProgress, setSyllabusIdForProgress] = useState<string | null>(null);
  const [teachersMap, setTeachersMap] = useState<Record<string, string>>({});
  
  // Get teacher/institute info from enrollment
  const teacherName = studentSelectedEnrollment?.teacherName;
  const instituteName = studentSelectedEnrollment?.instituteName;
  const isIndependentTeacher = !!studentSelectedEnrollment?.teacherId;
  
  // Fetch teacher's syllabus assignment to get the correct syllabusId for progress lookup
  useEffect(() => {
    const fetchSyllabusId = async () => {
      if (!studentSelectedEnrollment) return;
      
      // For independent teachers, get their syllabus assignments
      if (studentSelectedEnrollment.teacherId) {
        const teacher = await getUser(studentSelectedEnrollment.teacherId);
        if (teacher?.syllabusAssignments) {
          const assignment = teacher.syllabusAssignments.find(
            sa => sa.classId === studentSelectedEnrollment.classId && 
                  sa.subjectId === studentSelectedEnrollment.subjectId
          );
          console.log('[StudentDashboard] Found syllabus assignment for independent teacher:', assignment?.syllabusId);
          setSyllabusIdForProgress(assignment?.syllabusId || null);
        }
      }
      // For institutes, find the teacher by their name or ID and get their syllabus assignment
      else if (studentSelectedEnrollment.instituteId) {
        try {
          // Get all teachers for this institute
          const teachers = await getTeachersForInstitute(studentSelectedEnrollment.instituteId);
          
          // Try to find teacher by matching with class's teacherId from institute
          if (instituteInfo?.classes) {
            const matchedClass = instituteInfo.classes.find(c => c.id === studentSelectedEnrollment.classId);
            const teacherIdValue = (matchedClass as any)?.teacherId;
            
            if (teacherIdValue) {
              // Check if it's a Firebase ID
              let matchedTeacher = teachers.find(t => t.id === teacherIdValue);
              
              // If not found by ID, try to match by name
              if (!matchedTeacher && teacherIdValue.length <= 20) {
                matchedTeacher = teachers.find(t => t.name === teacherIdValue);
              }
              
              // If still not found, try to match by email
              if (!matchedTeacher && teacherIdValue.includes('@')) {
                matchedTeacher = teachers.find(t => t.email?.toLowerCase() === teacherIdValue.toLowerCase());
              }
              
              if (matchedTeacher) {
                // Get the teacher's syllabus assignments
                const teacherData = await getUser(matchedTeacher.id);
                if (teacherData?.syllabusAssignments) {
                  const assignment = teacherData.syllabusAssignments.find(
                    sa => sa.classId === studentSelectedEnrollment.classId && 
                          sa.subjectId === studentSelectedEnrollment.subjectId
                  );
                  console.log('[StudentDashboard] Found syllabus assignment for institute teacher:', assignment?.syllabusId);
                  setSyllabusIdForProgress(assignment?.syllabusId || null);
                  return;
                }
              }
            }
          }
          
          // Fallback: No syllabusId found, will use other matching strategies
          console.log('[StudentDashboard] No syllabusId found for institute student');
          setSyllabusIdForProgress(null);
        } catch (error) {
          console.error('[StudentDashboard] Error fetching teacher syllabus:', error);
          setSyllabusIdForProgress(null);
        }
      }
    };
    
    fetchSyllabusId();
  }, [studentSelectedEnrollment, instituteInfo]);

  // Fetch teacher/institute info
  useEffect(() => {
    if (!authUser) return;
    
    // Fetch teacher info if independent teacher student
    if (authUser.independentTeacherId) {
      getUser(authUser.independentTeacherId).then((teacher) => {
        setTeacherInfo(teacher);
        // Get class name from teacher's classes
        if (teacher?.classes && authUser.classId) {
          const classObj = teacher.classes.find(c => c.id === authUser.classId);
          if (classObj) setClassName(classObj.name);
        }
      });
    }
    
    // Subscribe to institute info if institute student
    if (authUser.instituteId) {
      const unsubscribe = subscribeToInstitute(authUser.instituteId, (institute) => {
        setInstituteInfo(institute);
        // Get class name from institute's classes
        if (institute?.classes && authUser.classId) {
          const classObj = institute.classes.find(c => c.id === authUser.classId);
          if (classObj) setClassName(classObj.name);
        }
      });
      return () => unsubscribe();
    }
  }, [authUser]);
  
  // Get the actual teacher name - either from enrollment or from institute class data
  const actualTeacherName = useMemo(() => {
    // If teacherName is set and different from instituteName, it's correct
    if (teacherName && teacherName !== instituteName) {
      return teacherName;
    }
    
    // Fallback: Look up from institute's classes data
    if (instituteInfo?.classes && studentSelectedEnrollment?.classId) {
      const matchedClass = instituteInfo.classes.find(c => c.id === studentSelectedEnrollment.classId);
      if (matchedClass && (matchedClass as any).teacherId) {
        const teacherIdValue = (matchedClass as any).teacherId;
        // Check if it's a Firebase ID (long alphanumeric string)
        if (teacherIdValue && teacherIdValue.length > 20 && /^[a-zA-Z0-9]+$/.test(teacherIdValue)) {
          // Look up teacher name from teachersMap
          if (teachersMap[teacherIdValue]) {
            return teachersMap[teacherIdValue];
          }
        } else if (teacherIdValue && !teacherIdValue.includes('@')) {
          return teacherIdValue;
        } else if (teacherIdValue) {
          // It's an email, extract name part
          return teacherIdValue.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
        }
      }
    }
    
    // If teacherName equals instituteName, that's incorrect - return 'Teacher' instead
    if (teacherName && teacherName === instituteName) {
      return 'Teacher';
    }
    
    return teacherName || 'Unknown';
  }, [teacherName, instituteName, instituteInfo, studentSelectedEnrollment, teachersMap]);

  // Load teachers when institute is loaded (for Firebase ID to name mapping)
  useEffect(() => {
    if (!instituteInfo?.id) return;
    
    getTeachersForInstitute(instituteInfo.id).then(teachers => {
      const map: Record<string, string> = {};
      teachers.forEach(t => {
        map[t.id] = t.name;
      });
      setTeachersMap(map);
    }).catch(err => {
      console.error('Error loading teachers:', err);
    });
  }, [instituteInfo?.id]);

  // Subscribe to teacher's taught progress
  useEffect(() => {
    if (!authUser || !selectedSubjectId) return;
    
    let unsubscribe: (() => void) | undefined;
    
    // Use syllabusIdForProgress if available, otherwise fall back to selectedSubjectId
    const progressSubjectId = syllabusIdForProgress || selectedSubjectId;
    
    if (authUser.independentTeacherId) {
      // Student of independent teacher
      unsubscribe = subscribeToTaughtProgress(authUser.independentTeacherId, progressSubjectId, (tp) => {
        console.log('Teacher progress received (independent):', tp?.overallProgress);
        setTeacherProgress(tp);
      });
    } else if (authUser.instituteId) {
      // Student of institute - get all taught progress for institute
      unsubscribe = subscribeToAllTaughtProgressForInstitute(authUser.instituteId, (progressList) => {
        console.log('All institute progress:', progressList.map(p => ({ subjectId: p.subjectId, progress: p.overallProgress })));
        // Find the progress for this subject - try syllabusIdForProgress first, then selectedSubjectId
        let subjectProgress = progressList.find(p => p.subjectId === syllabusIdForProgress);
        if (!subjectProgress) {
          // Fallback: try to match by subjectId
          subjectProgress = progressList.find(p => p.subjectId === selectedSubjectId);
        }
        console.log('Matched progress:', subjectProgress?.overallProgress);
        setTeacherProgress(subjectProgress || null);
      });
    }
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [authUser, selectedSubjectId, syllabusIdForProgress]);

  // Get current subject chapters
  const currentChapters = useMemo(() => {
    if (selectedSubjectId) {
      const subject = subjects.find(s => s.id === selectedSubjectId);
      return subject?.chapters || [];
    }
    return chapters;
  }, [selectedSubjectId, subjects, chapters]);

  const currentSubject = subjects.find(s => s.id === selectedSubjectId);

  const overallProgress = progress?.overallProgress || 0;
  const currentStreak = streakData?.currentStreak || 0;
  const longestStreak = streakData?.longestStreak || 0;

  // Calculate chapter progress data
  const chapterProgressData = useMemo(() => {
    return currentChapters.map((chapter) => {
      const chapterProgressItems = progress?.items.filter((item) =>
        chapter.topics.some((t) => t.id === item.topicId)
      ) || [];
      
      let chapterProgress = 0;
      const totalTopicsInChapter = chapter.topics.length;
      
      if (totalTopicsInChapter > 0) {
        let totalProgress = 0;
        chapter.topics.forEach((topic) => {
          const progressItem = chapterProgressItems.find((item) => item.topicId === topic.id);
          if (progressItem) {
            const completed = [
              progressItem.lectureCompleted,
              progressItem.ncertCompleted,
              progressItem.level1Completed,
              progressItem.level2Completed,
              progressItem.notesCompleted,
            ].filter(Boolean).length;
            totalProgress += (completed / 5) * 100;
          }
        });
        chapterProgress = totalProgress / totalTopicsInChapter;
      }
      
      return {
        chapterId: chapter.id,
        chapterName: chapter.name,
        progress: chapterProgress
      };
    });
  }, [currentChapters, progress]);

  // Calculate test average
  const userTests = allTestMarks.filter((t) => t.userId === user.id);
  const testAverage = userTests.length > 0
    ? userTests.reduce((sum, t) => sum + t.marks, 0) / userTests.length
    : 0;

  // Calculate rank in class (only within the same school)
  const rankings = useMemo(() => {
    // Only calculate if we have data
    if (allStudents.length === 0) return [];
    
    // Get student IDs for filtering
    const studentIds = new Set(allStudents.map(s => s.id));
    
    return allStudents
      .map((student) => {
        const studentProgress = allProgress.find((p) => p.userId === student.id);
        const studentMarks = allTestMarks.filter((m) => studentIds.has(m.userId) && m.userId === student.id);
        const progressScore = studentProgress?.overallProgress || 0;
        const testAvg = studentMarks.length > 0
          ? studentMarks.reduce((sum, m) => sum + m.marks, 0) / studentMarks.length
          : 0;
        const rankScore = (progressScore * 0.7) + (testAvg * 0.3);
        return { student, progressScore, testAvg, rankScore };
      })
      .sort((a, b) => b.rankScore - a.rankScore);
  }, [allStudents, allProgress, allTestMarks]);

  // Check if current user is in the students list
  const isUserInStudents = allStudents.some(s => s.id === user.id);
  const totalStudents = allStudents.length || 1;
  const isRankLoading = allStudents.length === 0;
  
  // Calculate my rank - only if user is in the list
  const myRank = useMemo(() => {
    if (rankings.length === 0 || !isUserInStudents) return 0;
    const index = rankings.findIndex((r) => r.student.id === user.id);
    return index >= 0 ? index + 1 : 0;
  }, [rankings, isUserInStudents, user.id]);

  // Calculate chapters completed
  const completedChapters = chapters.filter((chapter) => {
    const chapterTopics = chapter.topics;
    const chapterProgressItems = progress?.items.filter((item) =>
      chapterTopics.some((t) => t.id === item.topicId)
    ) || [];
    
    return chapterTopics.every((topic) => {
      const progressItem = chapterProgressItems.find((item) => item.topicId === topic.id);
      if (!progressItem) return false;
      
      return (
        progressItem.lectureCompleted &&
        progressItem.ncertCompleted &&
        progressItem.level1Completed &&
        progressItem.level2Completed &&
        progressItem.notesCompleted
      );
    });
  }).length;
  
  // Get badge info
  const currentBadge = getOverallBadge(overallProgress);
  const nextBadge = getNextBadge(overallProgress, OVERALL_BADGES);
  const progressToNext = nextBadge ? nextBadge.threshold - overallProgress : 0;

  // Count badges per chapter
  const badgeCounts = useMemo(() => {
    const counts = { king: 0, warrior: 0, scout: 0, locked: 0 };
    
    chapters.forEach((chapter) => {
      const chapterProgressItems = progress?.items.filter((item) =>
        chapter.topics.some((t) => t.id === item.topicId)
      ) || [];
      
      let chapterProgress = 0;
      const totalTopicsInChapter = chapter.topics.length;
      
      if (totalTopicsInChapter > 0) {
        let totalProgress = 0;
        chapter.topics.forEach((topic) => {
          const progressItem = chapterProgressItems.find((item) => item.topicId === topic.id);
          if (progressItem) {
            const completed = [
              progressItem.lectureCompleted,
              progressItem.ncertCompleted,
              progressItem.level1Completed,
              progressItem.level2Completed,
              progressItem.notesCompleted,
            ].filter(Boolean).length;
            totalProgress += (completed / 5) * 100;
          }
        });
        chapterProgress = totalProgress / totalTopicsInChapter;
      }
      
      const badge = getChapterBadge(chapterProgress);
      counts[badge.id as keyof typeof counts]++;
    });
    
    return counts;
  }, [chapters, progress]);

  // Weekly points for chart (last 5 weeks)
  const weeklyData = useMemo(() => {
    const weeks: { week: number; points: number; stars: number }[] = [];
    const now = new Date();
    
    for (let i = 4; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7) - now.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      
      // Count activities in this week
      const weekActivities = activityLog.filter((log) => {
        const logDate = new Date(log.createdAt);
        return logDate >= weekStart && logDate < weekEnd;
      });
      
      // Calculate points from progress activities
      const progressPoints = weekActivities
        .filter((a) => a.type === 'progress')
        .length * 10;
      
      // Calculate stars from discipline activities
      const starsGained = weekActivities
        .filter((a) => a.type === 'discipline' && (a.change || 0) > 0)
        .reduce((sum, a) => sum + (a.change || 0), 0);
      
      weeks.push({
        week: 5 - i,
        points: progressPoints,
        stars: starsGained
      });
    }
    
    return weeks;
  }, [activityLog]);

  // Format date for activity log
  const formatDate = (date: Date) => {
    const now = new Date();
    const logDate = new Date(date);
    const diffDays = Math.floor((now.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return logDate.toLocaleDateString();
  };

  // Get activity icon
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'progress': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'test': return <Target className="w-4 h-4 text-blue-600" />;
      case 'discipline': return <Star className="w-4 h-4 text-yellow-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const stats = [
    {
      title: 'Overall Progress',
      value: `${Math.round(overallProgress)}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Chapters Completed',
      value: `${completedChapters}/${chapters.length}`,
      icon: BookOpen,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Test Average',
      value: `${testAverage.toFixed(1)}%`,
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Tests Taken',
      value: userTests.length.toString(),
      icon: Trophy,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Subject & Teacher/Institute Info Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 rounded-xl p-6 text-white shadow-lg"
      >
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              <span className="text-purple-200 text-sm">Current Subject</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">
              {currentSubject?.name || studentSelectedEnrollment?.subjectName || 'Chemistry'}
            </h1>
            {studentSelectedEnrollment?.className && (
              <div className="flex items-center gap-2 text-purple-100">
                <GraduationCap className="w-4 h-4" />
                <span>{studentSelectedEnrollment.className}</span>
              </div>
            )}
          </div>
          
          {/* Learning with section */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 min-w-[200px]">
            {/* Show institute name if exists */}
            {instituteName && (
              <div className="mb-3 pb-3 border-b border-white/20">
                <div className="flex items-center gap-2 text-purple-200 text-sm mb-1">
                  <Building2 className="w-4 h-4" />
                  <span>Learning at</span>
                </div>
                <p className="font-semibold">{instituteName}</p>
              </div>
            )}
            {/* Show teacher name */}
            <div>
              <div className="flex items-center gap-2 text-purple-200 text-sm mb-2">
                {isIndependentTeacher ? (
                  <UserIcon className="w-4 h-4" />
                ) : (
                  <UserIcon className="w-4 h-4" />
                )}
                <span>Learning with</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-lg">{formatTeacherName(actualTeacherName)}</p>
                  <p className="text-purple-200 text-sm">
                    {isIndependentTeacher ? 'Teacher' : 'Subject Teacher'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Welcome message */}
        <div className="mt-4 pt-4 border-t border-white/20">
          <p className="text-purple-100">
            Welcome back, <span className="font-semibold text-white">{user.name}</span>! Track your learning progress below.
          </p>
        </div>
      </motion.div>

      {/* Quick Stats - Rank, Stars & Streak */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center">
                  <Trophy className="w-7 h-7 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rank in Class</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {isRankLoading ? (
                      <span className="text-lg animate-pulse">Loading...</span>
                    ) : !isUserInStudents ? (
                      <span className="text-lg">Not found</span>
                    ) : myRank > 0 ? (
                      <>#{myRank}<span className="text-lg text-muted-foreground">/{totalStudents}</span></>
                    ) : (
                      <span className="text-lg animate-pulse">Calculating...</span>
                    )}
                  </p>
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
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Star className="w-7 h-7 text-yellow-500 fill-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Discipline Stars</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {disciplineStars?.stars || 0}
                    <span className="text-lg text-yellow-500"> ⭐</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="col-span-2 md:col-span-1"
        >
          <Card className={`bg-gradient-to-br ${currentStreak >= 7 ? 'from-orange-100 to-red-50 border-orange-300' : 'from-orange-50 to-white border-orange-200'}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${currentStreak >= 7 ? 'bg-gradient-to-br from-orange-400 to-red-500' : 'bg-orange-100'}`}>
                  <Flame className={`w-7 h-7 ${currentStreak >= 7 ? 'text-white' : 'text-orange-500'}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Streak</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {currentStreak}
                    <span className="text-lg text-orange-500"> 🔥</span>
                  </p>
                  {longestStreak > 0 && (
                    <p className="text-xs text-muted-foreground">Best: {longestStreak} days</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Progress Circle & Badge */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Overall Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <div className="relative w-48 h-48">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="none"
                      className="text-purple-100"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={553}
                      strokeDashoffset={553 - (553 * overallProgress) / 100}
                      className="text-purple-600 transition-all duration-1000"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-4xl font-bold text-purple-600">
                        {Math.round(overallProgress)}%
                      </span>
                      <p className="text-sm text-muted-foreground">Complete</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Current Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-600" />
                Your Badge
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              {/* Current Badge */}
              <div className={`w-24 h-24 rounded-full ${currentBadge.bgColor} flex items-center justify-center mb-4 shadow-lg`}>
                <span className="text-5xl">{currentBadge.icon}</span>
              </div>
              <h3 className={`text-2xl font-bold ${currentBadge.color}`}>{currentBadge.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {currentBadge.id === 'legend' ? 'Maximum badge achieved!' : `${Math.round(progressToNext)}% to next badge`}
              </p>
              
              {/* Progress to next badge */}
              {nextBadge && (
                <div className="w-full mt-4">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress to {nextBadge.icon} {nextBadge.name}</span>
                    <span>{Math.round(overallProgress)}/{nextBadge.threshold}%</span>
                  </div>
                  <Progress 
                    value={(overallProgress / nextBadge.threshold) * 100} 
                    className="h-2" 
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Badges Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-600" />
              Chapter Badges Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {CHAPTER_BADGES.slice().reverse().map((badge) => {
                const count = badgeCounts[badge.id as keyof typeof badgeCounts] || 0;
                return (
                  <div
                    key={badge.id}
                    className={`p-4 rounded-xl text-center ${
                      badge.id === 'locked' ? 'bg-gray-50 opacity-60' : badge.bgColor
                    }`}
                  >
                    <span className="text-3xl">{badge.icon}</span>
                    <p className={`font-semibold mt-1 ${badge.color}`}>{badge.name}</p>
                    <p className="text-2xl font-bold mt-1">{count}</p>
                    <p className="text-xs text-muted-foreground">chapters</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Teacher Progress Comparison */}
      {currentSubject && (authUser?.independentTeacherId || authUser?.instituteId) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.375 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Compare with Teacher's Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StudentProgressComparison 
                subject={currentSubject} 
                studentProgress={overallProgress}
                syllabusId={syllabusIdForProgress}
              />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Weekly Progress Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Weekly Progress (Last 5 Weeks)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between h-40 gap-2">
              {weeklyData.map((week) => {
                const maxPoints = Math.max(...weeklyData.map((w) => w.points), 1);
                const height = (week.points / maxPoints) * 100;
                
                return (
                  <div key={week.week} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex flex-col items-center justify-end h-32">
                      <div
                        className="w-full max-w-12 bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg transition-all duration-500"
                        style={{ height: `${Math.max(height, 5)}%` }}
                      >
                        {week.points > 0 && (
                          <span className="text-xs text-white font-semibold flex justify-center pt-1">
                            {week.points}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">W{week.week}</p>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-center gap-4 mt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-purple-500 rounded"></div>
                Points Earned
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Activity Log */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-600" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activityLog.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {activityLog.slice(0, 10).map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-2 bg-gray-50 rounded-lg"
                  >
                    <div className="mt-0.5">{getActivityIcon(log.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{log.action}</p>
                      <p className="text-xs text-muted-foreground truncate">{log.details}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No recent activity</p>
                <p className="text-xs">Start completing chapters to see your progress!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Chapter Progress Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Chapter Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {chapters.slice(0, 5).map((chapter) => {
                const chapterTopics = chapter.topics;
                const chapterProgressItems = progress?.items.filter((item) =>
                  chapterTopics.some((t) => t.id === item.topicId)
                ) || [];
                
                let chapterProgress = 0;
                const totalTopicsInChapter = chapterTopics.length;
                
                if (totalTopicsInChapter > 0) {
                  let totalProgress = 0;
                  chapterTopics.forEach((topic) => {
                    const progressItem = chapterProgressItems.find((item) => item.topicId === topic.id);
                    if (progressItem) {
                      const completed = [
                        progressItem.lectureCompleted,
                        progressItem.ncertCompleted,
                        progressItem.level1Completed,
                        progressItem.level2Completed,
                        progressItem.notesCompleted,
                      ].filter(Boolean).length;
                      totalProgress += (completed / 5) * 100;
                    }
                  });
                  chapterProgress = totalProgress / totalTopicsInChapter;
                }

                const chapterBadge = getChapterBadge(chapterProgress);

                return (
                  <div key={chapter.id} className="flex items-center gap-3">
                    <div className={`px-2 py-1 rounded ${chapterBadge.bgColor}`}>
                      <span className="text-sm">{chapterBadge.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium truncate">{chapter.name}</span>
                        <span className="text-muted-foreground">{Math.round(chapterProgress)}%</span>
                      </div>
                      <Progress value={chapterProgress} className="h-2" />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
