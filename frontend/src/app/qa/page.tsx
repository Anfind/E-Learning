'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageSquare,
  CheckCircle2,
  User,
  Calendar,
  Search,
  Plus,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface Question {
  id: string;
  title: string;
  content: string;
  userId: string;
  subjectId: string | null;
  lessonId: string | null;
  status: string;
  views: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  subject?: {
    id: string;
    name: string;
    major?: {
      id: string;
      name: string;
    };
  };
  lesson?: {
    id: string;
    name: string;
  };
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

export default function QAPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [majors, setMajors] = useState<Major[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedMajor, setSelectedMajor] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  useEffect(() => {
    if (user) {
      loadMajors();
      loadQuestions();
    }
  }, [user]);

  useEffect(() => {
    if (selectedMajor !== 'all') {
      loadSubjects(selectedMajor);
    } else {
      setSubjects([]);
      setSelectedSubject('all');
    }
  }, [selectedMajor]);

  useEffect(() => {
    if (user) {
      loadQuestions();
    }
  }, [selectedSubject]);

  const loadMajors = async () => {
    try {
      const response = await api.get<{ data: Major[] }>('/majors');
      setMajors(response.data || []);
    } catch (error) {
      console.error('Failed to load majors:', error);
    }
  };

  const loadSubjects = async (majorId: string) => {
    try {
      const response = await api.get<{ data: Subject[] }>(`/subjects?majorId=${majorId}`);
      setSubjects(response.data || []);
    } catch (error) {
      console.error('Failed to load subjects:', error);
      setSubjects([]);
    }
  };

  const loadQuestions = async () => {
    try {
      setLoading(true);
      let url = '/questions';
      if (selectedSubject !== 'all') {
        url += `?subjectId=${selectedSubject}`;
      }
      const response = await api.get<{ data: Question[] }>(url);
      // Ensure all questions have tags array
      const questionsData = (response.data || []).map(q => ({
        ...q,
        tags: q.tags || []
      }));
      setQuestions(questionsData);
    } catch (error) {
      console.error('Failed to load questions:', error);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         q.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || q.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-700 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'resolved': return 'Đã giải quyết';
      case 'pending': return 'Đang chờ';
      default: return status;
    }
  };

  if (!user) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8">
          <div className="max-w-7xl mx-auto px-4">
            <Skeleton className="h-12 w-64 mb-8" />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  ❓ Q&A - Hỏi đáp
                </h1>
                <p className="text-gray-600 text-lg">
                  Nơi cộng đồng giải đáp thắc mắc học tập
                </p>
              </div>
              <Link href="/qa/create">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg">
                  <Plus className="mr-2 h-5 w-5" />
                  Đặt câu hỏi
                </Button>
              </Link>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col gap-4">
              {/* Major and Subject filters */}
              <div className="flex flex-col md:flex-row gap-4">
                <Select value={selectedMajor} onValueChange={setSelectedMajor}>
                  <SelectTrigger className="w-full md:w-64 border-2 shadow-sm">
                    <SelectValue placeholder="Chọn ngành học" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả ngành</SelectItem>
                    {majors.map(major => (
                      <SelectItem key={major.id} value={major.id}>
                        {major.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedMajor !== 'all' && subjects.length > 0 && (
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger className="w-full md:w-64 border-2 shadow-sm">
                      <SelectValue placeholder="Chọn môn học" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả môn</SelectItem>
                      {subjects.map(subject => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Search and Status filter */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    placeholder="Tìm kiếm câu hỏi..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-2 focus:border-blue-500 shadow-sm"
                  />
                </div>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full md:w-48 border-2 shadow-sm">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="pending">Đang chờ</SelectItem>
                    <SelectItem value="resolved">Đã giải quyết</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Questions List */}
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          ) : filteredQuestions.length === 0 ? (
            <Card className="text-center py-12 border-2 border-dashed">
              <CardContent>
                <MessageSquare className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <p className="text-xl text-gray-600 mb-4">
                  {searchTerm || selectedStatus !== 'all' 
                    ? 'Không tìm thấy câu hỏi nào' 
                    : 'Chưa có câu hỏi nào'}
                </p>
                {!searchTerm && selectedStatus === 'all' && (
                  <Link href="/qa/create">
                    <Button className="bg-gradient-to-r from-blue-500 to-purple-600">
                      <Plus className="mr-2 h-4 w-4" />
                      Đặt câu hỏi đầu tiên
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredQuestions.map((question) => (
                <Card 
                  key={question.id} 
                  className="overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all group bg-white cursor-pointer"
                  onClick={() => router.push(`/qa/${question.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="h-4 w-4" />
                        <span className="font-medium">{question.user?.name || 'Unknown'}</span>
                      </div>
                      <Badge className={getStatusColor(question.status)}>
                        {question.status === 'resolved' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                        {getStatusText(question.status)}
                      </Badge>
                    </div>
                    <CardTitle className="group-hover:text-blue-600 transition-colors text-xl line-clamp-2">
                      {question.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-3 text-gray-600">
                      {question.content.substring(0, 150)}...
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    {/* Subject/Lesson */}
                    {(question.subject || question.lesson) && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {question.subject && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            <BookOpen className="h-3 w-3 mr-1" />
                            {question.subject.name}
                          </Badge>
                        )}
                        {question.lesson && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            {question.lesson.name}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Tags */}
                    {question.tags && question.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {question.tags.slice(0, 3).map(tagObj => (
                          tagObj?.tag ? (
                            <Badge 
                              key={tagObj.tag.id} 
                              className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-0"
                            >
                              {tagObj.tag.name}
                            </Badge>
                          ) : null
                        ))}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center">
                          <MessageSquare className="mr-1 h-4 w-4" />
                          {question._count.answers}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="mr-1 h-4 w-4" />
                          {new Date(question.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
