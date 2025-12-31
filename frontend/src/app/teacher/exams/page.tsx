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
  Award,
  Clock,
  FileQuestion,
  Users,
  Settings,
} from 'lucide-react';
import Link from 'next/link';
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

interface Exam {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  passingScore: number;
  order: number;
  isRequired: boolean;
  isActive: boolean;
  subjectId: string;
  subject: {
    id: string;
    name: string;
    major: {
      name: string;
    };
  };
  _count: {
    questions: number;
    attempts: number;
  };
}

export default function TeacherExamsPage() {
  const { user, loading: authLoading, isTeacher, isAdmin } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  
  // Dialog states
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [deletingExam, setDeletingExam] = useState<Exam | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: 60,
    passingScore: 70,
    order: 1,
    subjectId: '',
    isRequired: false,
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
      const [examsRes, subjectsRes] = await Promise.all([
        api.get<{ data: Exam[] }>('/teacher/exams'),
        api.get<{ data: Subject[] }>('/teacher/subjects'),
      ]);
      setExams(examsRes.data || []);
      setSubjects(subjectsRes.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingExam(null);
    setFormData({
      name: '',
      description: '',
      duration: 60,
      passingScore: 70,
      order: exams.length + 1,
      subjectId: filterSubject !== 'all' ? filterSubject : '',
      isRequired: false,
      isActive: true,
    });
    setShowDialog(true);
  };

  const openEditDialog = (exam: Exam) => {
    setEditingExam(exam);
    setFormData({
      name: exam.name,
      description: exam.description || '',
      duration: exam.duration,
      passingScore: exam.passingScore,
      order: exam.order,
      subjectId: exam.subjectId,
      isRequired: exam.isRequired,
      isActive: exam.isActive,
    });
    setShowDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.subjectId) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    if (formData.passingScore < 0 || formData.passingScore > 100) {
      toast.error('Điểm đạt phải từ 0-100');
      return;
    }

    setSubmitting(true);
    try {
      if (editingExam) {
        await api.patch(`/exams/${editingExam.id}`, formData);
        toast.success('Cập nhật bài thi thành công');
      } else {
        await api.post('/exams', formData);
        toast.success('Tạo bài thi thành công');
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
    if (!deletingExam) return;

    try {
      await api.delete(`/exams/${deletingExam.id}`);
      toast.success('Xóa bài thi thành công');
      setShowDeleteDialog(false);
      setDeletingExam(null);
      loadData();
    } catch (error) {
      const err = error as { message?: string };
      toast.error(err.message || 'Không thể xóa bài thi');
    }
  };

  const openDeleteDialog = (exam: Exam) => {
    setDeletingExam(exam);
    setShowDeleteDialog(true);
  };

  // Filter exams
  const filteredExams = exams.filter((exam) => {
    const matchSearch = exam.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSubject = filterSubject === 'all' || exam.subjectId === filterSubject;
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
              <h1 className="text-3xl font-bold mb-2 text-gray-900">Quản lý bài thi</h1>
              <p className="text-gray-600">Tạo và quản lý bài thi cho các môn bạn phụ trách</p>
            </div>
            <Button onClick={openCreateDialog} size="lg" className="bg-orange-600 hover:bg-orange-700">
              <Plus className="mr-2 h-5 w-5" />
              Thêm bài thi
            </Button>
          </div>

          {/* Filters */}
          <Card className="mb-6 shadow-sm border-gray-200">
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Tìm kiếm bài thi..."
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

          {/* Exams Table */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
              <CardTitle className="text-orange-900">
                Danh sách bài thi ({filteredExams.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold min-w-[250px]">Bài thi</TableHead>
                      <TableHead className="font-semibold min-w-[150px]">Môn học</TableHead>
                      <TableHead className="font-semibold min-w-[100px]">Thời gian</TableHead>
                      <TableHead className="font-semibold min-w-[100px]">Điểm đạt</TableHead>
                      <TableHead className="font-semibold min-w-[100px]">Câu hỏi</TableHead>
                      <TableHead className="font-semibold min-w-[100px]">Lượt thi</TableHead>
                      <TableHead className="font-semibold min-w-[100px]">Trạng thái</TableHead>
                      <TableHead className="text-right font-semibold w-[180px]">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExams.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12">
                          <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">
                            {searchTerm || filterSubject !== 'all' 
                              ? 'Không tìm thấy bài thi phù hợp' 
                              : 'Chưa có bài thi nào'}
                          </p>
                          <Button onClick={openCreateDialog} className="mt-4">
                            <Plus className="mr-2 h-4 w-4" />
                            Thêm bài thi đầu tiên
                          </Button>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredExams.map((exam, index) => (
                        <TableRow
                          key={exam.id}
                          className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                                <Award className="h-5 w-5 text-orange-600" />
                              </div>
                              <div>
                                <p className="font-medium">{exam.name}</p>
                                {exam.isRequired && (
                                  <Badge variant="outline" className="text-xs">
                                    Bắt buộc
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{exam.subject.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {exam.subject.major.name}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              {exam.duration} phút
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              {exam.passingScore}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <FileQuestion className="h-4 w-4 text-muted-foreground" />
                              {exam._count.questions}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              {exam._count.attempts}
                            </div>
                          </TableCell>
                          <TableCell>
                            {exam.isActive ? (
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                Hoạt động
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Tạm ẩn</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link href={`/teacher/exams/${exam.id}/questions`}>
                                <Button size="sm" variant="outline" title="Quản lý câu hỏi">
                                  <Settings className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditDialog(exam)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => openDeleteDialog(exam)}
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
              {editingExam ? 'Chỉnh sửa bài thi' : 'Thêm bài thi mới'}
            </DialogTitle>
            <DialogDescription>
              {editingExam
                ? 'Cập nhật thông tin bài thi'
                : 'Điền thông tin để tạo bài thi mới'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên bài thi *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nhập tên bài thi"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả về bài thi"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Môn học *</Label>
              <Select
                value={formData.subjectId}
                onValueChange={(value) => setFormData({ ...formData, subjectId: value })}
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

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Thời gian (phút) *</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
                  min={1}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passingScore">Điểm đạt (%) *</Label>
                <Input
                  id="passingScore"
                  type="number"
                  value={formData.passingScore}
                  onChange={(e) => setFormData({ ...formData, passingScore: parseInt(e.target.value) || 70 })}
                  min={0}
                  max={100}
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

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="isRequired">Bài thi bắt buộc</Label>
                <p className="text-sm text-muted-foreground">
                  Sinh viên phải đạt bài thi này để hoàn thành môn học
                </p>
              </div>
              <Switch
                id="isRequired"
                checked={formData.isRequired}
                onCheckedChange={(checked) => setFormData({ ...formData, isRequired: checked })}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">Trạng thái hoạt động</Label>
                <p className="text-sm text-muted-foreground">
                  Bài thi sẽ hiển thị cho sinh viên khi được kích hoạt
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
                {submitting ? 'Đang xử lý...' : editingExam ? 'Cập nhật' : 'Tạo mới'}
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
              Bạn có chắc chắn muốn xóa bài thi &ldquo;{deletingExam?.name}&rdquo;?
              Tất cả câu hỏi và kết quả thi sẽ bị xóa. Hành động này không thể hoàn tác.
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
