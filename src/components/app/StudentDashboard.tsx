'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAppStore, type User } from '@/lib/store';
import { BookOpen, Trophy, Target, TrendingUp } from 'lucide-react';

interface StudentDashboardProps {
  user: User;
}

export function StudentDashboard({ user }: StudentDashboardProps) {
  const progress = useAppStore((state) => state.progress);
  const chapters = useAppStore((state) => state.chapters);
  const allTestMarks = useAppStore((state) => state.allTestMarks);

  // Calculate test average
  const userTests = allTestMarks.filter((t) => t.userId === user.id);
  const testAverage = userTests.length > 0
    ? userTests.reduce((sum, t) => sum + t.marks, 0) / userTests.length
    : 0;

  // Calculate chapters completed - ALL topics in chapter must be 100% complete
  const completedChapters = chapters.filter((chapter) => {
    const chapterTopics = chapter.topics;
    const chapterProgressItems = progress?.items.filter((item) =>
      chapterTopics.some((t) => t.id === item.topicId)
    ) || [];
    
    // Check if ALL topics in this chapter are complete
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

  const overallProgress = progress?.overallProgress || 0;

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user.name}!</h1>
        <p className="text-muted-foreground">Track your chemistry learning progress</p>
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

      {/* Progress Circle */}
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

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
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
                  
                  // Calculate progress - divide by TOTAL topics in chapter
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

                  return (
                    <div key={chapter.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium truncate">{chapter.name}</span>
                        <span className="text-muted-foreground">{Math.round(chapterProgress)}%</span>
                      </div>
                      <Progress value={chapterProgress} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
