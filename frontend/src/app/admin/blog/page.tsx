'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { api, getUploadUrl } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Pencil,
  Trash2,
  FileText,
  Eye,
  EyeOff,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import { toast } from 'sonner';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  published: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
  };
  tags: Array<{
    tag: {
      id: string;
      name: string;
    };
  }>;
  _count: {
    comments: number;
  };
}

export default function AdminBlogPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingPost, setDeletingPost] = useState<BlogPost | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (!authLoading && user && !isAdmin) {
      router.push('/dashboard');
    } else if (user && isAdmin) {
      loadPosts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, isAdmin]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ success: boolean; data: BlogPost[] }>('/blog');
      setPosts(response.data || []);
    } catch (error) {
      console.error('Failed to load posts:', error);
      toast.error('Không thể tải danh sách bài viết');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublished = async (postId: string, currentStatus: boolean) => {
    try {
      await api.patch(`/blog/${postId}`, { published: !currentStatus });
      toast.success(currentStatus ? 'Đã ẩn bài viết' : 'Đã xuất bản bài viết');
      loadPosts();
    } catch {
      toast.error('Cập nhật thất bại');
    }
  };

  const openDeleteDialog = (post: BlogPost) => {
    setDeletingPost(post);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!deletingPost) return;

    try {
      await api.delete(`/blog/${deletingPost.id}`);
      toast.success('Đã xóa bài viết');
      setShowDeleteDialog(false);
      setDeletingPost(null);
      loadPosts();
    } catch {
      toast.error('Xóa bài viết thất bại');
    }
  };

  const filteredPosts = posts.filter((post) =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-gray-900">Quản lý Blog</h1>
              <p className="text-gray-600">Quản lý bài viết và nội dung</p>
            </div>
            <Button
              onClick={() => router.push('/blog/create')}
              size="lg"
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <FileText className="mr-2 h-5 w-5" />
              Viết bài mới
            </Button>
          </div>

          {/* Search */}
          <Card className="mb-6 shadow-sm border-gray-200">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm theo tiêu đề hoặc tác giả..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-200 focus:border-indigo-400 focus:ring-indigo-400"
                />
              </div>
            </CardContent>
          </Card>

          {/* Posts Table */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
              <CardTitle className="text-indigo-900">
                Danh sách bài viết ({filteredPosts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead className="font-semibold min-w-[300px]">Bài viết</TableHead>
                      <TableHead className="font-semibold min-w-[150px]">Tác giả</TableHead>
                      <TableHead className="font-semibold min-w-[150px]">Tags</TableHead>
                      <TableHead className="font-semibold min-w-[100px]">Bình luận</TableHead>
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
                    ) : filteredPosts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Không có dữ liệu
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPosts.map((post, index) => (
                        <TableRow
                          key={post.id}
                          className={index % 2 === 0 ? 'bg-white hover:bg-indigo-50/50' : 'bg-gray-50/50 hover:bg-indigo-50/50'}
                        >
                          <TableCell>
                            <div>
                              <div className="font-medium text-gray-900 line-clamp-1">{post.title}</div>
                              <div className="text-xs text-gray-500 line-clamp-1 mt-1">
                                {post.excerpt}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8 border-2 border-indigo-100">
                                <AvatarImage src={getUploadUrl(post.user.avatar)} />
                                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-semibold">
                                  {post.user.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-gray-700">{post.user.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {post.tags.slice(0, 2).map((tagRelation) => (
                                <Badge
                                  key={tagRelation.tag.id}
                                  className="bg-purple-100 text-purple-700 border-purple-200 text-xs"
                                >
                                  {tagRelation.tag.name}
                                </Badge>
                              ))}
                              {post.tags.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{post.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-gray-700">
                              {post._count.comments}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {post.published ? (
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                ✓ Đã xuất bản
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                                ● Nháp
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-gray-700">
                            {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                          </TableCell>
                          <TableCell className="text-right sticky right-0 bg-white border-l shadow-sm">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                className={post.published ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}
                                onClick={() => handleTogglePublished(post.id, post.published)}
                              >
                                {post.published ? (
                                  <>
                                    <EyeOff className="h-4 w-4" />
                                  </>
                                ) : (
                                  <>
                                    <Eye className="h-4 w-4" />
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={() => router.push(`/blog/${post.id}`)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                className="bg-red-600 hover:bg-red-700 text-white"
                                onClick={() => openDeleteDialog(post)}
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

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa bài viết &ldquo;{deletingPost?.title}&rdquo;?
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
