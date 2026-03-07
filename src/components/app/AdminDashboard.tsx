'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import {
  Users,
  TrendingUp,
  Trophy,
  AlertTriangle,
  BookOpen,
  Target,
  BarChart3,
  CheckCircle2,
  Star,
} from 'lucide-react';

export function AdminDashboard() {
  const { chapters, allStudents, allProgress, allTestMarks, allDisciplineStars } = useAppStore();

  // Calculate analytics - filtered by school (allStudents is already filtered)
  const analytics = useMemo(() => {
    // Get student IDs for filtering
    const studentIds = new Set(allStudents.map(s => s.id));
    
    // Filter progress and stars to only include students from this school
    const schoolProgress = allProgress.filter(p => studentIds.has(p.userId));
    const schoolDisciplineStars = allDisciplineStars.filter(s => studentIds.has(s.userId));
    const schoolTestMarks = allTestMarks.filter(m => studentIds.has(m.userId));
    
    // Get stars for a student
    const getStudentStars = (userId: string): number => {
      const stars = schoolDisciplineStars.find((s) => s.userId === userId);
      return stars?.stars || 0;
    };
    // Class average progress
    const classAverage = schoolProgress.length > 0
      ? schoolProgress.reduce((sum, p) => sum + (p.overallProgress || 0), 0) / schoolProgress.length
      : 0;

    // Chapter completion stats
    const chapterStats = chapters.map((chapter) => {
      const progressValues = schoolProgress.map((p) => {
        const chapterItems = p.items.filter((item) =>
          chapter.topics.some((t) => t.id === item.topicId)
        );
        
        if (chapterItems.length === 0) return 0;
        
        let total = 0;
        chapterItems.forEach((item) => {
          const completed = [
            item.lectureCompleted,
            item.ncertCompleted,
            item.level1Completed,
            item.level2Completed,
            item.notesCompleted,
          ].filter(Boolean).length;
          total += (completed / 5) * 100;
        });
        
        return total / chapterItems.length;
      });

      const avgProgress = progressValues.length > 0
        ? progressValues.reduce((a, b) => a + b, 0) / progressValues.length
        : 0;

      return { chapter, avgProgress };
    });

    // Most completed chapter
    const mostCompleted = chapterStats.reduce(
      (max, stat) => (stat.avgProgress > max.avgProgress ? stat : max),
      { chapter: null, avgProgress: 0 } as { chapter: typeof chapters[0] | null; avgProgress: number }
    );

    // Least completed chapter
    const leastCompleted = chapterStats.reduce(
      (min, stat) => (stat.avgProgress < min.avgProgress ? stat : min),
      { chapter: null, avgProgress: 100 } as { chapter: typeof chapters[0] | null; avgProgress: number }
    );

    // Test stats per chapter
    const testStats = chapters.map((chapter) => {
      const marks = schoolTestMarks.filter((m) => m.chapterId === chapter.id);
      const avg = marks.length > 0
        ? marks.reduce((sum, m) => sum + m.marks, 0) / marks.length
        : 0;
      return { chapter, avg };
    });

    const highestScoreChapter = testStats.reduce(
      (max, stat) => (stat.avg > max.avg ? stat : max),
      { chapter: null, avg: 0 } as { chapter: typeof chapters[0] | null; avg: number }
    );

    const lowestScoreChapter = testStats.reduce(
      (min, stat) => (min.avg > 0 && stat.avg > 0 && stat.avg < min.avg ? stat : min),
      { chapter: null, avg: 100 } as { chapter: typeof chapters[0] | null; avg: number }
    );

    // Test pass rate
    const passingMarks = schoolTestMarks.filter((m) => m.marks >= 40).length;
    const testPassRate = schoolTestMarks.length > 0
      ? (passingMarks / schoolTestMarks.length) * 100
      : 0;

    // Student rankings
    const rankings = allStudents.map((student) => {
      const progress = schoolProgress.find((p) => p.userId === student.id);
      const studentMarks = schoolTestMarks.filter((m) => m.userId === student.id);
      
      const progressScore = progress?.overallProgress || 0;
      
      // Calculate test average: total marks obtained / total max marks
      const totalObtained = studentMarks.reduce((sum, m) => sum + m.marks, 0);
      const totalMax = studentMarks.reduce((sum, m) => sum + (m.maxMarks || 100), 0);
      const testAvg = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
      
      const rankScore = (progressScore * 0.7) + (testAvg * 0.3);
      
      return { student, progressScore, testAvg, rankScore };
    }).sort((a, b) => b.rankScore - a.rankScore);

    // Top 3 performers
    const topPerformers = rankings.slice(0, 3).map(r => ({
      name: r.student.name,
      progress: r.progressScore,
      testAverage: r.testAvg,
      rankScore: r.rankScore,
    }));

    // Students needing support: progress < 30% OR test average < 40%
    // Get up to 3 students needing support (from lowest ranked)
    const studentsNeedingHelp = [...rankings]
      .reverse()
      .filter(r => r.progressScore < 30 || r.testAvg < 40)
      .slice(0, 3)
      .map(r => ({
        name: r.student.name,
        progress: r.progressScore,
        testAverage: r.testAvg,
        rankScore: r.rankScore,
      }));

    return {
      classAverage,
      mostCompletedChapter: mostCompleted.chapter ? {
        name: mostCompleted.chapter.name,
        avgProgress: mostCompleted.avgProgress,
      } : null,
      leastCompletedChapter: leastCompleted.chapter ? {
        name: leastCompleted.chapter.name,
        avgProgress: leastCompleted.avgProgress,
      } : null,
      highestScoreChapter: highestScoreChapter.chapter ? {
        name: highestScoreChapter.chapter.name,
        testAvg: highestScoreChapter.avg,
      } : null,
      lowestScoreChapter: lowestScoreChapter.chapter ? {
        name: lowestScoreChapter.chapter.name,
        testAvg: lowestScoreChapter.avg,
      } : null,
      testPassRate,
      topPerformers,
      studentsNeedingHelp,
      totalStudents: allStudents.length,
      // Stars leaderboard
      starsLeaderboard: [...allStudents]
        .map((student) => ({
          name: student.name,
          school: student.school,
          stars: getStudentStars(student.id),
        }))
        .sort((a, b) => b.stars - a.stars)
        .slice(0, 5),
    };
  }, [chapters, allStudents, allProgress, allTestMarks, allDisciplineStars]);

  const stats = [
    {
      title: 'Total Students',
      value: analytics.totalStudents.toString(),
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Class Average',
      value: `${Math.round(analytics.classAverage)}%`,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Test Pass Rate',
      value: `${Math.round(analytics.testPassRate)}%`,
      icon: Target,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Avg Progress',
      value: `${Math.round(analytics.classAverage)}%`,
      icon: BarChart3,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of class performance (Real-time)</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
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

      {/* Chapter Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most/Least Completed */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-600" />
                Chapter Completion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {analytics.mostCompletedChapter && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-700">Most Completed</span>
                    </div>
                    <Badge className="bg-green-100 text-green-700">
                      {Math.round(analytics.mostCompletedChapter.avgProgress)}%
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground pl-6">
                    {analytics.mostCompletedChapter.name}
                  </p>
                  <Progress value={analytics.mostCompletedChapter.avgProgress} className="h-2" />
                </div>
              )}

              {analytics.leastCompletedChapter && analytics.leastCompletedChapter.avgProgress > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span className="font-medium text-amber-700">Needs Attention</span>
                    </div>
                    <Badge className="bg-amber-100 text-amber-700">
                      {Math.round(analytics.leastCompletedChapter.avgProgress)}%
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground pl-6">
                    {analytics.leastCompletedChapter.name}
                  </p>
                  <Progress value={analytics.leastCompletedChapter.avgProgress} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Test Scores */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                Test Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {analytics.highestScoreChapter && analytics.highestScoreChapter.testAvg > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-blue-700">Highest Average</span>
                    </div>
                    <Badge className="bg-blue-100 text-blue-700">
                      {analytics.highestScoreChapter.testAvg.toFixed(1)}%
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground pl-6">
                    {analytics.highestScoreChapter.name}
                  </p>
                </div>
              )}

              {analytics.lowestScoreChapter && analytics.lowestScoreChapter.testAvg > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span className="font-medium text-red-700">Lowest Average</span>
                    </div>
                    <Badge className="bg-red-100 text-red-700">
                      {analytics.lowestScoreChapter.testAvg.toFixed(1)}%
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground pl-6">
                    {analytics.lowestScoreChapter.name}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Top 3 Performers & Students Needing Support */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 3 Performers */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                <Trophy className="w-5 h-5" />
                Top 3 Performers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics.topPerformers.length > 0 ? (
                analytics.topPerformers.map((performer, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-white/50 rounded-lg">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-100 text-gray-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{performer.name}</p>
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span>Progress: {Math.round(performer.progress)}%</span>
                        <span>Tests: {performer.testAverage.toFixed(1)}%</span>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-700">
                      {Math.round(performer.rankScore)} pts
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No students yet</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Students Needing Support */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-amber-700">
                <AlertTriangle className="w-5 h-5" />
                Needs Support
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics.studentsNeedingHelp.length > 0 ? (
                analytics.studentsNeedingHelp.map((student, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-white/50 rounded-lg">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{student.name}</p>
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span className={student.progress < 30 ? 'text-red-600 font-medium' : ''}>
                          Progress: {Math.round(student.progress)}%
                        </span>
                        <span className={student.testAverage < 40 ? 'text-red-600 font-medium' : ''}>
                          Tests: {student.testAverage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <Badge className="bg-amber-100 text-amber-700">
                      {Math.round(student.rankScore)} pts
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">All students are doing well! 🎉</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Stars Leaderboard */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-yellow-700">
              <Star className="w-5 h-5 fill-yellow-500" />
              Stars Leaderboard (Top 5)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.starsLeaderboard.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {analytics.starsLeaderboard.map((student, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-xl text-center ${
                      index === 0 ? 'bg-yellow-100 border-2 border-yellow-400' :
                      index === 1 ? 'bg-gray-100 border-2 border-gray-300' :
                      index === 2 ? 'bg-orange-100 border-2 border-orange-300' :
                      'bg-white border border-gray-200'
                    }`}
                  >
                    <div className="text-2xl mb-1">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </div>
                    <p className="font-semibold truncate">{student.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{student.school}</p>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-lg font-bold text-yellow-600">{student.stars}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No stars awarded yet</p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
