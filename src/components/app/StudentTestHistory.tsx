'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAppStore, type User } from '@/lib/store';
import { FileCheck, TrendingUp, TrendingDown, Target, Award, BookOpen } from 'lucide-react';

interface StudentTestHistoryProps {
  user: User;
}

export function StudentTestHistory({ user }: StudentTestHistoryProps) {
  const { allTestMarks, allTests, chapters } = useAppStore();

  // Get user's test marks with details
  const testHistory = useMemo(() => {
    const userMarks = allTestMarks.filter((m) => m.userId === user.id);
    
    return userMarks.map((mark) => {
      const test = allTests.find((t) => t.id === mark.testId);
      const chapter = chapters.find((c) => c.id === mark.chapterId);
      const percentage = (mark.marks / (mark.maxMarks || 100)) * 100;
      
      return {
        id: mark.id,
        testName: test?.testName || 'Test',
        chapterName: chapter?.name || 'Unknown Chapter',
        chapterNo: chapter?.chapterNo || 0,
        marks: mark.marks,
        maxMarks: mark.maxMarks || 100,
        percentage,
        passed: percentage >= 40,
      };
    }).sort((a, b) => b.chapterNo - a.chapterNo);
  }, [allTestMarks, allTests, chapters, user.id]);

  // Calculate stats
  const stats = useMemo(() => {
    if (testHistory.length === 0) {
      return { average: 0, highest: 0, lowest: 0, passRate: 0, totalTests: 0 };
    }
    
    const totalTests = testHistory.length;
    const average = testHistory.reduce((sum, t) => sum + t.percentage, 0) / totalTests;
    const highest = Math.max(...testHistory.map((t) => t.percentage));
    const lowest = Math.min(...testHistory.map((t) => t.percentage));
    const passedTests = testHistory.filter((t) => t.passed).length;
    const passRate = (passedTests / totalTests) * 100;
    
    return { average, highest, lowest, passRate, totalTests };
  }, [testHistory]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">📝 Test History</h1>
        <p className="text-muted-foreground">View all your test marks and performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileCheck className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Tests</p>
                  <p className="text-xl font-bold">{stats.totalTests}</p>
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
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Average</p>
                  <p className="text-xl font-bold">{stats.average.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Award className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Highest</p>
                  <p className="text-xl font-bold">{stats.highest.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-red-100 rounded-lg">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Lowest</p>
                  <p className="text-xl font-bold">{stats.lowest.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Target className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pass Rate</p>
                  <p className="text-xl font-bold">{stats.passRate.toFixed(0)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Test History List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-600" />
              All Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {testHistory.length > 0 ? (
              <div className="space-y-3">
                {testHistory.map((test, index) => (
                  <motion.div
                    key={test.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 rounded-lg border ${
                      test.passed 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            Ch {test.chapterNo}
                          </Badge>
                          <span className="font-semibold">{test.chapterName}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{test.testName}</p>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold">{test.marks}</span>
                          <span className="text-muted-foreground">/ {test.maxMarks}</span>
                        </div>
                        <Badge className={test.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                          {test.percentage.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <Progress 
                        value={test.percentage} 
                        className={`h-2 ${test.passed ? 'bg-green-100' : 'bg-red-100'}`}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileCheck className="w-12 h-12 mx-auto text-muted-foreground opacity-30" />
                <p className="mt-2 text-muted-foreground">No tests taken yet</p>
                <p className="text-xs text-muted-foreground">Your test marks will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
