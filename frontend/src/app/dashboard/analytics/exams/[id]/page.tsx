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
  XCircle,
  Clock,
  Brain,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/layout/Header';

interface ExamAnalysis {
  attempt: {
    id: string;
    score: number;
    passed: boolean;
    startedAt: string;
    submittedAt: string;
  };
  exam: {
    id: string;
    name: string;
    subject: string;
    duration: number;
    passingScore: number;
  };
  summary: {
    totalQuestions: number;
    correctAnswers: number;
    maxScore: number;
    percentage: number;
  };
  byDifficulty: {
    easy: { total: number; correct: number; percent: number };
    medium: { total: number; correct: number; percent: number };
    hard: { total: number; correct: number; percent: number };
  };
  byType: {
    MULTIPLE_CHOICE: { total: number; correct: number };
    TRUE_FALSE: { total: number; correct: number };
    ESSAY: { total: number; correct: number };
  };
  questions: Array<{
    id: string;
    question: string;
    type: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    points: number;
    difficulty: string;
    options: string[] | null;
  }>;
  wrongQuestions: Array<{
    id: string;
    question: string;
    userAnswer: string;
    correctAnswer: string;
    difficulty: string;
  }>;
}

const difficultyLabels = {
  EASY: { label: 'Dễ', color: 'bg-green-500', emoji: '🟢' },
  MEDIUM: { label: 'Trung bình', color: 'bg-yellow-500', emoji: '🟡' },
  HARD: { label: 'Khó', color: 'bg-red-500', emoji: '🔴' }
};

const typeLabels = {
  MULTIPLE_CHOICE: 'Trắc nghiệm',
  TRUE_FALSE: 'Đúng/Sai',
  ESSAY: 'Tự luận'
};

