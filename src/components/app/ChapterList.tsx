'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import { BookOpen, CheckCircle2, ChevronRight } from 'lucide-react';

export function ChapterList() {
  const { chapters, progress, setCurrentView, setSelectedChapterId } = useAppStore();

  const handleChapterClick = (chapterId: string) => {
    setSelectedChapterId(chapterId);
    setCurrentView('chapter-detail');
  };

  // Calculate progress for each chapter
  const getChapterProgress = (chapterId: string) => {
    const chapter = chapters.find((c) => c.id === chapterId);
    if (!chapter || !progress) return 0;

    const chapterProgressItems = progress.items.filter((item) =>
      chapter.topics.some((t) => t.id === item.topicId)
    );

    const totalTopicsInChapter = chapter.topics.length;
    if (totalTopicsInChapter === 0) return 0;

    let totalProgress = 0;
    
    // For each topic in this chapter, calculate its progress
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
      // If no progress item exists, topic contributes 0%
    });

    return totalProgress / totalTopicsInChapter;
  };

  const isChapterComplete = (chapterId: string) => {
    return getChapterProgress(chapterId) === 100;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Chapters</h1>
        <p className="text-muted-foreground">CBSE Class 12 Chemistry - All 10 Chapters</p>
      </div>

      {/* Overall Progress */}
      <Card className="bg-gradient-to-r from-purple-50 to-white border-purple-100">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Overall Progress</span>
            <span className="text-purple-600 font-semibold">
              {Math.round(progress?.overallProgress || 0)}%
            </span>
          </div>
          <Progress value={progress?.overallProgress || 0} className="h-3" />
        </CardContent>
      </Card>

      {/* Chapter List */}
      <div className="grid gap-4">
        {chapters.map((chapter, index) => {
          const chapterProgress = getChapterProgress(chapter.id);
          const isComplete = isChapterComplete(chapter.id);
          
          return (
            <motion.div
              key={chapter.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className={`cursor-pointer hover:shadow-md transition-all hover:border-purple-300 ${
                  isComplete ? 'border-green-200 bg-green-50/50' : ''
                }`}
                onClick={() => handleChapterClick(chapter.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Chapter Number */}
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                        isComplete
                          ? 'bg-green-100 text-green-700'
                          : chapterProgress > 0
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {isComplete ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : (
                        chapter.chapterNo
                      )}
                    </div>

                    {/* Chapter Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {chapter.name}
                        </h3>
                        {isComplete && (
                          <Badge className="bg-green-100 text-green-700 text-xs">
                            Complete
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {chapter.topics.length} topics
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <Progress value={chapterProgress} className="h-2 flex-1" />
                        <span className="text-sm font-medium text-purple-600">
                          {Math.round(chapterProgress)}%
                        </span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
