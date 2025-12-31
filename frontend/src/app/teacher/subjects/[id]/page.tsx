'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  FileText,
  Award,
  Users,
  Search,
  ChevronLeft,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  GraduationCap
} from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/layout/Header';

interface StudentProgress {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  enrolledAt: string;
  progress: {
    completedLessons: number;
    totalLessons: number;
    lessonProgressPercent: number;
    passedExams: number;
    totalExams: number;
    examResults: Array<{
      examId: string;
      bestScore: number;
      passed: boolean;
      attemptCount: number;
    }>;
  };
}

interface SubjectData {
  subject: {
    id: string;
    name: string;
    totalLessons: number;
    totalExams: number;
  };
  students: StudentProgress[];
  totalStudents: number;
}

interface ExamStats {
  examId: string;
  examName: string;
  passingScore: number;
  totalAttempts: number;
  passedCount: number;
  failedCount: number;
  passRate: number;
  averageScore: number;
}

interface ExamAttempt {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  exam: {
    id: string;
    name: string;
    passingScore: number;
  };
  score: number;
  passed: boolean;
  startedAt: string;
  submittedAt: string;
  faceVerifiedStart: boolean;
}

interface ExamResultsData {
  subject: {
    id: string;
    name: string;
  };
  examStats: ExamStats[];
  attempts: ExamAttempt[];
}

