'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore, useAppStore, TeacherAssignment, SyllabusAssignment } from '@/lib/store';
import {
  CustomSubject,
  createCustomSubject,
  addChapterToSubject,
  updateChapter,
  deleteChapter,
  addTopicToChapter,
  updateTopic,
  deleteTopic,
  deleteSubject,
  subscribeToCustomSubjectsForTeacher,
  subscribeToCustomSubjectsForInstitute,
  getSubjects,
  setSyllabusPreference,
  Subject,
  getUser,
  updateUser,
  syncSyllabusToStudents
} from '@/lib/firebase-service';
import {
  BookOpen,
  Plus,
  X,
  ChevronDown,
  ChevronRight,
  Trash2,
  Edit2,
  Check,
  Loader2,
  FileText,
  List,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Settings,
  Download,
  Users
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
  getSubjectsForClass,
  getAllPredefinedSubjects,
  PredefinedSubject
} from '@/lib/predefined-syllabus';

interface SyllabusManagerProps {
  onSyllabusChange?: () => void;
}

interface ClassSubjectSyllabus {
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  syllabusId: string | null;
  syllabusType: 'predefined' | 'custom' | null;
  syllabusName: string | null;
}

export function SyllabusManager({ onSyllabusChange }: SyllabusManagerProps) {
  const { user } = useAuthStore();
  const { institute, teacherSelectedAssignment } = useAppStore();
  const { toast } = useToast();
  const updateUserInAuthStore = useAuthStore((state) => state.updateUser);

  const [customSubjects, setCustomSubjects] = useState<CustomSubject[]>([]);
  const [predefinedSubjects, setPredefinedSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  
  // Class-subject syllabus assignments - use SyllabusAssignment type from store
  const [syllabusAssignments, setSyllabusAssignments] = useState<SyllabusAssignment[]>([]);

  // Form states
  const [showSubjectDialog, setShowSubjectDialog] = useState(false);
  const [showChapterDialog, setShowChapterDialog] = useState(false);
  const [showTopicDialog, setShowTopicDialog] = useState(false);
  const [showPredefinedSelector, setShowPredefinedSelector] = useState(false);
  const [selectedAssignmentForSyllabus, setSelectedAssignmentForSyllabus] = useState<ClassSubjectSyllabus | null>(null);
  
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectClasses, setNewSubjectClasses] = useState<string[]>([]);
  const [newSubjectChapters, setNewSubjectChapters] = useState<{ name: string; topics: string[] }[]>([]);
  const [newChapterName, setNewChapterName] = useState('');
  const [newChapterTopics, setNewChapterTopics] = useState<string[]>([]);
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicInput, setNewTopicInput] = useState('');
  const [newChapterInput, setNewChapterInput] = useState('');
  const [newTopicInputForChapter, setNewTopicInputForChapter] = useState('');
  
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  
  // Track if we're creating a subject for a specific class-subject assignment
  const [creatingForAssignment, setCreatingForAssignment] = useState<ClassSubjectSyllabus | null>(null);
  
  const [editingItem, setEditingItem] = useState<{ type: 'chapter' | 'topic'; id: string; subjectId: string; chapterId?: string } | null>(null);
  const [editingValue, setEditingValue] = useState('');

  // Get teacher's assignments
  const assignments = user?.assignments || [];

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    if (!user || !user.id) {
      setLoading(false);
      return;
    }
    
    const load = async () => {
      setLoading(true);
      try {
        // Load predefined subjects from Firestore
        const predefined = await getSubjects(undefined);
        setPredefinedSubjects(predefined);

        // Load user's syllabus assignments from user document
        const userData = await getUser(user.id);
        console.log('[SyllabusManager] Loaded userData:', userData?.syllabusAssignments);
        console.log('[SyllabusManager] teacherSelectedAssignment:', teacherSelectedAssignment);
        if (userData?.syllabusAssignments) {
          setSyllabusAssignments(userData.syllabusAssignments);
        }

        // Get the effective institute ID
        const effectiveInstituteId = user.instituteId || institute?.id;

        // Load custom subjects based on role
        if (user.role === 'independent_teacher') {
          unsubscribe = subscribeToCustomSubjectsForTeacher(user.id, (subjects) => {
            setCustomSubjects(subjects);
          });
        } else if (effectiveInstituteId) {
          unsubscribe = subscribeToCustomSubjectsForInstitute(effectiveInstituteId, (subjects) => {
            setCustomSubjects(subjects);
          });
        }
      } catch (error) {
        console.error('Error loading subjects:', error);
        toast({ 
          title: 'Error', 
          description: 'Failed to load syllabus data. Please try again.', 
          variant: 'destructive' 
        });
      } finally {
        setLoading(false);
      }
    };
    
    load();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user?.id, user?.instituteId, institute?.id]);

  // Build class-subject assignments with syllabus info
  // Filter to only show the SELECTED class-subject from teacherSelectedAssignment
  console.log('[SyllabusManager] assignments:', assignments);
  console.log('[SyllabusManager] Filtering by teacherSelectedAssignment:', teacherSelectedAssignment);
  
  const classSubjectAssignments: ClassSubjectSyllabus[] = assignments
    .filter(assignment => {
      const shouldInclude = teacherSelectedAssignment 
        ? assignment.classId === teacherSelectedAssignment.classId && 
          assignment.subjectId === teacherSelectedAssignment.subjectId
        : true;
      console.log('[SyllabusManager] Filter check:', {
        assignmentClassId: assignment.classId,
        assignmentSubjectId: assignment.subjectId,
        selectedClassId: teacherSelectedAssignment?.classId,
        selectedSubjectId: teacherSelectedAssignment?.subjectId,
        shouldInclude
      });
      return shouldInclude;
    })
    .map(assignment => {
      const className = institute?.classes.find(c => c.id === assignment.classId)?.name || assignment.classId;
      const subjectName = institute?.subjects.find(s => s.id === assignment.subjectId)?.name || assignment.subjectId;
      
      // Check if syllabus is assigned
      const syllabusAssignment = syllabusAssignments.find(
        sa => sa.classId === assignment.classId && sa.subjectId === assignment.subjectId
      );
      
      return {
        classId: assignment.classId,
        className,
        subjectId: assignment.subjectId,
        subjectName,
        syllabusId: syllabusAssignment?.syllabusId || null,
        syllabusType: syllabusAssignment?.syllabusType || null,
        syllabusName: syllabusAssignment?.syllabusName || null
      };
    });
  
  console.log('[SyllabusManager] Final classSubjectAssignments:', classSubjectAssignments);

  // Filter custom subjects based on selected class-subject
  const filteredCustomSubjects = useMemo(() => {
    if (!teacherSelectedAssignment) {
      // No class selected - show all custom subjects
      return customSubjects;
    }
    
    // Get class name for display
    const selectedClassName = institute?.classes.find(c => c.id === teacherSelectedAssignment.classId)?.name || 'this class';
    
    // Filter to only show custom subjects that are:
    // 1. Assigned to the selected class-subject via syllabusAssignments, OR
    // 2. Have the selected class in their classIds array
    const selectedSyllabusIds = syllabusAssignments
      .filter(sa => sa.classId === teacherSelectedAssignment.classId && 
                    sa.subjectId === teacherSelectedAssignment.subjectId &&
                    sa.syllabusType === 'custom')
      .map(sa => sa.syllabusId);
    
    return customSubjects.filter(subject => 
      selectedSyllabusIds.includes(subject.id) ||
      (subject.classIds && subject.classIds.includes(teacherSelectedAssignment.classId))
    );
  }, [customSubjects, teacherSelectedAssignment, syllabusAssignments, institute?.classes]);
  
  // Get selected class name for display
  const selectedClassNameForFilter = useMemo(() => {
    if (!teacherSelectedAssignment || !institute?.classes) return '';
    return institute.classes.find(c => c.id === teacherSelectedAssignment.classId)?.name || '';
  }, [teacherSelectedAssignment, institute?.classes]);

  // Get available predefined syllabus for a class-subject combination
  const getAvailablePredefinedForClass = (classId: string, subjectId: string) => {
    const className = institute?.classes.find(c => c.id === classId)?.name || '';
    const subjectName = institute?.subjects.find(s => s.id === subjectId)?.name || '';
    
    // Extract class number from class name (e.g., "Class 10A" -> 10)
    const classNumber = parseInt(className.match(/\d+/)?.[0] || '0');
    
    // Extract subject name - remove parentheses content like "(Class 11 Science)"
    let cleanSubjectName = subjectName.replace(/\s*\(.*?\)\s*/g, '').trim().toLowerCase();
    
    // Get all subjects for this class
    const allSubjectsForClass = getSubjectsForClass(classNumber);
    
    // Filter to only show subjects that match the teacher's subject
    return allSubjectsForClass.filter(s => 
      s.name.toLowerCase() === cleanSubjectName ||
      cleanSubjectName.includes(s.name.toLowerCase()) ||
      s.name.toLowerCase().includes(cleanSubjectName)
    );
  };

  // Handle syllabus selection for a class-subject
  const handleSelectPredefinedSyllabus = async (predefinedSubject: PredefinedSubject) => {
    if (!selectedAssignmentForSyllabus || !user) return;
    
    setSaving(true);
    try {
      // Convert predefined chapters to the format needed for createCustomSubject
      const chaptersData = predefinedSubject.chapters.map(chapter => ({
        name: chapter.name,
        topics: chapter.topics.map(t => t.name)
      }));
      
      // Create a custom subject copy for this teacher
      const customSubjectName = `CBSE Class ${predefinedSubject.classNumber} ${predefinedSubject.name}`;
      let createdSubject: CustomSubject | null = null;
      
      if (user.role === 'independent_teacher') {
        createdSubject = await createCustomSubject(customSubjectName, [], chaptersData, { 
          independentTeacherId: user.id 
        });
      } else if (user.instituteId) {
        createdSubject = await createCustomSubject(customSubjectName, [], chaptersData, { 
          instituteId: user.instituteId 
        });
      }
      
      if (createdSubject) {
        // Update syllabus assignments with the custom subject
        const newAssignments = syllabusAssignments.filter(
          a => !(a.classId === selectedAssignmentForSyllabus.classId && 
                 a.subjectId === selectedAssignmentForSyllabus.subjectId)
        );
        
        newAssignments.push({
          classId: selectedAssignmentForSyllabus.classId,
          className: selectedAssignmentForSyllabus.className,
          subjectId: selectedAssignmentForSyllabus.subjectId,
          subjectName: selectedAssignmentForSyllabus.subjectName,
          syllabusId: createdSubject.id,
          syllabusType: 'custom',
          syllabusName: customSubjectName
        });
        
        // Save to user document
        await updateUser(user.id, { syllabusAssignments: newAssignments });
        setSyllabusAssignments(newAssignments);
        
        // Also update the auth store so other components see the change immediately
        updateUserInAuthStore({ syllabusAssignments: newAssignments });
        
        toast({ 
          title: 'Syllabus Loaded!', 
          description: `${predefinedSubject.name} syllabus loaded. You can now edit it in your Custom Syllabus Library.` 
        });
      }
      
      setShowPredefinedSelector(false);
      setSelectedAssignmentForSyllabus(null);
      onSyllabusChange?.();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Handle custom syllabus selection
  const handleSelectCustomSyllabus = async (customSubject: CustomSubject) => {
    if (!selectedAssignmentForSyllabus || !user) return;
    
    setSaving(true);
    try {
      const newAssignments = syllabusAssignments.filter(
        a => !(a.classId === selectedAssignmentForSyllabus.classId && 
               a.subjectId === selectedAssignmentForSyllabus.subjectId)
      );
      
      newAssignments.push({
        classId: selectedAssignmentForSyllabus.classId,
        className: selectedAssignmentForSyllabus.className,
        subjectId: selectedAssignmentForSyllabus.subjectId,
        subjectName: selectedAssignmentForSyllabus.subjectName,
        syllabusId: customSubject.id,
        syllabusType: 'custom',
        syllabusName: customSubject.name
      });
      
      await updateUser(user.id, { syllabusAssignments: newAssignments });
      setSyllabusAssignments(newAssignments);
      
      // Also update the auth store so other components see the change immediately
      updateUserInAuthStore({ syllabusAssignments: newAssignments });
      
      toast({ 
        title: 'Syllabus Assigned', 
        description: `${customSubject.name} assigned to ${selectedAssignmentForSyllabus.className}` 
      });
      
      setShowPredefinedSelector(false);
      setSelectedAssignmentForSyllabus(null);
      onSyllabusChange?.();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
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

  // Subject functions
  const handleCreateSubject = async () => {
    if (!newSubjectName || newSubjectChapters.length === 0) {
      toast({ title: 'Error', description: 'Enter subject name and at least one chapter', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      let createdSubject: CustomSubject | null = null;
      
      if (user?.role === 'independent_teacher') {
        createdSubject = await createCustomSubject(newSubjectName, newSubjectClasses, newSubjectChapters, { 
          independentTeacherId: user.id 
        });
      } else if (user?.instituteId) {
        createdSubject = await createCustomSubject(newSubjectName, newSubjectClasses, newSubjectChapters, { 
          instituteId: user.instituteId 
        });
      }

      // If we're creating for a specific assignment, auto-assign it
      if (createdSubject && creatingForAssignment && user) {
        const newAssignments = syllabusAssignments.filter(
          a => !(a.classId === creatingForAssignment.classId && 
                 a.subjectId === creatingForAssignment.subjectId)
        );
        
        newAssignments.push({
          classId: creatingForAssignment.classId,
          className: creatingForAssignment.className,
          subjectId: creatingForAssignment.subjectId,
          subjectName: creatingForAssignment.subjectName,
          syllabusId: createdSubject.id,
          syllabusType: 'custom',
          syllabusName: newSubjectName
        });
        
        await updateUser(user.id, { syllabusAssignments: newAssignments });
        setSyllabusAssignments(newAssignments);
        updateUserInAuthStore({ syllabusAssignments: newAssignments });
        
        toast({ 
          title: 'Success', 
          description: `Subject "${newSubjectName}" created and assigned to ${creatingForAssignment.className}!` 
        });
      } else {
        toast({ title: 'Success', description: 'Subject created successfully!' });
      }
      
      setShowSubjectDialog(false);
      resetSubjectForm();
      setCreatingForAssignment(null);
      onSyllabusChange?.();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (!confirm('Delete this subject and all its chapters/topics?')) return;

    setLoading(true);
    try {
      await deleteSubject(subjectId);
      toast({ title: 'Deleted', description: 'Subject deleted' });
      onSyllabusChange?.();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Chapter functions
  const openChapterDialog = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setNewChapterName('');
    setNewChapterTopics([]);
    setShowChapterDialog(true);
  };

  const handleAddChapter = async () => {
    if (!selectedSubjectId || !newChapterName) {
      toast({ title: 'Error', description: 'Enter chapter name', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      await addChapterToSubject(selectedSubjectId, newChapterName, newChapterTopics);
      toast({ title: 'Success', description: 'Chapter added!' });
      setShowChapterDialog(false);
      setNewChapterName('');
      setNewChapterTopics([]);
      onSyllabusChange?.();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateChapter = async (subjectId: string, chapterId: string, name: string) => {
    setLoading(true);
    try {
      await updateChapter(subjectId, chapterId, name);
      toast({ title: 'Updated', description: 'Chapter name updated' });
      setEditingItem(null);
      onSyllabusChange?.();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChapter = async (subjectId: string, chapterId: string) => {
    if (!confirm('Delete this chapter and all its topics?')) return;

    setLoading(true);
    try {
      await deleteChapter(subjectId, chapterId);
      toast({ title: 'Deleted', description: 'Chapter deleted' });
      onSyllabusChange?.();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Topic functions
  const openTopicDialog = (subjectId: string, chapterId: string) => {
    setSelectedSubjectId(subjectId);
    setSelectedChapterId(chapterId);
    setNewTopicName('');
    setShowTopicDialog(true);
  };

  const handleAddTopic = async () => {
    if (!selectedSubjectId || !selectedChapterId || !newTopicName) {
      toast({ title: 'Error', description: 'Enter topic name', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      await addTopicToChapter(selectedSubjectId, selectedChapterId, newTopicName);
      toast({ title: 'Success', description: 'Topic added!' });
      setShowTopicDialog(false);
      setNewTopicName('');
      onSyllabusChange?.();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTopic = async (subjectId: string, chapterId: string, topicId: string, name: string) => {
    setLoading(true);
    try {
      await updateTopic(subjectId, chapterId, topicId, name);
      toast({ title: 'Updated', description: 'Topic name updated' });
      setEditingItem(null);
      onSyllabusChange?.();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTopic = async (subjectId: string, chapterId: string, topicId: string) => {
    if (!confirm('Delete this topic?')) return;

    setLoading(true);
    try {
      await deleteTopic(subjectId, chapterId, topicId);
      toast({ title: 'Deleted', description: 'Topic deleted' });
      onSyllabusChange?.();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Sync syllabus changes to students
  const handleSyncToStudents = async (subjectId: string) => {
    if (!user) return;
    
    // Find the class-subject assignment that uses this syllabus
    const assignment = syllabusAssignments.find(sa => sa.syllabusId === subjectId);
    if (!assignment) {
      toast({ 
        title: 'Cannot Sync', 
        description: 'This syllabus is not assigned to any class', 
        variant: 'destructive' 
      });
      return;
    }
    
    setSaving(true);
    try {
      const result = await syncSyllabusToStudents(
        subjectId,
        assignment.classId,
        user.instituteId,
        user.role === 'independent_teacher' ? user.id : undefined
      );
      
      if (result.success) {
        toast({ 
          title: 'Sync Complete!', 
          description: `Syllabus changes applied to ${result.studentsUpdated} student${result.studentsUpdated !== 1 ? 's' : ''}` 
        });
      } else {
        toast({ 
          title: 'Sync Failed', 
          description: 'Could not sync syllabus to students', 
          variant: 'destructive' 
        });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const resetSubjectForm = () => {
    setNewSubjectName('');
    setNewSubjectClasses([]);
    setNewSubjectChapters([]);
    setNewChapterInput('');
    setNewTopicInput('');
  };

  const addChapterToForm = () => {
    if (newChapterInput && newTopicInput) {
      const topics = newTopicInput.split(',').map(t => t.trim()).filter(Boolean);
      if (topics.length > 0) {
        setNewSubjectChapters([...newSubjectChapters, { name: newChapterInput, topics }]);
        setNewChapterInput('');
        setNewTopicInput('');
      }
    }
  };

  const removeChapterFromForm = (index: number) => {
    setNewSubjectChapters(newSubjectChapters.filter((_, i) => i !== index));
  };

  const addTopicToChapterForm = () => {
    if (newChapterTopics.includes(newTopicInputForChapter.trim())) return;
    setNewChapterTopics([...newChapterTopics, newTopicInputForChapter.trim()]);
    setNewTopicInputForChapter('');
  };

  const openSyllabusSelector = (assignment: ClassSubjectSyllabus) => {
    setSelectedAssignmentForSyllabus(assignment);
    setShowPredefinedSelector(true);
  };

  // Load CBSE syllabus for a specific assignment
  const handleLoadCBSESyllabus = async (assignment: ClassSubjectSyllabus) => {
    // Extract class number from class name (handles "11 Science" or "11" or "Class 11")
    const classNumber = parseInt(assignment.className.match(/\d+/)?.[0] || '0');
    
    // Check if class is supported (CBSE predefined syllabus available for 9-12)
    if (!classNumber || classNumber < 9 || classNumber > 12) {
      toast({ 
        title: 'CBSE Syllabus Not Available', 
        description: `CBSE predefined syllabus is only available for classes 9-12. Your class: ${assignment.className}. Use Create Subject instead.`, 
        variant: 'destructive' 
      });
      return;
    }
    
    // Extract subject name - handle formats like:
    // "Chemistry (Class 11 Science)" -> "Chemistry"
    // "Science (Class 6)" -> "Science"
    // "Physics" -> "Physics"
    let subjectName = assignment.subjectName;
    
    // Remove parentheses content like "(Class 11 Science)"
    subjectName = subjectName.replace(/\s*\(.*?\)\s*/g, '').trim();
    
    // Also handle "Class 11 Science" format at the beginning
    const classInName = subjectName.match(/Class\s*\d+\s*(Science|Commerce|Arts)?\s*/i);
    if (classInName) {
      subjectName = subjectName.replace(classInName[0], '').trim();
    }
    
    // Map common abbreviations to full subject names
    const subjectMap: Record<string, string> = {
      'sci': 'Science',
      'science': 'Science',
      'math': 'Mathematics',
      'maths': 'Mathematics',
      'mathematics': 'Mathematics',
      'phy': 'Physics',
      'physics': 'Physics',
      'chem': 'Chemistry',
      'chemistry': 'Chemistry',
      'bio': 'Biology',
      'biology': 'Biology',
      'sst': 'SST',
      'social': 'SST',
      'social science': 'SST',
      'accounts': 'Accountancy',
      'accountancy': 'Accountancy',
      'business': 'Business Studies',
      'business studies': 'Business Studies',
      'economics': 'Economics',
      'history': 'History',
      'pol sci': 'Political Science',
      'political science': 'Political Science',
      'geography': 'Geography',
      'psychology': 'Psychology',
      'english': 'English',
      'hindi': 'Hindi',
    };
    
    const mappedSubject = subjectMap[subjectName.toLowerCase()] || subjectName;
    
    console.log('Loading CBSE syllabus:', { classNumber, subjectName, mappedSubject, originalSubject: assignment.subjectName });
    
    setSaving(true);
    try {
      // Get the predefined syllabus for this class and subject
      const classSubjects = getSubjectsForClass(classNumber);
      const predefinedSubject = classSubjects.find(
        s => s.name.toLowerCase() === mappedSubject.toLowerCase()
      );
      
      if (!predefinedSubject) {
        toast({ 
          title: 'Error', 
          description: `Subject "${mappedSubject}" not found for Class ${classNumber}. Available: Physics, Chemistry, Maths, Biology, etc.`, 
          variant: 'destructive' 
        });
        setSaving(false);
        return;
      }
      
      // Convert predefined chapters to the format needed for createCustomSubject
      const chaptersData = predefinedSubject.chapters.map(chapter => ({
        name: chapter.name,
        topics: chapter.topics.map(t => t.name)
      }));
      
      // Create a custom subject copy for this teacher
      const customSubjectName = `CBSE Class ${classNumber} ${mappedSubject}`;
      let createdSubject: CustomSubject | null = null;
      
      if (user?.role === 'independent_teacher') {
        createdSubject = await createCustomSubject(customSubjectName, [], chaptersData, { 
          independentTeacherId: user.id 
        });
      } else if (user?.instituteId) {
        createdSubject = await createCustomSubject(customSubjectName, [], chaptersData, { 
          instituteId: user.instituteId 
        });
      }
      
      if (createdSubject) {
        // Assign this custom subject to the class-subject
        const newAssignments = syllabusAssignments.filter(
          a => !(a.classId === assignment.classId && a.subjectId === assignment.subjectId)
        );
        
        newAssignments.push({
          classId: assignment.classId,
          className: assignment.className,
          subjectId: assignment.subjectId,
          subjectName: assignment.subjectName,
          syllabusId: createdSubject.id,
          syllabusType: 'custom',
          syllabusName: customSubjectName
        });
        
        await updateUser(user!.id, { syllabusAssignments: newAssignments });
        setSyllabusAssignments(newAssignments);
        
        // Also update the auth store so other components see the change immediately
        updateUserInAuthStore({ syllabusAssignments: newAssignments });
        
        toast({ 
          title: 'Syllabus Loaded!', 
          description: `CBSE Class ${classNumber} ${mappedSubject} syllabus loaded. You can now edit it in your Custom Syllabus Library.` 
        });
        
        onSyllabusChange?.();
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Class-Subject Syllabus Assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            My Syllabus
          </CardTitle>
          <CardDescription>
            Load CBSE syllabus or create custom syllabus for your class
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : classSubjectAssignments.length === 0 ? (
            <div className="text-center py-8">
              <GraduationCap className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-muted-foreground mb-2">No class assignments yet</p>
              <p className="text-sm text-muted-foreground">
                Contact your institute administrator to get assigned to classes
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {classSubjectAssignments.map((assignment, index) => (
                <Card key={`${assignment.classId}_${assignment.subjectId}`} className="overflow-hidden">
                  <div className={`h-1 ${
                    assignment.syllabusId 
                      ? 'bg-gradient-to-r from-green-400 to-green-600' 
                      : 'bg-gradient-to-r from-orange-400 to-orange-600'
                  }`} />
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{assignment.className}</h3>
                          <p className="text-sm text-muted-foreground">{assignment.subjectName}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {assignment.syllabusId ? (
                          <div className="text-right">
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Syllabus Set
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">{assignment.syllabusName}</p>
                            {assignment.syllabusType === 'custom' && (
                              <Button
                                variant="link"
                                size="sm"
                                className="text-xs p-0 h-auto mt-1"
                                onClick={() => {
                                  // Find the subject and expand it
                                  const subject = customSubjects.find(s => s.id === assignment.syllabusId);
                                  if (subject) {
                                    setExpandedSubjects(new Set([subject.id]));
                                    // Scroll to the custom syllabus library
                                    document.getElementById('custom-syllabus-library')?.scrollIntoView({ behavior: 'smooth' });
                                  }
                                }}
                              >
                                <Edit2 className="w-3 h-3 mr-1" />
                                Edit Syllabus
                              </Button>
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            No Syllabus
                          </Badge>
                        )}
                        
                        {/* Quick Load CBSE Syllabus Button */}
                        {!assignment.syllabusId && (
                          <Button 
                            variant="default" 
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700"
                            onClick={() => handleLoadCBSESyllabus(assignment)}
                            disabled={saving}
                          >
                            {saving ? (
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4 mr-1" />
                            )}
                            Load CBSE
                          </Button>
                        )}
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            // Pre-fill subject name and track assignment
                            setCreatingForAssignment(assignment);
                            setNewSubjectName(assignment.subjectName);
                            setShowSubjectDialog(true);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Create Subject
                        </Button>
                        
                        {assignment.syllabusId && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openSyllabusSelector(assignment)}
                          >
                            Change
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Syllabus Management */}
      <Card id="custom-syllabus-library">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Custom Syllabus Library</CardTitle>
              <CardDescription>
                Create and manage your own subjects, chapters, and topics
              </CardDescription>
            </div>
            <Button onClick={() => setShowSubjectDialog(true)} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Subject
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : filteredCustomSubjects.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-muted-foreground mb-2">
                {teacherSelectedAssignment 
                  ? `No custom subjects for ${selectedClassNameForFilter || 'this class'}`
                  : 'No custom subjects yet'}
              </p>
              <p className="text-sm text-muted-foreground">
                {teacherSelectedAssignment
                  ? 'Create a subject for this class or select a different class'
                  : 'Create your first subject to build a custom syllabus'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCustomSubjects.map((subject) => (
                <Card key={subject.id} className="overflow-hidden">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleSubject(subject.id)}
                  >
                    <div className="flex items-center gap-3">
                      {expandedSubjects.has(subject.id) ? (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      )}
                      <BookOpen className="w-5 h-5 text-green-600" />
                      <span className="font-semibold">{subject.name}</span>
                      <Badge variant="secondary" className="ml-2">
                        {subject.chapters?.length || 0} chapters
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleSubject(subject.id)}
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSubject(subject.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {expandedSubjects.has(subject.id) && (
                    <div className="border-t bg-gray-50 p-4">
                      <p className="text-sm text-muted-foreground mb-3">
                        💡 Click on chapters to expand and edit topics. Use buttons to add or remove content.
                      </p>
                      
                      {/* Sync to Students Button */}
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-800">Sync to Students</p>
                            <p className="text-xs text-blue-600">Apply syllabus changes to all enrolled students' progress</p>
                          </div>
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => handleSyncToStudents(subject.id)}
                            disabled={saving}
                          >
                            {saving ? (
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                              <Users className="w-4 h-4 mr-1" />
                            )}
                            Apply Changes
                          </Button>
                        </div>
                      </div>
                      
                      {/* Chapters */}
                      <div className="space-y-2">
                        {subject.chapters?.map((chapter) => (
                          <div key={chapter.id} className="bg-white rounded-lg border">
                            <div
                              className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                              onClick={() => toggleChapter(chapter.id)}
                            >
                              <div className="flex items-center gap-2">
                                {expandedChapters.has(chapter.id) ? (
                                  <ChevronDown className="w-4 h-4 text-gray-400" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-400" />
                                )}
                                <FileText className="w-4 h-4 text-blue-600" />
                                
                                {editingItem?.type === 'chapter' && editingItem.id === chapter.id ? (
                                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                    <Input
                                      value={editingValue}
                                      onChange={(e) => setEditingValue(e.target.value)}
                                      className="w-64 h-8"
                                    />
                                    <Button size="sm" variant="ghost" onClick={() => {
                                      handleUpdateChapter(subject.id, chapter.id, editingValue);
                                    }}>
                                      <Check className="w-4 h-4 text-green-600" />
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => setEditingItem(null)}>
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <span>{chapter.chapterNo}. {chapter.name}</span>
                                )}
                                
                                <Badge variant="outline" className="text-xs">
                                  {chapter.topics?.length || 0} topics
                                </Badge>
                              </div>
                              
                              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => {
                                    setEditingItem({ type: 'chapter', id: chapter.id, subjectId: subject.id });
                                    setEditingValue(chapter.name);
                                  }}
                                >
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-red-500"
                                  onClick={() => handleDeleteChapter(subject.id, chapter.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>

                            {expandedChapters.has(chapter.id) && (
                              <div className="border-t px-4 py-3 bg-gray-50">
                                {/* Topics */}
                                <div className="space-y-1">
                                  {chapter.topics?.map((topic) => (
                                    <div key={topic.id} className="flex items-center justify-between py-1 px-2 hover:bg-white rounded">
                                      <div className="flex items-center gap-2">
                                        <List className="w-3 h-3 text-gray-400" />
                                        
                                        {editingItem?.type === 'topic' && editingItem.id === topic.id ? (
                                          <div className="flex items-center gap-2">
                                            <Input
                                              value={editingValue}
                                              onChange={(e) => setEditingValue(e.target.value)}
                                              className="w-64 h-7 text-sm"
                                            />
                                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => {
                                              handleUpdateTopic(subject.id, chapter.id, topic.id, editingValue);
                                            }}>
                                              <Check className="w-3 h-3 text-green-600" />
                                            </Button>
                                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingItem(null)}>
                                              <X className="w-3 h-3" />
                                            </Button>
                                          </div>
                                        ) : (
                                          <span className="text-sm">{topic.topicNo}. {topic.name}</span>
                                        )}
                                      </div>
                                      
                                      <div className="flex items-center gap-1">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6"
                                          onClick={() => {
                                            setEditingItem({ type: 'topic', id: topic.id, subjectId: subject.id, chapterId: chapter.id });
                                            setEditingValue(topic.name);
                                          }}
                                        >
                                          <Edit2 className="w-3 h-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 text-red-500"
                                          onClick={() => handleDeleteTopic(subject.id, chapter.id, topic.id)}
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {/* Add Topic Button */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="mt-2"
                                  onClick={() => openTopicDialog(subject.id, chapter.id)}
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Add Topic
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Add Chapter Button */}
                      <Button
                        variant="outline"
                        className="mt-3"
                        onClick={() => openChapterDialog(subject.id)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Chapter
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Predefined Syllabus Selector Dialog */}
      <Dialog open={showPredefinedSelector} onOpenChange={setShowPredefinedSelector}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Syllabus</DialogTitle>
            <DialogDescription>
              Choose a predefined CBSE syllabus or custom syllabus for {selectedAssignmentForSyllabus?.className} - {selectedAssignmentForSyllabus?.subjectName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Predefined Syllabi */}
            <div>
              <h4 className="font-medium mb-3">CBSE Predefined Syllabus</h4>
              {selectedAssignmentForSyllabus && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {getAvailablePredefinedForClass(selectedAssignmentForSyllabus.classId, selectedAssignmentForSyllabus.subjectId).map((predefined) => (
                    <Card 
                      key={`class${predefined.classNumber}_${predefined.name}`}
                      className="cursor-pointer hover:border-purple-500 transition-colors"
                      onClick={() => handleSelectPredefinedSyllabus(predefined)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h5 className="font-medium">Class {predefined.classNumber} {predefined.name}</h5>
                            <p className="text-sm text-muted-foreground">
                              {predefined.chapters.length} chapters
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {getAvailablePredefinedForClass(selectedAssignmentForSyllabus.classId, selectedAssignmentForSyllabus.subjectId).length === 0 && (
                    <p className="text-muted-foreground col-span-2">
                      No predefined syllabus available for this class
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Custom Syllabi */}
            {customSubjects.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Your Custom Syllabi</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {customSubjects.map((custom) => (
                    <Card 
                      key={custom.id}
                      className="cursor-pointer hover:border-purple-500 transition-colors"
                      onClick={() => handleSelectCustomSyllabus(custom)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <h5 className="font-medium">{custom.name}</h5>
                            <p className="text-sm text-muted-foreground">
                              {custom.chapters?.length || 0} chapters
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPredefinedSelector(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Subject Dialog */}
      <Dialog open={showSubjectDialog} onOpenChange={(open) => {
        setShowSubjectDialog(open);
        if (!open) {
          setCreatingForAssignment(null);
          resetSubjectForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Subject</DialogTitle>
            <DialogDescription>
              {creatingForAssignment 
                ? `Creating syllabus for ${creatingForAssignment.subjectName} - ${creatingForAssignment.className}. Add chapters and topics below.`
                : 'Add a subject with chapters and topics for your students.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Subject Name *</Label>
              <Input
                placeholder="e.g., Physics, Mathematics"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
              />
            </div>

            {/* Chapters */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Chapters & Topics *</Label>
                {newSubjectChapters.length > 0 && (
                  <Badge variant="secondary">{newSubjectChapters.length} chapter{newSubjectChapters.length > 1 ? 's' : ''}</Badge>
                )}
              </div>
              
              {/* Added chapters */}
              {newSubjectChapters.length > 0 && (
                <div className="space-y-2 mb-3">
                  {newSubjectChapters.map((chapter, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{chapter.name}</span>
                        <X
                          className="w-4 h-4 cursor-pointer hover:text-red-500"
                          onClick={() => removeChapterFromForm(index)}
                        />
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {chapter.topics.map((topic, ti) => (
                          <Badge key={ti} variant="outline" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add chapter form */}
              <div className="border rounded-lg p-3 bg-blue-50/50 space-y-3">
                <Input
                  placeholder="Chapter name (e.g., Chapter 1: Introduction)"
                  value={newChapterInput}
                  onChange={(e) => setNewChapterInput(e.target.value)}
                />
                <Input
                  placeholder="Topics (comma-separated, e.g., Basic Concepts, Formulas, Problems)"
                  value={newTopicInput}
                  onChange={(e) => setNewTopicInput(e.target.value)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addChapterToForm}
                  disabled={!newChapterInput || !newTopicInput}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Chapter
                </Button>
              </div>
              
              {newSubjectChapters.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  💡 Add at least one chapter with topics to create the subject.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowSubjectDialog(false);
              setCreatingForAssignment(null);
              resetSubjectForm();
            }}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleCreateSubject}
              disabled={loading || !newSubjectName || newSubjectChapters.length === 0}
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {creatingForAssignment ? 'Create & Assign' : 'Create Subject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Chapter Dialog */}
      <Dialog open={showChapterDialog} onOpenChange={setShowChapterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Chapter</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Chapter Name</Label>
              <Input
                placeholder="e.g., Chapter 1: Introduction"
                value={newChapterName}
                onChange={(e) => setNewChapterName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Topics (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter topic name"
                  value={newTopicInputForChapter}
                  onChange={(e) => setNewTopicInputForChapter(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTopicToChapterForm())}
                />
                <Button variant="outline" onClick={addTopicToChapterForm}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {newChapterTopics.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {newChapterTopics.map((topic, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {topic}
                      <X
                        className="w-3 h-3 ml-1 cursor-pointer hover:text-red-500"
                        onClick={() => setNewChapterTopics(newChapterTopics.filter((_, i) => i !== index))}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChapterDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddChapter} disabled={loading || !newChapterName}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Add Chapter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Topic Dialog */}
      <Dialog open={showTopicDialog} onOpenChange={setShowTopicDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Topic</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-2">
            <Label>Topic Name</Label>
            <Input
              placeholder="e.g., Introduction to the concept"
              value={newTopicName}
              onChange={(e) => setNewTopicName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTopicDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTopic} disabled={loading || !newTopicName}>
              Add Topic
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
