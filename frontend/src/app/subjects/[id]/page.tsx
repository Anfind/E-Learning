'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { api, getUploadUrl } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play,
  CheckCircle2,
  Lock,
  Clock,
  Award,
  BookOpen,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import type { Subject, Lesson, Exam } from '@/types';

export default function SubjectDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const subjectId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user && subjectId) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, subjectId, router]);

  const loadData = async () => {
    try {
      const subjectRes = await api.get<{ data: Subject & { lessons: Lesson[], exams: Exam[] } }>(`/subjects/${subjectId}`);
      setSubject(subjectRes.data);
      setLessons(subjectRes.data.lessons || []);
      setExams(subjectRes.data.exams || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      router.push('/majors');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading || !subject) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div>Loading...</div>
        </main>
      </div>
    );
  }

  const completedLessons = lessons.filter(l => l.progress?.completed).length;
  const progressPercent = lessons.length > 0 ? Math.round((completedLessons / lessons.length) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-50 via-emerald-50 to-white">
      <Header />
      <main className="flex-1">
        {/* Hero Section with Gradient */}
        <div className="relative h-80 w-full bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-10 right-10 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl"></div>
          
          {subject.imageUrl && (
            <Image
              src={getUploadUrl(subject.imageUrl)}
              alt={subject.name}
              fill
              className="object-cover opacity-10"
            />
          )}
          
          <div className="absolute inset-0 flex items-center">
            <div className="container mx-auto px-4">
              <Link
                href={`/majors/${subject.majorId}`}
                className="inline-flex items-center text-white/90 hover:text-white mb-6 transition-all hover:gap-3 gap-2 font-medium"
              >
                <ArrowLeft className="h-5 w-5" />
                Quay lại ngành học
              </Link>
              <div className="flex items-start gap-6">
                <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm">
                  <BookOpen className="h-14 w-14 text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
                    {subject.name}
                  </h1>
                  <p className="text-xl text-white/95 max-w-3xl leading-relaxed">
                    {subject.description || 'Chưa có mô tả'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 -mt-16 pb-12">
          {/* Progress Overview Card - Floating */}
          <Card className="mb-8 shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    Tiến độ học tập
                  </h3>
                  <p className="text-base text-gray-600 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    {completedLessons}/{lessons.length} bài học hoàn thành
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-5xl font-bold bg-gradient-to-br from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {progressPercent}%
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Hoàn thành</p>
                </div>
              </div>
              <Progress value={progressPercent} className="h-4 bg-green-100" />
            </CardContent>
          </Card>

          {/* Tabs: Lessons & Exams */}
          <Tabs defaultValue="lessons" className="space-y-8">
            <TabsList className="grid w-full max-w-lg grid-cols-2 h-14 bg-gradient-to-r from-green-100 to-emerald-100 p-1.5">
              <TabsTrigger 
                value="lessons"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-base font-semibold"
              >
                <BookOpen className="mr-2 h-5 w-5" />
                Bài học ({lessons.length})
              </TabsTrigger>
              <TabsTrigger 
                value="exams"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg text-base font-semibold"
              >
                <Award className="mr-2 h-5 w-5" />
                Bài thi ({exams.length})
              </TabsTrigger>
            </TabsList>

            {/* Lessons Tab */}
            <TabsContent value="lessons" className="space-y-5">
              {lessons.length === 0 ? (
                <Card className="p-16 border-2 border-dashed border-gray-200 bg-gradient-to-br from-green-50 to-emerald-50">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-6">
                      <BookOpen className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-gray-800">Chưa có bài học</h3>
                    <p className="text-gray-600">Môn học này chưa có bài học nào</p>
                  </div>
                </Card>
              ) : (
                lessons.map((lesson, index) => {
                  const progress = lesson.progress;
                  const isCompleted = progress?.completed ?? false;
                  const isLocked = progress?.isLocked ?? false;
                  const watchPercent = progress?.percentComplete ?? 0;

                  return (
                    <Card
                      key={lesson.id}
                      className={`border-2 transition-all duration-300 overflow-hidden ${
                        isLocked 
                          ? 'opacity-60 bg-gray-50' 
                          : 'hover:shadow-2xl hover:scale-[1.01] cursor-pointer border-green-100 hover:border-green-300'
                      }`}
                    >
                      <Link
                        href={isLocked ? '#' : `/lessons/${lesson.id}`}
                        onClick={(e) => isLocked && e.preventDefault()}
                      >
                        <CardContent className="p-7">
                          <div className="flex items-start gap-6">
                            {/* Order Number - Colorful */}
                            <div
                              className={`flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg ${
                                isCompleted
                                  ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
                                  : isLocked
                                  ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700'
                                  : 'bg-gradient-to-br from-green-600 to-emerald-600 text-white'
                              }`}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="h-8 w-8" />
                              ) : isLocked ? (
                                <Lock className="h-7 w-7" />
                              ) : (
                                index + 1
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-4 mb-3">
                                <div>
                                  <h3 className="text-2xl font-bold mb-2 flex items-center gap-3 text-gray-800">
                                    {lesson.name}
                                    {isCompleted && (
                                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 px-3 py-1">
                                        <CheckCircle2 className="mr-1 h-4 w-4" />
                                        Hoàn thành
                                      </Badge>
                                    )}
                                    {isLocked && (
                                      <Badge className="bg-gradient-to-r from-gray-400 to-gray-500 text-white border-0 px-3 py-1">
                                        <Lock className="mr-1 h-4 w-4" />
                                        Chưa mở
                                      </Badge>
                                    )}
                                  </h3>
                                  <p className="text-base text-gray-600 line-clamp-2 leading-relaxed">
                                    {lesson.description || 'Chưa có mô tả'}
                                  </p>
                                </div>
                                {!isLocked && (
                                  <Button 
                                    size="lg"
                                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg px-6"
                                  >
                                    <Play className="mr-2 h-5 w-5" />
                                    {isCompleted ? 'Xem lại' : 'Học ngay'}
                                  </Button>
                                )}
                              </div>

                              {/* Stats */}
                              <div className="flex items-center gap-6 mb-4 text-sm text-gray-600">
                                <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full">
                                  <Clock className="h-4 w-4 text-green-600" />
                                  <span className="font-medium">{lesson.duration} phút</span>
                                </div>
                                {lesson.videoUrl && (
                                  <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full">
                                    <Play className="h-4 w-4 text-emerald-600" />
                                    <span className="font-medium">Video bài giảng</span>
                                  </div>
                                )}
                              </div>

                              {/* Progress Bar */}
                              {progress && !isLocked && !isCompleted && (
                                <div className="space-y-2 bg-green-50 p-4 rounded-xl">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-700 font-medium">
                                      Đã xem {progress.watchTime}/{lesson.duration} phút
                                    </span>
                                    <span className="font-bold text-green-600">{watchPercent}%</span>
                                  </div>
                                  <Progress value={watchPercent} className="h-2.5 bg-green-200" />
                                </div>
                              )}

                              {isLocked && progress?.lockedReason && (
                                <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-r-lg">
                                  <p className="text-sm text-amber-800 font-medium">{progress.lockedReason}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Link>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            {/* Exams Tab */}
            <TabsContent value="exams" className="space-y-5">
              {exams.length === 0 ? (
                <Card className="p-16 border-2 border-dashed border-gray-200 bg-gradient-to-br from-orange-50 to-red-50">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center mx-auto mb-6">
                      <Award className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-gray-800">Chưa có bài thi</h3>
                    <p className="text-gray-600">Môn học này chưa có bài thi nào</p>
                  </div>
                </Card>
              ) : (
                exams.map((exam) => (
                  <Card
                    key={exam.id}
                    className="border-2 border-orange-100 hover:border-orange-300 hover:shadow-2xl transition-all duration-300 cursor-pointer hover:scale-[1.01] overflow-hidden"
                  >
                    <Link href={`/exams/${exam.id}`}>
                      <CardContent className="p-7">
                        <div className="flex items-start gap-6">
                          {/* Icon - Colorful Gradient */}
                          <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 text-white flex items-center justify-center shadow-lg">
                            <Award className="h-8 w-8" />
                          </div>

                          {/* Content */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div>
                                <h3 className="text-2xl font-bold mb-2 flex items-center gap-3 text-gray-800">
                                  {exam.name}
                                  {exam.isRequired && (
                                    <Badge className="bg-gradient-to-r from-red-500 to-rose-600 text-white border-0 px-3 py-1">
                                      Bắt buộc
                                    </Badge>
                                  )}
                                </h3>
                                <p className="text-base text-gray-600 line-clamp-2 leading-relaxed">
                                  {exam.description || 'Chưa có mô tả'}
                                </p>
                              </div>
                              <Button 
                                size="lg" 
                                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg px-6"
                              >
                                <Play className="mr-2 h-5 w-5" />
                                Làm bài
                              </Button>
                            </div>

                            {/* Stats - Colorful Pills */}
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-full">
                                <Clock className="h-4 w-4 text-orange-600" />
                                <span className="font-medium text-gray-700">{exam.duration} phút</span>
                              </div>
                              <div className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-full">
                                <Award className="h-4 w-4 text-red-600" />
                                <span className="font-medium text-gray-700">Điểm đạt: {exam.passingScore}%</span>
                              </div>
                              {exam.questions && (
                                <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-full">
                                  <BookOpen className="h-4 w-4 text-amber-600" />
                                  <span className="font-medium text-gray-700">{exam.questions.length} câu hỏi</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
