'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  XCircle,
  Trophy,
  Target,
  ArrowLeft,
  RotateCcw,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import type { ExamResult } from '@/types';
import { toast } from 'sonner';

export default function ExamResultPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;
  const attemptId = params.attemptId as string;

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ExamResult | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      loadResult();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, examId, attemptId]);

  const loadResult = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ data: ExamResult }>(`/exams/attempts/${attemptId}/result`);
      setResult(response.data);
    } catch (error) {
      console.error('Failed to load result:', error);
      toast.error('Không thể tải kết quả');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    router.push(`/exams/${examId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary/5 to-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Đang tải kết quả...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const passed = result.passed;
  const scorePercentage = result.score;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary/5 to-background">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Về trang chủ
          </Button>

          {/* Result Header */}
          <Card className="mb-6">
            <CardContent className="pt-12 pb-8 text-center">
              <div className="mb-6">
                {passed ? (
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100">
                    <Trophy className="h-12 w-12 text-green-600" />
                  </div>
                ) : (
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-100">
                    <XCircle className="h-12 w-12 text-red-600" />
                  </div>
                )}
              </div>
              <h1 className="text-4xl font-bold mb-2">
                {passed ? 'Chúc mừng! Bạn đã đạt' : 'Chưa đạt yêu cầu'}
              </h1>
              <p className="text-muted-foreground mb-8">
                {passed
                  ? 'Bạn đã hoàn thành bài thi với kết quả xuất sắc'
                  : 'Đừng nản chí! Hãy ôn tập và thử lại'}
              </p>

              <div className="grid md:grid-cols-3 gap-6 max-w-2xl mx-auto">
                {/* Score */}
                <div className="p-6 bg-muted rounded-lg">
                  <Target className="h-8 w-8 text-primary mx-auto mb-3" />
                  <div className="text-3xl font-bold mb-1">{scorePercentage.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">Điểm số</div>
                </div>

                {/* Points */}
                <div className="p-6 bg-muted rounded-lg">
                  <Trophy className="h-8 w-8 text-primary mx-auto mb-3" />
                  <div className="text-3xl font-bold mb-1">
                    {result.totalScore}/{result.maxScore}
                  </div>
                  <div className="text-sm text-muted-foreground">Điểm đạt được</div>
                </div>

                {/* Passing Score */}
                <div className="p-6 bg-muted rounded-lg">
                  <CheckCircle2 className="h-8 w-8 text-primary mx-auto mb-3" />
                  <div className="text-3xl font-bold mb-1">{result.passingScore}%</div>
                  <div className="text-sm text-muted-foreground">Điểm cần đạt</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Results */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Chi tiết kết quả</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.results.map((item, index) => {
                const isCorrect = item.isCorrect;
                return (
                  <div
                    key={item.questionId}
                    className={`p-6 border-2 rounded-lg ${
                      isCorrect ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'
                    }`}
                  >
                    {/* Question Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline">Câu {index + 1}</Badge>
                          {isCorrect ? (
                            <Badge variant="default" className="bg-green-600">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Đúng
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="mr-1 h-3 w-3" />
                              Sai
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-medium text-lg">{item.question}</h3>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-2xl font-bold">
                          {item.points}/{item.maxPoints}
                        </div>
                        <div className="text-xs text-muted-foreground">điểm</div>
                      </div>
                    </div>

                    {/* Answers */}
                    <div className="space-y-3">
                      {/* User Answer */}
                      <div className="p-4 bg-background rounded-lg">
                        <div className="text-sm font-medium text-muted-foreground mb-1">
                          Câu trả lời của bạn:
                        </div>
                        <div className={isCorrect ? 'text-green-700' : 'text-red-700'}>
                          {item.userAnswer || <span className="italic">Chưa trả lời</span>}
                        </div>
                      </div>

                      {/* Correct Answer */}
                      {!isCorrect && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="text-sm font-medium text-green-700 mb-1">
                            Đáp án đúng:
                          </div>
                          <div className="text-green-900 font-medium">{item.correctAnswer}</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-4">
            <Button variant="outline" onClick={() => router.push('/dashboard')} size="lg">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Về trang chủ
            </Button>
            {!passed && (
              <Button onClick={handleRetry} size="lg">
                <RotateCcw className="mr-2 h-5 w-5" />
                Làm lại
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