export default function ExamAnalysisPage() {
  const params = useParams();
  const attemptId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<ExamAnalysis | null>(null);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [showAllQuestions, setShowAllQuestions] = useState(false);

  useEffect(() => {
    if (attemptId) {
      fetchAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId]);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      const response = await api.get<ExamAnalysis>(`/analytics/exam/${attemptId}`);
      setAnalysis(response);
    } catch (error) {
      console.error('Error fetching exam analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAIInsight = async () => {
    if (!analysis) return;
    
    setLoadingAI(true);
    try {
      const response = await api.post<{ insights: string }>('/analytics/ai-insights', {
        reportType: 'exam',
        reportData: {
          examName: analysis.exam.name,
          score: analysis.summary.correctAnswers,
          maxScore: analysis.summary.totalQuestions,
          percentage: analysis.summary.percentage,
          passed: analysis.attempt.passed,
          totalQuestions: analysis.summary.totalQuestions,
          correctAnswers: analysis.summary.correctAnswers,
          easyCorrect: analysis.byDifficulty.easy.correct,
          easyTotal: analysis.byDifficulty.easy.total,
          easyPercent: analysis.byDifficulty.easy.percent,
          mediumCorrect: analysis.byDifficulty.medium.correct,
          mediumTotal: analysis.byDifficulty.medium.total,
          mediumPercent: analysis.byDifficulty.medium.percent,
          hardCorrect: analysis.byDifficulty.hard.correct,
          hardTotal: analysis.byDifficulty.hard.total,
          hardPercent: analysis.byDifficulty.hard.percent
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

  if (!analysis) {
    return (
      <div className="container max-w-5xl py-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Không tìm thấy bài thi</h3>
            <Link href="/dashboard/analytics">
              <Button>Quay lại</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const timeTaken = analysis.attempt.submittedAt && analysis.attempt.startedAt
    ? Math.round((new Date(analysis.attempt.submittedAt).getTime() - new Date(analysis.attempt.startedAt).getTime()) / 60000)
    : 0;

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
              <h1 className="text-2xl font-bold">📝 Phân tích bài thi</h1>
              <p className="text-muted-foreground">{analysis.exam.name}</p>
            </div>
          </div>

          {/* Score Card */}
          <Card className={analysis.attempt.passed ? 'border-green-500/50' : 'border-red-500/50'}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Badge 
                    variant={analysis.attempt.passed ? 'default' : 'destructive'}
                    className="mb-2"
                  >
                {analysis.attempt.passed ? '✓ ĐẬU' : '✗ CHƯA ĐẠT'}
              </Badge>
              <h2 className="text-4xl font-bold">{analysis.summary.percentage}%</h2>
              <p className="text-muted-foreground">
                {analysis.summary.correctAnswers}/{analysis.summary.totalQuestions} câu đúng
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Môn học</p>
              <p className="font-semibold">{analysis.exam.subject}</p>
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{timeTaken} phút</span>
              </div>
            </div>
          </div>
          <Progress 
            value={analysis.summary.percentage} 
            className="mt-4 h-3"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Điểm đạt: {analysis.exam.passingScore}% • 
            Nộp lúc: {new Date(analysis.attempt.submittedAt).toLocaleString('vi-VN')}
          </p>
        </CardContent>
      </Card>

      {/* Analysis by Difficulty */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Phân tích theo độ khó</CardTitle>
          <CardDescription>Kết quả theo từng mức độ câu hỏi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Easy */}
            <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-900/10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🟢</span>
                <span className="font-semibold">Dễ</span>
              </div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {analysis.byDifficulty.easy.correct}/{analysis.byDifficulty.easy.total}
              </p>
              <Progress 
                value={analysis.byDifficulty.easy.percent} 
                className="mt-2 h-2"
              />
              <p className="text-sm text-muted-foreground mt-1">
                {analysis.byDifficulty.easy.percent}% chính xác
              </p>
            </div>

            {/* Medium */}
            <div className="p-4 rounded-lg border bg-yellow-50 dark:bg-yellow-900/10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🟡</span>
                <span className="font-semibold">Trung bình</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {analysis.byDifficulty.medium.correct}/{analysis.byDifficulty.medium.total}
              </p>
              <Progress 
                value={analysis.byDifficulty.medium.percent} 
                className="mt-2 h-2"
              />
              <p className="text-sm text-muted-foreground mt-1">
                {analysis.byDifficulty.medium.percent}% chính xác
              </p>
            </div>

            {/* Hard */}
            <div className="p-4 rounded-lg border bg-red-50 dark:bg-red-900/10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🔴</span>
                <span className="font-semibold">Khó</span>
              </div>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {analysis.byDifficulty.hard.correct}/{analysis.byDifficulty.hard.total}
              </p>
              <Progress 
                value={analysis.byDifficulty.hard.percent} 
                className="mt-2 h-2"
              />
              <p className="text-sm text-muted-foreground mt-1">
                {analysis.byDifficulty.hard.percent}% chính xác
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis by Type */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Phân tích theo loại câu hỏi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(analysis.byType).map(([type, data]) => {
              if (data.total === 0) return null;
              const percent = Math.round((data.correct / data.total) * 100);
              return (
                <div key={type} className="flex items-center gap-4">
                  <div className="w-32 text-sm font-medium">
                    {typeLabels[type as keyof typeof typeLabels]}
                  </div>
                  <div className="flex-1">
                    <Progress value={percent} className="h-2" />
                  </div>
                  <div className="w-20 text-right text-sm">
                    {data.correct}/{data.total} ({percent}%)
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Wrong Questions */}
      {analysis.wrongQuestions.length > 0 && (
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <XCircle className="h-5 w-5" />
              Câu trả lời sai ({analysis.wrongQuestions.length})
            </CardTitle>
            <CardDescription>Các câu bạn cần ôn lại</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysis.wrongQuestions.map((q, index) => (
                <div key={q.id} className="p-4 rounded-lg border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-900/10">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium mb-2">{q.question}</p>
                      <div className="space-y-1 text-sm">
                        <p className="text-red-600 dark:text-red-400">
                          ✗ Bạn chọn: {q.userAnswer || '(Không trả lời)'}
                        </p>
                        <p className="text-green-600 dark:text-green-400">
                          ✓ Đáp án đúng: {q.correctAnswer}
                        </p>
                      </div>
                      <Badge variant="outline" className="mt-2">
                        {difficultyLabels[q.difficulty as keyof typeof difficultyLabels]?.emoji}{' '}
                        {difficultyLabels[q.difficulty as keyof typeof difficultyLabels]?.label}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Questions (Collapsible) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Tất cả câu hỏi ({analysis.questions.length})
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowAllQuestions(!showAllQuestions)}
            >
              {showAllQuestions ? 'Thu gọn' : 'Xem tất cả'}
            </Button>
          </div>
        </CardHeader>
        {showAllQuestions && (
          <CardContent>
            <div className="space-y-3">
              {analysis.questions.map((q, index) => (
                <div 
                  key={q.id}
                  className={`p-3 rounded-lg border ${
                    q.isCorrect 
                      ? 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-900/10' 
                      : 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-900/10'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {q.isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Câu {index + 1}: {q.question}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Bạn chọn: {q.userAnswer || '(Không trả lời)'} • 
                        Đáp án: {q.correctAnswer}
                      </p>
                    </div>
                    <Badge variant="outline" className="flex-shrink-0">
                      {difficultyLabels[q.difficulty as keyof typeof difficultyLabels]?.emoji}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* AI Insights */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Phân tích bài thi
          </CardTitle>
          <CardDescription>
            Gợi ý cải thiện từ LearnHub AI
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
                    Lấy phân tích AI
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
