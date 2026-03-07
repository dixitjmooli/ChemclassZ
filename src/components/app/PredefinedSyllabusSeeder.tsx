'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  BookOpen,
  Loader2,
  Download,
  FileText,
  List,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  GraduationCap
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  PREDEFINED_SYLLABUS,
  AVAILABLE_CLASSES,
  getSubjectsForClass,
  PredefinedSubject
} from '@/lib/predefined-syllabus';

interface PredefinedSyllabusSeederProps {
  onSeedComplete?: () => void;
  embedded?: boolean; // If true, render without outer Card wrapper
}

// Stream definitions for Class 11 and 12
const STREAMS = {
  11: {
    'Science': ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
    'Commerce': ['Accountancy', 'Business Studies', 'Economics'],
    'Arts': ['History', 'Political Science', 'Geography', 'Psychology'],
  },
  12: {
    'Science': ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
    'Commerce': ['Accountancy', 'Business Studies', 'Economics'],
    'Arts': ['History', 'Political Science', 'Geography', 'Psychology'],
  }
};

export function PredefinedSyllabusSeeder({ onSeedComplete, embedded = false }: PredefinedSyllabusSeederProps) {
  const { toast } = useToast();
  
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedStream, setSelectedStream] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<PredefinedSubject | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());

  // Get available streams for selected class
  const availableStreams = useMemo(() => {
    if (!selectedClass || !STREAMS[selectedClass as keyof typeof STREAMS]) return [];
    return Object.keys(STREAMS[selectedClass as keyof typeof STREAMS]);
  }, [selectedClass]);

  // Get available subjects based on class and stream
  const availableSubjects = useMemo(() => {
    if (!selectedClass) return [];
    
    const allSubjects = getSubjectsForClass(selectedClass);
    
    // For class 9 and 10, return all subjects
    if (selectedClass === 9 || selectedClass === 10) {
      return allSubjects;
    }
    
    // For class 11 and 12, filter by stream
    if (selectedStream && STREAMS[selectedClass as keyof typeof STREAMS]) {
      const streamSubjects = STREAMS[selectedClass as keyof typeof STREAMS][selectedStream as keyof typeof STREAMS[11]] || [];
      return allSubjects.filter(s => streamSubjects.includes(s.name));
    }
    
    return allSubjects;
  }, [selectedClass, selectedStream]);

  // Reset stream and subject when class changes
  const handleClassChange = (classNum: string) => {
    const classNumber = parseInt(classNum);
    setSelectedClass(classNumber);
    setSelectedStream(null);
    setSelectedSubject(null);
  };

  // Reset subject when stream changes
  const handleStreamChange = (stream: string) => {
    setSelectedStream(stream);
    setSelectedSubject(null);
  };

  // Handle subject selection
  const handleSubjectChange = (subjectName: string) => {
    const subject = availableSubjects.find(s => s.name === subjectName);
    setSelectedSubject(subject || null);
  };

  // Toggle chapter expansion
  const toggleChapter = (chapterNo: number) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterNo)) {
      newExpanded.delete(chapterNo);
    } else {
      newExpanded.add(chapterNo);
    }
    setExpandedChapters(newExpanded);
  };

  // Seed the selected syllabus
  const handleSeed = async () => {
    if (!selectedClass || !selectedSubject) return;
    
    setSeeding(true);
    try {
      const response = await fetch('/api/seed-syllabus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          classNumber: selectedClass, 
          subject: selectedSubject.name 
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Syllabus Seeded Successfully!',
          description: `Class ${selectedClass} ${selectedSubject.name} syllabus has been added to database`,
        });
        onSeedComplete?.();
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to seed syllabus',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSeeding(false);
    }
  };

  // Seed all subjects for selected class/stream
  const handleSeedAll = async () => {
    if (!selectedClass) return;
    
    setSeeding(true);
    try {
      const response = await fetch('/api/seed-syllabus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classNumber: selectedClass })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'All Syllabi Seeded!',
          description: `All Class ${selectedClass} subjects have been added to database`,
        });
        onSeedComplete?.();
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to seed syllabi',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSeeding(false);
    }
  };

  const content = (
    <div className="space-y-6">
      {/* Dropdowns Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Class Dropdown */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            Select Class
          </Label>
          <Select value={selectedClass?.toString() || ''} onValueChange={handleClassChange}>
            <SelectTrigger>
              <SelectValue placeholder="Choose class..." />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_CLASSES.map((classNum) => (
                <SelectItem key={classNum} value={classNum.toString()}>
                  Class {classNum}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stream Dropdown (only for Class 11 & 12) */}
        {selectedClass && (selectedClass === 11 || selectedClass === 12) && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Select Stream
            </Label>
            <Select value={selectedStream || ''} onValueChange={handleStreamChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose stream..." />
              </SelectTrigger>
              <SelectContent>
                {availableStreams.map((stream) => (
                  <SelectItem key={stream} value={stream}>
                    {stream}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Subject Dropdown */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Select Subject
          </Label>
          <Select 
            value={selectedSubject?.name || ''} 
            onValueChange={handleSubjectChange}
            disabled={!selectedClass || ((selectedClass === 11 || selectedClass === 12) && !selectedStream)}
          >
            <SelectTrigger>
              <SelectValue placeholder={
                !selectedClass 
                  ? "Select class first..." 
                  : ((selectedClass === 11 || selectedClass === 12) && !selectedStream)
                    ? "Select stream first..."
                    : "Choose subject..."
              } />
            </SelectTrigger>
            <SelectContent>
              {availableSubjects.map((subject) => (
                <SelectItem key={subject.name} value={subject.name}>
                  {subject.name}
                  <Badge variant="outline" className="ml-2">
                    {subject.chapters.length} ch
                  </Badge>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Selected Subject Preview */}
      {selectedSubject && (
        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                  Class {selectedClass} - {selectedSubject.name}
                </CardTitle>
                <CardDescription>
                  CBSE 2025-26 Syllabus • {selectedSubject.chapters.length} Chapters
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(true)}
                >
                  Preview
                </Button>
                <Button
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={handleSeed}
                  disabled={seeding}
                >
                  {seeding ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-1" />
                      Seed Syllabus
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {selectedSubject.chapters.slice(0, 6).map((chapter) => (
                <Badge key={chapter.chapterNo} variant="secondary">
                  Ch {chapter.chapterNo}: {chapter.name}
                </Badge>
              ))}
              {selectedSubject.chapters.length > 6 && (
                <Badge variant="outline">
                  +{selectedSubject.chapters.length - 6} more chapters
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // If embedded, return content directly
  if (embedded) {
    return (
      <>
        {content}
        
        {/* Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-600" />
                {selectedSubject?.name} - Class {selectedClass}
              </DialogTitle>
              <DialogDescription>
                CBSE 2025-26 Syllabus • {selectedSubject?.chapters.length || 0} Chapters
              </DialogDescription>
            </DialogHeader>

            {selectedSubject && (
              <div className="space-y-2">
                {selectedSubject.chapters.map((chapter) => (
                  <Card key={chapter.chapterNo} className="overflow-hidden">
                    <div
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleChapter(chapter.chapterNo)}
                    >
                      <div className="flex items-center gap-2">
                        {expandedChapters.has(chapter.chapterNo) ? (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">{chapter.chapterNo}. {chapter.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {chapter.topics.length} topics
                        </Badge>
                      </div>
                    </div>

                    {expandedChapters.has(chapter.chapterNo) && (
                      <div className="border-t px-4 py-3 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                          {chapter.topics.map((topic, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <List className="w-3 h-3 text-gray-400" />
                              <span>{topic.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}

            <DialogFooter className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Close
              </Button>
              <Button
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => {
                  setShowPreview(false);
                  handleSeed();
                }}
                disabled={seeding}
              >
                {seeding ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Seed This Syllabus
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Default: wrap in Card
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            CBSE Predefined Syllabus
          </CardTitle>
          <CardDescription>
            Select class and subject to seed CBSE syllabus (2025-26)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {content}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-600" />
              {selectedSubject?.name} - Class {selectedClass}
            </DialogTitle>
            <DialogDescription>
              CBSE 2025-26 Syllabus • {selectedSubject?.chapters.length || 0} Chapters
            </DialogDescription>
          </DialogHeader>

          {selectedSubject && (
            <div className="space-y-2">
              {selectedSubject.chapters.map((chapter) => (
                <Card key={chapter.chapterNo} className="overflow-hidden">
                  <div
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleChapter(chapter.chapterNo)}
                  >
                    <div className="flex items-center gap-2">
                      {expandedChapters.has(chapter.chapterNo) ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">{chapter.chapterNo}. {chapter.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {chapter.topics.length} topics
                      </Badge>
                    </div>
                  </div>

                  {expandedChapters.has(chapter.chapterNo) && (
                    <div className="border-t px-4 py-3 bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                        {chapter.topics.map((topic, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <List className="w-3 h-3 text-gray-400" />
                            <span>{topic.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}

          <DialogFooter className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => {
                setShowPreview(false);
                handleSeed();
              }}
              disabled={seeding}
            >
              {seeding ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Seed This Syllabus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
