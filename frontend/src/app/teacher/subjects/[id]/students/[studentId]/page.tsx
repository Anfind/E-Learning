'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  ChevronLeft,
  FileText,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  Calendar,
  Eye,
  Shield,
  ShieldCheck,
  ShieldX
} from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/layout/Header';

interface LessonProgress {
  id: string;
  name: string;
  order: number;
  duration: number;
  progress: {
    completed: boolean;
    watchTime: number;
    faceVerifiedBefore: boolean;
    faceVerifiedAfter: boolean;
    startedAt: string;
    lastAccessedAt: string;
  } | null;
}

interface ExamAttempt {
  id: string;
  score: number;
  passed: boolean;
  startedAt: string;
  submittedAt: string;
  faceVerifiedStart: boolean;
}

interface ExamWithAttempts {
  id: string;
  name: string;
  order: number;
  passingScore: number;
  duration: number;
  attempts: ExamAttempt[];
  bestScore: number | null;
  passed: boolean;
  attemptCount: number;
}

interface StudentDetailData {
  student: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    createdAt: string;
  };
  enrolledAt: string;
  subject: {
    id: string;
    name: string;
  };
  lessons: LessonProgress[];
  exams: ExamWithAttempts[];
  summary: {
    completedLessons: number;
    totalLessons: number;
    passedExams: number;
    totalExams: number;
  };
}

