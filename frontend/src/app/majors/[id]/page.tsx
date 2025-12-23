'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BookOpen,
  CheckCircle2,
  Lock,
  ArrowRight,
  Clock,
  Play
} from 'lucide-react';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import type { Major, Subject } from '@/types';
import { getUploadUrl } from '@/lib/api';

export default function MajorDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const majorId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [major, setMajor] = useState<Major | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const loadData = async () => {
    try {
      const majorRes = await api.get<{ data: Major & { subjects: Subject[] } }>(`/majors/${majorId}`);
      setMajor(majorRes.data);
      setSubjects(majorRes.data.subjects || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      router.push('/majors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user && majorId) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, majorId, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-64 w-full mb-8" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!major) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative h-72 w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 overflow-hidden">
          {major.imageUrl && (
            <Image
              src={getUploadUrl(major.imageUrl)}
              alt={major.name}
              fill
              className="object-cover opacity-20"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30"></div>
          <div className="absolute inset-0 flex items-center">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl">
                <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">{major.name}</h1>
                <p className="text-xl text-white/95 leading-relaxed drop-shadow-md">
                  {major.description || 'Chưa có mô tả'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-8 -mt-12 relative z-10">
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-gray-600">Môn học</CardTitle>
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  {subjects.length}
                </div>
                <p className="text-xs text-gray-500 mt-1">Tổng môn học</p>
              </CardContent>
            </Card>
            
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-gray-600">Hoàn thành</CardTitle>
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {subjects.filter(s => s.userProgress?.completedLessons === s.userProgress?.totalLessons).length}
                </div>
                <p className="text-xs text-gray-500 mt-1">Đã hoàn thành</p>
              </CardContent>
            </Card>
            
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-gray-600">Đang học</CardTitle>
                <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600">
                  <Play className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  {subjects.filter(s => (s.userProgress?.completedLessons || 0) > 0 && 
                    s.userProgress?.completedLessons !== s.userProgress?.totalLessons).length}
                </div>
                <p className="text-xs text-gray-500 mt-1">Đang tiến hành</p>
              </CardContent>
            </Card>
          </div>

          {/* Subjects List */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Danh sách môn học
              </h2>
            </div>
            
            {subjects.length === 0 ? (
              <Card className="p-12 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <div className="text-center">
                  <div className="inline-flex p-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 mb-4">
                    <BookOpen className="h-16 w-16 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2 text-gray-800">Chưa có môn học</h3>
                  <p className="text-gray-600">
                    Ngành học này chưa có môn học nào
                  </p>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {subjects.map((subject) => {
                  const progress = subject.userProgress;
                  const isLocked = progress?.isLocked ?? false;
                  const completed = progress?.completedLessons === progress?.totalLessons;
                  const progressPercent = progress?.totalLessons 
                    ? Math.round((progress.completedLessons / progress.totalLessons) * 100)
                    : 0;

                  return (
                    <Card 
                      key={subject.id} 
                      className={`shadow-lg border-0 transition-all bg-white/80 backdrop-blur-sm ${
                        isLocked 
                          ? 'opacity-60' 
                          : 'hover:shadow-2xl hover:scale-[1.02] cursor-pointer'
                      }`}
                      onClick={(e) => {
                        if (!isLocked && !(e.target as HTMLElement).closest('button')) {
                          router.push(`/subjects/${subject.id}`);
                        }
                      }}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          {/* Image */}
                          {subject.imageUrl ? (
                            <div className="relative w-28 h-28 rounded-2xl overflow-hidden shadow-lg flex-shrink-0 ring-4 ring-purple-100">
                              <Image
                                src={getUploadUrl(subject.imageUrl)}
                                alt={subject.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 shadow-lg flex items-center justify-center flex-shrink-0">
                              <BookOpen className="h-12 w-12 text-white" />
                            </div>
                          )}

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div>
                                <h3 className="text-2xl font-bold mb-2 flex items-center gap-2 text-gray-800">
                                  {subject.name}
                                  {completed && (
                                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">
                                      <CheckCircle2 className="mr-1 h-3 w-3" />
                                      Hoàn thành
                                    </Badge>
                                  )}
                                  {isLocked && (
                                    <Badge className="bg-gradient-to-r from-gray-400 to-gray-500 text-white border-0">
                                      <Lock className="mr-1 h-3 w-3" />
                                      Chưa mở
                                    </Badge>
                                  )}
                                </h3>
                                <p className="text-sm text-gray-600 line-clamp-2">
                                  {subject.description || 'Chưa có mô tả'}
                                </p>
                              </div>
                              {!isLocked && (
                                <Button 
                                  className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    router.push(`/subjects/${subject.id}`);
                                  }}
                                >
                                  Học ngay
                                  <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                              )}
                            </div>

                            {/* Prerequisite */}
                            {subject.prerequisite && (
                              <div className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-3 flex items-center border border-amber-200">
                                <Lock className="mr-2 h-4 w-4" />
                                <span className="font-medium">Yêu cầu:</span>
                                <span className="ml-1">{subject.prerequisite.name}</span>
                              </div>
                            )}

                            {/* Progress */}
                            {progress && !isLocked && (
                              <div className="space-y-2 mb-3">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600 font-medium">
                                    {progress.completedLessons}/{progress.totalLessons} bài học
                                  </span>
                                  <span className="font-bold text-purple-600">{progressPercent}%</span>
                                </div>
                                <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-purple-500 to-pink-600 transition-all duration-500 rounded-full"
                                    style={{ width: `${progressPercent}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}
                            
                            {isLocked && progress?.lockedReason && (
                              <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-3 border border-amber-200">
                                ⚠️ {progress.lockedReason}
                              </p>
                            )}

                            {/* Stats */}
                            <div className="flex items-center gap-6 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-blue-100">
                                  <BookOpen className="h-4 w-4 text-blue-600" />
                                </div>
                                <span className="font-medium">{subject._count?.lessons || 0} bài học</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-orange-100">
                                  <Clock className="h-4 w-4 text-orange-600" />
                                </div>
                                <span className="font-medium">{subject._count?.exams || 0} bài thi</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
