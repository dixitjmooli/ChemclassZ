'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/lib/store';
import {
  Subject,
  Chapter,
  TaughtProgress,
  initializeTaughtProgress,
  updateTaughtProgressItem,
  subscribeToTaughtProgress
} from '@/lib/firebase-service';
import {
  BookOpen,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  Loader2,
  TrendingUp
} from 'lucide-react';

interface TeacherSyllabusProgressProps {
  subject: Subject;
  syllabusAssigned?: boolean; // Whether syllabus has been assigned for this class-subject
  onProgressUpdate?: () => void;
}

export function TeacherSyllabusProgress({ subject, syllabusAssigned = false, onProgressUpdate }: TeacherSyllabusProgressProps) {
  const { user } = useAuthStore();
  const { toast } = useToast();

  console.log('[TeacherSyllabusProgress] subject:', subject?.id, subject?.name);
  console.log('[TeacherSyllabusProgress] syllabusAssigned prop:', syllabusAssigned);
  console.log('[TeacherSyllabusProgress] subject chapters:', subject?.chapters?.length);

  const [taughtProgress, setTaughtProgress] = useState<TaughtProgress | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);

  useEffect(() => {
    if (user?.id && subject?.id) {
      const unsub = subscribeToTaughtProgress(user.id, subject.id, (progress) => {
        setTaughtProgress(progress);
      });
      return () => unsub();
    }
  }, [user?.id, subject?.id]);

  // Use the prop to determine if syllabus is assigned
  // This is passed from parent which has access to the correct syllabusAssignment data
  const isSyllabusAssigned = syllabusAssigned;

  const initializeProgress = async () => {
    if (!user?.id || !subject?.chapters) return;
    
    setInitializing(true);
    try {
      await initializeTaughtProgress(
        user.id,
        subject.id,
        subject.chapters,
        {
          instituteId: user.instituteId,
          independentTeacherId: user.role === 'independent_teacher' ? user.id : undefined
        }
      );
      toast({ title: 'Success', description: 'Syllabus progress initialized' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setInitializing(false);
    }
  };

  const toggleChapter = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  const toggleTopicTaught = async (topicId: string, currentState: boolean) => {
    if (!user?.id || !subject?.id) return;
    
    setLoading(true);
    try {
      await updateTaughtProgressItem(user.id, subject.id, topicId, !currentState);
      onProgressUpdate?.();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getChapterProgress = (chapter: Chapter): { taught: number; total: number; percent: number } => {
    if (!taughtProgress || !chapter.topics) {
      return { taught: 0, total: chapter.topics?.length || 0, percent: 0 };
    }
    
    const chapterTopicIds = chapter.topics.map(t => t.id);
    const taughtCount = taughtProgress.items.filter(
      item => chapterTopicIds.includes(item.topicId) && item.taught
    ).length;
    
    return {
      taught: taughtCount,
      total: chapter.topics.length,
      percent: chapter.topics.length > 0 ? Math.round((taughtCount / chapter.topics.length) * 100) : 0
    };
  };

  const getProgressColor = (percent: number): string => {
    if (percent >= 80) return 'bg-green-500';
    if (percent >= 50) return 'bg-yellow-500';
    if (percent >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getProgressBgColor = (percent: number): string => {
    if (percent >= 80) return 'bg-green-100';
    if (percent >= 50) return 'bg-yellow-100';
    if (percent >= 25) return 'bg-orange-100';
    return 'bg-red-100';
  };

  // Calculate overall progress from chapters
  const calculateOverallProgress = (): { taught: number; total: number; percent: number } => {
    if (!subject.chapters) return { taught: 0, total: 0, percent: 0 };
    
    let totalTopics = 0;
    let taughtTopics = 0;
    
    subject.chapters.forEach(chapter => {
      const chapterProgress = getChapterProgress(chapter);
      totalTopics += chapterProgress.total;
      taughtTopics += chapterProgress.taught;
    });
    
    return {
      taught: taughtTopics,
      total: totalTopics,
      percent: totalTopics > 0 ? Math.round((taughtTopics / totalTopics) * 100) : 0
    };
  };

  // Don't render anything meaningful if no syllabus is assigned
  if (!isSyllabusAssigned) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="py-8 text-center">
          <BookOpen className="w-12 h-12 mx-auto text-orange-400 mb-4" />
          <h3 className="text-lg font-semibold text-orange-800 mb-2">No Syllabus Assigned</h3>
          <p className="text-muted-foreground mb-4">
            Please go to the <strong>Syllabus</strong> tab to load or select a syllabus for this class before tracking your progress.
          </p>
          <p className="text-sm text-muted-foreground">
            You can choose from predefined CBSE syllabi or create your own custom syllabus.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Show the initialize button if syllabus is assigned but progress hasn't started
  if (!taughtProgress) {
    return (
      <Card className="border-purple-200">
        <CardContent className="py-8 text-center">
          <BookOpen className="w-12 h-12 mx-auto text-purple-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Ready to Start Tracking</h3>
          <p className="text-muted-foreground mb-4">
            Your syllabus is set up. Start tracking which topics you've taught in class.
          </p>
          <Button 
            onClick={initializeProgress} 
            disabled={initializing}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {initializing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            Start Progress Tracking
          </Button>
        </CardContent>
      </Card>
    );
  }

  const overall = calculateOverallProgress();

  return (
    <div className="space-y-4">
      {/* Overall Progress Card */}
      <Card className="overflow-hidden">
        <div className={`p-1 ${getProgressBgColor(overall.percent)}`}>
          <div 
            className={`h-2 ${getProgressColor(overall.percent)} transition-all duration-500`}
            style={{ width: `${overall.percent}%` }}
          />
        </div>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              {subject.name} - Overall Progress
            </CardTitle>
            <Badge 
              variant={overall.percent >= 80 ? 'default' : 'secondary'}
              className={`text-lg px-4 py-1 ${overall.percent >= 80 ? 'bg-green-600' : ''}`}
            >
              {overall.percent}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{overall.taught} of {overall.total} topics taught</span>
            <span>•</span>
            <span>{subject.chapters?.length || 0} chapters</span>
          </div>
        </CardContent>
      </Card>

      {/* Chapter-wise Progress */}
      <div className="space-y-2">
        {subject.chapters?.map((chapter) => {
          const chapterProgress = getChapterProgress(chapter);
          
          return (
            <Card key={chapter.id} className="overflow-hidden">
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleChapter(chapter.id)}
              >
                <div className="flex items-center gap-3 flex-1">
                  {expandedChapters.has(chapter.id) ? (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">
                        Chapter {chapter.chapterNo}: {chapter.name}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                          {chapterProgress.taught}/{chapterProgress.total} topics
                        </span>
                        <Badge 
                          variant="outline"
                          className={`${getProgressBgColor(chapterProgress.percent)} border-0`}
                        >
                          {chapterProgress.percent}%
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getProgressColor(chapterProgress.percent)} transition-all duration-300`}
                        style={{ width: `${chapterProgress.percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Topics List */}
              {expandedChapters.has(chapter.id) && (
                <div className="border-t bg-gray-50 p-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {chapter.topics?.map((topic) => {
                      const topicProgress = taughtProgress.items.find(
                        item => item.topicId === topic.id
                      );
                      const isTaught = topicProgress?.taught || false;
                      
                      return (
                        <div
                          key={topic.id}
                          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                            isTaught 
                              ? 'bg-green-100 hover:bg-green-200' 
                              : 'bg-white hover:bg-gray-100 border'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTopicTaught(topic.id, isTaught);
                          }}
                        >
                          {isTaught ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-400" />
                          )}
                          <span className={`text-sm ${isTaught ? 'text-green-800 font-medium' : ''}`}>
                            {topic.topicNo}. {topic.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
