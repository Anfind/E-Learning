'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BookOpen,
  Clock,
  Award,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Calendar,
  CheckCircle,
  Brain,
  RefreshCw,
  Sparkles,
  ArrowLeft,
  Target,
  GraduationCap
} from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/layout/Header';

interface MonthlyReport {
  month: number;
  year: number;
  completedLessons: number;
  totalLessons: number;
  lessonProgress: number;
  totalHours: number;
  totalMinutes: number;
  examsTaken: number;
  avgScore: number;
  comparison: number;
  exams: Array<{
    name: string;
    subject: string;
    score: number;
    passed: boolean;
    date: string;
  }>;
  lessons: Array<{
    name: string;
    subject: string;
    completedAt: string;
  }>;
  aiConfigured?: boolean;
}

const monthNames = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

// Stat Card Component
function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  gradient = 'from-blue-500 to-blue-600',
  trend
}: { 
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  gradient?: string;
  trend?: number;
}) {
  return (
    <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
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
        {trend !== undefined && trend !== 0 && (
          <div className="mt-3 flex items-center gap-1 text-sm">
            {trend > 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span className={`font-medium ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
            <span className="text-gray-500">so với tháng trước</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function MonthlyReportPage() {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  const [aiInsight, setAiInsight] = useState<string>('');
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await api.get<MonthlyReport>(`/analytics/monthly/${selectedDate.year}/${selectedDate.month}`);
      setReport(response);
      setAiInsight('');
    } catch (error) {
      console.error('Error fetching monthly report:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => {
      let newMonth = prev.month + (direction === 'next' ? 1 : -1);
      let newYear = prev.year;
      
      if (newMonth > 12) {
        newMonth = 1;
        newYear++;
      } else if (newMonth < 1) {
        newMonth = 12;
        newYear--;
      }
      
      return { year: newYear, month: newMonth };
    });
  };

  const fetchAIInsight = async () => {
    if (!report) return;
    
    setLoadingAI(true);
    try {
      const response = await api.post<{ insights: string }>('/analytics/ai-insights', {
        reportType: 'monthly',
        reportData: {
          month: monthNames[report.month - 1],
          year: report.year,
          completedLessons: report.completedLessons,
          totalStudyHours: report.totalHours,
          examsTaken: report.examsTaken,
          avgScore: report.avgScore,
          comparison: report.comparison
        }
      });
      setAiInsight(response.insights);
    } catch (error) {
      console.error('Error fetching AI insight:', error);
    } finally {
      setLoadingAI(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return selectedDate.year === now.getFullYear() && selectedDate.month === now.getMonth() + 1;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700" />
            <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-gray-500">Đang tải báo cáo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 dark:from-gray-900 dark:via-purple-950/10 dark:to-pink-950/10">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-6xl py-8 px-4 md:px-8 space-y-8">
          {/* Navigation */}
          <Link href="/dashboard/analytics">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại tổng quan
            </Button>
          </Link>

          {/* Header with Month Navigation */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent">
                📅 Báo cáo theo tháng
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Phân tích chi tiết hoạt động học tập trong tháng
              </p>
            </div>
            
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-xl shadow-lg">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigateMonth('prev')}
                className="hover:bg-purple-100 dark:hover:bg-purple-950/30"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="px-4 py-2 min-w-[160px] text-center">
                <span className="font-bold text-lg text-gray-900 dark:text-white">
                  {monthNames[selectedDate.month - 1]}
                </span>
              <span className="text-gray-500 ml-2">{selectedDate.year}</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigateMonth('next')}
              disabled={isCurrentMonth()}
              className="hover:bg-purple-100 dark:hover:bg-purple-950/30"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {report ? (
          <>
            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Bài học hoàn thành"
                value={report.completedLessons}
                subtitle={`/ ${report.totalLessons} bài học`}
                icon={BookOpen}
                gradient="from-blue-500 to-cyan-500"
                trend={report.comparison}
              />
              <StatCard
                title="Thời gian học"
                value={`${report.totalHours}h ${report.totalMinutes}m`}
                subtitle="Tổng trong tháng"
                icon={Clock}
                gradient="from-green-500 to-emerald-500"
              />
              <StatCard
                title="Bài thi"
                value={report.examsTaken}
                subtitle="Bài đã hoàn thành"
                icon={GraduationCap}
                gradient="from-purple-500 to-pink-500"
              />
              <StatCard
                title="Điểm trung bình"
                value={`${report.avgScore}%`}
                icon={Award}
                gradient={report.avgScore >= 70 ? "from-green-500 to-emerald-500" : report.avgScore >= 50 ? "from-yellow-500 to-orange-500" : "from-red-500 to-pink-500"}
              />
            </div>

            {/* Progress Overview */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  Tiến độ tháng {monthNames[selectedDate.month - 1]}
                </CardTitle>
                <CardDescription>
                  Tổng quan về tiến độ học tập trong tháng
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Hoàn thành bài học</span>
                      <span className="text-sm font-bold text-purple-600">{report.lessonProgress}%</span>
                    </div>
                    <Progress value={report.lessonProgress} className="h-3" />
                    <p className="text-xs text-gray-500 mt-1">
                      {report.completedLessons} / {report.totalLessons} bài học
                    </p>
                  </div>
                  
                  {report.examsTaken > 0 && (
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tỷ lệ thi đạt</span>
                        <span className="text-sm font-bold text-green-600">
                          {Math.round((report.exams.filter(e => e.passed).length / report.exams.length) * 100)}%
                        </span>
                      </div>
                      <Progress 
                        value={(report.exams.filter(e => e.passed).length / report.exams.length) * 100} 
                        className="h-3" 
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {report.exams.filter(e => e.passed).length} / {report.exams.length} bài thi đạt yêu cầu
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Exams and Lessons Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Exams */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 rounded-t-lg">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <GraduationCap className="h-5 w-5 text-green-600" />
                    Bài thi trong tháng
                  </CardTitle>
                  <CardDescription>
                    {report.exams.length} bài thi hoàn thành
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 max-h-96 overflow-y-auto">
                  {report.exams.length > 0 ? (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                      {report.exams.map((exam, index) => (
                        <div key={index} className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            exam.passed 
                              ? 'bg-gradient-to-br from-green-400 to-emerald-500' 
                              : 'bg-gradient-to-br from-red-400 to-pink-500'
                          }`}>
                            <span className="text-lg font-bold text-white">{exam.score}%</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate">{exam.name}</p>
                            <p className="text-sm text-gray-500">{exam.subject}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant={exam.passed ? 'default' : 'destructive'}>
                              {exam.passed ? 'Đạt' : 'Chưa đạt'}
                            </Badge>
                            <p className="text-xs text-gray-400 mt-1">{formatDate(exam.date)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <GraduationCap className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Chưa có bài thi nào trong tháng này</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Lessons */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50 rounded-t-lg">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    Bài học hoàn thành
                  </CardTitle>
                  <CardDescription>
                    {report.lessons.length} bài học trong tháng
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 max-h-96 overflow-y-auto">
                  {report.lessons.length > 0 ? (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                      {report.lessons.map((lesson, index) => (
                        <div key={index} className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                            <CheckCircle className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate">{lesson.name}</p>
                            <p className="text-sm text-gray-500">{lesson.subject}</p>
                          </div>
                          <span className="text-xs text-gray-400">{formatDate(lesson.completedAt)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Chưa hoàn thành bài học nào trong tháng này</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* AI Insights */}
            {report.aiConfigured && (
              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 dark:from-purple-950/30 dark:via-pink-950/30 dark:to-rose-950/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    AI Phân tích tháng {monthNames[selectedDate.month - 1]}
                  </CardTitle>
                  <CardDescription>
                    Đánh giá và gợi ý từ LearnHub AI
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
                      <p className="text-gray-500 mb-4">Nhấn để lấy phân tích AI cho tháng này</p>
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
          </>
        ) : (
          <Card className="border-0 shadow-lg">
            <CardContent className="text-center py-16">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Không có dữ liệu cho tháng này</p>
              <p className="text-gray-400 text-sm mt-2">
                Hãy thử chọn tháng khác hoặc bắt đầu học để có dữ liệu
              </p>
            </CardContent>
          </Card>
        )}
        </div>
      </main>
    </div>
  );
}
