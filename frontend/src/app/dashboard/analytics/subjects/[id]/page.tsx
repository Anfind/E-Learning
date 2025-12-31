'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ChevronLeft,
  CheckCircle,
  BookOpen,
  Award,
  Brain,
  RefreshCw,
  Sparkles,
  FileText,
  Calendar,
  TrendingUp,
  Clock,
  Target,
  Flame,
  Play,
  GraduationCap,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/layout/Header';

interface SubjectProgress {
  subject: {
    id: string;
    name: string;
    description: string;
    majorName: string;
  };
  progress: {
    completedLessons: number;
    totalLessons: number;
    lessonProgress: number;
    totalHours: number;
    totalMinutes: number;
  };
  exams: {
    taken: number;
    total: number;
    avgScore: number;
    history: Array<{
      id: string;
      examId: string;
      score: number;
      passed: boolean;
      submittedAt: string;
    }>;
  };
  timeline: {
    startDate: string | null;
    lessonsPerWeek: number;
    estimatedCompletion: string | null;
  };
  lessons: Array<{
    id: string;
    name: string;
    duration: number;
    order: number;
    completed: boolean;
    watchTime: number;
    completedAt: string | null;
  }>;
}

// Enhanced Stat Card with gradient and animation
function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  gradient = 'from-blue-500 to-blue-600'
}: { 
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  gradient?: string;
}) {
  return (
    <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10`} />
      <CardContent className="p-6 relative">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Progress Ring Component
function ProgressRing({ progress, size = 120 }: { progress: number; size?: number }) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-white/20"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="text-white transition-all duration-1000 ease-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-white">{progress}%</span>
      </div>
    </div>
  );
}

export default function SubjectProgressPage() {
  const params = useParams();
  const subjectId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<SubjectProgress | null>(null);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    if (subjectId) {
      fetchProgress();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId]);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const response = await api.get<SubjectProgress>(`/analytics/subject/${subjectId}`);
      setProgress(response);
    } catch (error) {
      console.error('Error fetching subject progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAIInsight = async () => {
    if (!progress) return;

    setLoadingAI(true);
    try {
      const response = await api.post<{ insights: string }>('/analytics/ai-insights', {
        reportType: 'subject',
        reportData: {
          subjectName: progress.subject.name,
          lessonsCompleted: progress.progress.completedLessons,
          totalLessons: progress.progress.totalLessons,
          lessonPercent: progress.progress.lessonProgress,
          examsTaken: progress.exams.taken,
          totalExams: progress.exams.total,
          avgScore: progress.exams.avgScore,
          estimatedCompletion: progress.timeline.estimatedCompletion
        }
      });
      setAiInsight(response.insights);
    } catch (error) {
      console.error('Error fetching AI insight:', error);
    } finally {
      setLoadingAI(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
            </div>
            <p className="text-muted-foreground animate-pulse">Đang tải dữ liệu...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <Header />
        <div className="container max-w-5xl py-12">
          <Card className="border-0 shadow-xl">
            <CardContent className="py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-6">
                <BookOpen className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Không tìm thấy môn học</h3>
              <p className="text-muted-foreground mb-6">Môn học này không tồn tại hoặc bạn chưa đăng ký</p>
              <Link href="/dashboard/analytics">
                <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Quay lại Analytics
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const passedExams = progress.exams.history.filter(e => e.passed).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <Header />
      
      <main className="container mx-auto max-w-6xl py-8 px-4 md:px-8 space-y-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.5))]" />
          <div className="relative">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Link href="/dashboard/analytics">
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                </Link>
                <div>
                  <Badge className="bg-white/20 text-white border-0 mb-2">
                    {progress.subject.majorName}
                  </Badge>
                  <h1 className="text-3xl font-bold mb-2">📚 {progress.subject.name}</h1>
                  <p className="text-white/80 max-w-2xl">
                    {progress.subject.description || 'Theo dõi tiến trình học tập của bạn'}
                  </p>
                </div>
              </div>
              <div className="hidden md:block">
                <ProgressRing progress={progress.progress.lessonProgress} />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Bài học hoàn thành"
            value={`${progress.progress.completedLessons}/${progress.progress.totalLessons}`}
            subtitle={`${progress.progress.lessonProgress}% hoàn thành`}
            icon={BookOpen}
            gradient="from-blue-500 to-cyan-500"
          />
          <StatCard
            title="Thời gian học"
            value={`${progress.progress.totalHours}h ${progress.progress.totalMinutes}m`}
            subtitle="Tổng thời gian"
            icon={Clock}
            gradient="from-green-500 to-emerald-500"
          />
          <StatCard
            title="Điểm trung bình"
            value={`${progress.exams.avgScore}%`}
            subtitle={`${progress.exams.taken}/${progress.exams.total} bài thi`}
            icon={Award}
            gradient={progress.exams.avgScore >= 70 ? "from-green-500 to-emerald-500" : progress.exams.avgScore >= 50 ? "from-yellow-500 to-orange-500" : "from-red-500 to-pink-500"}
          />
          <StatCard
            title="Tốc độ học"
            value={progress.timeline.lessonsPerWeek}
            subtitle="bài/tuần"
            icon={Flame}
            gradient="from-orange-500 to-red-500"
          />
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Lessons List - Takes 2 columns */}
          <Card className="lg:col-span-2 border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    Danh sách bài học
                  </CardTitle>
                  <CardDescription>
                    {progress.progress.completedLessons} / {progress.progress.totalLessons} bài học đã hoàn thành
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-white dark:bg-gray-900">
                  {progress.progress.lessonProgress}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {(progress.lessons || [])
                  .sort((a, b) => a.order - b.order)
                  .map((lesson, index) => (
                    <div
                      key={lesson.id}
                      className={`group flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-md ${
                        lesson.completed
                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 dark:from-green-950/30 dark:to-emerald-950/30 dark:border-green-800'
                          : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-800'
                      }`}
                    >
                      <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                        lesson.completed
                          ? 'bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg shadow-green-200 dark:shadow-green-900'
                          : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 text-gray-500'
                      }`}>
                        {lesson.completed ? (
                          <CheckCircle className="h-6 w-6" />
                        ) : (
                          <span>{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold truncate ${lesson.completed ? 'text-green-700 dark:text-green-400' : ''}`}>
                          {lesson.name}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {lesson.duration} phút
                          </span>
                          {lesson.completedAt && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(lesson.completedAt).toLocaleDateString('vi-VN')}
                            </span>
                          )}
                        </div>
                      </div>
                      {lesson.completed ? (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 border-0">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Hoàn thành
                        </Badge>
                      ) : (
                        <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="h-4 w-4 mr-1" />
                          Học ngay
                        </Button>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Estimated Completion */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-4">
                <div className="flex items-center gap-3 text-white">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Target className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-white/80">Dự kiến hoàn thành</p>
                    <p className="text-xl font-bold">
                      {progress.timeline.estimatedCompletion 
                        ? new Date(progress.timeline.estimatedCompletion).toLocaleDateString('vi-VN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })
                        : 'Chưa xác định'}
                    </p>
                  </div>
                </div>
              </div>
              <CardContent className="p-4">
                {progress.timeline.startDate && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Ngày bắt đầu</span>
                    <span className="font-medium">
                      {new Date(progress.timeline.startDate).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Exams History */}
            {(progress.exams.history || []).length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <GraduationCap className="h-5 w-5 text-purple-600" />
                    Lịch sử thi
                  </CardTitle>
                  <CardDescription>
                    {passedExams}/{progress.exams.history.length} bài đậu
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {progress.exams.history.slice(0, 5).map((exam) => (
                    <Link
                      key={exam.id}
                      href={`/dashboard/analytics/exams/${exam.id}`}
                      className="block"
                    >
                      <div className={`p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${
                        exam.passed
                          ? 'border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 dark:border-green-800'
                          : 'border-red-200 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/30 dark:border-red-800'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">Bài thi #{exam.examId.slice(0, 8)}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(exam.submittedAt).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-xl font-bold ${
                              exam.passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            }`}>
                              {exam.score}%
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                  {progress.exams.history.length > 5 && (
                    <Button variant="ghost" className="w-full text-muted-foreground">
                      Xem thêm {progress.exams.history.length - 5} bài thi
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Thống kê nhanh
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tổng thời gian</span>
                  <span className="font-bold">{progress.progress.totalHours}h {progress.progress.totalMinutes}m</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tốc độ học</span>
                  <span className="font-bold">{progress.timeline.lessonsPerWeek} bài/tuần</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tiến độ</span>
                  <span className="font-bold">{progress.progress.lessonProgress}%</span>
                </div>
                <Progress value={progress.progress.lessonProgress} className="h-2" />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* AI Insights */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-violet-950/30 dark:via-purple-950/30 dark:to-fuchsia-950/30 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl" />
          <CardHeader className="relative">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-200 dark:shadow-purple-900">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">AI Đánh giá môn học</CardTitle>
                <CardDescription>
                  Phân tích và gợi ý học tập từ LearnHub AI
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative">
            {aiInsight ? (
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl p-6 shadow-inner">
                <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">{aiInsight}</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Nhận đánh giá và gợi ý cải thiện từ AI
                </p>
                <Button 
                  onClick={fetchAIInsight} 
                  disabled={loadingAI}
                  size="lg"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-200 dark:shadow-purple-900"
                >
                  {loadingAI ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                      Đang phân tích...
                    </>
                  ) : (
                    <>
                      <Brain className="h-5 w-5 mr-2" />
                      Lấy đánh giá AI
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
