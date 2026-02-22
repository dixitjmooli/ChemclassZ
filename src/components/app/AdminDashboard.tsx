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
} from 'lucide-react';

export function AdminDashboard() {
  const { chapters, allStudents, allProgress, allTestMarks } = useAppStore();

  // Calculate analytics
  const analytics = useMemo(() => {
    // Class average progress
    const classAverage = allProgress.length > 0
      ? allProgress.reduce((sum, p) => sum + (p.overallProgress || 0), 0) / allProgress.length
      : 0;

    // Chapter completion stats
    const chapterStats = chapters.map((chapter) => {
      const progressValues = allProgress.map((p) => {
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
      const marks = allTestMarks.filter((m) => m.chapterId === chapter.id);
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
    const passingMarks = allTestMarks.filter((m) => m.marks >= 40).length;
    const testPassRate = allTestMarks.length > 0
      ? (passingMarks / allTestMarks.length) * 100
      : 0;

    // Student rankings
    const rankings = allStudents.map((student) => {
      const progress = allProgress.find((p) => p.userId === student.id);
      const studentMarks = allTestMarks.filter((m) => m.userId === student.id);
      
      const progressScore = progress?.overallProgress || 0;
      const testAvg = studentMarks.length > 0
        ? studentMarks.reduce((sum, m) => sum + m.marks, 0) / studentMarks.length
        : 0;
      
      const rankScore = (progressScore * 0.7) + (testAvg * 0.3);
      
      return { student, progressScore, testAvg, rankScore };
    }).sort((a, b) => b.rankScore - a.rankScore);

    const topPerformer = rankings[0] || null;
    const studentNeedingHelp = [...rankings].reverse().find(
      (r) => r.progressScore < 30 || r.testAvg < 40
    ) || null;

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
      topPerformer: topPerformer ? {
        name: topPerformer.student.name,
        progress: topPerformer.progressScore,
        testAverage: topPerformer.testAvg,
      } : null,
      studentNeedingHelp: studentNeedingHelp ? {
        name: studentNeedingHelp.student.name,
        progress: studentNeedingHelp.progressScore,
        testAverage: studentNeedingHelp.testAvg,
      } : null,
      totalStudents: allStudents.length,
    };
  }, [chapters, allStudents, allProgress, allTestMarks]);

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

      {/* Top Performer & Student Needing Help */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {analytics.topPerformer && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-green-600 font-medium">Top Performer</p>
                    <p className="text-xl font-bold text-gray-900">{analytics.topPerformer.name}</p>
                    <div className="flex gap-4 mt-1">
                      <span className="text-sm text-muted-foreground">
                        Progress: {Math.round(analytics.topPerformer.progress)}%
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Tests: {analytics.topPerformer.testAverage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {analytics.studentNeedingHelp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-amber-600 font-medium">Needs Support</p>
                    <p className="text-xl font-bold text-gray-900">{analytics.studentNeedingHelp.name}</p>
                    <div className="flex gap-4 mt-1">
                      <span className="text-sm text-muted-foreground">
                        Progress: {Math.round(analytics.studentNeedingHelp.progress)}%
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Tests: {analytics.studentNeedingHelp.testAverage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
