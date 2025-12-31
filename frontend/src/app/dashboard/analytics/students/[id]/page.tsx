'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Award,
  GraduationCap,
  Mail,
  Calendar,
  CheckCircle2,
  XCircle,
  Target,
  Brain,
  Sparkles,
  RefreshCw,
  BarChart3,
  FileText,
  Activity,
  CalendarDays
} from 'lucide-react';
import Header from '@/components/layout/Header';

interface StudentDetail {
  student: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    createdAt: string;
  };
  enrollments: Array<{
    majorId: string;
    majorName: string;
    enrolledAt: string;
  }>;
  summary: {
    totalLessons: number;
    completedLessons: number;
    progress: number;
    totalStudyMinutes: number;
    examsTaken: number;
    avgScore: number;
    passRate: number;
    streak: number;
  };
  subjectProgress: Array<{
    id: string;
    name: string;
    majorName: string;
    completedLessons: number;
    totalLessons: number;
    progress: number;
    lastActivity: string | null;
  }>;
  examHistory: Array<{
    id: string;
    examName: string;
    subjectName: string;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    passed: boolean;
    submittedAt: string;
    timeSpent: number;
  }>;
  monthlyProgress: Array<{
    month: number;
    year: number;
    label: string;
    lessonsCompleted: number;
    examsTaken: number;
    avgScore: number;
    studyMinutes: number;
  }>;
  recentActivity: Array<{
    type: 'lesson' | 'exam';
    title: string;
    subjectName: string;
    date: string;
    score?: number;
    passed?: boolean;
  }>;
  aiConfigured: boolean;
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// Stat Card Component
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
      <CardContent className="p-5 relative">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Bar Chart Component
