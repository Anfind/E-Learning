'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  BookOpen,
  Clock,
  Award,
  Flame,
  TrendingUp,
  TrendingDown,
  Users,
  GraduationCap,
  ChevronRight,
  Brain,
  BarChart3,
  Sparkles,
  RefreshCw,
  Calendar,
  Target,
  Search,
  Eye,
  FileText,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/layout/Header';

interface StudentOverview {
  summary: {
    enrolledMajors: number;
    completedLessons: number;
    totalLessons: number;
    lessonProgress: number;
    totalStudyTime: { hours: number; minutes: number };
    examsTaken: number;
    avgScore: number;
    streak: number;
    bestSubject: string;
    weakestSubject: string;
  };
  recentExams: Array<{
    id: string;
    examName: string;
    subjectName: string;
    score: number;
    passed: boolean;
    submittedAt: string;
  }>;
  subjectProgress: Array<{
    id: string;
    name: string;
    majorName: string;
    completedLessons: number;
    totalLessons: number;
    progress: number;
  }>;
  monthlyProgress: Array<{
    month: number;
    year: number;
    label: string;
    lessonsCompleted: number;
    examsTaken: number;
    avgScore: number;
  }>;
  aiConfigured: boolean;
}

interface TeacherOverview {
  summary: {
    totalSubjects: number;
    totalStudents: number;
    activeStudents: number;
    activePercent: number;
    avgProgress: number;
    avgExamScore: number;
  };
  subjects: Array<{
    id: string;
    name: string;
    majorName: string;
    totalLessons: number;
    totalExams: number;
    studentsEnrolled: number;
    avgProgress: number;
  }>;
  students: Array<{
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    majorName: string;
    completedLessons: number;
    totalLessons: number;
    progress: number;
    avgScore: number | null;
    lastActivity: string | null;
  }>;
  topStudents: Array<{
    id: string;
    name: string;
    progress: number;
    avgScore: number | null;
  }>;
  aiConfigured: boolean;
}

// Enhanced Bar Chart with animation
function AnimatedBarChart({ data }: { data: Array<{ label: string; value: number; color?: string }> }) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  
  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="group">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
            <span className="text-sm font-bold text-primary">{item.value}</span>
          </div>
          <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ease-out ${item.color || 'bg-gradient-to-r from-blue-500 to-purple-600'}`}
              style={{ 
                width: `${(item.value / maxValue) * 100}%`,
                animationDelay: `${index * 100}ms`
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Enhanced Stat Card with gradient and animation
function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  gradient = 'from-blue-500 to-blue-600'
}: { 
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: number;
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
        {trend !== undefined && (
          <div className="mt-4 flex items-center gap-1 text-sm">
            {trend >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span className={`font-medium ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {trend >= 0 ? '+' : ''}{trend}%
            </span>
            <span className="text-gray-500">so với tháng trước</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Student Dashboard Component
