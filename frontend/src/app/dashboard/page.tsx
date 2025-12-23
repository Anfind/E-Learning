'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  Award, 
  TrendingUp, 
  GraduationCap, 
  Clock,
  PlayCircle,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import type { DashboardOverview, Major } from '@/types';
import { getUploadUrl } from '@/lib/api';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<DashboardOverview | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user?.role === 'ADMIN') {
      router.push('/admin/dashboard');
    } else if (user) {
      loadDashboard();
    }
  }, [user, authLoading, router]);

  const loadDashboard = async () => {
    try {
      const response = await api.get<{ data: DashboardOverview }>('/dashboard/overview');
      setDashboard(response.data);
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
          <div className="space-y-8">
            <Skeleton className="h-12 w-64" />
            <div className="grid md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!dashboard) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Xin chào, {user?.name}! 👋
            </h1>
            <p className="text-gray-600 text-lg">
              Chào mừng bạn quay trở lại với Learning Platform
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:shadow-xl transition-all hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-50">Ngành học</CardTitle>
                <GraduationCap className="h-5 w-5 text-blue-100" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{dashboard.enrolledMajors}</div>
                <p className="text-xs text-blue-100">Đã ghi danh</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white hover:shadow-xl transition-all hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-50">Bài học</CardTitle>
                <BookOpen className="h-5 w-5 text-green-100" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{dashboard.completedLessons}</div>
                <p className="text-xs text-green-100">Đã hoàn thành</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white hover:shadow-xl transition-all hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-amber-50">Bài thi</CardTitle>
                <Award className="h-5 w-5 text-amber-100" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{dashboard.passedExams}</div>
                <p className="text-xs text-amber-100">Đã đỗ</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white hover:shadow-xl transition-all hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-50">Đang học</CardTitle>
                <TrendingUp className="h-5 w-5 text-purple-100" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{dashboard.inProgressLessons}</div>
                <p className="text-xs text-purple-100">Bài học</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Enrolled Majors */}
            <div className="lg:col-span-2">
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl">Ngành học của bạn</CardTitle>
                      <CardDescription className="text-base">Các ngành học bạn đã ghi danh</CardDescription>
                    </div>
                    <Link href="/majors">
                      <Button variant="outline" size="sm" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 hover:from-blue-600 hover:to-purple-600">
                        Xem tất cả
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {dashboard.majors.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 mb-4">
                        <GraduationCap className="h-10 w-10 text-blue-600" />
                      </div>
                      <p className="text-gray-600 mb-4 text-lg">
                        Bạn chưa ghi danh ngành học nào
                      </p>
                      <Link href="/majors">
                        <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                          Khám phá ngành học
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {dashboard.majors.map((major: Major) => (
                        <Link key={major.id} href={`/majors/${major.id}`}>
                          <div className="flex items-center space-x-4 p-4 rounded-xl border-2 border-gray-100 hover:border-blue-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all cursor-pointer group">
                            {major.imageUrl && (
                              <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 shadow-md group-hover:shadow-lg transition-shadow">
                                <Image
                                  src={getUploadUrl(major.imageUrl)}
                                  alt={major.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1">
                              <h3 className="font-bold text-lg text-gray-800 group-hover:text-blue-600 transition-colors">{major.name}</h3>
                              <p className="text-sm text-gray-600 line-clamp-1">
                                {major.description}
                              </p>
                            </div>
                            <ArrowRight className="h-6 w-6 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Activities */}
            <div className="lg:col-span-1">
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-2xl">Hoạt động gần đây</CardTitle>
                  <CardDescription className="text-base">Tiến trình học tập của bạn</CardDescription>
                </CardHeader>
                <CardContent>
                  {dashboard.recentActivities.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 mb-3">
                        <Clock className="h-8 w-8 text-gray-500" />
                      </div>
                      <p className="text-sm text-gray-600">
                        Chưa có hoạt động nào
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {dashboard.recentActivities.map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className={`mt-1 rounded-full p-2 shadow-sm ${
                            activity.type === 'lesson' 
                              ? 'bg-gradient-to-br from-blue-400 to-blue-500' 
                              : 'bg-gradient-to-br from-green-400 to-emerald-500'
                          }`}>
                            {activity.type === 'lesson' ? (
                              <PlayCircle className="h-4 w-4 text-white" />
                            ) : (
                              <Award className="h-4 w-4 text-white" />
                            )}
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-semibold text-gray-800">{activity.name}</p>
                            <p className="text-xs text-gray-500">
                              {activity.subjectName}
                            </p>
                            {activity.type === 'lesson' && activity.progress !== undefined && (
                              <Progress value={activity.progress} className="h-2 bg-gray-200" />
                            )}
                            {activity.type === 'exam' && activity.score !== undefined && (
                              <Badge 
                                variant={activity.passed ? 'default' : 'destructive'}
                                className={activity.passed 
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                                  : 'bg-gradient-to-r from-red-500 to-pink-500'
                                }
                              >
                                {activity.score}%
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