function BarChart({ data }: { data: Array<{ label: string; value: number }> }) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  
  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
            <span className="font-bold text-gray-900 dark:text-white">{item.value}</span>
          </div>
          <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-700"
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StudentDetail | null>(null);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get<StudentDetail>(`/analytics/students/${studentId}`);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const fetchAIInsight = async () => {
    if (!data?.aiConfigured) return;
    
    setLoadingAI(true);
    try {
      const response = await api.post<{ insights: string }>('/analytics/ai-insights', {
        reportType: 'student-detail',
        reportData: {
          studentName: data.student.name,
          totalLessons: data.summary.totalLessons,
          completedLessons: data.summary.completedLessons,
          progress: data.summary.progress,
          examsTaken: data.summary.examsTaken,
          avgScore: data.summary.avgScore,
          passRate: data.summary.passRate,
          subjectProgress: data.subjectProgress.map(s => ({
            name: s.name,
            progress: s.progress
          })),
          recentExams: data.examHistory.slice(0, 5).map(e => ({
            name: e.examName,
            score: e.score,
            passed: e.passed
          }))
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700" />
            <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-gray-500">Đang tải thông tin sinh viên...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="max-w-md border-0 shadow-lg">
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-red-500 mb-4 font-medium">{error || 'Không tìm thấy sinh viên'}</p>
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { student, summary, subjectProgress, examHistory, monthlyProgress, recentActivity, enrollments } = data;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-950/10 dark:to-purple-950/10">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-7xl py-8 px-4 md:px-8 space-y-8">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại danh sách
          </Button>

          {/* Student Header */}
          <Card className="border-0 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 text-white">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <Avatar className="h-28 w-28 ring-4 ring-white/50 shadow-2xl">
                  <AvatarFallback className="bg-white/20 text-4xl font-bold text-white">
                    {student.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center md:text-left flex-1">
                  <h1 className="text-3xl font-bold mb-2">{student.name}</h1>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-white/80">
                    <span className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {student.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Tham gia: {formatDate(student.createdAt)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
                    {enrollments.map((e) => (
                      <Badge key={e.majorId} variant="secondary" className="bg-white/20 text-white border-0">
                        {e.majorName}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-5xl font-bold">{summary.progress}%</div>
                    <div className="text-sm text-white/80">Tiến độ học</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Bài học hoàn thành"
            value={summary.completedLessons}
            subtitle={`/ ${summary.totalLessons} bài`}
            icon={BookOpen}
            gradient="from-blue-500 to-cyan-500"
          />
          <StatCard
            title="Thời gian học"
            value={formatDuration(summary.totalStudyMinutes)}
            subtitle="Tổng thời gian"
            icon={Clock}
            gradient="from-green-500 to-emerald-500"
          />
          <StatCard
            title="Điểm trung bình"
            value={`${summary.avgScore}%`}
            subtitle={`${summary.examsTaken} bài thi`}
            icon={Award}
            gradient={summary.avgScore >= 70 ? "from-green-500 to-emerald-500" : summary.avgScore >= 50 ? "from-yellow-500 to-orange-500" : "from-red-500 to-pink-500"}
          />
          <StatCard
            title="Tỷ lệ đạt"
            value={`${summary.passRate}%`}
            subtitle="Bài thi đạt yêu cầu"
            icon={Target}
            gradient={summary.passRate >= 70 ? "from-green-500 to-emerald-500" : "from-yellow-500 to-orange-500"}
          />
        </div>

        <Tabs defaultValue="progress" className="space-y-6">
          <TabsList className="bg-white dark:bg-gray-900 p-1 rounded-xl shadow-lg">
            <TabsTrigger value="progress" className="rounded-lg px-6 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <BookOpen className="h-4 w-4 mr-2" />
              Tiến độ môn học
            </TabsTrigger>
            <TabsTrigger value="exams" className="rounded-lg px-6 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <GraduationCap className="h-4 w-4 mr-2" />
              Lịch sử bài thi
            </TabsTrigger>
            <TabsTrigger value="monthly" className="rounded-lg px-6 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <BarChart3 className="h-4 w-4 mr-2" />
              Báo cáo tháng
            </TabsTrigger>
            <TabsTrigger value="activity" className="rounded-lg px-6 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <Activity className="h-4 w-4 mr-2" />
              Hoạt động
            </TabsTrigger>
          </TabsList>

          {/* Subject Progress Tab */}
          <TabsContent value="progress">
            <div className="grid gap-6 md:grid-cols-2">
              {subjectProgress.length > 0 ? (
                subjectProgress.map((subject) => (
                  <Card key={subject.id} className="border-0 shadow-lg hover:shadow-xl transition-all">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <BookOpen className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{subject.name}</CardTitle>
                            <CardDescription>{subject.majorName}</CardDescription>
                          </div>
                        </div>
                        <Badge 
                          className={`${
                            subject.progress >= 80 ? 'bg-green-100 text-green-700' :
                            subject.progress >= 50 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}
                        >
                          {subject.progress}%
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Progress value={subject.progress} className="h-3 mb-3" />
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>{subject.completedLessons}/{subject.totalLessons} bài học</span>
                        {subject.lastActivity && (
                          <span>Học gần nhất: {formatDate(subject.lastActivity)}</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="md:col-span-2 border-0 shadow-lg">
                  <CardContent className="text-center py-12">
                    <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Chưa có dữ liệu tiến độ môn học</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Exam History Tab */}
          <TabsContent value="exams">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-green-600" />
                  Lịch sử bài thi ({examHistory.length} bài)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {examHistory.length > 0 ? (
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {examHistory.map((exam) => (
                      <div key={exam.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                          exam.passed 
                            ? 'bg-gradient-to-br from-green-400 to-emerald-500' 
                            : 'bg-gradient-to-br from-red-400 to-pink-500'
                        }`}>
                          <span className="text-lg font-bold text-white">{exam.score}%</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white">{exam.examName}</p>
                          <p className="text-sm text-gray-500">{exam.subjectName}</p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              {exam.correctAnswers}/{exam.totalQuestions} đúng
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDuration(exam.timeSpent)}
                            </span>
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              {formatDate(exam.submittedAt)}
                            </span>
                          </div>
                        </div>
                        <Badge variant={exam.passed ? 'default' : 'destructive'}>
                          {exam.passed ? 'Đạt' : 'Chưa đạt'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <GraduationCap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Chưa làm bài thi nào</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monthly Progress Tab */}
          <TabsContent value="monthly">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-600" />
                    Bài học hoàn thành theo tháng
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <BarChart 
                    data={monthlyProgress.map(m => ({
                      label: m.label,
                      value: m.lessonsCompleted
                    }))}
                  />
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50 rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-blue-600" />
                    Điểm trung bình theo tháng
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <BarChart 
                    data={monthlyProgress.filter(m => m.examsTaken > 0).map(m => ({
                      label: m.label,
                      value: m.avgScore
                    }))}
                  />
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-green-600" />
                    Chi tiết theo tháng
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Tháng</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Bài học</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Bài thi</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Điểm TB</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Thời gian học</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyProgress.map((month, index) => (
                          <tr key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="py-3 px-4 font-medium">{month.label}</td>
                            <td className="text-center py-3 px-4">
                              <Badge variant="outline">{month.lessonsCompleted}</Badge>
                            </td>
                            <td className="text-center py-3 px-4">
                              <Badge variant="outline">{month.examsTaken}</Badge>
                            </td>
                            <td className="text-center py-3 px-4">
                              {month.examsTaken > 0 ? (
                                <Badge className={
                                  month.avgScore >= 70 ? 'bg-green-100 text-green-700' :
                                  month.avgScore >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }>
                                  {month.avgScore}%
                                </Badge>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="text-center py-3 px-4 text-gray-600 dark:text-gray-400">
                              {formatDuration(month.studyMinutes)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/50 dark:to-amber-950/50 rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-orange-600" />
                  Hoạt động gần đây
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {recentActivity.length > 0 ? (
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center gap-4 p-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          activity.type === 'lesson' 
                            ? 'bg-blue-100 dark:bg-blue-950/50' 
                            : 'bg-green-100 dark:bg-green-950/50'
                        }`}>
                          {activity.type === 'lesson' ? (
                            <BookOpen className="h-5 w-5 text-blue-600" />
                          ) : (
                            <GraduationCap className="h-5 w-5 text-green-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">{activity.title}</p>
                          <p className="text-sm text-gray-500">{activity.subjectName}</p>
                        </div>
                        <div className="text-right">
                          {activity.type === 'exam' && activity.score !== undefined && (
                            <Badge variant={activity.passed ? 'default' : 'destructive'} className="mb-1">
                              {activity.score}%
                            </Badge>
                          )}
                          <p className="text-xs text-gray-400">{formatDate(activity.date)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Activity className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Chưa có hoạt động nào</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* AI Insights */}
        {data.aiConfigured && (
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/30 dark:via-purple-950/30 dark:to-pink-950/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-purple-600" />
                AI Phân tích & Đánh giá sinh viên
              </CardTitle>
              <CardDescription>
                Phân tích thông minh về tiến độ và kết quả học tập của {student.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {aiInsight ? (
                <div className="prose prose-sm dark:prose-invert max-w-none bg-white/50 dark:bg-gray-900/50 rounded-xl p-4">
                  <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{aiInsight}</p>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Brain className="h-16 w-16 text-purple-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Nhấn để lấy phân tích AI về sinh viên này</p>
                  <Button 
                    onClick={fetchAIInsight} 
                    disabled={loadingAI}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {loadingAI ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Đang phân tích...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Lấy phân tích AI
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        </div>
      </main>
    </div>
  );
}
