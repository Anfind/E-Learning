'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ChevronLeft,
  CheckCircle,
  BookOpen,
  Award,
  Brain,
  RefreshCw,
  Sparkles,
  FileText,
  Calendar,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/layout/Header';

interface SubjectProgress {
  subject: {
    id: string;
    name: string;
    description: string;
    totalLessons: number;
    totalExams: number;
  };
  lessons: {
    total: number;
    completed: number;
    percent: number;
    list: Array<{
      id: string;
      title: string;
      completed: boolean;
      completedAt: string | null;
      order: number;
    }>;
  };
  exams: {
    total: number;
    passed: number;
    avgScore: number;
    list: Array<{
      attemptId: string;
      examName: string;
      score: number;
      passed: boolean;
      submittedAt: string;
    }>;
  };
  timeline: Array<{
    date: string;
    lessonsCompleted: number;
    examsCompleted: number;
    examsPassed: number;
  }>;
  estimatedCompletion: string | null;
  lastActivity: string | null;
}

export default function SubjectProgressPage() {
  const params = useParams();
  const subjectId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<SubjectProgress | null>(null);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    if (subjectId) {
      fetchProgress();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId]);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const response = await api.get<SubjectProgress>(`/analytics/subject/${subjectId}`);
      setProgress(response);
    } catch (error) {
      console.error('Error fetching subject progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAIInsight = async () => {
    if (!progress) return;

    setLoadingAI(true);
    try {
      const response = await api.post<{ insights: string }>('/analytics/ai-insights', {
        reportType: 'subject',
        reportData: {
          subjectName: progress.subject.name,
          lessonsCompleted: progress.lessons.completed,
          totalLessons: progress.lessons.total,
          lessonPercent: progress.lessons.percent,
          examsPassed: progress.exams.passed,
          totalExams: progress.exams.total,
          avgScore: progress.exams.avgScore,
          estimatedCompletion: progress.estimatedCompletion
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
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="container max-w-5xl py-6">
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Không tìm thấy môn học</h3>
            <Link href="/dashboard/analytics">
              <Button>Quay lại</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="flex-1">
        <div className="container max-w-5xl py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link href="/dashboard/analytics">
              <Button variant="ghost" size="icon">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">📚 {progress.subject.name}</h1>
              <p className="text-muted-foreground line-clamp-1">
                {progress.subject.description || 'Tiến trình học tập'}
              </p>
            </div>
          </div>

          {/* Overview Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Lessons Progress */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Bài học</p>
                    <p className="text-2xl font-bold">
                      {progress.lessons.completed}/{progress.lessons.total}
                    </p>
                  </div>
                </div>
                <Progress value={progress.lessons.percent} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {progress.lessons.percent}% hoàn thành
                </p>
              </CardContent>
            </Card>

            {/* Exams Progress */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                    <Award className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Bài thi đã qua</p>
                    <p className="text-2xl font-bold">
                      {progress.exams.passed}/{progress.exams.total}
                    </p>
                  </div>
                </div>
                <Progress 
                  value={progress.exams.total > 0 ? (progress.exams.passed / progress.exams.total) * 100 : 0} 
                  className="h-2" 
            />
            <p className="text-xs text-muted-foreground mt-2">
              Điểm TB: {progress.exams.avgScore}%
            </p>
          </CardContent>
        </Card>

        {/* Estimated Completion */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dự kiến hoàn thành</p>
                <p className="text-xl font-bold">
                  {progress.estimatedCompletion 
                    ? new Date(progress.estimatedCompletion).toLocaleDateString('vi-VN')
                    : 'Chưa xác định'}
                </p>
              </div>
            </div>
            {progress.lastActivity && (
              <p className="text-xs text-muted-foreground">
                Hoạt động gần nhất: {new Date(progress.lastActivity).toLocaleDateString('vi-VN')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lessons List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Danh sách bài học
          </CardTitle>
          <CardDescription>
            {progress.lessons.completed} / {progress.lessons.total} bài học đã hoàn thành
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {progress.lessons.list
              .sort((a, b) => a.order - b.order)
              .map((lesson, index) => (
                <div
                  key={lesson.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    lesson.completed
                      ? 'bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-900'
                      : 'bg-muted/30'
                  }`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    lesson.completed
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : 'bg-muted'
                  }`}>
                    {lesson.completed ? (
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <span className="text-sm text-muted-foreground">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${lesson.completed ? '' : 'text-muted-foreground'}`}>
                      {lesson.title}
                    </p>
                    {lesson.completedAt && (
                      <p className="text-xs text-muted-foreground">
                        Hoàn thành: {new Date(lesson.completedAt).toLocaleDateString('vi-VN')}
                      </p>
                    )}
                  </div>
                  {lesson.completed && (
                    <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      Đã học
                    </Badge>
                  )}
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Exams History */}
      {progress.exams.list.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Lịch sử thi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {progress.exams.list.map((exam) => (
                <Link
                  key={exam.attemptId}
                  href={`/dashboard/analytics/exams/${exam.attemptId}`}
                  className="block"
                >
                  <div className={`p-4 rounded-lg border hover:shadow-md transition-shadow ${
                    exam.passed
                      ? 'border-green-200 dark:border-green-900'
                      : 'border-red-200 dark:border-red-900'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{exam.examName}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(exam.submittedAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${
                          exam.passed ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {exam.score}%
                        </p>
                        <Badge variant={exam.passed ? 'default' : 'destructive'}>
                          {exam.passed ? 'Đậu' : 'Chưa đạt'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      {progress.timeline.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tiến trình theo thời gian
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
              
              <div className="space-y-4">
                {progress.timeline.map((day) => (
                  <div key={day.date} className="relative flex items-start gap-4 pl-10">
                    {/* Timeline dot */}
                    <div className="absolute left-2.5 w-3 h-3 rounded-full bg-primary" />
                    
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {new Date(day.date).toLocaleDateString('vi-VN', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long'
                        })}
                      </p>
                      <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                        {day.lessonsCompleted > 0 && (
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {day.lessonsCompleted} bài học
                          </span>
                        )}
                        {day.examsCompleted > 0 && (
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {day.examsCompleted} bài thi ({day.examsPassed} đậu)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Insights */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Đánh giá môn học
          </CardTitle>
          <CardDescription>
            Gợi ý học tập từ LearnHub AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          {aiInsight ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap">{aiInsight}</p>
            </div>
          ) : (
            <div className="text-center py-4">
              <Button onClick={fetchAIInsight} disabled={loadingAI}>
                {loadingAI ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Đang phân tích...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Lấy đánh giá AI
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
        </div>
      </main>
    </div>
  );
}