export default function StudentDetailPage() {
  const { user, loading: authLoading, isTeacher, isAdmin } = useAuth();
  const router = useRouter();
  const params = useParams();
  const subjectId = params.id as string;
  const studentId = params.studentId as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StudentDetailData | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (!authLoading && user && !isTeacher && !isAdmin) {
      router.push('/dashboard');
    } else if (user && (isTeacher || isAdmin) && subjectId && studentId) {
      loadData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, isTeacher, isAdmin, router, subjectId, studentId]);

  const loadData = async () => {
    try {
      const response = await api.get<{ data: StudentDetailData }>(
        `/teacher/subjects/${subjectId}/students/${studentId}`
      );
      setData(response.data);
    } catch (error) {
      console.error('Failed to load data:', error);
      router.push(`/teacher/subjects/${subjectId}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins} phút`;
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

  const lessonProgress = data.summary.totalLessons > 0 
    ? Math.round((data.summary.completedLessons / data.summary.totalLessons) * 100)
    : 0;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-indigo-50 to-white">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <Link href={`/teacher/subjects/${subjectId}`}>
            <Button variant="ghost" size="sm" className="gap-2 mb-4">
              <ChevronLeft className="h-4 w-4" />
              Quay lại danh sách sinh viên
            </Button>
          </Link>

          {/* Student Info Card */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={data.student.avatar || undefined} />
                  <AvatarFallback className="text-2xl">
                    {data.student.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold mb-1">{data.student.name}</h1>
                  <p className="text-muted-foreground mb-3">{data.student.email}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Đăng ký: {formatDate(data.enrolledAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      Môn: {data.subject.name}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 md:gap-8">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">
                      {data.summary.completedLessons}/{data.summary.totalLessons}
                    </p>
                    <p className="text-sm text-muted-foreground">Bài học</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">
                      {data.summary.passedExams}/{data.summary.totalExams}
                    </p>
                    <p className="text-sm text-muted-foreground">Bài thi đậu</p>
                  </div>
                </div>
              </div>
              <Separator className="my-6" />
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Tiến độ tổng thể</span>
                  <span className="font-medium">{lessonProgress}%</span>
                </div>
                <Progress value={lessonProgress} className="h-3" />
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Lessons Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Tiến độ bài học ({data.summary.completedLessons}/{data.summary.totalLessons})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.lessons.map((lesson, index) => (
                  <div 
                    key={lesson.id}
                    className={`p-4 rounded-lg border ${
                      lesson.progress?.completed 
                        ? 'bg-green-50 border-green-200' 
                        : lesson.progress 
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm text-muted-foreground">#{index + 1}</span>
                          <h4 className="font-medium">{lesson.name}</h4>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(lesson.duration)}
                          </span>
                          {lesson.progress && (
                            <>
                              <span className="flex items-center gap-1">
                                <Play className="h-3 w-3" />
                                Đã xem: {formatDuration(lesson.progress.watchTime)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                Truy cập: {formatDate(lesson.progress.lastAccessedAt)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {lesson.progress?.completed ? (
                          <Badge className="bg-green-600 gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Hoàn thành
                          </Badge>
                        ) : lesson.progress ? (
                          <Badge variant="secondary" className="gap-1">
                            <Clock className="h-3 w-3" />
                            Đang học
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground gap-1">
                            <XCircle className="h-3 w-3" />
                            Chưa bắt đầu
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Face Verification Status */}
                    {lesson.progress && (
                      <div className="mt-3 pt-3 border-t flex gap-3 text-xs">
                        <span className={`flex items-center gap-1 ${lesson.progress.faceVerifiedBefore ? 'text-green-600' : 'text-gray-400'}`}>
                          {lesson.progress.faceVerifiedBefore ? (
                            <ShieldCheck className="h-3 w-3" />
                          ) : (
                            <ShieldX className="h-3 w-3" />
                          )}
                          Face trước: {lesson.progress.faceVerifiedBefore ? 'OK' : 'Chưa'}
                        </span>
                        <span className={`flex items-center gap-1 ${lesson.progress.faceVerifiedAfter ? 'text-green-600' : 'text-gray-400'}`}>
                          {lesson.progress.faceVerifiedAfter ? (
                            <ShieldCheck className="h-3 w-3" />
                          ) : (
                            <ShieldX className="h-3 w-3" />
                          )}
                          Face sau: {lesson.progress.faceVerifiedAfter ? 'OK' : 'Chưa'}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
                
                {data.lessons.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Chưa có bài học nào
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Exams Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Kết quả bài thi ({data.summary.passedExams}/{data.summary.totalExams})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.exams.map((exam, index) => (
                  <div 
                    key={exam.id}
                    className={`p-4 rounded-lg border ${
                      exam.passed 
                        ? 'bg-green-50 border-green-200' 
                        : exam.attemptCount > 0
                          ? 'bg-orange-50 border-orange-200'
                          : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm text-muted-foreground">#{index + 1}</span>
                          <h4 className="font-medium">{exam.name}</h4>
                        </div>
                        <div className="flex gap-3 text-xs text-muted-foreground">
                          <span>Điểm đạt: {exam.passingScore}</span>
                          <span>Thời gian: {exam.duration} phút</span>
                        </div>
                      </div>
                      <div className="text-right">
                        {exam.passed ? (
                          <Badge className="bg-green-600 gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Đậu
                          </Badge>
                        ) : exam.attemptCount > 0 ? (
                          <Badge variant="destructive" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Trượt
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Chưa thi
                          </Badge>
                        )}
                        {exam.bestScore !== null && (
                          <p className="text-lg font-bold mt-1">
                            {exam.bestScore}/100
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Attempts List */}
                    {exam.attempts.length > 0 && (
                      <div className="mt-3 pt-3 border-t space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          Lịch sử thi ({exam.attemptCount} lần)
                        </p>
                        {exam.attempts.slice(0, 3).map((attempt, attemptIndex) => (
                          <div 
                            key={attempt.id}
                            className="flex items-center justify-between text-sm bg-white/50 rounded p-2"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">
                                Lần {exam.attempts.length - attemptIndex}
                              </span>
                              <span className={`font-medium ${attempt.passed ? 'text-green-600' : 'text-red-600'}`}>
                                {attempt.score} điểm
                              </span>
                              {attempt.faceVerifiedStart && (
                                <Shield className="h-3 w-3 text-green-600" />
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(attempt.submittedAt)}
                            </span>
                          </div>
                        ))}
                        {exam.attempts.length > 3 && (
                          <p className="text-xs text-center text-muted-foreground">
                            + {exam.attempts.length - 3} lần thi khác
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                
                {data.exams.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Chưa có bài thi nào
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
