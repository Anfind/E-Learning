'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { api, getUploadUrl } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
  Plus,
  Search,
  Pencil,
  Trash2,
  Image as ImageIcon,
  BookOpen,
  Lock,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import type { Subject, Major } from '@/types';
import { toast } from 'sonner';
import Image from 'next/image';

interface SubjectWithStats extends Subject {
  _count?: {
    lessons: number;
    exams: number;
  };
}

export default function AdminSubjectsPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<SubjectWithStats[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMajor, setFilterMajor] = useState('all');

  // Dialog states
  const [showDialog, setShowDialog] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectWithStats | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingSubject, setDeletingSubject] = useState<SubjectWithStats | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    majorId: '',
    prerequisiteId: '',
    order: 1,
    isActive: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
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
      const [subjectsRes, majorsRes] = await Promise.all([
        api.get<{ success: boolean; data: SubjectWithStats[] }>('/subjects'),
        api.get<{ success: boolean; data: Major[] }>('/majors'),
      ]);
      setSubjects(subjectsRes.data || []);
      setMajors(majorsRes.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const openCreateDialog = () => {
    setEditingSubject(null);
    setFormData({
      name: '',
      description: '',
      majorId: filterMajor || '',
      prerequisiteId: '',
      order: subjects.length + 1,
      isActive: true,
    });
    setImageFile(null);
    setImagePreview('');
    setShowDialog(true);
  };

  const openEditDialog = (subject: SubjectWithStats) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      description: subject.description || '',
      majorId: subject.majorId || '',
      prerequisiteId: subject.prerequisiteId || '',
      order: subject.order,
      isActive: subject.isActive,
    });
    setImageFile(null);
    setImagePreview(subject.imageUrl ? getUploadUrl(subject.imageUrl) : '');
    setShowDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.majorId) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    try {
      setSubmitting(true);
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('majorId', formData.majorId);
      if (formData.prerequisiteId) {
        data.append('prerequisiteId', formData.prerequisiteId);
      }
      data.append('order', formData.order.toString());
      data.append('isActive', formData.isActive.toString());
      if (imageFile) {
        data.append('image', imageFile);
      }

      if (editingSubject) {
        await api.patchForm(`/subjects/${editingSubject.id}`, data);
        toast.success('Cập nhật môn học thành công');
      } else {
        await api.postForm('/subjects', data);
        toast.success('Tạo môn học thành công');
      }

      setShowDialog(false);
      loadData();
    } catch (error) {
      console.error('Failed to save subject:', error);
      toast.error(editingSubject ? 'Cập nhật thất bại' : 'Tạo mới thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingSubject) return;

    try {
      await api.delete(`/subjects/${deletingSubject.id}`);
      toast.success('Xóa môn học thành công');
      setShowDeleteDialog(false);
      setDeletingSubject(null);
      loadData();
    } catch (error) {
      console.error('Failed to delete subject:', error);
      toast.error('Xóa thất bại');
    }
  };

  const openDeleteDialog = (subject: SubjectWithStats) => {
    setDeletingSubject(subject);
    setShowDeleteDialog(true);
  };

  const filteredSubjects = subjects.filter((subject) => {
    const matchesSearch = subject.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMajor = filterMajor === 'all' || subject.majorId === filterMajor;
    return matchesSearch && matchesMajor;
  });

  // Get available prerequisites for selected major
  const availablePrerequisites = subjects.filter(
    (s) => s.majorId === formData.majorId && (!editingSubject || s.id !== editingSubject.id)
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-gray-900">Quản lý môn học</h1>
              <p className="text-gray-600">Tạo, chỉnh sửa và quản lý các môn học</p>
            </div>
            <Button onClick={openCreateDialog} size="lg" className="bg-green-600 hover:bg-green-700">
              <Plus className="mr-2 h-5 w-5" />
              Thêm môn học
            </Button>
          </div>

          {/* Filters */}
          <Card className="mb-6 shadow-sm border-gray-200">
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Tìm kiếm môn học..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-200 focus:border-green-400 focus:ring-green-400"
                  />
                </div>
                <Select value={filterMajor} onValueChange={setFilterMajor}>
                  <SelectTrigger className="border-gray-200 focus:border-green-400 focus:ring-green-400">
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
              </div>
            </CardContent>
          </Card>

          {/* Subjects Table */}
          <Card className="shadow-sm border-gray-200">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead className="font-semibold min-w-[250px]">Môn học</TableHead>
                      <TableHead className="font-semibold min-w-[150px]">Ngành học</TableHead>
                      <TableHead className="font-semibold min-w-[150px]">Tiên quyết</TableHead>
                      <TableHead className="font-semibold min-w-[100px]">Thứ tự</TableHead>
                      <TableHead className="font-semibold min-w-[100px]">Bài học</TableHead>
                      <TableHead className="font-semibold min-w-[100px]">Bài thi</TableHead>
                      <TableHead className="font-semibold min-w-[120px]">Trạng thái</TableHead>
                      <TableHead className="text-right font-semibold w-[150px] sticky right-0 bg-white">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        Đang tải...
                      </TableCell>
                    </TableRow>
                  ) : filteredSubjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        {searchTerm || filterMajor ? 'Không tìm thấy kết quả' : 'Chưa có môn học nào'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSubjects.map((subject, index) => (
                      <TableRow 
                        key={subject.id}
                        className={index % 2 === 0 ? 'bg-white hover:bg-green-50/30' : 'bg-gray-50/50 hover:bg-green-50/30'}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-green-100 to-emerald-100 flex-shrink-0 border-2 border-green-200">
                              {subject.imageUrl ? (
                                <Image
                                  src={getUploadUrl(subject.imageUrl)}
                                  alt={subject.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <BookOpen className="h-6 w-6 text-green-600" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{subject.name}</div>
                              {subject.description && (
                                <div className="text-sm text-muted-foreground line-clamp-1">
                                  {subject.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-purple-100 text-purple-800 border-purple-200">{subject.major?.name}</Badge>
                        </TableCell>
                        <TableCell>
                          {subject.prerequisite ? (
                            <div className="flex items-center gap-1">
                              <Lock className="h-3 w-3 text-orange-600" />
                              <span className="text-sm text-gray-700">{subject.prerequisite.name}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200">{subject.order}</Badge>
                        </TableCell>
                        <TableCell className="text-gray-700 font-medium">{subject._count?.lessons || 0}</TableCell>
                        <TableCell className="text-gray-700 font-medium">{subject._count?.exams || 0}</TableCell>
                        <TableCell>
                          {subject.isActive ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">● Hoạt động</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800 border-gray-200">◯ Ẩn</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right sticky right-0 bg-white border-l shadow-sm">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() => openEditDialog(subject)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              className="bg-red-600 hover:bg-red-700 text-white"
                              onClick={() => openDeleteDialog(subject)}
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
              {editingSubject ? 'Chỉnh sửa môn học' : 'Thêm môn học mới'}
            </DialogTitle>
            <DialogDescription>
              {editingSubject
                ? 'Cập nhật thông tin môn học'
                : 'Tạo một môn học mới trong hệ thống'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Ảnh đại diện</Label>
              <div className="flex items-start gap-4">
                <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-muted border-2 border-dashed flex-shrink-0">
                  {imagePreview ? (
                    <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground">
                    Khuyến nghị: 400x300px, định dạng JPG/PNG
                  </p>
                </div>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Tên môn học <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Lập trình C cơ bản"
                required
              />
            </div>

            {/* Major */}
            <div className="space-y-2">
              <Label htmlFor="majorId">
                Ngành học <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.majorId}
                onValueChange={(value) => setFormData({ ...formData, majorId: value, prerequisiteId: '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn ngành học" />
                </SelectTrigger>
                <SelectContent>
                  {majors.map((major) => (
                    <SelectItem key={major.id} value={major.id}>
                      {major.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Prerequisite */}
            <div className="space-y-2">
              <Label htmlFor="prerequisiteId">Môn tiên quyết</Label>
              <Select
                value={formData.prerequisiteId || 'none'}
                onValueChange={(value) => setFormData({ ...formData, prerequisiteId: value === 'none' ? '' : value })}
                disabled={!formData.majorId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Không có (tùy chọn)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không có</SelectItem>
                  {availablePrerequisites.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Học viên phải hoàn thành môn tiên quyết trước khi học môn này
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả về môn học..."
                rows={4}
              />
            </div>

            {/* Order */}
            <div className="space-y-2">
              <Label htmlFor="order">Thứ tự hiển thị</Label>
              <Input
                id="order"
                type="number"
                min="1"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
              />
            </div>

            {/* Is Active */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">Trạng thái hoạt động</Label>
                <p className="text-sm text-muted-foreground">
                  Môn học sẽ hiển thị với người dùng khi được kích hoạt
                </p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked: boolean) => setFormData({ ...formData, isActive: checked })}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
                disabled={submitting}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Đang xử lý...' : editingSubject ? 'Cập nhật' : 'Tạo mới'}
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
              Bạn có chắc chắn muốn xóa môn học <strong>{deletingSubject?.name}</strong>?
              <br />
              <span className="text-destructive">
                Lưu ý: Tất cả bài học, bài thi và dữ liệu liên quan sẽ bị xóa theo.
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
