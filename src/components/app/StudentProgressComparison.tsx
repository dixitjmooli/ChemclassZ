'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuthStore, useAppStore } from '@/lib/store';
import {
  Subject,
  Chapter,
  TaughtProgress,
  subscribeToTaughtProgress,
  subscribeToAllTaughtProgressForInstitute,
  getTeachersForInstitute,
  getUser
} from '@/lib/firebase-service';
import {
  TrendingUp,
  TrendingDown,
  Target,
  CheckCircle2,
  Circle,
  AlertCircle,
  Trophy,
  BookOpen,
  Zap,
  ListTodo,
  BarChart3,
  MessageSquare,
  ChevronRight,
  Clock,
  Flame,
  Star
} from 'lucide-react';

interface StudentProgressComparisonProps {
  subject: Subject;
  studentProgress: number;
  syllabusId?: string | null;
}

// Gap-based messages
const GAP_MESSAGES: Record<string, { message: string; emoji: string; color: string }> = {
  ahead: {
    message: "Amazing! You're ahead of your teacher! Keep up the excellent work!",
    emoji: "🏆",
    color: "text-green-600"
  },
  perfect: {
    message: "Perfect! You're right on track with your teacher!",
    emoji: "🎯",
    color: "text-blue-600"
  },
  behind5: {
    message: "You're just 5% behind! A little more effort and you'll catch up!",
    emoji: "💪",
    color: "text-yellow-600"
  },
  behind10: {
    message: "10% gap - Time to focus! Review the topics your teacher has covered.",
    emoji: "📚",
    color: "text-orange-600"
  },
  behind15: {
    message: "15% behind - Let's pick up the pace! Your teacher is waiting for you to catch up!",
    emoji: "⚡",
    color: "text-orange-600"
  },
  behind20: {
    message: "20% gap detected - Schedule extra study time this week. You can do it!",
    emoji: "🔥",
    color: "text-red-600"
  },
  behind30: {
    message: "30% behind - Don't worry! Focus on one chapter at a time. Every step counts!",
    emoji: "🚀",
    color: "text-red-600"
  },
  behind40: {
    message: "40% gap - Let's create a study plan! Reach out to your teacher for guidance.",
    emoji: "💪",
    color: "text-red-600"
  }
};

function getGapMessage(studentPercent: number, teacherPercent: number): { message: string; emoji: string; color: string; gap: number } {
  const gap = teacherPercent - studentPercent;
  
  if (gap < 0) {
    return { ...GAP_MESSAGES.ahead, gap: Math.abs(gap) };
  }
  if (gap === 0) {
    return { ...GAP_MESSAGES.perfect, gap: 0 };
  }
  if (gap <= 5) {
    return { ...GAP_MESSAGES.behind5, gap };
  }
  if (gap <= 10) {
    return { ...GAP_MESSAGES.behind10, gap };
  }
  if (gap <= 15) {
    return { ...GAP_MESSAGES.behind15, gap };
  }
  if (gap <= 20) {
    return { ...GAP_MESSAGES.behind20, gap };
  }
  if (gap <= 30) {
    return { ...GAP_MESSAGES.behind30, gap };
  }
  return { ...GAP_MESSAGES.behind40, gap };
}

