'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BookOpen,
  ArrowLeft,
  CheckCircle,
  Clock,
  TrendingUp,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/layout/Header';

interface SubjectProgressItem {
  id: string;
  name: string;
  majorName: string;
  completedLessons: number;
  totalLessons: number;
  progress: number;
}

interface SubjectsData {
  subjects: SubjectProgressItem[];
  summary: {
    totalSubjects: number;
    completedSubjects: number;
    inProgressSubjects: number;
    avgProgress: number;
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

export default function SubjectsListPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SubjectsData | null>(null);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      // Get overview which includes subject progress
      const overview = await api.get<{ subjectProgress: SubjectProgressItem[] }>('/analytics/overview');
      
      // Calculate summary from available data
      const subjects = overview.subjectProgress || [];
      const completedSubjects = subjects.filter(s => s.progress === 100).length;
      const inProgressSubjects = subjects.filter(s => s.progress > 0 && s.progress < 100).length;
      const progresses = subjects.map(s => s.progress);
      
      setData({
        subjects,
        summary: {
          totalSubjects: subjects.length,
          completedSubjects,
          inProgressSubjects,
          avgProgress: progresses.length > 0 ? Math.round(progresses.reduce((a, b) => a + b, 0) / progresses.length) : 0
        }
      });
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'from-green-500 to-emerald-500';
    if (progress >= 50) return 'from-blue-500 to-cyan-500';
    if (progress >= 20) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700" />
            <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-gray-500">Đang tải danh sách môn học...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-blue-50/30 to-cyan-50/30 dark:from-gray-900 dark:via-blue-950/10 dark:to-cyan-950/10">
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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent">
              📚 Tiến độ môn học
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Theo dõi tiến độ học tập chi tiết từng môn
            </p>
          </div>

          {data && (
            <>
              {/* Summary Stats */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Tổng môn học"
                  value={data.summary.totalSubjects}
                  icon={BookOpen}
                  gradient="from-blue-500 to-cyan-500"
                />
                <StatCard
                  title="Đã hoàn thành"
                  value={data.summary.completedSubjects}
                  subtitle="Môn học 100%"
                  icon={CheckCircle}
                  gradient="from-green-500 to-emerald-500"
                />
                <StatCard
                  title="Đang học"
                  value={data.summary.inProgressSubjects}
                  subtitle="Chưa hoàn thành"
                  icon={Clock}
                  gradient="from-yellow-500 to-orange-500"
                />
                <StatCard
                  title="Tiến độ TB"
                  value={`${data.summary.avgProgress}%`}
                  icon={TrendingUp}
                  gradient={data.summary.avgProgress >= 50 ? "from-green-500 to-emerald-500" : "from-yellow-500 to-orange-500"}
                />
              </div>

              {/* Subjects Grid */}
              <div className="grid gap-6 md:grid-cols-2">
                {data.subjects.length > 0 ? (
                  data.subjects.map((subject) => (
                    <Link 
                      key={subject.id}
                      href={`/dashboard/analytics/subjects/${subject.id}`}
                      className="block group"
                    >
                      <Card className="border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getProgressColor(subject.progress)} flex items-center justify-center`}>
                                <BookOpen className="h-6 w-6 text-white" />
                              </div>
                              <div>
                                <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                                  {subject.name}
                                </CardTitle>
                                <CardDescription>{subject.majorName}</CardDescription>
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-500">Tiến độ</span>
                              <span className="font-bold text-lg">{subject.progress}%</span>
                            </div>
                            <Progress value={subject.progress} className="h-2" />
                            <div className="flex justify-between text-sm text-gray-500">
                              <span>{subject.completedLessons} / {subject.totalLessons} bài học</span>
                              {subject.progress === 100 && (
                                <Badge className="bg-green-100 text-green-700">
                                  <CheckCircle className="h-3 w-3 mr-1" /> Hoàn thành
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))
                ) : (
                  <Card className="md:col-span-2 border-0 shadow-lg">
                    <CardContent className="text-center py-16">
                      <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">Chưa có dữ liệu môn học</p>
                      <p className="text-gray-400 text-sm mt-2">
                        Hãy đăng ký ngành học và bắt đầu học để theo dõi tiến độ
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
