'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  GraduationCap,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Award
} from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/layout/Header';

interface ExamAttemptItem {
  id: string;
  examName: string;
  subjectName: string;
  score: number;
  passed: boolean;
  submittedAt: string;
  totalQuestions: number;
  correctAnswers: number;
}

interface ExamsData {
  attempts: ExamAttemptItem[];
  summary: {
    totalAttempts: number;
    passedCount: number;
    failedCount: number;
    avgScore: number;
    bestScore: number;
    passRate: number;
  };
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
    <Card className="relative overflow-hidden border-0 shadow-lg">
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

export default function ExamsListPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ExamsData | null>(null);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      // Get overview which includes recent exams
      const overview = await api.get<{ recentExams: ExamAttemptItem[] }>('/analytics/overview');
      
      // Calculate summary from available data
      const attempts = overview.recentExams || [];
      const passedCount = attempts.filter(a => a.passed).length;
      const scores = attempts.map(a => a.score);
      
      setData({
        attempts,
        summary: {
          totalAttempts: attempts.length,
          passedCount,
          failedCount: attempts.length - passedCount,
          avgScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
          bestScore: scores.length > 0 ? Math.max(...scores) : 0,
          passRate: attempts.length > 0 ? Math.round((passedCount / attempts.length) * 100) : 0
        }
      });
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700" />
            <div className="absolute inset-0 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-gray-500">Đang tải danh sách bài thi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/30 dark:from-gray-900 dark:via-green-950/10 dark:to-emerald-950/10">
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

          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
              🎓 Phân tích bài thi
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Xem lại kết quả và phân tích chi tiết các bài thi đã làm
            </p>
          </div>

          {data && (
            <>
              {/* Summary Stats */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Tổng bài thi"
                  value={data.summary.totalAttempts}
                  icon={GraduationCap}
                  gradient="from-blue-500 to-cyan-500"
                />
                <StatCard
                  title="Bài đạt / Chưa đạt"
                  value={`${data.summary.passedCount} / ${data.summary.failedCount}`}
                  subtitle={`Tỷ lệ đạt: ${data.summary.passRate}%`}
                  icon={CheckCircle}
                  gradient="from-green-500 to-emerald-500"
                />
                <StatCard
                  title="Điểm trung bình"
                  value={`${data.summary.avgScore}%`}
                  icon={TrendingUp}
                  gradient={data.summary.avgScore >= 70 ? "from-green-500 to-emerald-500" : data.summary.avgScore >= 50 ? "from-yellow-500 to-orange-500" : "from-red-500 to-pink-500"}
                />
                <StatCard
                  title="Điểm cao nhất"
                  value={`${data.summary.bestScore}%`}
                  icon={Award}
                  gradient="from-yellow-500 to-orange-500"
                />
              </div>

              {/* Exam List */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-green-600" />
                    Danh sách bài thi ({data.attempts.length})
                  </CardTitle>
                  <CardDescription>
                    Nhấn vào bài thi để xem phân tích chi tiết
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {data.attempts.length > 0 ? (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                      {data.attempts.map((attempt) => (
                        <Link 
                          key={attempt.id}
                          href={`/dashboard/analytics/exams/${attempt.id}`}
                          className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                        >
                          <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                            attempt.passed 
                              ? 'bg-gradient-to-br from-green-400 to-emerald-500' 
                              : 'bg-gradient-to-br from-red-400 to-pink-500'
                          }`}>
                            <span className="text-xl font-bold text-white">{attempt.score}%</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white group-hover:text-green-600 transition-colors">
                              {attempt.examName}
                            </p>
                            <p className="text-sm text-gray-500">{attempt.subjectName}</p>
                            <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(attempt.submittedAt)}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={attempt.passed ? 'default' : 'destructive'} className="mb-2">
                              {attempt.passed ? (
                                <><CheckCircle className="h-3 w-3 mr-1" /> Đạt</>
                              ) : (
                                <><XCircle className="h-3 w-3 mr-1" /> Chưa đạt</>
                              )}
                            </Badge>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <GraduationCap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">Chưa làm bài thi nào</p>
                      <p className="text-gray-400 text-sm mt-2">
                        Hãy tham gia các bài thi để xem phân tích kết quả
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
