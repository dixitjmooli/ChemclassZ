'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import { createUser, deleteUser, initializeProgress, getAllStudents, checkFirebaseConnection } from '@/lib/firebase-service';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Trash2,
  Users,
  UserPlus,
  Search,
  Loader2,
  School,
  Calendar,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  WifiOff,
} from 'lucide-react';

export function StudentsTable() {
  const { allStudents, allProgress, setAllStudents } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{
    lastRefresh: string | null;
    connectionStatus: 'checking' | 'connected' | 'error';
    errorMessage: string | null;
    rawStudentCount: number | null;
  }>({
    lastRefresh: null,
    connectionStatus: 'checking',
    errorMessage: null,
    rawStudentCount: null,
  });
  const { toast } = useToast();

  // Check connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const isConnected = await checkFirebaseConnection();
        setDebugInfo(prev => ({
          ...prev,
          connectionStatus: isConnected ? 'connected' : 'error',
          errorMessage: isConnected ? null : 'Cannot connect to Firebase'
        }));
      } catch (error) {
        setDebugInfo(prev => ({
          ...prev,
          connectionStatus: 'error',
          errorMessage: error instanceof Error ? error.message : 'Connection check failed'
        }));
      }
    };
    checkConnection();
  }, []);

  // Manual refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setDebugInfo(prev => ({ ...prev, connectionStatus: 'checking' }));
    try {
      const students = await getAllStudents();
      setAllStudents(students);
      const now = new Date().toLocaleTimeString();
      setDebugInfo(prev => ({
        ...prev,
        lastRefresh: now,
        connectionStatus: 'connected',
        rawStudentCount: students.length,
        errorMessage: null,
      }));
      toast({
        title: 'Refreshed',
        description: `Found ${students.length} students at ${now}`,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to refresh students';
      setDebugInfo(prev => ({
        ...prev,
        connectionStatus: 'error',
        errorMessage: errorMsg,
      }));
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    school: '',
  });

  const filteredStudents = allStudents.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.school.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddStudent = async () => {
    if (!formData.name || !formData.username || !formData.password || !formData.school) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Password Too Short',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    setIsAdding(true);
    try {
      await createUser(
        formData.name,
        formData.username.toLowerCase(),
        formData.password,
        formData.school,
        'student'
      );
      
      toast({
        title: 'Student Added',
        description: `${formData.name} has been added successfully`,
      });
      
      setFormData({ name: '', username: '', password: '', school: '' });
      setDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add student',
        variant: 'destructive',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    setIsDeleting(studentId);
    try {
      await deleteUser(studentId);
      toast({
        title: 'Student Deleted',
        description: `${studentName} has been removed`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete student',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const getStudentProgress = (studentId: string) => {
    const progress = allProgress.find((p) => p.userId === studentId);
    return progress?.overallProgress || 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-muted-foreground">Manage your students ({allStudents.length} total)</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Student
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
              <DialogDescription>
                Create a new student account. They can login with these credentials.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Enter student's name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Enter username (lowercase)"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password (min 6 characters)"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="school">School/Institute</Label>
                <Input
                  id="school"
                  placeholder="Enter school name"
                  value={formData.school}
                  onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddStudent} disabled={isAdding}>
                {isAdding ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Student'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{allStudents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <School className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Schools</p>
                <p className="text-2xl font-bold">
                  {new Set(allStudents.map((s) => s.school)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Debug Panel */}
      <Card className="bg-gray-50 border-dashed">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Firebase:</span>
              {debugInfo.connectionStatus === 'checking' ? (
                <Badge variant="outline" className="bg-gray-100">
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Checking...
                </Badge>
              ) : debugInfo.connectionStatus === 'connected' ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  <WifiOff className="w-3 h-3 mr-1" />
                  Error
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Students in UI:</span>
              <Badge variant="outline">{allStudents.length}</Badge>
            </div>
            
            {debugInfo.rawStudentCount !== null && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Last fetch:</span>
                <Badge variant="outline">{debugInfo.rawStudentCount}</Badge>
              </div>
            )}
            
            {debugInfo.lastRefresh && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Last refresh:</span>
                <span className="font-mono text-xs">{debugInfo.lastRefresh}</span>
              </div>
            )}
            
            {debugInfo.errorMessage && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span className="font-mono text-xs">{debugInfo.errorMessage}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search students..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Card>
          <CardContent className="p-0">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
                <p className="mt-2 text-muted-foreground">
                  {searchQuery ? 'No students found' : 'No students yet. Add your first student!'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead className="text-center">Progress</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => {
                    const progress = getStudentProgress(student.id);
                    
                    return (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {student.username}
                          </code>
                        </TableCell>
                        <TableCell>{student.school}</TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={
                              progress >= 75
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : progress >= 50
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-gray-50 text-gray-700 border-gray-200'
                            }
                          >
                            {Math.round(progress)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Student</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete <strong>{student.name}</strong>? 
                                  This will also delete all their progress data. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteStudent(student.id, student.name)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {isDeleting === student.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    'Delete'
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
    </div>
  );
}
