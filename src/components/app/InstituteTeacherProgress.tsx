'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  User,
  Subject,
  TaughtProgress,
  subscribeToAllTaughtProgressForInstitute,
  subscribeToAllTeachers
} from '@/lib/firebase-service';
import {
  Users,
  TrendingUp,
  BookOpen,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  Trophy,
  Target,
  BarChart3
} from 'lucide-react';

interface InstituteTeacherProgressProps {
  instituteId: string;
  subjects: { id: string; name: string; classIds: string[] }[];
}

export function InstituteTeacherProgress({ instituteId, subjects }: InstituteTeacherProgressProps) {
  const { toast } = useToast();
  
  const [teachers, setTeachers] = useState<User[]>([]);
  const [taughtProgressList, setTaughtProgressList] = useState<TaughtProgress[]>([]);
  const [expandedTeachers, setExpandedTeachers] = useState<Set<string>>(new Set());

  // Subscribe to teachers and their progress
  useEffect(() => {
    if (!instituteId) return;
    
    const unsubTeachers = subscribeToAllTeachers((teacherList) => {
      setTeachers(teacherList);
    }, instituteId);
    
    const unsubProgress = subscribeToAllTaughtProgressForInstitute(instituteId, (progress) => {
      setTaughtProgressList(progress);
    });
    
    return () => {
      unsubTeachers();
      unsubProgress();
    };
  }, [instituteId]);

  const toggleTeacher = (teacherId: string) => {
    const newExpanded = new Set(expandedTeachers);
    if (newExpanded.has(teacherId)) {
      newExpanded.delete(teacherId);
    } else {
      newExpanded.add(teacherId);
    }
    setExpandedTeachers(newExpanded);
  };

  // Calculate teacher progress data
  const teacherProgressData = useMemo(() => {
    return teachers.map((teacher) => {
      // Get progress for each subject this teacher teaches
      const assignments = teacher.assignments || [];
      const assignedSubjectIds = [...new Set(assignments.map(a => a.subjectId))];
      
      const subjectProgress = assignedSubjectIds.map((subjectId) => {
        const progress = taughtProgressList.find(
          p => p.teacherId === teacher.id && p.subjectId === subjectId
        );
        const subject = subjects.find(s => s.id === subjectId);
        
        return {
          subjectId,
          subjectName: subject?.name || 'Unknown Subject',
          progress: progress?.overallProgress || 0,
          taughtTopics: progress?.items.filter(i => i.taught).length || 0,
          totalTopics: progress?.items.length || 0
        };
      });
      
      // Calculate overall progress for teacher
      const overallProgress = subjectProgress.length > 0
        ? subjectProgress.reduce((sum, sp) => sum + sp.progress, 0) / subjectProgress.length
        : 0;
      
      return {
        teacher,
        subjectProgress,
        overallProgress
      };
    });
  }, [teachers, taughtProgressList, subjects]);

  // Sort by progress (highest first)
  const sortedTeachers = [...teacherProgressData].sort((a, b) => b.overallProgress - a.overallProgress);

  // Get progress color
  const getProgressColor = (percent: number): string => {
    if (percent >= 80) return 'text-green-600';
    if (percent >= 50) return 'text-yellow-600';
    if (percent >= 25) return 'text-orange-600';
    return 'text-red-600';
  };

  const getProgressBgColor = (percent: number): string => {
    if (percent >= 80) return 'bg-green-100';
    if (percent >= 50) return 'bg-yellow-100';
    if (percent >= 25) return 'bg-orange-100';
    return 'bg-red-100';
  };

  if (teachers.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-muted-foreground">No teachers added yet</p>
          <p className="text-sm text-muted-foreground mt-1">Add teachers to track their syllabus progress</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            Teacher Progress Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">{teachers.length}</p>
              <p className="text-sm text-muted-foreground">Total Teachers</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {teacherProgressData.filter(t => t.overallProgress >= 80).length}
              </p>
              <p className="text-sm text-muted-foreground">80%+ Complete</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">
                {teacherProgressData.filter(t => t.overallProgress >= 50 && t.overallProgress < 80).length}
              </p>
              <p className="text-sm text-muted-foreground">50-80% Complete</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">
                {teacherProgressData.filter(t => t.overallProgress < 50).length}
              </p>
              <p className="text-sm text-muted-foreground">Below 50%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Teacher Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedTeachers.map((data, index) => {
              const isExpanded = expandedTeachers.has(data.teacher.id);
              const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;
              
              return (
                <Card key={data.teacher.id} className={`overflow-hidden ${index < 3 ? 'border-2 border-yellow-200' : ''}`}>
                  {/* Teacher Header */}
                  <div 
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleTeacher(data.teacher.id)}
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      )}
                      
                      <div className="flex items-center gap-2">
                        {medal && <span className="text-2xl">{medal}</span>}
                        <div>
                          <p className="font-medium">{data.teacher.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {data.subjectProgress.length} subject(s) assigned
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={`text-xl font-bold ${getProgressColor(data.overallProgress)}`}>
                          {Math.round(data.overallProgress)}%
                        </p>
                        <p className="text-xs text-muted-foreground">Overall</p>
                      </div>
                      <Badge 
                        variant="outline"
                        className={`${getProgressBgColor(data.overallProgress)} border-0`}
                      >
                        Rank #{index + 1}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Expanded Subject Details */}
                  {isExpanded && (
                    <div className="border-t bg-gray-50 p-4">
                      <p className="text-sm font-medium mb-3">Subject-wise Progress:</p>
                      <div className="space-y-3">
                        {data.subjectProgress.map((sp) => (
                          <div key={sp.subjectId} className="bg-white p-3 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{sp.subjectName}</span>
                              <span className={`font-bold ${getProgressColor(sp.progress)}`}>
                                {Math.round(sp.progress)}%
                              </span>
                            </div>
                            <Progress value={sp.progress} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-1">
                              {sp.taughtTopics} of {sp.totalTopics} topics taught
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Progress Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            Progress Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedTeachers.map((data) => (
              <div key={data.teacher.id} className="flex items-center gap-3">
                <span className="w-32 truncate font-medium text-sm">{data.teacher.name}</span>
                <div className="flex-1">
                  <Progress 
                    value={data.overallProgress} 
                    className="h-4"
                  />
                </div>
                <span className={`w-12 text-right font-bold ${getProgressColor(data.overallProgress)}`}>
                  {Math.round(data.overallProgress)}%
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
