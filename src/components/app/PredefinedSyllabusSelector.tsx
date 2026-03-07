'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getPredefinedSubjectsByClass, Subject } from '@/lib/firebase-service';
import { 
  BookOpen, 
  ChevronDown, 
  ChevronRight, 
  FileText, 
  List, 
  Loader2,
  Download,
  CheckCircle2,
  GraduationCap
} from 'lucide-react';
import {
  AVAILABLE_CLASSES,
  getSubjectsForClass,
  PredefinedSubject
} from '@/lib/predefined-syllabus';

interface PredefinedSyllabusSelectorProps {
  onSelectSyllabus?: (subjectId: string, classNumber: number, subjectName: string) => void;
}

export function PredefinedSyllabusSelector({ onSelectSyllabus }: PredefinedSyllabusSelectorProps) {
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [selectedClass, setSelectedClass] = useState<number>(10);
  const [predefinedByClass, setPredefinedByClass] = useState<Record<number, Subject[]>>({});
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  // Load predefined subjects from Firebase
  useEffect(() => {
    loadPredefinedSubjects();
  }, []);

  const loadPredefinedSubjects = async () => {
    setLoading(true);
    try {
      const subjects = await getPredefinedSubjectsByClass();
      setPredefinedByClass(subjects);
    } catch (error) {
      console.error('Error loading predefined subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  // Seed predefined syllabus to Firebase
  const handleSeedSyllabus = async () => {
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
          title: 'Syllabus Seeded!',
          description: data.message,
        });
        // Reload subjects
        await loadPredefinedSubjects();
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

  const toggleSubject = (subjectId: string) => {
    const newExpanded = new Set(expandedSubjects);
    if (newExpanded.has(subjectId)) {
      newExpanded.delete(subjectId);
    } else {
      newExpanded.add(subjectId);
    }
    setExpandedSubjects(newExpanded);
  };

  const toggleChapter = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  // Get local predefined data for preview
  const getLocalPredefinedData = (classNum: number): PredefinedSubject[] => {
    return getSubjectsForClass(classNum);
  };

  const localPredefined = getLocalPredefinedData(selectedClass);
  const firebaseSubjects = predefinedByClass[selectedClass] || [];
  const hasFirebaseData = firebaseSubjects.length > 0;

  return (
    <div className="space-y-6">
      {/* Class Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            CBSE Predefined Syllabus
          </CardTitle>
          <CardDescription>
            Select a class to view and use predefined CBSE syllabus
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_CLASSES.map((classNum) => (
              <Button
                key={classNum}
                variant={selectedClass === classNum ? 'default' : 'outline'}
                onClick={() => setSelectedClass(classNum)}
                className={selectedClass === classNum ? 'bg-purple-600 hover:bg-purple-700' : ''}
              >
                Class {classNum}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Seed Button (if no data in Firebase) */}
      {!loading && !hasFirebaseData && (
        <Card className="border-dashed border-2 border-orange-300 bg-orange-50">
          <CardContent className="py-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <Download className="w-12 h-12 text-orange-500" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">No Predefined Syllabus in Database</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Click below to seed the Class {selectedClass} syllabus to your database
                </p>
              </div>
              <Button 
                onClick={handleSeedSyllabus}
                disabled={seeding}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {seeding ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Seeding...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Seed Class {selectedClass} Syllabus
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Firebase Data Status */}
      {hasFirebaseData && (
        <Card className="border-green-300 bg-green-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-medium text-green-800">
                  Class {selectedClass} Syllabus Available
                </p>
                <p className="text-sm text-green-600">
                  {firebaseSubjects.length} subject(s) ready to use
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Predefined Syllabus Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Class {selectedClass} - Available Subjects
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {/* Show Firebase data if available, otherwise show local preview */}
              {(hasFirebaseData ? firebaseSubjects : localPredefined).map((subject) => (
                <Card key={subject.id || subject.name} className="overflow-hidden">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleSubject(subject.id || subject.name)}
                  >
                    <div className="flex items-center gap-3">
                      {expandedSubjects.has(subject.id || subject.name) ? (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      )}
                      <BookOpen className="w-5 h-5 text-purple-600" />
                      <span className="font-semibold">{subject.name}</span>
                      <Badge variant="secondary" className="ml-2">
                        {subject.chapters?.length || 0} chapters
                      </Badge>
                    </div>
                    {hasFirebaseData && onSelectSyllabus && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSyllabus(subject.id, selectedClass, subject.name);
                        }}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        Select
                      </Button>
                    )}
                  </div>

                  {expandedSubjects.has(subject.id || subject.name) && (
                    <div className="border-t bg-gray-50 p-4">
                      <div className="space-y-2">
                        {subject.chapters?.map((chapter) => (
                          <div key={chapter.id || chapter.chapterNo} className="bg-white rounded-lg border">
                            <div
                              className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                              onClick={() => toggleChapter(chapter.id || `${chapter.chapterNo}`)}
                            >
                              <div className="flex items-center gap-2">
                                {expandedChapters.has(chapter.id || `${chapter.chapterNo}`) ? (
                                  <ChevronDown className="w-4 h-4 text-gray-400" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-400" />
                                )}
                                <FileText className="w-4 h-4 text-blue-600" />
                                <span>{chapter.chapterNo}. {chapter.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {chapter.topics?.length || 0} topics
                                </Badge>
                              </div>
                            </div>

                            {expandedChapters.has(chapter.id || `${chapter.chapterNo}`) && (
                              <div className="border-t px-4 py-3 bg-gray-50">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                                  {chapter.topics?.map((topic) => (
                                    <div 
                                      key={topic.id || topic.topicNo} 
                                      className="flex items-center gap-2 py-1 px-2 hover:bg-white rounded text-sm"
                                    >
                                      <List className="w-3 h-3 text-gray-400" />
                                      <span>{topic.topicNo}. {topic.name}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
