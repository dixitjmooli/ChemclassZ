'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import { updateDisciplineStars, DisciplineStars as DisciplineStarsType } from '@/lib/firebase-service';
import { Star, Plus, Minus, Search, Trophy, Award } from 'lucide-react';

export function DisciplineManager() {
  const { allStudents, allDisciplineStars, allProgress, allTestMarks } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [starsToAdd, setStarsToAdd] = useState(1);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get stars for a student
  const getStudentStars = (userId: string): number => {
    const stars = allDisciplineStars.find((s) => s.userId === userId);
    return stars?.stars || 0;
  };

  // Calculate rank score for sorting
  const getRankScore = (userId: string): number => {
    const progress = allProgress.find((p) => p.userId === userId);
    const studentMarks = allTestMarks.filter((m) => m.userId === userId);
    const progressScore = progress?.overallProgress || 0;
    const testAvg = studentMarks.length > 0
      ? studentMarks.reduce((sum, m) => sum + m.marks, 0) / studentMarks.length
      : 0;
    return (progressScore * 0.7) + (testAvg * 0.3);
  };

  // Filter and sort students
  const filteredStudents = allStudents
    .filter((student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.username.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => getRankScore(b.id) - getRankScore(a.id));

  // Handle add/remove stars
  const handleUpdateStars = async (change: number) => {
    if (!selectedStudent || !reason.trim()) return;
    
    setIsSubmitting(true);
    try {
      await updateDisciplineStars(selectedStudent, change, reason.trim());
      setReason('');
      setStarsToAdd(1);
    } catch (error) {
      console.error('Error updating stars:', error);
    }
    setIsSubmitting(false);
  };

  const selectedStudentData = allStudents.find((s) => s.id === selectedStudent);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">⭐ Discipline Stars</h1>
        <p className="text-muted-foreground">Reward or deduct stars from students</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Stars Given</p>
                <p className="text-xl font-bold">
                  {allDisciplineStars.reduce((sum, s) => sum + s.stars, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Trophy className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Top Student</p>
                <p className="text-lg font-bold truncate">
                  {filteredStudents[0]?.name || 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Award className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Students with Stars</p>
                <p className="text-xl font-bold">
                  {allDisciplineStars.filter((s) => s.stars > 0).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Star className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average Stars</p>
                <p className="text-xl font-bold">
                  {allStudents.length > 0
                    ? Math.round(allDisciplineStars.reduce((sum, s) => sum + s.stars, 0) / allStudents.length)
                    : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Student</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredStudents.map((student, index) => {
                const stars = getStudentStars(student.id);
                const isSelected = selectedStudent === student.id;
                
                return (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => setSelectedStudent(student.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-all border-2 ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-transparent hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center font-semibold text-purple-700">
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-xs text-muted-foreground">{student.school}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded-full">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-semibold text-yellow-700">{stars}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Star Management */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedStudentData ? `Manage: ${selectedStudentData.name}` : 'Select a Student'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedStudentData ? (
              <div className="space-y-6">
                {/* Current Stars */}
                <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
                    <span className="text-4xl font-bold text-yellow-600">
                      {getStudentStars(selectedStudent!)}
                    </span>
                    <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
                  </div>
                  <p className="text-sm text-muted-foreground">Current Stars</p>
                </div>

                {/* Stars Input */}
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium">Stars:</label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStarsToAdd(Math.max(1, starsToAdd - 1))}
                    >
                      -
                    </Button>
                    <Input
                      type="number"
                      value={starsToAdd}
                      onChange={(e) => setStarsToAdd(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 text-center"
                      min={1}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStarsToAdd(starsToAdd + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>

                {/* Reason Input */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Reason:</label>
                  <Input
                    placeholder="e.g., Good behavior, Helping classmate..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleUpdateStars(starsToAdd)}
                    disabled={isSubmitting || !reason.trim()}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add {starsToAdd} ⭐
                  </Button>
                  <Button
                    className="flex-1 bg-red-600 hover:bg-red-700"
                    onClick={() => handleUpdateStars(-starsToAdd)}
                    disabled={isSubmitting || !reason.trim() || getStudentStars(selectedStudent!) < starsToAdd}
                  >
                    <Minus className="w-4 h-4 mr-2" />
                    Remove {starsToAdd} ⭐
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Star className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Select a student from the list to manage their stars</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Stars Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Stars Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {filteredStudents
              .slice(0, 5)
              .map((student, index) => {
                const stars = getStudentStars(student.id);
                return (
                  <div
                    key={student.id}
                    className={`p-3 rounded-lg text-center ${
                      index === 0 ? 'bg-yellow-50 border-2 border-yellow-300' :
                      index === 1 ? 'bg-gray-50 border-2 border-gray-300' :
                      index === 2 ? 'bg-orange-50 border-2 border-orange-300' :
                      'bg-gray-50'
                    }`}
                  >
                    <div className="text-2xl mb-1">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </div>
                    <p className="font-semibold truncate">{student.name}</p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-bold">{stars}</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
