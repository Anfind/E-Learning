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
  Award,
  Clock,
  CheckCircle,
  FileText,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Link from 'next/link';
import type { Exam, Subject, Major } from '@/types';
import { toast } from 'sonner';

interface ExamWithRelations extends Exam {
  subject: Subject & { major: Major };
  _count?: {
    questions: number;
    attempts: number;
  };
}

export default function AdminExamsPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<ExamWithRelations[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMajor, setFilterMajor] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');

  // Dialog states
  const [showDialog, setShowDialog] = useState(false);
  const [editingExam, setEditingExam] = useState<ExamWithRelations | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingExam, setDeletingExam] = useState<ExamWithRelations | null>(null);

  // Form states
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
      const [examsRes, majorsRes, subjectsRes] = await Promise.all([
        api.get<{ success: boolean; data: ExamWithRelations[] }>('/exams'),
        api.get<{ success: boolean; data: Major[] }>('/majors'),
        api.get<{ success: boolean; data: Subject[] }>('/subjects'),
      ]);
      setExams(examsRes.data || []);
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
    setEditingExam(null);
    setFormData({
      name: '',
      description: '',
      duration: 60,
      passingScore: 70,
      order: 1,
      subjectId: '',
      isRequired: false,
      isActive: true,
    });
    setShowDialog(true);
  };

  const openEditDialog = (exam: ExamWithRelations) => {
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

  const openDeleteDialog = (exam: ExamWithRelations) => {
    setDeletingExam(exam);
    setShowDeleteDialog(true);
  };

  // Filter exams
  const filteredExams = exams.filter((exam) => {
    const matchSearch = exam.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchMajor = filterMajor === 'all' || exam.subject.majorId === filterMajor;
    const matchSubject = filterSubject === 'all' || exam.subjectId === filterSubject;
    return matchSearch && matchMajor && matchSubject;
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-gray-900">Quản lý bài thi</h1>
              <p className="text-gray-600">Tạo, chỉnh sửa và quản lý các bài thi</p>
            </div>
            <Button onClick={openCreateDialog} size="lg" className="bg-orange-600 hover:bg-orange-700">
              <Plus className="mr-2 h-5 w-5" />
              Thêm bài thi
            </Button>
          </div>

          {/* Filters */}
          <Card className="mb-6 shadow-sm border-gray-200">
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-4 gap-4">
                <div className="md:col-span-2 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Tìm kiếm bài thi..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-200 focus:border-orange-400 focus:ring-orange-400"
                  />
                </div>
                <Select value={filterMajor} onValueChange={setFilterMajor}>
                  <SelectTrigger className="border-gray-200 focus:border-orange-400 focus:ring-orange-400">
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
                  <SelectTrigger className="border-gray-200 focus:border-orange-400 focus:ring-orange-400">
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

          {/* Exams Table */}
          <Card className="shadow-sm border-gray-200">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead className="font-semibold min-w-[250px]">Bài thi</TableHead>
                      <TableHead className="font-semibold min-w-[150px]">Môn học</TableHead>
                      <TableHead className="font-semibold min-w-[120px]">Thời gian</TableHead>
                      <TableHead className="font-semibold min-w-[120px]">Điểm đạt</TableHead>
                      <TableHead className="font-semibold min-w-[100px]">Câu hỏi</TableHead>
                      <TableHead className="font-semibold min-w-[100px]">Lượt thi</TableHead>
                      <TableHead className="font-semibold min-w-[120px]">Trạng thái</TableHead>
                      <TableHead className="text-right font-semibold w-[180px] sticky right-0 bg-white">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        Đang tải...
                      </TableCell>
                    </TableRow>
                  ) : filteredExams.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        Không có bài thi nào
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredExams.map((exam, index) => (
                      <TableRow 
                        key={exam.id} 
                        className={index % 2 === 0 ? 'bg-white hover:bg-orange-50/30' : 'bg-gray-50/50 hover:bg-orange-50/30'}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-100 to-red-100 border-2 border-orange-200">
                              <Award className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{exam.name}</div>
                              <div className="text-xs text-gray-500 line-clamp-1">
                                {exam.description}
                              </div>
                              {exam.isRequired && (
                                <Badge className="mt-1 text-xs bg-red-100 text-red-800 border-red-200">
                                  ⚠ Bắt buộc
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">{exam.subject.name}</div>
                            <div className="text-xs mt-1">
                              <Badge className="bg-teal-100 text-teal-700 border-teal-200 text-xs">
                                {exam.subject.major.name}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-4 w-4 text-orange-500" />
                            <span className="font-medium text-gray-700">{exam.duration} phút</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="font-mono bg-yellow-100 text-yellow-800 border-yellow-200">
                            {exam.passingScore}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-700 font-medium">
                            {exam._count?.questions || 0} câu
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-700 font-medium">
                            {exam._count?.attempts || 0} lượt
                          </div>
                        </TableCell>
                        <TableCell>
                          {exam.isActive ? (
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
                            <Link href={`/admin/exams/${exam.id}/questions`}>
                              <Button
                                size="sm"
                                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0"
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                Câu hỏi
                              </Button>
                            </Link>
                            <Button
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              size="sm"
                              onClick={() => openEditDialog(exam)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              className="bg-red-600 hover:bg-red-700 text-white"
                              size="sm"
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
              Điền thông tin chi tiết bài thi
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Tên bài thi <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Kiểm tra cuối khóa Python"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả nội dung bài thi..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subjectId">
                  Môn học <span className="text-red-500">*</span>
                </Label>
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
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">
                    Thời gian (phút) <span className="text-red-500">*</span>
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
                  <Label htmlFor="passingScore">
                    Điểm đạt (%) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="passingScore"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.passingScore}
                    onChange={(e) => setFormData({ ...formData, passingScore: parseInt(e.target.value) })}
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

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isRequired"
                    checked={formData.isRequired}
                    onCheckedChange={(checked) => setFormData({ ...formData, isRequired: checked })}
                  />
                  <Label htmlFor="isRequired">Bắt buộc thi</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="isActive">Kích hoạt</Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={submitting} className="bg-orange-600 hover:bg-orange-700">
                {submitting ? 'Đang lưu...' : editingExam ? 'Cập nhật' : 'Tạo mới'}
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
              <br />
              <span className="text-red-600 font-medium">
                Hành động này sẽ xóa toàn bộ câu hỏi và kết quả thi!
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