export default function TeacherSubjectDetailPage() {
  const { user, loading: authLoading, isTeacher, isAdmin } = useAuth();
  const router = useRouter();
  const params = useParams();
  const subjectId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SubjectData | null>(null);
  const [examData, setExamData] = useState<ExamResultsData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('students');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (!authLoading && user && !isTeacher && !isAdmin) {
      router.push('/dashboard');
    } else if (user && (isTeacher || isAdmin) && subjectId) {
      loadData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, isTeacher, isAdmin, router, subjectId]);

  const loadData = async () => {
    try {
      const [studentsRes, examsRes] = await Promise.all([
        api.get<{ data: SubjectData }>(`/teacher/subjects/${subjectId}/students`),
        api.get<{ data: ExamResultsData }>(`/teacher/subjects/${subjectId}/exam-results`)
      ]);
      setData(studentsRes.data);
      setExamData(examsRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
      router.push('/teacher/subjects');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = data?.students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

  if (!data) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-indigo-50 to-white">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Back Button & Header */}
          <div className="mb-6">
            <Link href="/teacher/subjects">
              <Button variant="ghost" size="sm" className="gap-2 mb-4">
                <ChevronLeft className="h-4 w-4" />
                Quay lại
              </Button>
            </Link>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2 text-gray-900">
                  {data.subject.name}
                </h1>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    {data.subject.totalLessons} bài học
                  </span>
                  <span className="flex items-center gap-1">
                    <Award className="h-4 w-4" />
                    {data.subject.totalExams} bài thi
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {data.totalStudents} sinh viên
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="students" className="gap-2">
                <Users className="h-4 w-4" />
                Sinh viên ({data.totalStudents})
              </TabsTrigger>
              <TabsTrigger value="exams" className="gap-2">
                <Award className="h-4 w-4" />
                Kết quả thi
              </TabsTrigger>
            </TabsList>

            {/* Students Tab */}
            <TabsContent value="students" className="space-y-6">
              {/* Search */}
              <Card>
                <CardContent className="pt-6">
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Tìm sinh viên..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Students Table */}
              <Card>
                <CardContent className="p-0">
                  {filteredStudents.length === 0 ? (
                    <div className="p-12 text-center">
                      <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <h2 className="text-xl font-semibold mb-2">
                        {searchTerm ? 'Không tìm thấy sinh viên' : 'Chưa có sinh viên nào'}
                      </h2>
                      <p className="text-muted-foreground">
                        {searchTerm 
                          ? 'Thử tìm kiếm với từ khóa khác'
                          : 'Chưa có sinh viên nào đăng ký môn học này'}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="min-w-[200px]">Sinh viên</TableHead>
                            <TableHead className="min-w-[150px]">Tiến độ bài học</TableHead>
                            <TableHead className="min-w-[120px]">Bài thi</TableHead>
                            <TableHead className="min-w-[120px]">Ngày đăng ký</TableHead>
                            <TableHead className="text-right">Thao tác</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredStudents.map((student) => (
                            <TableRow key={student.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar>
                                    <AvatarImage src={student.avatar || undefined} />
                                    <AvatarFallback>
                                      {student.name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{student.name}</p>
                                    <p className="text-sm text-muted-foreground">{student.email}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-sm">
                                    <span>{student.progress.completedLessons}/{student.progress.totalLessons}</span>
                                    <span className="text-muted-foreground">
                                      {student.progress.lessonProgressPercent}%
                                    </span>
                                  </div>
                                  <Progress value={student.progress.lessonProgressPercent} className="h-2" />
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {student.progress.passedExams > 0 && (
                                    <Badge variant="default" className="gap-1 bg-green-600">
                                      <CheckCircle2 className="h-3 w-3" />
                                      {student.progress.passedExams} đậu
                                    </Badge>
                                  )}
                                  {student.progress.totalExams - student.progress.passedExams > 0 && (
                                    <Badge variant="secondary" className="gap-1">
                                      <Clock className="h-3 w-3" />
                                      {student.progress.totalExams - student.progress.passedExams} còn lại
                                    </Badge>
                                  )}
                                  {student.progress.passedExams === 0 && student.progress.totalExams === 0 && (
                                    <span className="text-sm text-muted-foreground">Chưa thi</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-muted-foreground">
                                  {formatDate(student.enrolledAt)}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <Link href={`/teacher/subjects/${subjectId}/students/${student.id}`}>
                                  <Button variant="outline" size="sm" className="gap-1">
                                    <Eye className="h-4 w-4" />
                                    Chi tiết
                                  </Button>
                                </Link>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Exams Tab */}
            <TabsContent value="exams" className="space-y-6">
              {/* Exam Stats Cards */}
              {examData && examData.examStats.length > 0 && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {examData.examStats.map((exam) => (
                    <Card key={exam.examId}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center justify-between">
                          <span className="truncate">{exam.examName}</span>
                          <Badge variant={exam.passRate >= 70 ? 'default' : exam.passRate >= 50 ? 'secondary' : 'destructive'}>
                            {exam.passRate}% đậu
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-2 text-center text-sm">
                          <div>
                            <p className="text-2xl font-bold text-blue-600">{exam.totalAttempts}</p>
                            <p className="text-muted-foreground">Lượt thi</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-green-600">{exam.passedCount}</p>
                            <p className="text-muted-foreground">Đậu</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-orange-600">{exam.averageScore}</p>
                            <p className="text-muted-foreground">TB điểm</p>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                          Điểm đạt: {exam.passingScore}/100
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Recent Attempts Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Lịch sử thi gần đây
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {examData && examData.attempts.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="min-w-[200px]">Sinh viên</TableHead>
                            <TableHead className="min-w-[150px]">Bài thi</TableHead>
                            <TableHead className="min-w-[100px]">Điểm</TableHead>
                            <TableHead className="min-w-[100px]">Kết quả</TableHead>
                            <TableHead className="min-w-[100px]">Face</TableHead>
                            <TableHead className="min-w-[150px]">Thời gian</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {examData.attempts.slice(0, 20).map((attempt) => (
                            <TableRow key={attempt.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={attempt.user.avatar || undefined} />
                                    <AvatarFallback>
                                      {attempt.user.name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-sm">{attempt.user.name}</p>
                                    <p className="text-xs text-muted-foreground">{attempt.user.email}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm">{attempt.exam.name}</span>
                              </TableCell>
                              <TableCell>
                                <span className={`font-bold ${attempt.passed ? 'text-green-600' : 'text-red-600'}`}>
                                  {attempt.score}/100
                                </span>
                              </TableCell>
                              <TableCell>
                                {attempt.passed ? (
                                  <Badge className="bg-green-600 gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Đậu
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive" className="gap-1">
                                    <XCircle className="h-3 w-3" />
                                    Trượt
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {attempt.faceVerifiedStart ? (
                                  <Badge variant="outline" className="text-green-600 border-green-600 gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    OK
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-orange-600 border-orange-600 gap-1">
                                    <XCircle className="h-3 w-3" />
                                    Không
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-muted-foreground">
                                  {formatDate(attempt.submittedAt)}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="p-12 text-center">
                      <Award className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <h2 className="text-xl font-semibold mb-2">Chưa có lịch sử thi</h2>
                      <p className="text-muted-foreground">
                        Chưa có sinh viên nào tham gia thi
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
