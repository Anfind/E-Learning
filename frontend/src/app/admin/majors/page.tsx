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
  Users,
  GraduationCap,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import type { Major } from '@/types';
import { toast } from 'sonner';
import Image from 'next/image';

interface MajorWithStats extends Major {
  _count?: {
    subjects: number;
    enrollments: number;
  };
}

export default function AdminMajorsPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [majors, setMajors] = useState<MajorWithStats[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Dialog states
  const [showDialog, setShowDialog] = useState(false);
  const [editingMajor, setEditingMajor] = useState<MajorWithStats | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingMajor, setDeletingMajor] = useState<MajorWithStats | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
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
      loadMajors();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, isAdmin]);

  const loadMajors = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ success: boolean; data: MajorWithStats[] }>('/majors');
      setMajors(response.data || []);
    } catch (error) {
      console.error('Failed to load majors:', error);
      toast.error('Không thể tải danh sách ngành học');
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
    setEditingMajor(null);
    setFormData({
      name: '',
      description: '',
      order: majors.length + 1,
      isActive: true,
    });
    setImageFile(null);
    setImagePreview('');
    setShowDialog(true);
  };

  const openEditDialog = (major: MajorWithStats) => {
    setEditingMajor(major);
    setFormData({
      name: major.name,
      description: major.description || '',
      order: major.order,
      isActive: major.isActive,
    });
    setImageFile(null);
    setImagePreview(major.imageUrl ? getUploadUrl(major.imageUrl) : '');
    setShowDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên ngành học');
      return;
    }

    try {
      setSubmitting(true);
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('order', formData.order.toString());
      data.append('isActive', formData.isActive.toString());
      if (imageFile) {
        data.append('image', imageFile);
      }

      if (editingMajor) {
        await api.patchForm(`/majors/${editingMajor.id}`, data);
        toast.success('Cập nhật ngành học thành công');
      } else {
        await api.postForm('/majors', data);
        toast.success('Tạo ngành học thành công');
      }

      setShowDialog(false);
      loadMajors();
    } catch (error) {
      console.error('Failed to save major:', error);
      toast.error(editingMajor ? 'Cập nhật thất bại' : 'Tạo mới thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingMajor) return;

    try {
      await api.delete(`/majors/${deletingMajor.id}`);
      toast.success('Xóa ngành học thành công');
      setShowDeleteDialog(false);
      setDeletingMajor(null);
      loadMajors();
    } catch (error) {
      console.error('Failed to delete major:', error);
      toast.error('Xóa thất bại');
    }
  };

  const openDeleteDialog = (major: MajorWithStats) => {
    setDeletingMajor(major);
    setShowDeleteDialog(true);
  };

  const filteredMajors = majors.filter((major) =>
    major.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-gray-900">Quản lý ngành học</h1>
              <p className="text-gray-600">Tạo, chỉnh sửa và quản lý các ngành học</p>
            </div>
            <Button onClick={openCreateDialog} size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-5 w-5" />
              Thêm ngành học
            </Button>
          </div>

          {/* Search */}
          <Card className="mb-6 shadow-sm border-gray-200">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm ngành học..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                />
              </div>
            </CardContent>
          </Card>

          {/* Majors Table */}
          <Card className="shadow-sm border-gray-200">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead className="font-semibold min-w-[250px]">Ngành học</TableHead>
                      <TableHead className="font-semibold min-w-[100px]">Thứ tự</TableHead>
                      <TableHead className="font-semibold min-w-[120px]">Số môn học</TableHead>
                      <TableHead className="font-semibold min-w-[120px]">Số học viên</TableHead>
                      <TableHead className="font-semibold min-w-[120px]">Trạng thái</TableHead>
                      <TableHead className="text-right font-semibold w-[150px] sticky right-0 bg-white">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Đang tải...
                      </TableCell>
                    </TableRow>
                  ) : filteredMajors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {searchTerm ? 'Không tìm thấy kết quả' : 'Chưa có ngành học nào'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMajors.map((major, index) => (
                      <TableRow 
                        key={major.id}
                        className={index % 2 === 0 ? 'bg-white hover:bg-blue-50/30' : 'bg-gray-50/50 hover:bg-blue-50/30'}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100 flex-shrink-0 border-2 border-blue-200">
                              {major.imageUrl ? (
                                <Image
                                  src={getUploadUrl(major.imageUrl)}
                                  alt={major.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <GraduationCap className="h-6 w-6 text-blue-600" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{major.name}</div>
                              {major.description && (
                                <div className="text-sm text-muted-foreground line-clamp-1">
                                  {major.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200">{major.order}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-gray-700">{major._count?.subjects || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-purple-600" />
                            <span className="font-medium text-gray-700">{major._count?.enrollments || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {major.isActive ? (
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
                              onClick={() => openEditDialog(major)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              className="bg-red-600 hover:bg-red-700 text-white"
                              variant="destructive"
                              onClick={() => openDeleteDialog(major)}
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
              {editingMajor ? 'Chỉnh sửa ngành học' : 'Thêm ngành học mới'}
            </DialogTitle>
            <DialogDescription>
              {editingMajor
                ? 'Cập nhật thông tin ngành học'
                : 'Tạo một ngành học mới trong hệ thống'}
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
                Tên ngành học <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Công nghệ thông tin"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả về ngành học..."
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
              <p className="text-xs text-muted-foreground">
                Ngành học sẽ hiển thị theo thứ tự từ nhỏ đến lớn
              </p>
            </div>

            {/* Is Active */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">Trạng thái hoạt động</Label>
                <p className="text-sm text-muted-foreground">
                  Ngành học sẽ hiển thị với người dùng khi được kích hoạt
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
                {submitting ? 'Đang xử lý...' : editingMajor ? 'Cập nhật' : 'Tạo mới'}
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
              Bạn có chắc chắn muốn xóa ngành học <strong>{deletingMajor?.name}</strong>?
              <br />
              <span className="text-destructive">
                Lưu ý: Tất cả môn học và dữ liệu liên quan sẽ bị xóa theo.
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
