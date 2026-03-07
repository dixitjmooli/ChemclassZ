'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/lib/store';
import {
  TodoItem,
  createTodo,
  updateTodo,
  deleteTodo,
  toggleTodoComplete,
  subscribeToTodos
} from '@/lib/firebase-service';
import {
  Plus,
  Trash2,
  Check,
  Circle,
  Calendar,
  Flag,
  Filter,
  ListTodo,
  AlertCircle,
  Clock,
  X,
  Edit2
} from 'lucide-react';

type FilterType = 'all' | 'pending' | 'completed' | 'overdue';
type CategoryType = 'teaching' | 'admin' | 'student' | 'personal';
type PriorityType = 'high' | 'medium' | 'low';

interface TodoListProps {
  compact?: boolean;
  maxItems?: number;
}

export function TodoList({ compact = false, maxItems = 10 }: TodoListProps) {
  const { user } = useAuthStore();
  const { toast } = useToast();

  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  
  // Add/Edit form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CategoryType>('teaching');
  const [priority, setPriority] = useState<PriorityType>('medium');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Delete confirmation
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; todoId: string }>({
    open: false,
    todoId: ''
  });

  useEffect(() => {
    if (!user?.id) return;
    
    const unsub = subscribeToTodos(user.id, (todoList) => {
      setTodos(todoList);
      setLoading(false);
    });
    
    return () => unsub();
  }, [user?.id]);

  // Filter todos
  const filteredTodos = todos.filter((todo) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    if (filter === 'overdue') {
      return !todo.completed && todo.dueDate && new Date(todo.dueDate) < new Date();
    }
    return true;
  }).slice(0, maxItems);

  const handleAddTodo = async () => {
    if (!user?.id || !title.trim()) {
      toast({ title: 'Error', description: 'Title is required', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      await createTodo(user.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        priority,
        dueDate: dueDate ? new Date(dueDate) : undefined
      });
      
      toast({ title: 'Success', description: 'Task added successfully' });
      resetForm();
      setShowAddForm(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTodo = async () => {
    if (!editingTodo || !title.trim()) {
      toast({ title: 'Error', description: 'Title is required', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      await updateTodo(editingTodo.id, {
        title: title.trim(),
        description: description.trim() || null,
        category,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null
      });
      
      toast({ title: 'Success', description: 'Task updated successfully' });
      resetForm();
      setEditingTodo(null);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleComplete = async (todoId: string, currentState: boolean) => {
    try {
      await toggleTodoComplete(todoId, !currentState);
      toast({ 
        title: currentState ? 'Task Reopened' : 'Task Completed', 
        description: currentState ? 'Task marked as pending' : 'Great job! Task completed!' 
      });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteTodo = async () => {
    try {
      await deleteTodo(deleteDialog.todoId);
      toast({ title: 'Deleted', description: 'Task removed' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setDeleteDialog({ open: false, todoId: '' });
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('teaching');
    setPriority('medium');
    setDueDate('');
  };

  const startEdit = (todo: TodoItem) => {
    setEditingTodo(todo);
    setTitle(todo.title);
    setDescription(todo.description || '');
    setCategory(todo.category);
    setPriority(todo.priority);
    setDueDate(todo.dueDate ? todo.dueDate.toISOString().split('T')[0] : '');
    setShowAddForm(false);
  };

  const getPriorityColor = (p: PriorityType): string => {
    switch (p) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getCategoryIcon = (c: CategoryType): string => {
    switch (c) {
      case 'teaching': return '📚';
      case 'admin': return '📋';
      case 'student': return '👥';
      case 'personal': return '👤';
    }
  };

  const isOverdue = (todo: TodoItem): boolean => {
    return !todo.completed && !!todo.dueDate && new Date(todo.dueDate) < new Date();
  };

  const formatDate = (date: Date): string => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-pulse">Loading tasks...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-purple-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-purple-600" />
              Teaching Tasks
              {todos.filter(t => !t.completed).length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {todos.filter(t => !t.completed).length} pending
                </Badge>
              )}
            </CardTitle>
            {!showAddForm && !editingTodo && (
              <Button
                size="sm"
                onClick={() => setShowAddForm(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Task
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add/Edit Form */}
          {(showAddForm || editingTodo) && (
            <Card className="bg-gray-50 border-dashed">
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">
                    {editingTodo ? 'Edit Task' : 'New Task'}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingTodo(null);
                      resetForm();
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <Input
                  placeholder="Task title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                
                {!compact && (
                  <Input
                    placeholder="Description (optional)..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                )}
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Category</Label>
                    <Select value={category} onValueChange={(v) => setCategory(v as CategoryType)}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="teaching">📚 Teaching</SelectItem>
                        <SelectItem value="admin">📋 Admin</SelectItem>
                        <SelectItem value="student">👥 Student</SelectItem>
                        <SelectItem value="personal">👤 Personal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Priority</Label>
                    <Select value={priority} onValueChange={(v) => setPriority(v as PriorityType)}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">🔴 High</SelectItem>
                        <SelectItem value="medium">🟡 Medium</SelectItem>
                        <SelectItem value="low">🟢 Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label className="text-xs">Due Date (optional)</Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="h-8"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingTodo(null);
                      resetForm();
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={editingTodo ? handleEditTodo : handleAddTodo}
                    disabled={isSubmitting || !title.trim()}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    {isSubmitting ? 'Saving...' : (editingTodo ? 'Update' : 'Add')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filter Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {(['all', 'pending', 'completed', 'overdue'] as FilterType[]).map((f) => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? 'default' : 'ghost'}
                className={`text-xs ${filter === f ? 'bg-purple-600' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' && <Filter className="w-3 h-3 mr-1" />}
                {f === 'overdue' && <AlertCircle className="w-3 h-3 mr-1" />}
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f === 'pending' && todos.filter(t => !t.completed).length > 0 && (
                  <span className="ml-1 text-xs">({todos.filter(t => !t.completed).length})</span>
                )}
                {f === 'overdue' && todos.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length > 0 && (
                  <span className="ml-1 text-xs text-red-600">
                    ({todos.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length})
                  </span>
                )}
              </Button>
            ))}
          </div>

          {/* Todo List */}
          {filteredTodos.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <ListTodo className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">
                {filter === 'all' ? 'No tasks yet. Add your first task!' : `No ${filter} tasks`}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTodos.map((todo) => (
                <div
                  key={todo.id}
                  className={`p-3 rounded-lg border transition-all ${
                    todo.completed
                      ? 'bg-gray-50 border-gray-200 opacity-60'
                      : isOverdue(todo)
                        ? 'bg-red-50 border-red-200'
                        : 'bg-white border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggleComplete(todo.id, todo.completed)}
                      className={`mt-0.5 flex-shrink-0 ${
                        todo.completed ? 'text-green-600' : 'text-gray-400 hover:text-purple-600'
                      }`}
                    >
                      {todo.completed ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${todo.completed ? 'line-through text-gray-500' : ''}`}>
                        {todo.title}
                      </p>
                      
                      {!compact && todo.description && (
                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                          {todo.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {getCategoryIcon(todo.category)} {todo.category}
                        </Badge>
                        
                        <Badge variant="outline" className={`text-xs ${getPriorityColor(todo.priority)}`}>
                          <Flag className="w-3 h-3 mr-1" />
                          {todo.priority}
                        </Badge>
                        
                        {todo.dueDate && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${isOverdue(todo) ? 'text-red-600 bg-red-50' : ''}`}
                          >
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatDate(todo.dueDate)}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => startEdit(todo)}
                      >
                        <Edit2 className="w-4 h-4 text-gray-500" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        onClick={() => setDeleteDialog({ open: true, todoId: todo.id })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTodo} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
