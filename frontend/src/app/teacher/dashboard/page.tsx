'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  BookOpen,
  FileText,
  Award,
  Users,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  GraduationCap
} from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/layout/Header';

interface TeacherStats {
  totalSubjects: number;
  totalLessons: number;
  totalExams: number;
  totalStudents: number;
  completedLessons: number;
  totalExamAttempts: number;
  passedExams: number;
  examPassRate: number;
}

interface SubjectSummary {
  id: string;
  name: string;
  majorName: string;
  lessonCount: number;
  examCount: number;
}

interface RecentActivity {
  type: 'lesson' | 'exam';
  user: {
    id: string;
    name: string;
    avatar: string | null;
  };
  item: {
    id: string;
    name: string;
  };
  completed?: boolean;
  score?: number;
  passed?: boolean;
  timestamp: string;
}

interface DashboardData {
  stats: TeacherStats;
  subjects: SubjectSummary[];
  recentActivities: RecentActivity[];
}

export default function TeacherDashboardPage() {
  const { user, loading: authLoading, isTeacher, isAdmin } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (!authLoading && user && !isTeacher && !isAdmin) {
      router.push('/dashboard');
    } else if (user && (isTeacher || isAdmin)) {
      loadDashboard();
    }
  }, [user, authLoading, isTeacher, isAdmin, router]);

  const loadDashboard = async () => {
    try {
      const response = await api.get<{ data: DashboardData }>('/teacher/dashboard');
      setData(response.data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid md:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!data) return null;

  const StatCard = ({ title, value, icon: Icon, subtitle, color = 'primary' }: {
    title: string;
    value: number | string;
    icon: React.ElementType;
    subtitle?: string;
    color?: 'primary' | 'green' | 'orange' | 'red';
  }) => {
    const colorClasses = {
      primary: 'text-primary',
      green: 'text-green-600',
      orange: 'text-orange-600',
      red: 'text-red-600',
    };

    return (
      <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <Icon className={`h-5 w-5 ${colorClasses[color]}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </CardContent>
      </Card>
    );
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${diffDays} ngày trước`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-indigo-50 to-white">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 text-gray-900">
              Xin chào, {user?.name}! 👋
            </h1>
            <p className="text-muted-foreground">
              Tổng quan về các môn học bạn đang phụ trách
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Môn phụ trách"
              value={data.stats.totalSubjects}
              icon={BookOpen}
              color="primary"
            />
            <StatCard
              title="Tổng bài học"
              value={data.stats.totalLessons}
              icon={FileText}
              color="primary"
            />
            <StatCard
              title="Tổng bài thi"
              value={data.stats.totalExams}
              icon={Award}
              color="orange"
            />
            <StatCard
              title="Sinh viên"
              value={data.stats.totalStudents}
              icon={Users}
              color="green"
            />
            <StatCard
              title="Bài học hoàn thành"
              value={data.stats.completedLessons}
              icon={CheckCircle2}
              subtitle="Tất cả sinh viên"
              color="green"
            />
            <StatCard
              title="Lượt thi"
              value={data.stats.totalExamAttempts}
              icon={Clock}
              color="primary"
            />
            <StatCard
              title="Đậu"
              value={data.stats.passedExams}
              icon={TrendingUp}
              color="green"
            />
            <StatCard
              title="Tỷ lệ đậu"
              value={`${data.stats.examPassRate}%`}
              icon={Award}
              color={data.stats.examPassRate >= 70 ? 'green' : data.stats.examPassRate >= 50 ? 'orange' : 'red'}
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Subjects List */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Môn học đang phụ trách
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.subjects.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Bạn chưa được phân công môn học nào
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {data.subjects.map((subject) => (
                        <Link 
                          key={subject.id} 
                          href={`/teacher/subjects/${subject.id}`}
                          className="block"
                        >
                          <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                            <div>
                              <h3 className="font-semibold">{subject.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {subject.majorName}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="gap-1">
                                <FileText className="h-3 w-3" />
                                {subject.lessonCount} bài
                              </Badge>
                              <Badge variant="outline" className="gap-1">
                                <Award className="h-3 w-3" />
                                {subject.examCount} thi
                              </Badge>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Activities */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Hoạt động gần đây
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.recentActivities.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Chưa có hoạt động nào
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {data.recentActivities.map((activity, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={activity.user.avatar || undefined} />
                            <AvatarFallback>
                              {activity.user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">
                              <span className="font-medium">{activity.user.name}</span>
                              {activity.type === 'lesson' ? (
                                activity.completed ? (
                                  <span className="text-green-600"> đã hoàn thành </span>
                                ) : (
                                  <span className="text-blue-600"> đang học </span>
                                )
                              ) : (
                                activity.passed ? (
                                  <span className="text-green-600"> đậu ({activity.score}đ) </span>
                                ) : (
                                  <span className="text-red-600"> trượt ({activity.score}đ) </span>
                                )
                              )}
                              <span className="text-muted-foreground truncate">
                                {activity.item.name}
                              </span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatTimeAgo(activity.timestamp)}
                            </p>
                          </div>
                          {activity.type === 'lesson' ? (
                            activity.completed ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                            ) : (
                              <Clock className="h-4 w-4 text-blue-600 shrink-0" />
                            )
                          ) : activity.passed ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/teacher/subjects">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="flex items-center gap-3 p-4">
                  <BookOpen className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-semibold">Môn học</p>
                    <p className="text-sm text-muted-foreground">Quản lý môn phụ trách</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/teacher/lessons">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="flex items-center gap-3 p-4">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="font-semibold">Bài học</p>
                    <p className="text-sm text-muted-foreground">Tạo & sửa bài học</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/teacher/exams">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="flex items-center gap-3 p-4">
                  <Award className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="font-semibold">Bài thi</p>
                    <p className="text-sm text-muted-foreground">Tạo & quản lý bài thi</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/teacher/questions">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="flex items-center gap-3 p-4">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="font-semibold">Hỏi đáp</p>
                    <p className="text-sm text-muted-foreground">Quản lý câu hỏi từ sinh viên</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
