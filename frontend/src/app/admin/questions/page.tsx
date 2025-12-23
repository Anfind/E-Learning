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
  MessageCircle,
  Trash2,
  CheckCircle,
  Clock,
  Eye,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import { toast } from 'sonner';

interface Question {
  id: string;
  title: string;
  content: string;
  status: 'OPEN' | 'ANSWERED' | 'CLOSED';
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
  };
  subject: {
    id: string;
    name: string;
    major: {
      id: string;
      name: string;
    };
  };
  lesson?: {
    id: string;
    name: string;
  } | null;
  tags: Array<{
    tag: {
      id: string;
      name: string;
    };
  }>;
  _count: {
    answers: number;
  };
}

interface Major {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
  majorId: string;
}

export default function AdminQuestionsPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMajor, setFilterMajor] = useState<string>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingQuestion, setDeletingQuestion] = useState<Question | null>(null);

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
      const [questionsRes, majorsRes, subjectsRes] = await Promise.all([
        api.get<{ success: boolean; data: Question[] }>('/questions'),
        api.get<{ success: boolean; data: Major[] }>('/majors'),
        api.get<{ success: boolean; data: Subject[] }>('/subjects'),
      ]);
      setQuestions(questionsRes.data || []);
      setMajors(majorsRes.data || []);
      setSubjects(subjectsRes.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const openDeleteDialog = (question: Question) => {
    setDeletingQuestion(question);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!deletingQuestion) return;

    try {
      await api.delete(`/questions/${deletingQuestion.id}`);
      toast.success('Đã xóa câu hỏi');
      setShowDeleteDialog(false);
      setDeletingQuestion(null);
      loadData();
    } catch {
      toast.error('Xóa câu hỏi thất bại');
    }
  };

  // Filter subjects by selected major
  const filteredSubjects = filterMajor === 'all'
    ? subjects
    : subjects.filter((s) => s.majorId === filterMajor);

  // Filter questions
  const filteredQuestions = questions.filter((question) => {
    const matchesSearch =
      question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.user.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || question.status === filterStatus;
    const matchesMajor = filterMajor === 'all' || question.subject.major.id === filterMajor;
    const matchesSubject = filterSubject === 'all' || question.subject.id === filterSubject;

    return matchesSearch && matchesStatus && matchesMajor && matchesSubject;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { className: string; icon: React.ReactElement; label: string }> = {
      OPEN: {
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: <Clock className="mr-1 h-3 w-3" />,
        label: 'Chưa trả lời',
      },
      ANSWERED: {
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: <CheckCircle className="mr-1 h-3 w-3" />,
        label: 'Đã trả lời',
      },
      CLOSED: {
        className: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: <CheckCircle className="mr-1 h-3 w-3" />,
        label: 'Đã đóng',
      },
    };
    const config = statusConfig[status] || statusConfig.OPEN;
    return (
      <Badge className={config.className}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 text-gray-900">Quản lý Hỏi đáp</h1>
            <p className="text-gray-600">Quản lý câu hỏi và câu trả lời của học viên</p>
          </div>

          {/* Filters */}
          <Card className="mb-6 border-orange-100 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
              <CardTitle className="text-orange-900">Bộ lọc</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-5 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Tìm kiếm theo tiêu đề hoặc tác giả..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-gray-200 focus:border-orange-400 focus:ring-orange-400"
                    />
                  </div>
                </div>
                <Select
                  value={filterStatus}
                  onValueChange={(value) => setFilterStatus(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="OPEN">Chưa trả lời</SelectItem>
                    <SelectItem value="ANSWERED">Đã trả lời</SelectItem>
                    <SelectItem value="CLOSED">Đã đóng</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filterMajor}
                  onValueChange={(value) => {
                    setFilterMajor(value);
                    setFilterSubject('all');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ngành học" />
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
                <Select
                  value={filterSubject}
                  onValueChange={(value) => setFilterSubject(value)}
                  disabled={filterMajor === 'all'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Môn học" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả môn</SelectItem>
                    {filteredSubjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Questions Table */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
              <CardTitle className="text-orange-900">
                Danh sách câu hỏi ({filteredQuestions.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead className="font-semibold min-w-[300px]">Câu hỏi</TableHead>
                      <TableHead className="font-semibold min-w-[150px]">Tác giả</TableHead>
                      <TableHead className="font-semibold min-w-[150px]">Ngành - Môn học</TableHead>
                      <TableHead className="font-semibold min-w-[120px]">Bài học</TableHead>
                      <TableHead className="font-semibold min-w-[150px]">Tags</TableHead>
                      <TableHead className="font-semibold min-w-[100px]">Câu trả lời</TableHead>
                      <TableHead className="font-semibold min-w-[120px]">Trạng thái</TableHead>
                      <TableHead className="font-semibold min-w-[120px]">Ngày tạo</TableHead>
                      <TableHead className="text-right font-semibold w-[150px] sticky right-0 bg-white">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          Đang tải...
                        </TableCell>
                      </TableRow>
                    ) : filteredQuestions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          Không có dữ liệu
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredQuestions.map((question, index) => (
                        <TableRow
                          key={question.id}
                          className={index % 2 === 0 ? 'bg-white hover:bg-orange-50/50' : 'bg-gray-50/50 hover:bg-orange-50/50'}
                        >
                          <TableCell>
                            <div>
                              <div className="font-medium text-gray-900 line-clamp-2">{question.title}</div>
                              <div className="text-xs text-gray-500 line-clamp-1 mt-1">
                                {question.content.substring(0, 80)}...
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8 border-2 border-orange-100">
                                <AvatarImage src={getUploadUrl(question.user.avatar)} />
                                <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-600 text-white text-xs font-semibold">
                                  {question.user.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-gray-700">{question.user.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                                {question.subject.major.name}
                              </Badge>
                              <div className="text-xs text-gray-600">{question.subject.name}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {question.lesson ? (
                              <Badge variant="outline" className="text-xs">
                                {question.lesson.name}
                              </Badge>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {question.tags.slice(0, 2).map((tagRelation) => (
                                <Badge
                                  key={tagRelation.tag.id}
                                  className="bg-purple-100 text-purple-700 border-purple-200 text-xs"
                                >
                                  {tagRelation.tag.name}
                                </Badge>
                              ))}
                              {question.tags.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{question.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-gray-700">
                              <MessageCircle className="mr-1 h-3 w-3" />
                              {question._count.answers}
                            </Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(question.status)}</TableCell>
                          <TableCell className="text-sm text-gray-700">
                            {new Date(question.createdAt).toLocaleDateString('vi-VN')}
                          </TableCell>
                          <TableCell className="text-right sticky right-0 bg-white border-l shadow-sm">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={() => router.push(`/qa/${question.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                className="bg-red-600 hover:bg-red-700 text-white"
                                onClick={() => openDeleteDialog(question)}
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
              Bạn có chắc chắn muốn xóa câu hỏi &ldquo;{deletingQuestion?.title}&rdquo;?
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
