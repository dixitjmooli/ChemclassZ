'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import { createTest, enterTestMarks, deleteTest } from '@/lib/firebase-service';
import { useToast } from '@/hooks/use-toast';
import {
  FileCheck,
  Save,
  Loader2,
  Users,
  BookOpen,
  CheckCircle,
  Plus,
  Trash2,
  Edit,
  X,
} from 'lucide-react';
import type { Test, TestMarks } from '@/lib/store';

export function TestMarksForm() {
  const { chapters, allStudents, allTests, allTestMarks } = useAppStore();
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [testName, setTestName] = useState('');
  const [maxMarks, setMaxMarks] = useState('100');
  const [marks, setMarks] = useState<Record<string, number>>({});
  const [originalMarks, setOriginalMarks] = useState<Record<string, number>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  // Get tests for selected chapter
  const chapterTests = allTests.filter((t) => t.chapterId === selectedChapterId);

  // Load marks when test is selected
  useEffect(() => {
    if (selectedTest) {
      const testMarksData: Record<string, number> = {};
      allStudents.forEach((student) => {
        const existingMark = allTestMarks.find(
          (m) => m.testId === selectedTest.id && m.userId === student.id
        );
        testMarksData[student.id] = existingMark?.marks || 0;
      });
      setMarks(testMarksData);
      setOriginalMarks(testMarksData);
    } else {
      setMarks({});
      setOriginalMarks({});
    }
  }, [selectedTest, allStudents, allTestMarks]);

  // Check if there are unsaved changes
  const hasChanges = Object.keys(marks).some(
    (studentId) => marks[studentId] !== originalMarks[studentId]
  );

  const handleMarkChange = (studentId: string, value: string) => {
    const numValue = Math.min(parseInt(maxMarks) || 100, Math.max(0, parseInt(value) || 0));
    setMarks((prev) => ({ ...prev, [studentId]: numValue }));
  };

  const handleCreateTest = async () => {
    if (!selectedChapterId || !testName.trim()) {
      toast({
        title: 'Error',
        description: 'Please select a chapter and enter a test name',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    try {
      const test = await createTest(selectedChapterId, testName.trim(), parseInt(maxMarks) || 100);
      setSelectedTest(test);
      setTestName('');
      toast({
        title: 'Success!',
        description: `Test "${test.testName}" created successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create test',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveAll = async () => {
    if (!selectedTest) return;
    
    setIsSaving(true);
    try {
      await Promise.all(
        Object.entries(marks).map(([studentId, markValue]) =>
          enterTestMarks(selectedTest.id, studentId, selectedTest.chapterId, markValue, selectedTest.maxMarks)
        )
      );
      setOriginalMarks(marks);
      toast({
        title: 'Success!',
        description: `Saved marks for ${Object.keys(marks).length} students`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save some marks',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTest = async (testId: string) => {
    if (!confirm('Are you sure you want to delete this test? All marks for this test will be deleted.')) {
      return;
    }

    setIsDeleting(testId);
    try {
      await deleteTest(testId);
      if (selectedTest?.id === testId) {
        setSelectedTest(null);
      }
      toast({
        title: 'Success!',
        description: 'Test deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete test',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const getMarkPercentage = (mark: number) => {
    const max = selectedTest?.maxMarks || 100;
    return (mark / max) * 100;
  };

  const getMarkColor = (mark: number) => {
    const percent = getMarkPercentage(mark);
    if (percent >= 80) return 'bg-green-100 text-green-700 border-green-200';
    if (percent >= 60) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (percent >= 40) return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Test Marks</h1>
        <p className="text-muted-foreground">Create tests and enter marks for students</p>
      </div>

      {/* Chapter Selection */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1 w-full sm:w-auto max-w-md">
              <label className="text-sm font-medium mb-2 block">Select Chapter</label>
              <Select value={selectedChapterId} onValueChange={(val) => {
                setSelectedChapterId(val);
                setSelectedTest(null);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a chapter" />
                </SelectTrigger>
                <SelectContent>
                  {chapters.map((chapter) => (
                    <SelectItem key={chapter.id} value={chapter.id}>
                      Ch {chapter.chapterNo}: {chapter.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedChapterId && (
        <>
          {/* Create New Test */}
          <Card className="border-purple-200 bg-purple-50/30">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-600" />
                Create New Test
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Test Name</label>
                  <Input
                    placeholder="e.g., Unit Test 1, Mid Term, etc."
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                  />
                </div>
                <div className="w-full sm:w-32">
                  <label className="text-sm font-medium mb-2 block">Max Marks</label>
                  <Input
                    type="number"
                    min="1"
                    value={maxMarks}
                    onChange={(e) => setMaxMarks(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleCreateTest}
                  disabled={isCreating || !testName.trim()}
                  className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Test
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Existing Tests for Chapter */}
          {chapterTests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Existing Tests ({chapterTests.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {chapterTests.map((test) => (
                    <div
                      key={test.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        selectedTest?.id === test.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{test.testName}</span>
                          <Badge variant="outline">Max: {test.maxMarks}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Created: {test.createdAt?.toLocaleDateString() || 'N/A'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={selectedTest?.id === test.id ? "default" : "outline"}
                          onClick={() => setSelectedTest(test)}
                          className={selectedTest?.id === test.id ? "bg-purple-600" : ""}
                        >
                          {selectedTest?.id === test.id ? (
                            <>
                              <Edit className="w-4 h-4 mr-1" />
                              Editing
                            </>
                          ) : (
                            <>
                              <Edit className="w-4 h-4 mr-1" />
                              Enter Marks
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteTest(test.id)}
                          disabled={isDeleting === test.id}
                        >
                          {isDeleting === test.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Marks Entry */}
          {selectedTest && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <CardTitle className="text-lg">
                        {selectedTest.testName}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Maximum Marks: {selectedTest.maxMarks}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {hasChanges && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          Unsaved changes
                        </Badge>
                      )}
                      <Button
                        onClick={handleSaveAll}
                        disabled={isSaving || !hasChanges}
                        className={`min-w-[140px] ${hasChanges ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-400'}`}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : hasChanges ? (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save All Marks
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Saved
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {allStudents.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
                      <p className="mt-2 text-muted-foreground">
                        No students added yet
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Student</TableHead>
                          <TableHead>School</TableHead>
                          <TableHead className="text-center">Marks (0-{selectedTest.maxMarks})</TableHead>
                          <TableHead className="text-center">Percentage</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allStudents.map((student, index) => {
                          const currentMark = marks[student.id] ?? 0;
                          const hasChanged = marks[student.id] !== originalMarks[student.id];
                          const percent = getMarkPercentage(currentMark);
                          
                          return (
                            <TableRow 
                              key={student.id}
                              className={hasChanged ? 'bg-amber-50' : ''}
                            >
                              <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                              <TableCell className="font-medium">{student.name}</TableCell>
                              <TableCell>{student.school}</TableCell>
                              <TableCell className="text-center">
                                <Input
                                  type="number"
                                  min="0"
                                  max={selectedTest.maxMarks}
                                  value={currentMark}
                                  onChange={(e) => handleMarkChange(student.id, e.target.value)}
                                  className={`w-24 text-center mx-auto ${hasChanged ? 'border-amber-400 bg-white' : ''}`}
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="font-medium">{percent.toFixed(1)}%</span>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className={getMarkColor(currentMark)}>
                                  {percent >= 40 ? 'Pass' : 'Fail'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Stats Summary */}
          {selectedTest && allStudents.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Class Average</p>
                  <p className="text-2xl font-bold">
                    {Object.values(marks).length > 0
                      ? (
                          (Object.values(marks).reduce((a, b) => a + b, 0) / selectedTest.maxMarks) /
                          Object.values(marks).length * 100
                        ).toFixed(1)
                      : '0'}
                    %
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Highest Score</p>
                  <p className="text-2xl font-bold text-green-600">
                    {Math.max(...Object.values(marks), 0)}/{selectedTest.maxMarks}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Lowest Score</p>
                  <p className="text-2xl font-bold text-red-600">
                    {Math.min(...Object.values(marks).filter(m => m > 0), 0) || 0}/{selectedTest.maxMarks}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Pass Rate</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {Object.values(marks).filter((m) => getMarkPercentage(m) >= 40).length}/
                    {Object.values(marks).length}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      {!selectedChapterId && (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
            <p className="mt-2 text-muted-foreground">
              Select a chapter to create and manage tests
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