function StudentAnalytics({ data }: { data: StudentOverview }) {
  const [aiInsight, setAiInsight] = useState<string>('');
  const [loadingAI, setLoadingAI] = useState(false);

  const summary = data.summary || {
    enrolledMajors: 0,
    completedLessons: 0,
    totalLessons: 0,
    lessonProgress: 0,
    totalStudyTime: { hours: 0, minutes: 0 },
    examsTaken: 0,
    avgScore: 0,
    streak: 0,
    bestSubject: 'Chưa có dữ liệu',
    weakestSubject: 'Chưa có dữ liệu'
  };
  const studyTime = summary.totalStudyTime || { hours: 0, minutes: 0 };

  const fetchAIInsight = async () => {
    if (!data.aiConfigured) return;
    
    setLoadingAI(true);
    try {
      const response = await api.post<{ insights: string }>('/analytics/ai-insights', {
        reportType: 'overview',
        reportData: {
          enrolledMajors: summary.enrolledMajors,
          totalCompletedLessons: summary.completedLessons,
          totalStudyHours: studyTime.hours || 0,
          overallAvgScore: summary.avgScore,
          currentStreak: summary.streak,
          bestSubject: summary.bestSubject,
          weakestSubject: summary.weakestSubject
        }
      });
      setAiInsight(response.insights);
    } catch (error) {
      console.error('Error fetching AI insight:', error);
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Bài học hoàn thành"
          value={summary.completedLessons}
          subtitle={`/ ${summary.totalLessons} bài học`}
          icon={BookOpen}
          gradient="from-blue-500 to-cyan-500"
        />
        <StatCard
          title="Thời gian học"
          value={`${studyTime.hours}h ${studyTime.minutes}m`}
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
          title="Streak học tập"
          value={summary.streak}
          subtitle="ngày liên tục"
          icon={Flame}
          gradient="from-orange-500 to-red-500"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Subject Progress - Takes 2 columns */}
        <Card className="lg:col-span-2 border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Tiến độ theo môn học
                </CardTitle>
                <CardDescription>Theo dõi tiến độ từng môn</CardDescription>
              </div>
              <Link href="/dashboard/analytics/subjects">
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                  Xem tất cả <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {(data.subjectProgress?.length ?? 0) > 0 ? (
              <div className="space-y-5">
                {data.subjectProgress.slice(0, 5).map(subject => (
                  <Link 
                    key={subject.id}
                    href={`/dashboard/analytics/subjects/${subject.id}`}
                    className="block group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                            {subject.name}
                          </p>
                          <p className="text-xs text-gray-500">{subject.majorName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {subject.progress}%
                        </span>
                        <p className="text-xs text-gray-500">
                          {subject.completedLessons}/{subject.totalLessons} bài
                        </p>
                      </div>
                    </div>
                    <Progress 
                      value={subject.progress} 
                      className="h-2 bg-gray-100 dark:bg-gray-800"
                    />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Chưa có dữ liệu tiến độ</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Exams */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-lg">
              <GraduationCap className="h-5 w-5 text-green-600" />
              Bài thi gần đây
            </CardTitle>
            <CardDescription>Kết quả các bài thi mới nhất</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {(data.recentExams?.length ?? 0) > 0 ? (
              <div className="space-y-3">
                {data.recentExams.slice(0, 5).map(exam => (
                  <Link 
                    key={exam.id}
                    href={`/dashboard/analytics/exams/${exam.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      exam.passed 
                        ? 'bg-gradient-to-br from-green-400 to-emerald-500' 
                        : 'bg-gradient-to-br from-red-400 to-pink-500'
                    }`}>
                      <span className="text-lg font-bold text-white">{exam.score}%</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">
                        {exam.examName}
                      </p>
                      <p className="text-xs text-gray-500">{exam.subjectName}</p>
                    </div>
                    <Badge variant={exam.passed ? 'default' : 'destructive'} className="shrink-0">
                      {exam.passed ? 'Đạt' : 'Chưa đạt'}
                    </Badge>
                  </Link>
                ))}
                <Link href="/dashboard/analytics/exams">
                  <Button variant="ghost" className="w-full mt-2 text-green-600 hover:text-green-700">
                    Xem tất cả bài thi <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <GraduationCap className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Chưa có bài thi nào</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Progress Chart */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Tiến độ 6 tháng gần đây
              </CardTitle>
              <CardDescription>Số bài học hoàn thành mỗi tháng</CardDescription>
            </div>
            <Link href="/dashboard/analytics/monthly">
              <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700">
                Xem chi tiết <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <AnimatedBarChart 
            data={(data.monthlyProgress || []).map(m => ({
              label: m.label,
              value: m.lessonsCompleted,
              color: 'bg-gradient-to-r from-purple-500 to-pink-500'
            }))}
          />
        </CardContent>
      </Card>

      {/* AI Insights & Quick Stats */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* AI Insights */}
        {data.aiConfigured && (
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/30 dark:via-purple-950/30 dark:to-pink-950/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-purple-600" />
                AI Phân tích & Gợi ý
              </CardTitle>
              <CardDescription>
                Phân tích thông minh từ LearnHub AI
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
                  <p className="text-gray-500 mb-4">Nhấn để lấy phân tích AI</p>
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

        {/* Quick Stats */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-orange-600" />
              Đánh giá nhanh
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-green-50 dark:bg-green-950/30">
              <div className="p-3 rounded-lg bg-green-500">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Môn học tốt nhất</p>
                <p className="font-bold text-lg text-gray-900 dark:text-white">{summary.bestSubject}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-yellow-50 dark:bg-yellow-950/30">
              <div className="p-3 rounded-lg bg-yellow-500">
                <TrendingDown className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Cần cải thiện</p>
                <p className="font-bold text-lg text-gray-900 dark:text-white">{summary.weakestSubject}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30">
              <div className="p-3 rounded-lg bg-blue-500">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Tiến độ tổng</p>
                <p className="font-bold text-lg text-gray-900 dark:text-white">{summary.lessonProgress}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Teacher Dashboard Component
function TeacherAnalytics({ data }: { data: TeacherOverview }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const summary = data.summary || {
    totalSubjects: 0,
    totalStudents: 0,
    activeStudents: 0,
    activePercent: 0,
    avgProgress: 0,
    avgExamScore: 0
  };

  const filteredStudents = (data.students || []).filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Môn học phụ trách"
          value={summary.totalSubjects}
          icon={BookOpen}
          gradient="from-blue-500 to-cyan-500"
        />
        <StatCard
          title="Tổng học viên"
          value={summary.totalStudents}
          subtitle={`${summary.activeStudents} đang hoạt động`}
          icon={Users}
          gradient="from-green-500 to-emerald-500"
        />
        <StatCard
          title="Tiến độ TB"
          value={`${summary.avgProgress}%`}
          subtitle="Toàn bộ học viên"
          icon={TrendingUp}
          gradient={summary.avgProgress >= 50 ? "from-green-500 to-emerald-500" : "from-yellow-500 to-orange-500"}
        />
        <StatCard
          title="Điểm TB bài thi"
          value={`${summary.avgExamScore}%`}
          icon={Award}
          gradient={summary.avgExamScore >= 70 ? "from-green-500 to-emerald-500" : summary.avgExamScore >= 50 ? "from-yellow-500 to-orange-500" : "from-red-500 to-pink-500"}
        />
      </div>

      <Tabs defaultValue="students" className="space-y-6">
        <TabsList className="bg-white dark:bg-gray-900 p-1 rounded-xl shadow-lg">
          <TabsTrigger value="students" className="rounded-lg px-6 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
            <Users className="h-4 w-4 mr-2" />
            Học viên
          </TabsTrigger>
          <TabsTrigger value="subjects" className="rounded-lg px-6 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
            <BookOpen className="h-4 w-4 mr-2" />
            Môn học
          </TabsTrigger>
          <TabsTrigger value="top" className="rounded-lg px-6 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
            <Award className="h-4 w-4 mr-2" />
            Top học viên
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 rounded-t-lg">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                    Danh sách học viên
                  </CardTitle>
                  <CardDescription>
                    Tổng {data.students?.length || 0} học viên - Sắp xếp theo tiến độ
                  </CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Tìm học viên..." 
                    className="pl-10 w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredStudents.length > 0 ? (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredStudents.map((student, index) => (
                    <Link 
                      key={student.id}
                      href={`/dashboard/analytics/students/${student.id}`}
                      className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                    >
                      <span className="text-lg font-bold text-gray-400 w-8">{index + 1}</span>
                      <Avatar className="h-12 w-12 ring-2 ring-white dark:ring-gray-800 shadow-lg">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                          {student.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                          {student.name}
                        </p>
                        <p className="text-sm text-gray-500">{student.email}</p>
                        <p className="text-xs text-gray-400">{student.majorName}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="flex items-center gap-2">
                          <Progress value={student.progress} className="w-24 h-2" />
                          <span className="text-sm font-bold w-12 text-right">{student.progress}%</span>
                        </div>
                        <div className="flex items-center gap-2 justify-end">
                          {student.avgScore !== null && (
                            <Badge variant={student.avgScore >= 70 ? 'default' : student.avgScore >= 50 ? 'secondary' : 'destructive'}>
                              TB: {student.avgScore}%
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {student.completedLessons}/{student.totalLessons} bài
                          </Badge>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Không tìm thấy học viên</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects">
          <div className="grid gap-6 md:grid-cols-2">
            {(data.subjects || []).map(subject => (
              <Card key={subject.id} className="border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
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
                    <Badge className="bg-gradient-to-r from-blue-500 to-purple-600">
                      {subject.studentsEnrolled} học viên
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="text-center p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30">
                      <FileText className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{subject.totalLessons}</p>
                      <p className="text-xs text-gray-500">Bài học</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-green-50 dark:bg-green-950/30">
                      <GraduationCap className="h-5 w-5 text-green-600 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{subject.totalExams}</p>
                      <p className="text-xs text-gray-500">Bài thi</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30">
                      <Activity className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{subject.avgProgress}%</p>
                      <p className="text-xs text-gray-500">Tiến độ</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="top">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/50 dark:to-orange-950/50 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Award className="h-5 w-5 text-yellow-600" />
                Bảng xếp hạng học viên xuất sắc
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {(data.topStudents || []).map((student, index) => (
                  <div 
                    key={student.id}
                    className={`flex items-center gap-4 p-4 ${
                      index === 0 ? 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30' :
                      index === 1 ? 'bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/30 dark:to-slate-800/30' :
                      index === 2 ? 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30' : ''
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold ${
                      index === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white' :
                      index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white' :
                      index === 2 ? 'bg-gradient-to-br from-orange-400 to-amber-600 text-white' : 
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-lg text-gray-900 dark:text-white">{student.name}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-gray-500">
                          <TrendingUp className="h-4 w-4 inline mr-1 text-green-500" />
                          Tiến độ: {student.progress}%
                        </span>
                        {student.avgScore !== null && (
                          <span className="text-sm text-gray-500">
                            <Award className="h-4 w-4 inline mr-1 text-blue-500" />
                            Điểm TB: {student.avgScore}%
                          </span>
                        )}
                      </div>
                    </div>
                    <Link href={`/dashboard/analytics/students/${student.id}`}>
                      <Button variant="outline" size="sm">
                        Xem chi tiết
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Main Analytics Page
export default function AnalyticsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentData, setStudentData] = useState<StudentOverview | null>(null);
  const [teacherData, setTeacherData] = useState<TeacherOverview | null>(null);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (user?.role === 'TEACHER') {
        const response = await api.get<TeacherOverview>('/analytics/overview');
        setTeacherData(response);
      } else {
        const response = await api.get<StudentOverview>('/analytics/overview');
        setStudentData(response);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
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
          <p className="text-gray-500">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="max-w-md border-0 shadow-lg">
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-red-500 mb-4 font-medium">{error}</p>
            <Button onClick={fetchData} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
              <RefreshCw className="h-4 w-4 mr-2" />
              Thử lại
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-950/10 dark:to-purple-950/10">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-7xl py-8 px-4 md:px-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                📊 Phân tích học tập
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
                {user?.role === 'TEACHER' 
                  ? 'Theo dõi tiến độ và kết quả học viên của bạn'
                  : 'Theo dõi tiến độ và kết quả học tập của bạn'
                }
              </p>
            </div>
            <Button 
              onClick={fetchData} 
              variant="outline" 
              className="bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Làm mới dữ liệu
            </Button>
          </div>

          {/* Quick Navigation */}
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/analytics/monthly">
              <Button variant="outline" className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md">
                <Calendar className="h-4 w-4 mr-2 text-purple-600" />
                Báo cáo theo tháng
              </Button>
            </Link>
            <Link href="/dashboard/analytics/exams">
              <Button variant="outline" className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md">
                <GraduationCap className="h-4 w-4 mr-2 text-green-600" />
                Phân tích bài thi
              </Button>
            </Link>
            <Link href="/dashboard/analytics/subjects">
              <Button variant="outline" className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md">
                <BookOpen className="h-4 w-4 mr-2 text-blue-600" />
                Tiến độ môn học
              </Button>
            </Link>
          </div>

          {/* Main Content */}
          {user?.role === 'TEACHER' && teacherData ? (
            <TeacherAnalytics data={teacherData} />
          ) : studentData ? (
            <StudentAnalytics data={studentData} />
          ) : (
            <Card className="border-0 shadow-lg">
              <CardContent className="text-center py-16">
                <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Không có dữ liệu phân tích</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
