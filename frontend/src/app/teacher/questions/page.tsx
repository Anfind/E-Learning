'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  MessageSquare,
  Clock,
  Eye,
  CheckCircle2,
  Send,
  User,
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

interface Tag {
  id: string;
  name: string;
}

interface Answer {
  id: string;
  content: string;
  isAccepted: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

interface Question {
  id: string;
  title: string;
  content: string;
  views: number;
  status: 'OPEN' | 'ANSWERED' | 'CLOSED';
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  subject: {
    id: string;
    name: string;
    major: {
      id: string;
      name: string;
    };
  } | null;
  lesson: {
    id: string;
    name: string;
  } | null;
  tags: Tag[];
  _count: {
    answers: number;
  };
  answers?: Answer[];
}

// Helper function to format time ago
const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays === 1) return 'hôm qua';
  if (diffDays < 30) return `${diffDays} ngày trước`;
  
  return date.toLocaleDateString('vi-VN');
};

export default function TeacherQuestionsPage() {
  const { user, loading: authLoading, isTeacher, isAdmin } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });

  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [answerContent, setAnswerContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (!authLoading && user && !isTeacher && !isAdmin) {
      router.push('/dashboard');
    }
  }, [user, authLoading, isTeacher, isAdmin, router]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load teacher's subjects
      const subjectsRes = await api.get<{ data: Subject[] }>('/teacher/subjects');
      setSubjects(subjectsRes.data);
      
      // Get all subject IDs that teacher manages
      const subjectIds = subjectsRes.data.map(s => s.id);
      
      // Build query params
      const params = new URLSearchParams();
      params.append('page', String(pagination.page));
      params.append('limit', '20');
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      if (filterSubject !== 'all') {
        params.append('subjectId', filterSubject);
      }
      
      // Load questions - for now load all and filter by subject
      const questionsRes = await api.get<{ 
        data: Question[], 
        pagination: { total: number; page: number; totalPages: number } 
      }>(`/questions?${params.toString()}`);
      
      // Filter questions to only show those related to teacher's subjects
      let filteredQuestions = questionsRes.data;
      if (filterSubject === 'all') {
        // Filter by all subjects teacher manages
        filteredQuestions = questionsRes.data.filter(q => 
          q.subject && subjectIds.includes(q.subject.id)
        );
      }
      
      // Filter by status
      if (filterStatus !== 'all') {
        filteredQuestions = filteredQuestions.filter(q => q.status === filterStatus);
      }
      
      setQuestions(filteredQuestions);
      setPagination(prev => ({ 
        ...prev, 
        total: filteredQuestions.length,
        totalPages: Math.ceil(filteredQuestions.length / 20) 
      }));
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterSubject, filterStatus, pagination.page]);

  useEffect(() => {
    if (user && (isTeacher || isAdmin)) {
      loadData();
    }
  }, [user, isTeacher, isAdmin, loadData]);

  const loadQuestionDetail = async (questionId: string) => {
    try {
      setLoadingDetail(true);
      const response = await api.get<{ data: Question }>(`/questions/${questionId}`);
      setSelectedQuestion(response.data);
    } catch (error) {
      console.error('Failed to load question detail:', error);
      toast.error('Không thể tải chi tiết câu hỏi');
    } finally {
      setLoadingDetail(false);
    }
  };

  const openViewDialog = async (question: Question) => {
    setViewDialogOpen(true);
    setAnswerContent('');
    await loadQuestionDetail(question.id);
  };

  const handleSubmitAnswer = async () => {
    if (!selectedQuestion || !answerContent.trim()) {
      toast.error('Vui lòng nhập nội dung trả lời');
      return;
    }

    try {
      setSubmitting(true);
      await api.post(`/questions/${selectedQuestion.id}/answers`, {
        content: answerContent,
      });
      toast.success('Gửi câu trả lời thành công');
      setAnswerContent('');
      await loadQuestionDetail(selectedQuestion.id);
      loadData();
    } catch (error) {
      console.error('Failed to submit answer:', error);
      toast.error('Không thể gửi câu trả lời');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptAnswer = async (answerId: string) => {
    try {
      await api.post(`/questions/answers/${answerId}/accept`);
      toast.success('Đã chấp nhận câu trả lời');
      if (selectedQuestion) {
        await loadQuestionDetail(selectedQuestion.id);
      }
      loadData();
    } catch (error) {
      console.error('Failed to accept answer:', error);
      toast.error('Không thể chấp nhận câu trả lời');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Chờ trả lời</Badge>;
      case 'ANSWERED':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Đã trả lời</Badge>;
      case 'CLOSED':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">Đã đóng</Badge>;
      default:
        return null;
    }
  };

  if (authLoading || !user) {
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
        <div className="container mx-auto py-8 px-4 max-w-6xl">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Câu hỏi từ sinh viên</h1>
            <p className="text-gray-600 mt-1">
              Quản lý và trả lời các câu hỏi liên quan đến môn học bạn phụ trách
            </p>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Tìm kiếm câu hỏi..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <Select value={filterSubject} onValueChange={setFilterSubject}>
                  <SelectTrigger className="w-full md:w-[200px]">
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
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    <SelectItem value="OPEN">Chờ trả lời</SelectItem>
                    <SelectItem value="ANSWERED">Đã trả lời</SelectItem>
                    <SelectItem value="CLOSED">Đã đóng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Questions List */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : questions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <MessageSquare className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Chưa có câu hỏi nào</h3>
                <p className="text-gray-600">
                  Các câu hỏi từ sinh viên về môn học bạn phụ trách sẽ xuất hiện ở đây
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {questions.map((question) => (
                <Card 
                  key={question.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => openViewDialog(question)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={question.user.avatar || undefined} />
                        <AvatarFallback>
                          {question.user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">
                              {question.title}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                              {question.content}
                            </p>
                          </div>
                          {getStatusBadge(question.status)}
                        </div>
                        
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {question.user.name}
                          </span>
                          {question.subject && (
                            <Badge variant="secondary" className="font-normal">
                              {question.subject.name}
                            </Badge>
                          )}
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3.5 w-3.5" />
                            {question._count.answers} trả lời
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" />
                            {question.views} lượt xem
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {formatTimeAgo(question.createdAt)}
                          </span>
                        </div>

                        {question.tags.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {question.tags.map((tag) => (
                              <Badge key={tag.id} variant="outline" className="text-xs">
                                {tag.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* View Question Dialog */}
          <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Chi tiết câu hỏi</DialogTitle>
              </DialogHeader>

              {loadingDetail ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : selectedQuestion && (
                <div className="space-y-6">
                  {/* Question */}
                  <div className="border-b pb-6">
                    <div className="flex items-start gap-3 mb-4">
                      <Avatar>
                        <AvatarImage src={selectedQuestion.user.avatar || undefined} />
                        <AvatarFallback>
                          {selectedQuestion.user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{selectedQuestion.user.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatTimeAgo(selectedQuestion.createdAt)}
                        </p>
                      </div>
                      <div className="ml-auto">
                        {getStatusBadge(selectedQuestion.status)}
                      </div>
                    </div>
                    
                    <h2 className="text-xl font-semibold mb-3">{selectedQuestion.title}</h2>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedQuestion.content}</p>
                    
                    {selectedQuestion.subject && (
                      <div className="mt-4">
                        <Badge variant="secondary">
                          {selectedQuestion.subject.name}
                        </Badge>
                        {selectedQuestion.lesson && (
                          <Badge variant="outline" className="ml-2">
                            Bài: {selectedQuestion.lesson.name}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Answers */}
                  <div>
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Câu trả lời ({selectedQuestion.answers?.length || 0})
                    </h3>

                    {selectedQuestion.answers && selectedQuestion.answers.length > 0 ? (
                      <div className="space-y-4">
                        {selectedQuestion.answers.map((answer) => (
                          <div 
                            key={answer.id} 
                            className={`p-4 rounded-lg border ${
                              answer.isAccepted 
                                ? 'bg-green-50 border-green-300' 
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={answer.user.avatar || undefined} />
                                <AvatarFallback>
                                  {answer.user.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="font-medium">{answer.user.name}</span>
                                    <span className="text-sm text-gray-500 ml-2">
                                      {formatTimeAgo(answer.createdAt)}
                                    </span>
                                  </div>
                                  {answer.isAccepted ? (
                                    <Badge className="bg-green-600">
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      Đã chấp nhận
                                    </Badge>
                                  ) : (
                                    selectedQuestion.user.id !== user?.id && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleAcceptAnswer(answer.id);
                                        }}
                                      >
                                        Chấp nhận
                                      </Button>
                                    )
                                  )}
                                </div>
                                <p className="mt-2 text-gray-700 whitespace-pre-wrap">
                                  {answer.content}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">
                        Chưa có câu trả lời nào
                      </p>
                    )}
                  </div>

                  {/* Answer Form */}
                  <div className="border-t pt-6">
                    <h3 className="font-semibold mb-3">Trả lời câu hỏi</h3>
                    <Textarea
                      value={answerContent}
                      onChange={(e) => setAnswerContent(e.target.value)}
                      placeholder="Nhập câu trả lời của bạn..."
                      rows={4}
                      className="mb-3"
                    />
                    <Button 
                      onClick={handleSubmitAnswer}
                      disabled={submitting || !answerContent.trim()}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      {submitting ? (
                        'Đang gửi...'
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Gửi trả lời
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}
