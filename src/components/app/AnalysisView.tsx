'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAppStore } from '@/lib/store';
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Target,
  Medal,
  BarChart3,
  Users,
} from 'lucide-react';

export function AnalysisView() {
  const { chapters, allStudents, allProgress, allTestMarks } = useAppStore();

  // Calculate chapter-wise statistics
  const chapterStats = useMemo(() => {
    return chapters.map((chapter) => {
      // Get progress for this chapter from all students
      const chapterProgressData = allProgress.map((p) => {
        const chapterItems = p.items.filter((item) =>
          chapter.topics.some((t) => t.id === item.topicId)
        );
        
        if (chapterItems.length === 0) return 0;
        
        let totalProgress = 0;
        chapterItems.forEach((item) => {
          const completed = [
            item.lectureCompleted,
            item.ncertCompleted,
            item.level1Completed,
            item.level2Completed,
            item.notesCompleted,
          ].filter(Boolean).length;
          totalProgress += (completed / 5) * 100;
        });
        
        return totalProgress / chapterItems.length;
      });

      const avgProgress = chapterProgressData.length > 0
        ? chapterProgressData.reduce((a, b) => a + b, 0) / chapterProgressData.length
        : 0;

      // Get test marks for this chapter
      const chapterMarks = allTestMarks.filter((m) => m.chapterId === chapter.id);
      const avgMarks = chapterMarks.length > 0
        ? chapterMarks.reduce((a, b) => a + b.marks, 0) / chapterMarks.length
        : 0;
      const highestMark = chapterMarks.length > 0
        ? Math.max(...chapterMarks.map((m) => m.marks))
        : 0;
      const lowestMark = chapterMarks.length > 0
        ? Math.min(...chapterMarks.map((m) => m.marks))
        : 0;
      const passCount = chapterMarks.filter((m) => m.marks >= 40).length;
      const passRate = chapterMarks.length > 0
        ? (passCount / chapterMarks.length) * 100
        : 0;

      return {
        chapter,
        avgProgress,
        avgMarks,
        highestMark,
        lowestMark,
        passRate,
        testCount: chapterMarks.length,
      };
    });
  }, [chapters, allProgress, allTestMarks]);

  // Calculate student rankings
  const studentRankings = useMemo(() => {
    return allStudents
      .map((student) => {
        const progress = allProgress.find((p) => p.userId === student.id);
        const studentMarks = allTestMarks.filter((m) => m.userId === student.id);
        
        const progressScore = progress?.overallProgress || 0;
        const testAvg = studentMarks.length > 0
          ? studentMarks.reduce((a, b) => a + b.marks, 0) / studentMarks.length
          : 0;
        
        // Ranking formula: 70% progress + 30% test average
        const rankScore = (progressScore * 0.7) + (testAvg * 0.3);
        
        return {
          student,
          progressScore,
          testAvg,
          rankScore,
        };
      })
      .sort((a, b) => b.rankScore - a.rankScore)
      .map((item, index) => ({ ...item, rank: index + 1 }));
  }, [allStudents, allProgress, allTestMarks]);

  // Get top 3 and bottom 3
  const topPerformers = studentRankings.slice(0, 3);
  const needsHelp = studentRankings.filter((s) => s.progressScore < 30 || s.testAvg < 40).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analysis</h1>
        <p className="text-muted-foreground">Detailed performance analysis</p>
      </div>

      {/* Top Performers */}
      {topPerformers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topPerformers.map((item, index) => (
            <motion.div
              key={item.student.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`${
                index === 0 ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-white' :
                index === 1 ? 'border-gray-300 bg-gradient-to-br from-gray-50 to-white' :
                'border-amber-600 bg-gradient-to-br from-amber-50 to-white'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      index === 0 ? 'bg-yellow-100 text-yellow-600' :
                      index === 1 ? 'bg-gray-100 text-gray-600' :
                      'bg-amber-100 text-amber-600'
                    }`}>
                      {index === 0 ? <Trophy className="w-5 h-5" /> : <Medal className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Rank #{item.rank}</p>
                      <p className="font-semibold">{item.student.name}</p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Progress</p>
                      <p className="font-medium">{Math.round(item.progressScore)}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Test Avg</p>
                      <p className="font-medium">{item.testAvg.toFixed(1)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Students Needing Help */}
      {needsHelp.length > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-red-700">
              <TrendingDown className="w-5 h-5" />
              Students Needing Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {needsHelp.map((item) => (
                <div key={item.student.id} className="flex items-center justify-between p-2 bg-white rounded-lg">
                  <div>
                    <p className="font-medium">{item.student.name}</p>
                    <p className="text-sm text-muted-foreground">{item.student.school}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">Progress: {Math.round(item.progressScore)}%</p>
                    <p className="text-sm">Test Avg: {item.testAvg.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chapter-wise Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            Chapter-wise Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chapter</TableHead>
                <TableHead className="text-center">Avg Progress</TableHead>
                <TableHead className="text-center">Avg Test Score</TableHead>
                <TableHead className="text-center">Highest</TableHead>
                <TableHead className="text-center">Lowest</TableHead>
                <TableHead className="text-center">Pass Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chapterStats.map((stat) => (
                <TableRow key={stat.chapter.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">Ch {stat.chapter.chapterNo}: {stat.chapter.name}</p>
                      <p className="text-xs text-muted-foreground">{stat.testCount} tests taken</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Progress value={stat.avgProgress} className="w-16 h-2" />
                      <span className="text-sm">{Math.round(stat.avgProgress)}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">
                      {stat.avgMarks.toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className="bg-green-100 text-green-700">
                      {stat.highestMark.toFixed(0)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className="bg-red-100 text-red-700">
                      {stat.lowestMark.toFixed(0)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={stat.passRate >= 70 ? 'bg-green-100 text-green-700' : stat.passRate >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}>
                      {Math.round(stat.passRate)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Full Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            Student Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {studentRankings.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
              <p className="mt-2 text-muted-foreground">No students yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead className="text-center">Progress</TableHead>
                  <TableHead className="text-center">Test Avg</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentRankings.map((item) => (
                  <TableRow key={item.student.id}>
                    <TableCell>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        item.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                        item.rank === 2 ? 'bg-gray-100 text-gray-700' :
                        item.rank === 3 ? 'bg-amber-100 text-amber-700' :
                        'bg-purple-50 text-purple-700'
                      }`}>
                        {item.rank}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{item.student.name}</TableCell>
                    <TableCell>{item.student.school}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Progress value={item.progressScore} className="w-16 h-2" />
                        <span className="text-sm">{Math.round(item.progressScore)}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {item.testAvg.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-purple-100 text-purple-700">
                        {Math.round(item.rankScore)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
