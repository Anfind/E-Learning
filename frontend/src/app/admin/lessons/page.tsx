'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  PlayCircle,
  Clock,
  CheckCircle,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import type { Lesson, Subject, Major } from '@/types';
import { toast } from 'sonner';

interface LessonWithRelations extends Lesson {
  subject: Subject & { major: Major };
  prerequisite?: Lesson;
}

export default function AdminLessonsPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState<LessonWithRelations[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMajor, setFilterMajor] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');

  // Dialog states
  const [showDialog, setShowDialog] = useState(false);
  const [editingLesson, setEditingLesson] = useState<LessonWithRelations | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingLesson, setDeletingLesson] = useState<LessonWithRelations | null>(null);

  // Form states
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
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (!authLoading && user && !isAdmin) {
      router.push('/dashboard');
    } else if (user && isAdmin) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, isAdmin]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [lessonsRes, majorsRes, subjectsRes] = await Promise.all([
        api.get<{ success: boolean; data: LessonWithRelations[] }>('/lessons'),
        api.get<{ success: boolean; data: Major[] }>('/majors'),
        api.get<{ success: boolean; data: Subject[] }>('/subjects'),
      ]);
      setLessons(lessonsRes.data || []);
      setMajors(majorsRes.data || []);
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
      order: 1,
      subjectId: '',
      prerequisiteId: '',
      isActive: true,
    });
    setShowDialog(true);
  };

  const openEditDialog = (lesson: LessonWithRelations) => {
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

  const openDeleteDialog = (lesson: LessonWithRelations) => {
    setDeletingLesson(lesson);
    setShowDeleteDialog(true);
  };

  // Filter lessons
  const filteredLessons = lessons.filter((lesson) => {
    const matchSearch = lesson.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchMajor = filterMajor === 'all' || lesson.subject.majorId === filterMajor;
    const matchSubject = filterSubject === 'all' || lesson.subjectId === filterSubject;
    return matchSearch && matchMajor && matchSubject;
  });

  // Get available prerequisites for selected subject
  const availablePrerequisites = lessons.filter(
    (l) => l.subjectId === formData.subjectId && (!editingLesson || l.id !== editingLesson.id)
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-gray-900">Quản lý bài học</h1>
              <p className="text-gray-600">Tạo, chỉnh sửa và quản lý các bài học</p>
            </div>
            <Button onClick={openCreateDialog} size="lg" className="bg-purple-600 hover:bg-purple-700">
              <Plus className="mr-2 h-5 w-5" />
              Thêm bài học
            </Button>
          </div>

          {/* Filters */}
          <Card className="mb-6 shadow-sm border-gray-200">
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-4 gap-4">
                <div className="md:col-span-2 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Tìm kiếm bài học..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-200 focus:border-purple-400 focus:ring-purple-400"
                  />
                </div>
                <Select value={filterMajor} onValueChange={setFilterMajor}>
                  <SelectTrigger className="border-gray-200 focus:border-purple-400 focus:ring-purple-400">
                    <SelectValue placeholder="Lọc theo ngành" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả ngành</SelectItem>
                    {majors.map((major) => (
                      <SelectItem key={major.id} value={major.id}>
                        {major.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterSubject} onValueChange={setFilterSubject}>
                  <SelectTrigger className="border-gray-200 focus:border-purple-400 focus:ring-purple-400">
                    <SelectValue placeholder="Lọc theo môn" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả môn</SelectItem>
                    {subjects
                      .filter((s) => filterMajor === 'all' || s.majorId === filterMajor)
                      .map((subject) => (
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
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead className="font-semibold min-w-[250px]">Bài học</TableHead>
                      <TableHead className="font-semibold min-w-[150px]">Môn học</TableHead>
                      <TableHead className="font-semibold min-w-[150px]">Tiên quyết</TableHead>
                      <TableHead className="font-semibold min-w-[120px]">Thời lượng</TableHead>
                      <TableHead className="font-semibold min-w-[100px]">Thứ tự</TableHead>
                      <TableHead className="font-semibold min-w-[120px]">Trạng thái</TableHead>
                      <TableHead className="text-right font-semibold w-[150px] sticky right-0 bg-white">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Đang tải...
                      </TableCell>
                    </TableRow>
                  ) : filteredLessons.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        Không có bài học nào
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLessons.map((lesson, index) => (
                      <TableRow 
                        key={lesson.id} 
                        className={index % 2 === 0 ? 'bg-white hover:bg-purple-50/30' : 'bg-gray-50/50 hover:bg-purple-50/30'}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-purple-200">
                              <PlayCircle className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{lesson.name}</div>
                              <div className="text-xs text-gray-500 line-clamp-1">
                                {lesson.description}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">{lesson.subject.name}</div>
                            <div className="text-xs">
                              <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 text-xs">
                                {lesson.subject.major.name}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {lesson.prerequisite ? (
                            <div className="text-sm text-gray-700 font-medium">{lesson.prerequisite.name}</div>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-4 w-4 text-orange-500" />
                            <span className="font-medium text-gray-700">{lesson.duration} phút</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200">{lesson.order}</Badge>
                        </TableCell>
                        <TableCell>
                          {lesson.isActive ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              ● Hoạt động
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800 border-gray-200">◯ Ẩn</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right sticky right-0 bg-white border-l shadow-sm">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              size="sm"
                              onClick={() => openEditDialog(lesson)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              className="bg-red-600 hover:bg-red-700 text-white"
                              size="sm"
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
              Điền thông tin chi tiết bài học
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Tên bài học <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Giới thiệu về Python"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả nội dung bài học..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="videoUrl">
                  Video URL <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="videoUrl"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                />
                <p className="text-xs text-gray-500">
                  Hỗ trợ: YouTube, Vimeo, hoặc link video trực tiếp
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">
                    Thời lượng (phút) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="order">Thứ tự</Label>
                  <Input
                    id="order"
                    type="number"
                    min="1"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subjectId">
                  Môn học <span className="text-red-500">*</span>
                </Label>
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
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.subjectId && (
                <div className="space-y-2">
                  <Label htmlFor="prerequisiteId">Bài học tiên quyết</Label>
                  <Select
                    value={formData.prerequisiteId || 'none'}
                    onValueChange={(value) => setFormData({ ...formData, prerequisiteId: value === 'none' ? '' : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Không có tiên quyết" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Không có</SelectItem>
                      {availablePrerequisites.map((lesson) => (
                        <SelectItem key={lesson.id} value={lesson.id}>
                          {lesson.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Kích hoạt</Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={submitting} className="bg-purple-600 hover:bg-purple-700">
                {submitting ? 'Đang lưu...' : editingLesson ? 'Cập nhật' : 'Tạo mới'}
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
              <br />
              <span className="text-red-600 font-medium">
                Hành động này không thể hoàn tác!
              </span>
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
