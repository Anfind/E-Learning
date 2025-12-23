'use client';

import { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, getUploadUrl } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Search,
  UserCheck,
  UserX,
  Shield,
  User as UserIcon
} from 'lucide-react';
import Header from '@/components/layout/Header';
import type { User, UserStatus, Role } from '@/types';
import { toast } from 'sonner';

function AdminUsersContent() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });
  
  const [filters, setFilters] = useState<{
    search: string;
    status: UserStatus | 'all';
    role: Role | 'all';
  }>({
    search: searchParams.get('search') || '',
    status: (searchParams.get('status') as UserStatus | 'all') || 'all',
    role: (searchParams.get('role') as Role | 'all') || 'all',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (!authLoading && user && !isAdmin) {
      router.push('/dashboard');
    } else if (user && isAdmin) {
      loadUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, isAdmin, router, filters]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());
      if (filters.search) params.append('search', filters.search);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.role && filters.role !== 'all') params.append('role', filters.role);

      const response = await api.get<{ 
        success: boolean; 
        data: { 
          users: User[]; 
          pagination: typeof pagination 
        } 
      }>(`/users?${params.toString()}`);
      // Backend returns: { success: true, data: { users: [], pagination: {} } }
      setUsers(response.data.users || []);
      setPagination(response.data.pagination || {
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      await api.patch(`/users/${userId}/approve`);
      toast.success('Đã phê duyệt người dùng');
      loadUsers();
    } catch {
      toast.error('Phê duyệt thất bại');
    }
  };

  const handleUpdateStatus = async (userId: string, status: UserStatus) => {
    try {
      console.log('[UPDATE STATUS] userId:', userId, 'status:', status);
      // Backend endpoint: PATCH /api/users/:id/status
      await api.patch(`/users/${userId}/status`, { status });
      toast.success(`Đã ${status === 'ACTIVE' ? 'mở khóa' : 'khóa'} tài khoản`);
      loadUsers();
    } catch (error) {
      console.error('[UPDATE STATUS ERROR]', error);
      toast.error('Cập nhật thất bại');
    }
  };

  const getStatusBadge = (status: UserStatus) => {
    const statusConfig: Record<UserStatus, { className: string; label: string }> = {
      PENDING: { 
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
        label: '⏳ Chờ duyệt' 
      },
      APPROVED: { 
        className: 'bg-blue-100 text-blue-800 border-blue-200', 
        label: '✓ Đã duyệt' 
      },
      ACTIVE: { 
        className: 'bg-green-100 text-green-800 border-green-200', 
        label: '● Hoạt động' 
      },
      DEACTIVE: { 
        className: 'bg-red-100 text-red-800 border-red-200', 
        label: '✕ Khóa' 
      },
    };
    const config = statusConfig[status];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 text-gray-900">Quản lý người dùng</h1>
            <p className="text-gray-600">
              Quản lý tài khoản và phê duyệt người dùng
            </p>
          </div>

          {/* Filters */}
          <Card className="mb-6 border-blue-100 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="text-blue-900">Bộ lọc</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Tìm kiếm theo tên, email, SĐT..."
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      className="pl-10 border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                    />
                  </div>
                </div>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters({ ...filters, status: value as UserStatus })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="PENDING">Chờ duyệt</SelectItem>
                    <SelectItem value="APPROVED">Đã duyệt</SelectItem>
                    <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                    <SelectItem value="DEACTIVE">Khóa</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filters.role}
                  onValueChange={(value) => setFilters({ ...filters, role: value as Role })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vai trò" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="USER">Học viên</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card className="shadow-sm border-gray-200">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead className="font-semibold min-w-[200px]">Người dùng</TableHead>
                      <TableHead className="font-semibold min-w-[200px]">Email</TableHead>
                      <TableHead className="font-semibold min-w-[120px]">SĐT</TableHead>
                      <TableHead className="font-semibold min-w-[100px]">Vai trò</TableHead>
                      <TableHead className="font-semibold min-w-[120px]">Trạng thái</TableHead>
                      <TableHead className="font-semibold min-w-[120px]">Ngày tạo</TableHead>
                      <TableHead className="text-right font-semibold w-[200px] sticky right-0 bg-white">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Đang tải...
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Không có dữ liệu
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((u, index) => (
                      <TableRow 
                        key={u.id}
                        className={index % 2 === 0 ? 'bg-white hover:bg-blue-50/50' : 'bg-gray-50/50 hover:bg-blue-50/50'}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="border-2 border-blue-100">
                              <AvatarImage src={getUploadUrl(u.avatar)} />
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                                {u.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-gray-900">{u.name}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-700">{u.email}</TableCell>
                        <TableCell className="text-gray-700">{u.phone || '-'}</TableCell>
                        <TableCell>
                          {u.role === 'ADMIN' ? (
                            <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
                              <Shield className="mr-1 h-3 w-3" />
                              Admin
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                              <UserIcon className="mr-1 h-3 w-3" />
                              Học viên
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(u.status)}</TableCell>
                        <TableCell className="text-gray-700">{new Date(u.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                        <TableCell className="text-right sticky right-0 bg-white border-l shadow-sm">
                          <div className="flex items-center justify-end gap-2">
                            {u.status === 'PENDING' && (
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleApprove(u.id)}
                              >
                                <UserCheck className="mr-1 h-4 w-4" />
                                Duyệt
                              </Button>
                            )}
                            {u.status === 'ACTIVE' && (
                              <Button
                                size="sm"
                                className="bg-red-600 hover:bg-red-700 text-white"
                                onClick={() => handleUpdateStatus(u.id, 'DEACTIVE')}
                              >
                                <UserX className="mr-1 h-4 w-4" />
                                Khóa
                              </Button>
                            )}
                            {u.status === 'DEACTIVE' && (
                              <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={() => handleUpdateStatus(u.id, 'ACTIVE')}
                              >
                                <UserCheck className="mr-1 h-4 w-4" />
                                Mở khóa
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Hiển thị {users.length} / {pagination.total} người dùng
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === 1}
                      onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    >
                      Trước
                    </Button>
                    <span className="text-sm">
                      Trang {pagination.page} / {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === pagination.totalPages}
                      onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang tải...</div>}>
      <AdminUsersContent />
    </Suspense>
  );
}
