'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAppStore } from '@/lib/store';
import { getChapterBadge, getOverallBadge, CHAPTER_BADGES } from '@/lib/badges';
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Target,
  Medal,
  BarChart3,
  Users,
  Search,
  Star,
  Award,
  BookOpen,
  CheckCircle2,
  XCircle,
  FileCheck,
  ArrowRightLeft,
  X,
} from 'lucide-react';

export function AnalysisView() {
  const { chapters, allStudents, allProgress, allTestMarks, allDisciplineStars } = useAppStore();
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [compareStudentId, setCompareStudentId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate chapter-wise statistics
  const chapterStats = useMemo(() => {
    return chapters.map((chapter) => {
      const progressValues = allProgress.map((p) => {
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

      const avgProgress = progressValues.length > 0
        ? progressValues.reduce((a, b) => a + b, 0) / progressValues.length
        : 0;

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

  // Get selected student details
  const selectedStudentData = useMemo(() => {
    if (!selectedStudentId) return null;

    // Get stars for a student
    const getStudentStars = (userId: string): number => {
      const stars = allDisciplineStars.find((s) => s.userId === userId);
      return stars?.stars || 0;
    };

    const student = allStudents.find((s) => s.id === selectedStudentId);
    if (!student) return null;

    const progress = allProgress.find((p) => p.userId === selectedStudentId);
    const studentMarks = allTestMarks.filter((m) => m.userId === selectedStudentId);
    const stars = getStudentStars(selectedStudentId);
    const rank = studentRankings.find((r) => r.student.id === selectedStudentId)?.rank || 0;

    // Calculate chapter progress for this student
    const chapterProgress = chapters.map((chapter) => {
      const chapterItems = progress?.items.filter((item) =>
        chapter.topics.some((t) => t.id === item.topicId)
      ) || [];
      
      let chapterProgressValue = 0;
      const totalTopicsInChapter = chapter.topics.length;
      
      if (totalTopicsInChapter > 0) {
        let totalProgress = 0;
        chapter.topics.forEach((topic) => {
          const progressItem = chapterItems.find((item) => item.topicId === topic.id);
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
        chapterProgressValue = totalProgress / totalTopicsInChapter;
      }

      const badge = getChapterBadge(chapterProgressValue);
      const testMark = studentMarks.find((m) => m.chapterId === chapter.id);

      return {
        chapter,
        progress: chapterProgressValue,
        badge,
        testMark: testMark ? (testMark.marks / (testMark.maxMarks || 100)) * 100 : null,
      };
    });

    // Count badges
    const badgeCounts = {
      king: chapterProgress.filter((c) => c.badge.id === 'king').length,
      warrior: chapterProgress.filter((c) => c.badge.id === 'warrior').length,
      scout: chapterProgress.filter((c) => c.badge.id === 'scout').length,
      locked: chapterProgress.filter((c) => c.badge.id === 'locked').length,
    };

    const overallBadge = getOverallBadge(progress?.overallProgress || 0);
    const testAverage = studentMarks.length > 0
      ? studentMarks.reduce((sum, m) => sum + m.marks, 0) / studentMarks.length
      : 0;

    return {
      student,
      progress: progress?.overallProgress || 0,
      stars,
      rank,
      testAverage,
      overallBadge,
      chapterProgress,
      badgeCounts,
      testCount: studentMarks.length,
      passedTests: studentMarks.filter((m) => m.marks >= 40).length,
    };
  }, [selectedStudentId, allStudents, allProgress, allTestMarks, allDisciplineStars, chapters, studentRankings]);

  // Get compare student details
  const compareStudentData = useMemo(() => {
    if (!compareStudentId) return null;

    // Get stars for a student
    const getStudentStars = (userId: string): number => {
      const stars = allDisciplineStars.find((s) => s.userId === userId);
      return stars?.stars || 0;
    };

    const student = allStudents.find((s) => s.id === compareStudentId);
    if (!student) return null;

    const progress = allProgress.find((p) => p.userId === compareStudentId);
    const studentMarks = allTestMarks.filter((m) => m.userId === compareStudentId);
    const stars = getStudentStars(compareStudentId);
    const rank = studentRankings.find((r) => r.student.id === compareStudentId)?.rank || 0;

    const overallBadge = getOverallBadge(progress?.overallProgress || 0);
    const testAverage = studentMarks.length > 0
      ? studentMarks.reduce((sum, m) => sum + m.marks, 0) / studentMarks.length
      : 0;

    // Calculate chapter progress for this student
    const chapterProgress = chapters.map((chapter) => {
      const chapterItems = progress?.items.filter((item) =>
        chapter.topics.some((t) => t.id === item.topicId)
      ) || [];
      
      let chapterProgressValue = 0;
      const totalTopicsInChapter = chapter.topics.length;
      
      if (totalTopicsInChapter > 0) {
        let totalProgress = 0;
        chapter.topics.forEach((topic) => {
          const progressItem = chapterItems.find((item) => item.topicId === topic.id);
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
        chapterProgressValue = totalProgress / totalTopicsInChapter;
      }

      const badge = getChapterBadge(chapterProgressValue);
      const testMark = studentMarks.find((m) => m.chapterId === chapter.id);

      return {
        chapter,
        progress: chapterProgressValue,
        badge,
        testMark: testMark ? (testMark.marks / (testMark.maxMarks || 100)) * 100 : null,
      };
    });

    const badgeCounts = {
      king: chapterProgress.filter((c) => c.badge.id === 'king').length,
      warrior: chapterProgress.filter((c) => c.badge.id === 'warrior').length,
      scout: chapterProgress.filter((c) => c.badge.id === 'scout').length,
      locked: chapterProgress.filter((c) => c.badge.id === 'locked').length,
    };

    return {
      student,
      progress: progress?.overallProgress || 0,
      stars,
      rank,
      testAverage,
      overallBadge,
      chapterProgress,
      badgeCounts,
      testCount: studentMarks.length,
      passedTests: studentMarks.filter((m) => m.marks >= 40).length,
    };
  }, [compareStudentId, allStudents, allProgress, allTestMarks, allDisciplineStars, chapters, studentRankings]);

  // Filter students for selection
  const filteredStudents = allStudents.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analysis</h1>
        <p className="text-muted-foreground">Detailed performance analysis</p>
      </div>

      {/* Student Selector & Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            View Student Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Primary Student Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Student:</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 mb-2"
                />
              </div>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a student" />
                </SelectTrigger>
                <SelectContent>
                  {filteredStudents.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name} ({student.school})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Compare Student Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4" />
                Compare with:
              </label>
              <Select value={compareStudentId} onValueChange={setCompareStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose another student" />
                </SelectTrigger>
                <SelectContent>
                  {filteredStudents
                    .filter((s) => s.id !== selectedStudentId)
                    .map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name} ({student.school})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {compareStudentId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCompareStudentId('')}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear Comparison
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Details / Comparison View */}
      {(selectedStudentData || compareStudentData) && (
        <div className={`grid gap-6 ${compareStudentData ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
          {/* Primary Student Card */}
          {selectedStudentData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-purple-200">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-white">
                  <CardTitle className="flex items-center justify-between">
                    <span>{selectedStudentData.student.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-purple-100 text-purple-700">
                        Rank #{selectedStudentData.rank}
                      </Badge>
                    </div>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{selectedStudentData.student.school}</p>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">{Math.round(selectedStudentData.progress)}%</p>
                      <p className="text-xs text-muted-foreground">Progress</p>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <p className="text-2xl font-bold text-yellow-600">{selectedStudentData.stars} ⭐</p>
                      <p className="text-xs text-muted-foreground">Stars</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{selectedStudentData.testAverage.toFixed(1)}%</p>
                      <p className="text-xs text-muted-foreground">Test Avg</p>
                    </div>
                  </div>

                  {/* Overall Badge */}
                  <div className="flex items-center justify-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-3xl">{selectedStudentData.overallBadge.icon}</span>
                    <div>
                      <p className="font-semibold">{selectedStudentData.overallBadge.name}</p>
                      <p className="text-xs text-muted-foreground">Overall Badge</p>
                    </div>
                  </div>

                  {/* Badge Counts */}
                  <div>
                    <p className="text-sm font-medium mb-2">Chapter Badges:</p>
                    <div className="grid grid-cols-4 gap-2">
                      {CHAPTER_BADGES.slice().reverse().map((badge) => {
                        const count = selectedStudentData.badgeCounts[badge.id as keyof typeof selectedStudentData.badgeCounts] || 0;
                        return (
                          <div key={badge.id} className={`p-2 rounded text-center ${badge.bgColor}`}>
                            <span className="text-lg">{badge.icon}</span>
                            <p className="font-bold">{count}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tests */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-green-600" />
                      <span className="text-sm">{selectedStudentData.passedTests} passed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm">{selectedStudentData.testCount - selectedStudentData.passedTests} failed</span>
                    </div>
                  </div>

                  {/* Chapter Progress Table */}
                  <div>
                    <p className="text-sm font-medium mb-2">Chapter Progress:</p>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {selectedStudentData.chapterProgress.map((cp) => (
                        <div key={cp.chapter.id} className="flex items-center gap-2 text-sm">
                          <span className="text-base">{cp.badge.icon}</span>
                          <span className="flex-1 truncate">Ch {cp.chapter.chapterNo}</span>
                          <Progress value={cp.progress} className="w-16 h-2" />
                          <span className="w-10 text-right">{Math.round(cp.progress)}%</span>
                          {cp.testMark !== null && (
                            <Badge variant="outline" className="text-xs">
                              {cp.testMark.toFixed(0)}%
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Compare Student Card */}
          {compareStudentData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-blue-200">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-white">
                  <CardTitle className="flex items-center justify-between">
                    <span>{compareStudentData.student.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-100 text-blue-700">
                        Rank #{compareStudentData.rank}
                      </Badge>
                    </div>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{compareStudentData.student.school}</p>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">{Math.round(compareStudentData.progress)}%</p>
                      <p className="text-xs text-muted-foreground">Progress</p>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <p className="text-2xl font-bold text-yellow-600">{compareStudentData.stars} ⭐</p>
                      <p className="text-xs text-muted-foreground">Stars</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{compareStudentData.testAverage.toFixed(1)}%</p>
                      <p className="text-xs text-muted-foreground">Test Avg</p>
                    </div>
                  </div>

                  {/* Overall Badge */}
                  <div className="flex items-center justify-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-3xl">{compareStudentData.overallBadge.icon}</span>
                    <div>
                      <p className="font-semibold">{compareStudentData.overallBadge.name}</p>
                      <p className="text-xs text-muted-foreground">Overall Badge</p>
                    </div>
                  </div>

                  {/* Badge Counts */}
                  <div>
                    <p className="text-sm font-medium mb-2">Chapter Badges:</p>
                    <div className="grid grid-cols-4 gap-2">
                      {CHAPTER_BADGES.slice().reverse().map((badge) => {
                        const count = compareStudentData.badgeCounts[badge.id as keyof typeof compareStudentData.badgeCounts] || 0;
                        return (
                          <div key={badge.id} className={`p-2 rounded text-center ${badge.bgColor}`}>
                            <span className="text-lg">{badge.icon}</span>
                            <p className="font-bold">{count}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tests */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm">{compareStudentData.passedTests} passed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm">{compareStudentData.testCount - compareStudentData.passedTests} failed</span>
                    </div>
                  </div>

                  {/* Chapter Progress Table */}
                  <div>
                    <p className="text-sm font-medium mb-2">Chapter Progress:</p>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {compareStudentData.chapterProgress.map((cp) => (
                        <div key={cp.chapter.id} className="flex items-center gap-2 text-sm">
                          <span className="text-base">{cp.badge.icon}</span>
                          <span className="flex-1 truncate">Ch {cp.chapter.chapterNo}</span>
                          <Progress value={cp.progress} className="w-16 h-2" />
                          <span className="w-10 text-right">{Math.round(cp.progress)}%</span>
                          {cp.testMark !== null && (
                            <Badge variant="outline" className="text-xs">
                              {cp.testMark.toFixed(0)}%
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      )}

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
