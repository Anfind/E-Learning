'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  FileText,
  Clock,
  Video,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import { toast } from 'sonner';

interface Subject {
  id: string;
  name: string;
  major: {
    id: string;
    name: string;
  };
}

interface Lesson {
  id: string;
  name: string;
  description: string | null;
  videoUrl: string | null;
  duration: number;
  order: number;
  isActive: boolean;
  subjectId: string;
  prerequisiteId: string | null;
  subject: {
    id: string;
    name: string;
    major: {
      name: string;
    };
  };
  prerequisite: {
    id: string;
    name: string;
  } | null;
}

export default function TeacherLessonsPage() {
  const { user, loading: authLoading, isTeacher, isAdmin } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  
  // Dialog states
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [deletingLesson, setDeletingLesson] = useState<Lesson | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    videoUrl: '',
    duration: 0,
    order: 1,
    subjectId: '',
    prerequisiteId: '',
    isActive: true,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (!authLoading && user && !isTeacher && !isAdmin) {
      router.push('/dashboard');
    } else if (user && (isTeacher || isAdmin)) {
      loadData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, isTeacher, isAdmin]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [lessonsRes, subjectsRes] = await Promise.all([
        api.get<{ data: Lesson[] }>('/teacher/lessons'),
        api.get<{ data: Subject[] }>('/teacher/subjects'),
      ]);
      setLessons(lessonsRes.data || []);
      setSubjects(subjectsRes.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingLesson(null);
    setFormData({
      name: '',
      description: '',
      videoUrl: '',
      duration: 0,
      order: lessons.length + 1,
      subjectId: filterSubject !== 'all' ? filterSubject : '',
      prerequisiteId: '',
      isActive: true,
    });
    setShowDialog(true);
  };

  const openEditDialog = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setFormData({
      name: lesson.name,
      description: lesson.description || '',
      videoUrl: lesson.videoUrl || '',
      duration: lesson.duration,
      order: lesson.order,
      subjectId: lesson.subjectId,
      prerequisiteId: lesson.prerequisiteId || '',
      isActive: lesson.isActive,
    });
    setShowDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.videoUrl || !formData.subjectId) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        prerequisiteId: formData.prerequisiteId || null,
      };

      if (editingLesson) {
        await api.patch(`/lessons/${editingLesson.id}`, payload);
        toast.success('Cập nhật bài học thành công');
      } else {
        await api.post('/lessons', payload);
        toast.success('Tạo bài học thành công');
      }
      
      setShowDialog(false);
      loadData();
    } catch (error) {
      const err = error as { message?: string };
      toast.error(err.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingLesson) return;

    try {
      await api.delete(`/lessons/${deletingLesson.id}`);
      toast.success('Xóa bài học thành công');
      setShowDeleteDialog(false);
      setDeletingLesson(null);
      loadData();
    } catch (error) {
      const err = error as { message?: string };
      toast.error(err.message || 'Không thể xóa bài học');
    }
  };

  const openDeleteDialog = (lesson: Lesson) => {
    setDeletingLesson(lesson);
    setShowDeleteDialog(true);
  };

  // Get lessons from same subject for prerequisite selection
  const lessonsForPrerequisite = lessons.filter(
    (l) => l.subjectId === formData.subjectId && (!editingLesson || l.id !== editingLesson.id)
  );

  // Filter lessons
  const filteredLessons = lessons.filter((lesson) => {
    const matchSearch = lesson.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSubject = filterSubject === 'all' || lesson.subjectId === filterSubject;
    return matchSearch && matchSubject;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <Skeleton className="h-96" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-gray-900">Quản lý bài học</h1>
              <p className="text-gray-600">Tạo và quản lý bài học cho các môn bạn phụ trách</p>
            </div>
            <Button onClick={openCreateDialog} size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-5 w-5" />
              Thêm bài học
            </Button>
          </div>

          {/* Filters */}
          <Card className="mb-6 shadow-sm border-gray-200">
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Tìm kiếm bài học..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterSubject} onValueChange={setFilterSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Lọc theo môn học" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả môn học</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Lessons Table */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="text-blue-900">
                Danh sách bài học ({filteredLessons.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold min-w-[250px]">Bài học</TableHead>
                      <TableHead className="font-semibold min-w-[150px]">Môn học</TableHead>
                      <TableHead className="font-semibold min-w-[100px]">Thời lượng</TableHead>
                      <TableHead className="font-semibold min-w-[100px]">Thứ tự</TableHead>
                      <TableHead className="font-semibold min-w-[100px]">Trạng thái</TableHead>
                      <TableHead className="text-right font-semibold w-[150px]">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLessons.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">
                            {searchTerm || filterSubject !== 'all' 
                              ? 'Không tìm thấy bài học phù hợp' 
                              : 'Chưa có bài học nào'}
                          </p>
                          <Button onClick={openCreateDialog} className="mt-4">
                            <Plus className="mr-2 h-4 w-4" />
                            Thêm bài học đầu tiên
                          </Button>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLessons.map((lesson, index) => (
                        <TableRow
                          key={lesson.id}
                          className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                <Video className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium">{lesson.name}</p>
                                {lesson.prerequisite && (
                                  <p className="text-xs text-muted-foreground">
                                    Yêu cầu: {lesson.prerequisite.name}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{lesson.subject.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {lesson.subject.major.name}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              {lesson.duration} phút
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{lesson.order}</Badge>
                          </TableCell>
                          <TableCell>
                            {lesson.isActive ? (
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                Hoạt động
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Tạm ẩn</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditDialog(lesson)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => openDeleteDialog(lesson)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingLesson ? 'Chỉnh sửa bài học' : 'Thêm bài học mới'}
            </DialogTitle>
            <DialogDescription>
              {editingLesson
                ? 'Cập nhật thông tin bài học'
                : 'Điền thông tin để tạo bài học mới'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên bài học *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nhập tên bài học"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả ngắn về bài học"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="videoUrl">Link video *</Label>
              <Input
                id="videoUrl"
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Thời lượng (phút) *</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                  min={1}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="order">Thứ tự</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                  min={1}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Môn học *</Label>
              <Select
                value={formData.subjectId}
                onValueChange={(value) => setFormData({ ...formData, subjectId: value, prerequisiteId: '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn môn học" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name} ({subject.major.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.subjectId && lessonsForPrerequisite.length > 0 && (
              <div className="space-y-2">
                <Label>Bài học tiên quyết</Label>
                <Select
                  value={formData.prerequisiteId || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, prerequisiteId: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn bài học tiên quyết (không bắt buộc)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Không yêu cầu</SelectItem>
                    {lessonsForPrerequisite.map((lesson) => (
                      <SelectItem key={lesson.id} value={lesson.id}>
                        {lesson.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">Trạng thái hoạt động</Label>
                <p className="text-sm text-muted-foreground">
                  Bài học sẽ hiển thị cho sinh viên khi được kích hoạt
                </p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Đang xử lý...' : editingLesson ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa bài học &ldquo;{deletingLesson?.name}&rdquo;?
              Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