export function StudentProgressComparison({ subject, studentProgress, syllabusId }: StudentProgressComparisonProps) {
  const { user } = useAuthStore();
  const { progress, studentSelectedEnrollment } = useAppStore();
  
  const [taughtProgress, setTaughtProgress] = useState<TaughtProgress | null>(null);
  const [displayMode, setDisplayMode] = useState<'A' | 'B' | 'C' | 'D'>('A');
  
  // Subscribe to teacher's taught progress
  useEffect(() => {
    if (!user) return;
    
    let unsubscribe: (() => void) | undefined;
    
    // Determine which subjectId to use for progress lookup
    // Priority: syllabusId prop > enrollment's subjectId > subject.id
    const progressSubjectId = syllabusId || studentSelectedEnrollment?.subjectId || subject.id;
    
    console.log('[StudentProgressComparison] Looking for progress with subjectId:', progressSubjectId, {
      syllabusId,
      enrollmentSubjectId: studentSelectedEnrollment?.subjectId,
      subjectId: subject.id
    });
    
    if (user.independentTeacherId) {
      // Get taught progress from independent teacher
      unsubscribe = subscribeToTaughtProgress(user.independentTeacherId, progressSubjectId, (tp) => {
        console.log('[StudentProgressComparison] Got progress from independent teacher:', tp?.overallProgress);
        setTaughtProgress(tp);
      });
    } else if (user.instituteId) {
      // For institute students, get all taught progress for this institute
      // and filter by the subject
      unsubscribe = subscribeToAllTaughtProgressForInstitute(user.instituteId, (progressList) => {
        console.log('[StudentProgressComparison] All institute progress:', progressList.map(p => ({ subjectId: p.subjectId, progress: p.overallProgress })));
        
        // Try multiple matching strategies
        let subjectProgress = null;
        
        // 1. First try exact match with syllabusId
        if (syllabusId) {
          subjectProgress = progressList.find(p => p.subjectId === syllabusId);
          console.log('[StudentProgressComparison] Tried syllabusId match:', syllabusId, 'found:', !!subjectProgress);
        }
        
        // 2. Try with underscore format (class11_chemistry)
        if (!subjectProgress && syllabusId) {
          const underscoreFormat = syllabusId.includes(' ') ? syllabusId.replace(/ /g, '_') : syllabusId;
          subjectProgress = progressList.find(p => p.subjectId === underscoreFormat);
          console.log('[StudentProgressComparison] Tried underscore format:', underscoreFormat, 'found:', !!subjectProgress);
        }
        
        // 3. Try with space format (class11 chemistry)
        if (!subjectProgress && syllabusId) {
          const spaceFormat = syllabusId.includes('_') ? syllabusId.replace(/_/g, ' ') : syllabusId;
          subjectProgress = progressList.find(p => p.subjectId === spaceFormat);
          console.log('[StudentProgressComparison] Tried space format:', spaceFormat, 'found:', !!subjectProgress);
        }
        
        // 4. Try enrollment's subjectId
        if (!subjectProgress && studentSelectedEnrollment?.subjectId) {
          subjectProgress = progressList.find(p => p.subjectId === studentSelectedEnrollment.subjectId);
          console.log('[StudentProgressComparison] Tried enrollment subjectId:', studentSelectedEnrollment.subjectId, 'found:', !!subjectProgress);
        }
        
        // 5. Fallback to subject.id
        if (!subjectProgress) {
          subjectProgress = progressList.find(p => p.subjectId === subject.id);
          console.log('[StudentProgressComparison] Tried subject.id fallback:', subject.id, 'found:', !!subjectProgress);
        }
        
        console.log('[StudentProgressComparison] Final progress found:', subjectProgress?.overallProgress);
        setTaughtProgress(subjectProgress || null);
      });
    }
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, subject.id, studentSelectedEnrollment, syllabusId]);
  
  // Calculate teacher's overall progress
  const teacherProgress = useMemo(() => {
    if (!taughtProgress) return 0;
    return taughtProgress.overallProgress || 0;
  }, [taughtProgress]);
  
  // Calculate chapter-wise comparison
  const chapterComparison = useMemo(() => {
    if (!subject.chapters || !progress) return [];
    
    return subject.chapters.map((chapter) => {
      // Student progress for this chapter
      const chapterProgressItems = progress.items.filter((item) =>
        chapter.topics.some((t) => t.id === item.topicId)
      );
      
      let studentChapterProgress = 0;
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
          studentChapterProgress += (completed / 5) * 100;
        }
      });
      studentChapterProgress = chapter.topics.length > 0 
        ? studentChapterProgress / chapter.topics.length 
        : 0;
      
      // Teacher progress for this chapter
      let teacherChapterProgress = 0;
      if (taughtProgress) {
        const taughtTopics = chapter.topics.filter((topic) =>
          taughtProgress.items.some((item) => item.topicId === topic.id && item.taught)
        );
        teacherChapterProgress = chapter.topics.length > 0
          ? (taughtTopics.length / chapter.topics.length) * 100
          : 0;
      }
      
      // Topics to do (taught by teacher but not completed by student)
      const topicsToDo = chapter.topics.filter((topic) => {
        const isTaught = taughtProgress?.items.some(
          (item) => item.topicId === topic.id && item.taught
        );
        const studentItem = progress.items.find((item) => item.topicId === topic.id);
        const isComplete = studentItem && 
          studentItem.lectureCompleted &&
          studentItem.ncertCompleted &&
          studentItem.level1Completed &&
          studentItem.level2Completed &&
          studentItem.notesCompleted;
        
        return isTaught && !isComplete;
      });
      
      return {
        chapter,
        studentProgress: studentChapterProgress,
        teacherProgress: teacherChapterProgress,
        gap: teacherChapterProgress - studentChapterProgress,
        topicsToDo
      };
    });
  }, [subject.chapters, progress, taughtProgress]);
  
  // Get gap message
  const gapInfo = getGapMessage(studentProgress, teacherProgress);
  
  // If no teacher progress data, show a message
  if (!taughtProgress) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-6 text-center">
          <BookOpen className="w-10 h-10 mx-auto text-gray-400 mb-3" />
          <p className="text-muted-foreground">
            Teacher's syllabus progress will appear here once they start tracking.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Display Mode Selector */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={displayMode === 'A' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setDisplayMode('A')}
          className={displayMode === 'A' ? 'bg-purple-600' : ''}
        >
          <Target className="w-4 h-4 mr-1" />
          Gap Indicator
        </Button>
        <Button
          variant={displayMode === 'B' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setDisplayMode('B')}
          className={displayMode === 'B' ? 'bg-purple-600' : ''}
        >
          <MessageSquare className="w-4 h-4 mr-1" />
          Motivation
        </Button>
        <Button
          variant={displayMode === 'C' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setDisplayMode('C')}
          className={displayMode === 'C' ? 'bg-purple-600' : ''}
        >
          <BarChart3 className="w-4 h-4 mr-1" />
          Chapter-wise
        </Button>
        <Button
          variant={displayMode === 'D' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setDisplayMode('D')}
          className={displayMode === 'D' ? 'bg-purple-600' : ''}
        >
          <ListTodo className="w-4 h-4 mr-1" />
          To-Do List
        </Button>
      </div>
      
      {/* Mode A: Gap Indicator */}
      {displayMode === 'A' && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              Progress Gap Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Visual Comparison */}
            <div className="grid grid-cols-2 gap-4">
              {/* Teacher Progress */}
              <div className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-2">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="text-blue-100" />
                    <circle
                      cx="48" cy="48" r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={251}
                      strokeDashoffset={251 - (251 * teacherProgress) / 100}
                      className="text-blue-600 transition-all duration-1000"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-blue-600">{Math.round(teacherProgress)}%</span>
                  </div>
                </div>
                <p className="font-medium text-blue-600">Teacher</p>
                <p className="text-xs text-muted-foreground">Syllabus Taught</p>
              </div>
              
              {/* Student Progress */}
              <div className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-2">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="text-purple-100" />
                    <circle
                      cx="48" cy="48" r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={251}
                      strokeDashoffset={251 - (251 * studentProgress) / 100}
                      className="text-purple-600 transition-all duration-1000"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-purple-600">{Math.round(studentProgress)}%</span>
                  </div>
                </div>
                <p className="font-medium text-purple-600">You</p>
                <p className="text-xs text-muted-foreground">Your Progress</p>
              </div>
            </div>
            
            {/* Gap Display */}
            <div className={`p-4 rounded-lg ${gapInfo.gap === 0 ? 'bg-blue-50' : gapInfo.gap < 0 ? 'bg-green-50' : gapInfo.gap <= 10 ? 'bg-yellow-50' : gapInfo.gap <= 20 ? 'bg-orange-50' : 'bg-red-50'}`}>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl">{gapInfo.emoji}</span>
                <div className="text-center">
                  <p className={`text-2xl font-bold ${gapInfo.color}`}>
                    {gapInfo.gap === 0 ? 'On Track!' : gapInfo.gap < 0 ? `${gapInfo.gap}% Ahead!` : `${gapInfo.gap}% Behind`}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Progress Bar Comparison */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm w-16 text-blue-600">Teacher</span>
                <Progress value={teacherProgress} className="h-3 flex-1" />
                <span className="text-sm w-12 text-right">{Math.round(teacherProgress)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm w-16 text-purple-600">You</span>
                <Progress value={studentProgress} className="h-3 flex-1 [&>div]:bg-purple-600" />
                <span className="text-sm w-12 text-right">{Math.round(studentProgress)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Mode B: Motivational Messages */}
      {displayMode === 'B' && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              Your Study Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Main Message Card */}
            <div className={`p-6 rounded-xl ${gapInfo.gap === 0 ? 'bg-gradient-to-r from-blue-100 to-blue-50' : gapInfo.gap < 0 ? 'bg-gradient-to-r from-green-100 to-green-50' : gapInfo.gap <= 10 ? 'bg-gradient-to-r from-yellow-100 to-yellow-50' : gapInfo.gap <= 20 ? 'bg-gradient-to-r from-orange-100 to-orange-50' : 'bg-gradient-to-r from-red-100 to-red-50'}`}>
              <div className="text-center">
                <span className="text-5xl mb-3 block">{gapInfo.emoji}</span>
                <p className={`text-xl font-semibold ${gapInfo.color}`}>
                  {gapInfo.message}
                </p>
              </div>
            </div>
            
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{Math.round(teacherProgress)}%</p>
                <p className="text-xs text-muted-foreground">Teacher's Progress</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{Math.round(studentProgress)}%</p>
                <p className="text-xs text-muted-foreground">Your Progress</p>
              </div>
              <div className={`text-center p-3 rounded-lg ${gapInfo.gap === 0 ? 'bg-blue-50' : gapInfo.gap < 0 ? 'bg-green-50' : gapInfo.gap <= 10 ? 'bg-yellow-50' : gapInfo.gap <= 20 ? 'bg-orange-50' : 'bg-red-50'}`}>
                <p className={`text-2xl font-bold ${gapInfo.color}`}>{gapInfo.gap === 0 ? '0%' : gapInfo.gap < 0 ? `+${Math.abs(gapInfo.gap)}%` : `-${gapInfo.gap}%`}</p>
                <p className="text-xs text-muted-foreground">Gap</p>
              </div>
            </div>
            
            {/* Motivational Tips */}
            {gapInfo.gap > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  Quick Tips to Catch Up:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Focus on topics your teacher has already covered</li>
                  <li>• Complete at least 2 topics per day</li>
                  <li>• Review NCERT content first, then practice questions</li>
                  {gapInfo.gap > 15 && <li>• Consider asking your teacher for extra guidance</li>}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Mode C: Chapter-wise Comparison */}
      {displayMode === 'C' && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              Chapter-wise Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {chapterComparison.map((item) => (
                <div key={item.chapter.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">
                      Ch {item.chapter.chapterNo}: {item.chapter.name}
                    </span>
                    <Badge variant={item.gap <= 0 ? 'default' : item.gap <= 10 ? 'secondary' : 'destructive'} 
                      className={item.gap <= 0 ? 'bg-green-600' : ''}>
                      {item.gap === 0 ? 'On Track' : item.gap < 0 ? 'Ahead' : `${item.gap}% gap`}
                    </Badge>
                  </div>
                  
                  {/* Dual Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs w-12 text-blue-600">Teacher</span>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all"
                          style={{ width: `${item.teacherProgress}%` }}
                        />
                      </div>
                      <span className="text-xs w-10 text-right">{Math.round(item.teacherProgress)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs w-12 text-purple-600">You</span>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 transition-all"
                          style={{ width: `${item.studentProgress}%` }}
                        />
                      </div>
                      <span className="text-xs w-10 text-right">{Math.round(item.studentProgress)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Mode D: To-Do List */}
      {displayMode === 'D' && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-purple-600" />
              Topics To Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Topics your teacher has covered but you haven't completed yet:
            </p>
            
            {chapterComparison.some(c => c.topicsToDo.length > 0) ? (
              <div className="space-y-4">
                {chapterComparison
                  .filter(c => c.topicsToDo.length > 0)
                  .map((item) => (
                    <div key={item.chapter.id}>
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="w-4 h-4 text-purple-600" />
                        <span className="font-medium text-sm">
                          Chapter {item.chapter.chapterNo}: {item.chapter.name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {item.topicsToDo.length} to complete
                        </Badge>
                      </div>
                      <div className="space-y-1 ml-6">
                        {item.topicsToDo.map((topic) => (
                          <div 
                            key={topic.id}
                            className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                          >
                            <Circle className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{topic.topicNo}. {topic.name}</span>
                            <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-3" />
                <p className="font-medium text-green-600">All caught up!</p>
                <p className="text-sm text-muted-foreground">
                  You've completed all topics your teacher has covered.
                </p>
              </div>
            )}
            
            {/* Summary Stats */}
            <div className="mt-4 p-3 bg-purple-50 rounded-lg">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold text-purple-600">
                    {chapterComparison.reduce((sum, c) => sum + c.topicsToDo.length, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Topics to do</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-blue-600">
                    {taughtProgress?.items.filter(i => i.taught).length || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Taught by teacher</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-green-600">
                    {subject.chapters?.reduce((sum, ch) => sum + (ch.topics?.length || 0), 0) || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Total topics</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
