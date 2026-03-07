'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore, type SyllabusAssignment } from '@/lib/store';
import {
  getPredefinedSubjectsByClass,
  Subject,
} from '@/lib/firebase-service';
import { db } from '@/lib/firebase';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { 
  BookOpen, 
  ChevronDown, 
  ChevronRight, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
  FileText,
  List,
  Download,
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
import { PREDEFINED_SYLLABUS, type PredefinedSubject } from '@/lib/predefined-syllabus';
import { PredefinedSyllabusSeeder } from '@/components/app/PredefinedSyllabusSeeder';

interface SyllabusAssignmentManagerProps {
  onSyllabusChange?: () => void;
}

export function SyllabusAssignmentManager({ onSyllabusChange }: SyllabusAssignmentManagerProps) {
  const { user } = useAuthStore();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Teacher's classes and subjects
  const [teacherClasses, setTeacherClasses] = useState<{ id: string; name: string }[]>([]);
  const [teacherSubjects, setTeacherSubjects] = useState<{ id: string; name: string; classIds: string[] }[]>([]);
  const [syllabusAssignments, setSyllabusAssignments] = useState<SyllabusAssignment[]>([]);
  
  // Predefined syllabi from Firebase (seeded)
  const [predefinedByClass, setPredefinedByClass] = useState<Record<number, Subject[]>>({});
  
  // UI state
  const [expandedAssignments, setExpandedAssignments] = useState<Set<string>>(new Set());
  const [showSelectDialog, setShowSelectDialog] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<SyllabusAssignment | null>(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewSyllabus, setPreviewSyllabus] = useState<Subject | PredefinedSubject | null>(null);

  useEffect(() => {
    if (user) {
      loadTeacherData();
    }
  }, [user, institute]);

  const loadTeacherData = async () => {
    setLoading(true);
    try {
      // Load predefined syllabi from Firebase
      const predefined = await getPredefinedSubjectsByClass();
      setPredefinedByClass(predefined);
      
      // Load teacher's classes and subjects
      if (user?.role === 'independent_teacher') {
        setTeacherClasses(user.classes || []);
        setTeacherSubjects(user.subjects || []);
        setSyllabusAssignments(user.syllabusAssignments || []);
      } else if (user?.role === 'teacher' && user.instituteId) {
        // For institute teachers, load from institute data using assignments
        const instituteData = institute;
        if (instituteData) {
          // Get unique classes from assignments
          const assignedClassIds = new Set(user.assignments?.map(a => a.classId) || []);
          const assignedSubjectIds = new Set(user.assignments?.map(a => a.subjectId) || []);
          
          const teacherClassesList = (instituteData.classes || [])
            .filter(c => assignedClassIds.has(c.id));
          
          const teacherSubjectsList = (instituteData.subjects || [])
            .filter(s => assignedSubjectIds.has(s.id));
          
          setTeacherClasses(teacherClassesList);
          setTeacherSubjects(teacherSubjectsList);
        }
        setSyllabusAssignments(user.syllabusAssignments || []);
      }
    } catch (error) {
      console.error('Error loading teacher data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get all class-subject combinations for this teacher
  const getClassSubjectCombinations = () => {
    const combinations: { classId: string; className: string; subjectId: string; subjectName: string }[] = [];
    
    teacherSubjects.forEach(subject => {
      subject.classIds.forEach(classId => {
        const classObj = teacherClasses.find(c => c.id === classId);
        if (classObj) {
          combinations.push({
            classId,
            className: classObj.name,
            subjectId: subject.id,
            subjectName: subject.name
          });
        }
      });
    });
    
    return combinations;
  };

  // Get syllabus status for a class-subject combination
  const getSyllabusStatus = (classId: string, subjectId: string) => {
    return syllabusAssignments.find(
      a => a.classId === classId && a.subjectId === subjectId
    );
  };

  // Get available predefined syllabi for a class
  const getAvailablePredefined = (className: string) => {
    // Extract class number from class name (e.g., "Class 10" -> 10)
    const classNum = parseInt(className.replace(/\D/g, '')) || 0;
    return predefinedByClass[classNum] || [];
  };

  // Get local predefined data for preview (not yet seeded)
  const getLocalPredefined = (className: string): PredefinedSubject[] => {
    const classNum = parseInt(className.replace(/\D/g, '')) || 0;
    return PREDEFINED_SYLLABUS[classNum] || [];
  };

  // Seed predefined syllabus for a class
  const handleSeedSyllabus = async (classNum: number) => {
    setSeeding(true);
    try {
      const response = await fetch('/api/seed-syllabus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classNumber: classNum })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Syllabus Seeded!',
          description: `Class ${classNum} syllabus has been added to database`,
        });
        // Reload predefined syllabi
        const predefined = await getPredefinedSubjectsByClass();
        setPredefinedByClass(predefined);
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

  // Assign predefined syllabus to a class-subject
  const handleAssignPredefined = async (assignment: SyllabusAssignment, syllabusId: string, syllabusName: string) => {
    if (!user) return;
    
    setSaving(true);
    try {
      // Update or add the assignment
      const updatedAssignments = syllabusAssignments.filter(
        a => !(a.classId === assignment.classId && a.subjectId === assignment.subjectId)
      );
      
      updatedAssignments.push({
        ...assignment,
        syllabusId,
        syllabusType: 'predefined',
        syllabusName
      });
      
      // Save to Firestore
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        syllabusAssignments: updatedAssignments,
        updatedAt: Timestamp.now()
      });
      
      setSyllabusAssignments(updatedAssignments);
      setShowSelectDialog(false);
      setSelectedAssignment(null);
      
      toast({
        title: 'Syllabus Assigned!',
        description: `${syllabusName} has been assigned to ${assignment.className} - ${assignment.subjectName}`,
      });
      
      onSyllabusChange?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  // Remove syllabus assignment
  const handleRemoveAssignment = async (assignment: SyllabusAssignment) => {
    if (!user || !confirm('Remove syllabus assignment?')) return;
    
    setSaving(true);
    try {
      const updatedAssignments = syllabusAssignments.filter(
        a => !(a.classId === assignment.classId && a.subjectId === assignment.subjectId)
      );
      
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        syllabusAssignments: updatedAssignments,
        updatedAt: Timestamp.now()
      });
      
      setSyllabusAssignments(updatedAssignments);
      
      toast({
        title: 'Assignment Removed',
        description: 'Syllabus assignment has been removed',
      });
      
      onSyllabusChange?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleAssignment = (key: string) => {
    const newExpanded = new Set(expandedAssignments);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedAssignments(newExpanded);
  };

  const openSelectDialog = (assignment: SyllabusAssignment) => {
    setSelectedAssignment(assignment);
    setShowSelectDialog(true);
  };

  const openPreviewDialog = (syllabus: Subject | PredefinedSubject) => {
    setPreviewSyllabus(syllabus);
    setShowPreviewDialog(true);
  };

  // Render class-subject combinations
  const combinations = getClassSubjectCombinations();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Predefined Syllabus Seeder */}
      <PredefinedSyllabusSeeder 
        onSeedComplete={loadTeacherData}
        embedded={false}
      />

      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            My Teaching Assignments
          </CardTitle>
          <CardDescription>
            Manage syllabus for each class and subject you teach
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Syllabus Assigned</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span>No Syllabus</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* No assignments message */}
      {combinations.length === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="py-8 text-center">
            <GraduationCap className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-muted-foreground mb-2">No class-subject assignments found</p>
            <p className="text-sm text-muted-foreground">
              Add classes and subjects in the Classes & Subjects tabs first
            </p>
          </CardContent>
        </Card>
      )}

      {/* Class-Subject Cards */}
      <div className="space-y-4">
        {combinations.map((combo) => {
          const key = `${combo.classId}_${combo.subjectId}`;
          const status = getSyllabusStatus(combo.classId, combo.subjectId);
          const hasSyllabus = status?.syllabusId;
          const isExpanded = expandedAssignments.has(key);
          const classNum = parseInt(combo.className.replace(/\D/g, '')) || 0;
          const availablePredefined = getAvailablePredefined(combo.className);
          const localPredefined = getLocalPredefined(combo.className);
          const matchingPredefined = availablePredefined.find(s => 
            s.name.toLowerCase() === combo.subjectName.toLowerCase()
          );
          const matchingLocal = localPredefined.find(s =>
            s.name.toLowerCase() === combo.subjectName.toLowerCase()
          );
          const needsSeeding = matchingLocal && !matchingPredefined;

          return (
            <Card 
              key={key} 
              className={`overflow-hidden ${hasSyllabus ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-orange-500'}`}
            >
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleAssignment(key)}
              >
                <div className="flex items-center gap-4">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  )}
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{combo.className}</span>
                        <span className="text-gray-400">-</span>
                        <span className="font-semibold">{combo.subjectName}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {hasSyllabus ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-600">{status.syllabusName}</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-orange-600" />
                            <span className="text-sm text-orange-600">No syllabus assigned</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  {hasSyllabus ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Find the syllabus and show preview
                          const subj = availablePredefined.find(s => s.id === status.syllabusId);
                          if (subj) openPreviewDialog(subj);
                        }}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openSelectDialog({
                          classId: combo.classId,
                          className: combo.className,
                          subjectId: combo.subjectId,
                          subjectName: combo.subjectName,
                          syllabusId: null,
                          syllabusType: null
                        })}
                      >
                        Change
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700"
                      onClick={() => openSelectDialog({
                        classId: combo.classId,
                        className: combo.className,
                        subjectId: combo.subjectId,
                        subjectName: combo.subjectName,
                        syllabusId: null,
                        syllabusType: null
                      })}
                    >
                      Select Syllabus
                    </Button>
                  )}
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="border-t bg-gray-50 p-4">
                  {needsSeeding && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-orange-800">
                            Predefined syllabus available for seeding
                          </p>
                          <p className="text-sm text-orange-600">
                            CBSE Class {classNum} {combo.subjectName} ({matchingLocal?.chapters?.length || 0} chapters)
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="bg-orange-500 hover:bg-orange-600"
                          onClick={() => handleSeedSyllabus(classNum)}
                          disabled={seeding}
                        >
                          {seeding ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Download className="w-4 h-4 mr-1" />
                              Seed
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Available predefined syllabi */}
                  {availablePredefined.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Available Predefined Syllabi:</p>
                      <div className="flex flex-wrap gap-2">
                        {availablePredefined.map(subject => (
                          <div 
                            key={subject.id}
                            className={`px-3 py-2 rounded-lg border ${
                              status?.syllabusId === subject.id 
                                ? 'bg-green-50 border-green-300' 
                                : 'bg-white border-gray-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{subject.name}</span>
                              <Badge variant="secondary">{subject.chapters?.length || 0} ch</Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7"
                                onClick={() => openPreviewDialog(subject)}
                              >
                                Preview
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No predefined available */}
                  {availablePredefined.length === 0 && !needsSeeding && (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">
                        No predefined syllabus available for this subject yet.
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        You can create a custom syllabus or contact admin.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Select Syllabus Dialog */}
      <Dialog open={showSelectDialog} onOpenChange={setShowSelectDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Syllabus</DialogTitle>
            <DialogDescription>
              {selectedAssignment && (
                <>Choose a syllabus for {selectedAssignment.className} - {selectedAssignment.subjectName}</>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedAssignment && (
            <div className="space-y-4">
              {/* Predefined syllabi */}
              {(() => {
                const classNum = parseInt(selectedAssignment.className.replace(/\D/g, '')) || 0;
                const available = predefinedByClass[classNum] || [];
                
                if (available.length === 0) {
                  return (
                    <div className="text-center py-6 bg-orange-50 rounded-lg">
                      <AlertCircle className="w-8 h-8 mx-auto text-orange-500 mb-2" />
                      <p className="text-orange-800 font-medium">No predefined syllabus seeded for Class {classNum}</p>
                      <Button
                        className="mt-3 bg-orange-500 hover:bg-orange-600"
                        onClick={() => handleSeedSyllabus(classNum)}
                        disabled={seeding}
                      >
                        {seeding ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Download className="w-4 h-4 mr-2" />
                        )}
                        Seed Class {classNum} Syllabus
                      </Button>
                    </div>
                  );
                }

                return (
                  <div className="space-y-2">
                    <p className="font-medium">Predefined Syllabi:</p>
                    {available.map(subject => (
                      <div 
                        key={subject.id}
                        className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200"
                      >
                        <div className="flex items-center gap-3">
                          <BookOpen className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="font-medium">{subject.name}</p>
                            <p className="text-sm text-blue-600">
                              {subject.chapters?.length || 0} chapters
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPreviewDialog(subject)}
                          >
                            Preview
                          </Button>
                          <Button
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700"
                            onClick={() => handleAssignPredefined(selectedAssignment, subject.id, `CBSE Class ${classNum} ${subject.name}`)}
                            disabled={saving}
                          >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Select'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Current assignment info */}
              {selectedAssignment.syllabusId && (
                <div className="pt-4 border-t">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      handleRemoveAssignment(selectedAssignment);
                      setShowSelectDialog(false);
                    }}
                  >
                    Remove Current Assignment
                  </Button>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSelectDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Syllabus Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {previewSyllabus?.name || 'Syllabus'} - Syllabus Preview
            </DialogTitle>
            <DialogDescription>
              {previewSyllabus && 'classNumber' in previewSyllabus 
                ? `CBSE Class ${(previewSyllabus as PredefinedSubject).classNumber}`
                : 'Complete syllabus details'
              }
            </DialogDescription>
          </DialogHeader>

          {previewSyllabus && (
            <div className="space-y-3">
              {previewSyllabus.chapters?.map((chapter: any) => (
                <Card key={chapter.id || chapter.chapterNo}>
                  <CardContent className="py-3">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">
                        {chapter.chapterNo}. {chapter.name}
                      </span>
                      <Badge variant="outline">{chapter.topics?.length || 0} topics</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-1 pl-6">
                      {chapter.topics?.slice(0, 6).map((topic: any, i: number) => (
                        <div key={topic.id || i} className="flex items-center gap-1 text-sm text-gray-600">
                          <List className="w-3 h-3" />
                          <span className="truncate">{topic.name}</span>
                        </div>
                      ))}
                      {chapter.topics?.length > 6 && (
                        <span className="text-xs text-gray-400 pl-4">
                          +{chapter.topics.length - 6} more
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowPreviewDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
