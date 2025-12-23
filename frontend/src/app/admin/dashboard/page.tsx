'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users,
  GraduationCap,
  BookOpen,
  FileText,
  Award,
  TrendingUp,
  MessageSquare,
  HelpCircle
} from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import type { AdminStats } from '@/types';

export default function AdminDashboardPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (!authLoading && user && !isAdmin) {
      router.push('/dashboard');
    } else if (user && isAdmin) {
      loadStats();
    }
  }, [user, authLoading, isAdmin, router]);

  const loadStats = async () => {
    try {
      const response = await api.get<{ data: AdminStats }>('/admin/stats/overview');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
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

  if (!stats) return null;

  const StatCard = ({ title, value, icon: Icon, href, subtitle }: {
    title: string;
    value: number;
    icon: React.ElementType;
    href?: string;
    subtitle?: string;
  }) => {
    const content = (
      <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </CardContent>
      </Card>
    );

    return href ? <Link href={href}>{content}</Link> : content;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary/5 to-background">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Tổng quan hệ thống và quản lý
            </p>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Tổng quan</TabsTrigger>
              <TabsTrigger value="users">Người dùng</TabsTrigger>
              <TabsTrigger value="learning">Học tập</TabsTrigger>
              <TabsTrigger value="community">Cộng đồng</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid md:grid-cols-4 gap-6">
                <StatCard
                  title="Tổng người dùng"
                  value={stats.users.total}
                  icon={Users}
                  href="/admin/users"
                  subtitle={`+${stats.users.newThisWeek} tuần này`}
                />
                <StatCard
                  title="Ngành học"
                  value={stats.learning.majors}
                  icon={GraduationCap}
                  href="/admin/majors"
                />
                <StatCard
                  title="Môn học"
                  value={stats.learning.subjects}
                  icon={BookOpen}
                  href="/admin/subjects"
                />
                <StatCard
                  title="Bài học"
                  value={stats.learning.lessons}
                  icon={FileText}
                  href="/admin/lessons"
                />
                <StatCard
                  title="Bài thi"
                  value={stats.learning.exams}
                  icon={Award}
                  href="/admin/exams"
                />
                <StatCard
                  title="Ghi danh"
                  value={stats.learning.enrollments}
                  icon={TrendingUp}
                />
                <StatCard
                  title="Blog Posts"
                  value={stats.community.blogPosts}
                  icon={FileText}
                  href="/admin/blog"
                />
                <StatCard
                  title="Q&A"
                  value={stats.community.questions}
                  icon={HelpCircle}
                  href="/admin/questions"
                />
              </div>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-6">
              <div className="grid md:grid-cols-4 gap-6">
                <StatCard
                  title="Chờ duyệt"
                  value={stats.users.pending}
                  icon={Users}
                  href="/admin/users?status=PENDING"
                  subtitle="Cần xử lý"
                />
                <StatCard
                  title="Đang hoạt động"
                  value={stats.users.active}
                  icon={Users}
                  href="/admin/users?status=ACTIVE"
                />
                <StatCard
                  title="Bị khóa"
                  value={stats.users.deactive}
                  icon={Users}
                  href="/admin/users?status=DEACTIVE"
                />
                <StatCard
                  title="Mới tuần này"
                  value={stats.users.newThisWeek}
                  icon={TrendingUp}
                  subtitle="Người dùng mới"
                />
                <StatCard
                  title="Mới tháng này"
                  value={stats.users.newThisMonth}
                  icon={TrendingUp}
                  subtitle="Người dùng mới"
                />
              </div>
            </TabsContent>

            {/* Learning Tab */}
            <TabsContent value="learning" className="space-y-6">
              <div className="grid md:grid-cols-4 gap-6">
                <StatCard
                  title="Ngành học"
                  value={stats.learning.majors}
                  icon={GraduationCap}
                  href="/admin/majors"
                />
                <StatCard
                  title="Môn học"
                  value={stats.learning.subjects}
                  icon={BookOpen}
                  href="/admin/subjects"
                />
                <StatCard
                  title="Bài học"
                  value={stats.learning.lessons}
                  icon={FileText}
                  href="/admin/lessons"
                />
                <StatCard
                  title="Bài thi"
                  value={stats.learning.exams}
                  icon={Award}
                  href="/admin/exams"
                />
                <StatCard
                  title="Tổng ghi danh"
                  value={stats.learning.enrollments}
                  icon={TrendingUp}
                />
                <StatCard
                  title="Bài học hoàn thành"
                  value={stats.progress.completedLessons}
                  icon={BookOpen}
                />
                <StatCard
                  title="Tỷ lệ đỗ thi"
                  value={stats.progress.examPassRate}
                  icon={Award}
                  subtitle="%"
                />
              </div>
            </TabsContent>

            {/* Community Tab */}
            <TabsContent value="community" className="space-y-6">
              <div className="grid md:grid-cols-4 gap-6">
                <StatCard
                  title="Blog Posts"
                  value={stats.community.blogPosts}
                  icon={FileText}
                  href="/admin/blog"
                />
                <StatCard
                  title="Câu hỏi"
                  value={stats.community.questions}
                  icon={HelpCircle}
                  href="/admin/questions"
                />
                <StatCard
                  title="Câu trả lời"
                  value={stats.community.answers}
                  icon={MessageSquare}
                />
                <StatCard
                  title="Bình luận"
                  value={stats.community.comments}
                  icon={MessageSquare}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
