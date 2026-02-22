'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAppStore, type ProgressItem } from '@/lib/store';
import {
  ChevronLeft,
  BookOpen,
  Video,
  FileText,
  GraduationCap,
  Lightbulb,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';

interface ChapterDetailProps {
  onUpdateProgressItem: (
    topicId: string,
    field: 'lectureCompleted' | 'ncertCompleted' | 'level1Completed' | 'level2Completed' | 'notesCompleted',
    value: boolean
  ) => void;
  onUpdateHotsCompleted: (chapterId: string, value: boolean) => void;
}

const milestoneConfig = [
  { field: 'lectureCompleted' as const, label: 'Lecture', icon: Video, color: 'text-blue-600' },
  { field: 'ncertCompleted' as const, label: 'NCERT', icon: BookOpen, color: 'text-green-600' },
  { field: 'level1Completed' as const, label: 'Level 1', icon: GraduationCap, color: 'text-amber-600' },
  { field: 'level2Completed' as const, label: 'Level 2', icon: Lightbulb, color: 'text-purple-600' },
  { field: 'notesCompleted' as const, label: 'Notes', icon: FileText, color: 'text-pink-600' },
];

export function ChapterDetail({ onUpdateProgressItem, onUpdateHotsCompleted }: ChapterDetailProps) {
  const { chapters, progress, selectedChapterId, setCurrentView, pdfs } = useAppStore();

  const chapter = chapters.find((c) => c.id === selectedChapterId);
  const chapterPdf = pdfs.find((p) => p.chapterId === selectedChapterId);
  const hotsCompleted = progress?.hotsCompleted?.[selectedChapterId || ''] || false;

  if (!chapter) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Chapter not found</p>
        <Button variant="link" onClick={() => setCurrentView('chapters')}>
          Go back to chapters
        </Button>
      </div>
    );
  }

  // Calculate chapter progress
  const chapterProgressItems = progress?.items.filter((item) =>
    chapter.topics.some((t) => t.id === item.topicId)
  ) || [];

  // Calculate progress - divide by TOTAL topics in chapter, not just matching ones
  let chapterProgress = 0;
  const totalTopicsInChapter = chapter.topics.length;
  
  if (totalTopicsInChapter > 0) {
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
    
    chapterProgress = totalProgress / totalTopicsInChapter;
  }

  // Count completed topics
  const completedTopics = chapterProgressItems.filter(
    (item) =>
      item.lectureCompleted &&
      item.ncertCompleted &&
      item.level1Completed &&
      item.level2Completed &&
      item.notesCompleted
  ).length;

  const getProgressItem = (topicId: string): ProgressItem | undefined => {
    return progress?.items.find((item) => item.topicId === topicId);
  };

  const handleCheckboxChange = (
    topicId: string,
    field: 'lectureCompleted' | 'ncertCompleted' | 'level1Completed' | 'level2Completed' | 'notesCompleted',
    checked: boolean
  ) => {
    onUpdateProgressItem(topicId, field, checked);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentView('chapters')}
          className="hover:bg-purple-100"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-purple-600 border-purple-200">
              Chapter {chapter.chapterNo}
            </Badge>
            {chapterProgress === 100 && (
              <Badge className="bg-green-100 text-green-700">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Complete
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{chapter.name}</h1>
        </div>
      </div>

      {/* Progress Overview */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gradient-to-r from-purple-50 to-white border-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Chapter Progress</span>
              <span className="text-sm text-muted-foreground">
                {completedTopics}/{chapter.topics.length} topics complete
              </span>
            </div>
            <Progress value={chapterProgress} className="h-3" />
            <p className="text-right text-sm font-semibold text-purple-600 mt-1">
              {Math.round(chapterProgress)}%
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Topics */}
      <div className="space-y-4">
        {chapter.topics.map((topic, index) => {
          const progressItem = getProgressItem(topic.id);
          
          return (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium">
                      {topic.topicNo}. {topic.name}
                    </CardTitle>
                    {progressItem &&
                      progressItem.lectureCompleted &&
                      progressItem.ncertCompleted &&
                      progressItem.level1Completed &&
                      progressItem.level2Completed &&
                      progressItem.notesCompleted && (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {milestoneConfig.map((milestone) => {
                      const isChecked = progressItem?.[milestone.field] || false;
                      
                      return (
                        <label
                          key={milestone.field}
                          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-green-50 border border-green-200'
                              : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(checked) =>
                              handleCheckboxChange(topic.id, milestone.field, checked as boolean)
                            }
                          />
                          <milestone.icon className={`w-4 h-4 ${isChecked ? 'text-green-600' : milestone.color}`} />
                          <span className={`text-sm ${isChecked ? 'text-green-700 font-medium' : ''}`}>
                            {milestone.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  
                  {/* PDF Link for this topic */}
                  {chapterPdf?.topicPdfs?.[topic.id] && (
                    <a
                      href={chapterPdf.topicPdfs[topic.id]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Study Material
                    </a>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* HOTS Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">HOTS Questions</h3>
                  <p className="text-sm text-muted-foreground">Higher Order Thinking Skills</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {chapterPdf?.hotsPdf && (
                  <a
                    href={chapterPdf.hotsPdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    PDF
                  </a>
                )}
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={hotsCompleted}
                    onCheckedChange={(checked) =>
                      onUpdateHotsCompleted(chapter.id, checked as boolean)
                    }
                  />
                  <span className="text-sm font-medium">
                    {hotsCompleted ? 'Completed' : 'Mark Complete'}
                  </span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
