'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
} from '@/components/ui/alert-dialog';
import {
  Users,
  School,
  UserCheck,
  Building2,
  Crown,
  Plus,
  Loader2,
  TrendingUp,
  TrendingDown,
  Activity,
  UserPlus,
  Search,
  ChevronDown,
  ChevronUp,
  Database,
  Globe,
  Zap,
  Award,
  AlertCircle,
  CheckCircle,
  XCircle,
  GraduationCap,
  Key,
  Lock,
  Copy,
  Trash2,
} from 'lucide-react';
import { useAppStore, useAuthStore } from '@/lib/store';
import { subscribeToAllUsers, subscribeToAllInstitutes, subscribeToAllProgressUnfiltered, updateUserPassword, deleteInstitute } from '@/lib/firebase-service';
import { useToast } from '@/hooks/use-toast';
import { Institute } from '@/lib/firebase-service';

export function SuperAdminDashboard() {
  const { user } = useAuthStore();
  const { allStudents, setAllStudents, allProgress, setAllProgress } = useAppStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedInstitute, setExpandedInstitute] = useState<string | null>(null);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const { toast } = useToast();

  // Password reset state
  const [resetPasswordDialog, setResetPasswordDialog] = useState<{
    open: boolean;
    userId: string;
    userName: string;
    userEmail: string;
  } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Delete institute state
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    instituteId: string;
    instituteName: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load all data
  useEffect(() => {
    const unsubUsers = subscribeToAllUsers((users) => {
      setAllStudents(users);
      setIsLoading(false);
    });
    
    const unsubProgress = subscribeToAllProgressUnfiltered((progress) => {
      setAllProgress(progress);
    });

    const unsubInstitutes = subscribeToAllInstitutes((inst) => {
      setInstitutes(inst);
    });
    
    return () => {
      unsubUsers();
      unsubProgress();
      unsubInstitutes();
    };
  }, [setAllStudents, setAllProgress]);

  // Get users by role
  const instituteOwners = useMemo(() => allStudents.filter(u => u.role === 'institute_owner'), [allStudents]);
  const teachers = useMemo(() => allStudents.filter(u => u.role === 'teacher'), [allStudents]);
  const students = useMemo(() => allStudents.filter(u => u.role === 'student'), [allStudents]);

  // Calculate institute statistics
  const instituteStats = useMemo(() => {
    return institutes.map(institute => {
      const instituteStudents = students.filter(s => s.instituteId === institute.id);
      const instituteTeachers = teachers.filter(t => t.instituteId === institute.id);
      const owner = instituteOwners.find(o => o.id === institute.ownerId);

      return {
        ...institute,
        studentCount: instituteStudents.length,
        teacherCount: instituteTeachers.length,
        owner: owner,
        students: instituteStudents,
        teachers: instituteTeachers,
        isActive: true, // Could be calculated from last activity
      };
    }).sort((a, b) => b.studentCount - a.studentCount);
  }, [institutes, students, teachers, instituteOwners]);

  // Growth metrics
  const growthMetrics = useMemo(() => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const newInstitutesThisMonth = institutes.filter(i => new Date(i.createdAt) >= thisMonth).length;
    const newStudentsThisMonth = students.filter(s => new Date(s.createdAt) >= thisMonth).length;
    const newTeachersThisMonth = teachers.filter(t => new Date(t.createdAt) >= thisMonth).length;

    return {
      newInstitutesThisMonth,
      newStudentsThisMonth,
      newTeachersThisMonth,
    };
  }, [institutes, students, teachers]);

  // Filter institutes by search
  const filteredInstitutes = useMemo(() => {
    if (!searchQuery) return instituteStats;
    return instituteStats.filter(i => 
      i.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [instituteStats, searchQuery]);

  // Format date
  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return new Date(date).toLocaleDateString();
  };

  // Handle password reset
  const handleResetPassword = async () => {
    if (!resetPasswordDialog || !newPassword || newPassword.length < 6) {
      toast({
        title: 'Invalid Password',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    setIsResetting(true);
    try {
      await updateUserPassword(resetPasswordDialog.userId, newPassword);
      toast({
        title: 'Password Updated',
        description: `Password reset for ${resetPasswordDialog.userName}`,
      });
      setResetPasswordDialog(null);
      setNewPassword('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reset password',
        variant: 'destructive',
      });
    } finally {
      setIsResetting(false);
    }
  };

  // Generate random password
  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(password);
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: 'Password copied to clipboard' });
  };

  // Handle delete institute
  const handleDeleteInstitute = async () => {
    if (!deleteDialog) return;

    setIsDeleting(true);
    try {
      await deleteInstitute(deleteDialog.instituteId);
      toast({
        title: 'Institute Deleted',
        description: `${deleteDialog.instituteName} and all its data have been deleted`,
      });
      setDeleteDialog(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete institute',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Crown className="w-6 h-6 text-yellow-500" />
            Super Admin Panel
          </h1>
          <p className="text-muted-foreground">Manage all institutes, teachers and students</p>
        </div>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Total Institutes</p>
                  <p className="text-3xl font-bold">{institutes.length}</p>
                </div>
                <School className="w-10 h-10 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Teachers</p>
                  <p className="text-3xl font-bold">{teachers.length}</p>
                </div>
                <UserCheck className="w-10 h-10 text-blue-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Total Students</p>
                  <p className="text-3xl font-bold">{students.length}</p>
                </div>
                <Users className="w-10 h-10 text-green-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm">Total Subjects</p>
                  <p className="text-3xl font-bold">{allProgress.length > 0 ? new Set(allProgress.map(p => p.subjectId)).size : 0}</p>
                </div>
                <Database className="w-10 h-10 text-amber-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-gradient-to-br from-pink-500 to-rose-500 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-pink-100 text-sm">Progress Records</p>
                  <p className="text-3xl font-bold">{allProgress.length}</p>
                </div>
                <Activity className="w-10 h-10 text-pink-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Growth Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">New Institutes (This Month)</p>
                  <p className="text-2xl font-bold">+{growthMetrics.newInstitutesThisMonth}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <UserPlus className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">New Students (This Month)</p>
                  <p className="text-2xl font-bold">+{growthMetrics.newStudentsThisMonth}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <GraduationCap className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">New Teachers (This Month)</p>
                  <p className="text-2xl font-bold">+{growthMetrics.newTeachersThisMonth}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search institutes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Institutes List */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-600" />
              All Institutes ({filteredInstitutes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredInstitutes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No institutes found. Institutes will appear here when owners register.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredInstitutes.map((institute) => (
                  <Card key={institute.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      {/* Institute Header */}
                      <div 
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                        onClick={() => setExpandedInstitute(expandedInstitute === institute.id ? null : institute.id)}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${institute.isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                            <School className={`w-5 h-5 ${institute.isActive ? 'text-green-600' : 'text-gray-500'}`} />
                          </div>
                          <div>
                            <p className="font-semibold">{institute.name}</p>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span>Referral Code: <strong className="text-purple-600">{institute.referralCode}</strong></span>
                              <span>Created: {formatDate(institute.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">{institute.teacherCount}</p>
                            <p className="text-xs text-muted-foreground">Teachers</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">{institute.studentCount}</p>
                            <p className="text-xs text-muted-foreground">Students</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {institute.classes.length} Classes
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {institute.subjects.length} Subjects
                            </Badge>
                            {expandedInstitute === institute.id ? (
                              <ChevronUp className="w-5 h-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Expanded View */}
                      {expandedInstitute === institute.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          className="border-t bg-gray-50 p-4"
                        >
                          {/* Owner Info */}
                          {institute.owner && (
                            <div className="mb-4 p-3 bg-white rounded-lg border border-purple-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                                    <Crown className="w-5 h-5 text-purple-600" />
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Institute Owner</p>
                                    <p className="font-semibold">{institute.owner.name}</p>
                                    <p className="text-sm text-muted-foreground">{institute.owner.email}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-purple-600 border-purple-300 hover:bg-purple-50"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setResetPasswordDialog({
                                        open: true,
                                        userId: institute.owner.id,
                                        userName: institute.owner.name,
                                        userEmail: institute.owner.email,
                                      });
                                    }}
                                  >
                                    <Key className="w-4 h-4 mr-2" />
                                    Reset Password
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 border-red-300 hover:bg-red-50"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteDialog({
                                        open: true,
                                        instituteId: institute.id,
                                        instituteName: institute.name,
                                      });
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Institute
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Classes */}
                            <div>
                              <p className="text-sm font-semibold mb-2">Classes</p>
                              <div className="flex flex-wrap gap-2">
                                {institute.classes.map(cls => (
                                  <Badge key={cls.id} variant="secondary">{cls.name}</Badge>
                                ))}
                              </div>
                            </div>
                            {/* Subjects */}
                            <div>
                              <p className="text-sm font-semibold mb-2">Subjects</p>
                              <div className="flex flex-wrap gap-2">
                                {institute.subjects.map(sub => (
                                  <Badge key={sub.id} variant="outline">{sub.name}</Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          {/* Teachers List */}
                          {institute.teachers.length > 0 && (
                            <div className="mt-4">
                              <p className="text-sm font-semibold mb-2">Teachers</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {institute.teachers.map(teacher => (
                                  <div key={teacher.id} className="bg-white p-2 rounded border text-sm">
                                    <span className="font-medium">{teacher.name}</span>
                                    <span className="text-muted-foreground ml-2">({teacher.email})</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Students Preview */}
                          {institute.students.length > 0 && (
                            <div className="mt-4">
                              <p className="text-sm font-semibold mb-2">Recent Students ({institute.students.length} total)</p>
                              <div className="flex flex-wrap gap-2">
                                {institute.students.slice(0, 10).map(student => (
                                  <Badge key={student.id} variant="secondary">{student.name}</Badge>
                                ))}
                                {institute.students.length > 10 && (
                                  <Badge variant="outline">+{institute.students.length - 10} more</Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Password Reset Dialog */}
      <Dialog open={resetPasswordDialog?.open} onOpenChange={(open) => !open && setResetPasswordDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-purple-600" />
              Reset Password
            </DialogTitle>
            <DialogDescription>
              Reset password for <strong>{resetPasswordDialog?.userName}</strong> ({resetPasswordDialog?.userEmail})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="flex gap-2">
                <Input
                  id="new-password"
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={generatePassword}
                  title="Generate random password"
                >
                  <Zap className="w-4 h-4" />
                </Button>
                {newPassword && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(newPassword)}
                    title="Copy password"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Minimum 6 characters. Click ⚡ to generate a random password.
              </p>
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setResetPasswordDialog(null);
                setNewPassword('');
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              onClick={handleResetPassword}
              disabled={isResetting || !newPassword || newPassword.length < 6}
            >
              {isResetting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <Key className="w-4 h-4 mr-2" />
                  Reset Password
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Institute Confirmation Dialog */}
      <AlertDialog open={deleteDialog?.open} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Delete Institute
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteDialog?.instituteName}</strong>?
              <br /><br />
              This will permanently delete:
              <ul className="list-disc list-inside mt-2 text-sm">
                <li>The institute and all its data</li>
                <li>All teachers belonging to this institute</li>
                <li>All students belonging to this institute</li>
                <li>All progress records, test marks, and discipline stars</li>
              </ul>
              <br />
              <span className="text-red-600 font-semibold">This action cannot be undone!</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteInstitute}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Institute
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
