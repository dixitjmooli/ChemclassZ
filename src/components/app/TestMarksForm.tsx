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
import { updateTestMarks } from '@/lib/firebase-service';
import { useToast } from '@/hooks/use-toast';
import {
  FileCheck,
  Save,
  Loader2,
  Users,
  BookOpen,
  CheckCircle,
} from 'lucide-react';

export function TestMarksForm() {
  const { chapters, allStudents, allTestMarks } = useAppStore();
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [marks, setMarks] = useState<Record<string, number>>({});
  const [originalMarks, setOriginalMarks] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Load marks when chapter changes
  useEffect(() => {
    if (selectedChapterId) {
      const chapterMarks: Record<string, number> = {};
      allStudents.forEach((student) => {
        const existingMark = allTestMarks.find(
          (m) => m.userId === student.id && m.chapterId === selectedChapterId
        );
        chapterMarks[student.id] = existingMark?.marks || 0;
      });
      setMarks(chapterMarks);
      setOriginalMarks(chapterMarks);
    }
  }, [selectedChapterId, allStudents, allTestMarks]);

  // Check if there are unsaved changes
  const hasChanges = Object.keys(marks).some(
    (studentId) => marks[studentId] !== originalMarks[studentId]
  );

  const handleMarkChange = (studentId: string, value: string) => {
    const numValue = Math.min(100, Math.max(0, parseInt(value) || 0));
    setMarks((prev) => ({ ...prev, [studentId]: numValue }));
  };

  const handleSaveAll = async () => {
    if (!selectedChapterId) return;
    
    setIsSaving(true);
    try {
      await Promise.all(
        Object.entries(marks).map(([studentId, markValue]) =>
          updateTestMarks(studentId, selectedChapterId, markValue)
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

  const getMarkColor = (mark: number) => {
    if (mark >= 80) return 'bg-green-100 text-green-700 border-green-200';
    if (mark >= 60) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (mark >= 40) return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Test Marks</h1>
        <p className="text-muted-foreground">Enter chapter test marks for students</p>
      </div>

      {/* Chapter Selection & Save Button */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 w-full sm:w-auto max-w-md">
              <label className="text-sm font-medium mb-2 block">Select Chapter</label>
              <Select value={selectedChapterId} onValueChange={setSelectedChapterId}>
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
            
            {selectedChapterId && (
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
            )}
          </div>
        </CardContent>
      </Card>

      {/* Marks Table */}
      {selectedChapterId ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {chapters.find((c) => c.id === selectedChapterId)?.name}
                </CardTitle>
                <Badge variant="outline">
                  {allStudents.length} students
                </Badge>
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
                      <TableHead className="text-center">Marks (0-100)</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allStudents.map((student, index) => {
                      const currentMark = marks[student.id] ?? 0;
                      const hasChanged = marks[student.id] !== originalMarks[student.id];
                      
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
                              max="100"
                              value={currentMark}
                              onChange={(e) => handleMarkChange(student.id, e.target.value)}
                              className={`w-24 text-center mx-auto ${hasChanged ? 'border-amber-400 bg-white' : ''}`}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={getMarkColor(currentMark)}>
                              {currentMark >= 40 ? 'Pass' : 'Fail'}
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
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
            <p className="mt-2 text-muted-foreground">
              Select a chapter to enter test marks
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats Summary */}
      {selectedChapterId && allStudents.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Class Average</p>
              <p className="text-2xl font-bold">
                {Object.values(marks).length > 0
                  ? (
                      Object.values(marks).reduce((a, b) => a + b, 0) /
                      Object.values(marks).length
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
                {Math.max(...Object.values(marks), 0)}%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Lowest Score</p>
              <p className="text-2xl font-bold text-red-600">
                {Math.min(...Object.values(marks).filter(m => m > 0), 0) || 0}%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Pass Rate</p>
              <p className="text-2xl font-bold text-blue-600">
                {Object.values(marks).filter((m) => m >= 40).length}/
                {Object.values(marks).length}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
