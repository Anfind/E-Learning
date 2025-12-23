'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import Countdown from 'react-countdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Info,
  Send,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import FaceVerificationModal from '@/components/face/FaceVerificationModal';
import type { Exam, ExamQuestion } from '@/types';
import { toast } from 'sonner';

export default function ExamTakingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [attemptId, setAttemptId] = useState<string>('');

  // Exam states
  const [started, setStarted] = useState(false);
  const [endTime, setEndTime] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Face verification state
  const [showStartVerification, setShowStartVerification] = useState(false);

  // Submit confirmation
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      loadExam();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, examId]);

  // Auto-save answers every 30 seconds
  // Removed auto-save - answers are submitted at the end only

  const loadExam = async () => {
    try {
      setLoading(true);
      console.log('[EXAM] Loading exam:', examId);
      
      // Backend returns { success: true, data: exam } where exam includes questions
      interface ApiResponse {
        success: boolean;
        data: Exam & { questions: ExamQuestion[] };
      }
      
      const response = await api.get<ApiResponse>(`/exams/${examId}`);
      console.log('[EXAM] API response:', response);
      
      const examData = response.data;
      console.log('[EXAM] Exam data:', examData);
      
      setExam(examData);
      setQuestions(examData.questions || []);
    } catch (error) {
      console.error('Failed to load exam:', error);
      toast.error('Không thể tải bài thi');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const startExam = () => {
    setShowStartVerification(true);
  };

  const handleStartVerified = async () => {
    try {
      console.log('[EXAM] Starting exam:', examId);
      
      interface StartExamResponse {
        message: string;
        data: {
          id: string;
          name: string;
          description: string;
          duration: number;
          passingScore: number;
          questions: ExamQuestion[];
          attemptId: string;
          startedAt: string;
        };
      }
      
      const response = await api.post<StartExamResponse>(`/exams/${examId}/start`);
      console.log('[EXAM] Start response:', response);
      
      // Backend returns { message: ..., data: { ...examData, attemptId, startedAt } }
      const examData = response.data;
      
      setAttemptId(examData.attemptId);
      setExam({
        id: examData.id,
        name: examData.name,
        description: examData.description,
        duration: examData.duration,
        passingScore: examData.passingScore,
      } as Exam);
      setQuestions(examData.questions);
      setStarted(true);
      setShowStartVerification(false);
      
      // Calculate end time
      const duration = examData.duration || 0;
      setEndTime(Date.now() + duration * 60 * 1000);
      
      toast.success('Bắt đầu làm bài thi!');
    } catch (error) {
      console.error('Failed to start exam:', error);
      toast.error('Không thể bắt đầu bài thi');
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmitClick = () => {
    setShowSubmitDialog(true);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const response = await api.post<{ data: { attemptId: string } }>(`/exams/${examId}/submit`, {
        attemptId,
        answers,
      });
      toast.success('Nộp bài thành công!');
      router.push(`/exams/${examId}/result/${response.data.attemptId}`);
    } catch (error) {
      console.error('Failed to submit exam:', error);
      toast.error('Không thể nộp bài');
    } finally {
      setSubmitting(false);
      setShowSubmitDialog(false);
    }
  };

  const handleTimeUp = () => {
    toast.warning('Hết giờ! Tự động nộp bài...');
    handleSubmit();
  };

  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length;
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary/5 to-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Đang tải bài thi...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!exam) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          {!started ? (
            // Start Screen - Enhanced
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Card className="max-w-2xl mx-auto border-2 shadow-2xl bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-900 dark:to-blue-950/30">
                <CardHeader className="text-center pb-4 space-y-4">
                  <div className="mb-2 animate-in zoom-in duration-500 delay-150">
                    <div className="inline-block p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg">
                      <Clock className="h-12 w-12 text-white" />
                    </div>
                  </div>
                  <Badge 
                    variant="default" 
                    className="text-lg px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg animate-in slide-in-from-top duration-500 delay-300"
                  >
                    {exam.name}
                  </Badge>
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent animate-in slide-in-from-bottom duration-500 delay-500">
                    Bắt đầu bài thi
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Exam Info - Enhanced */}
                  <div className="grid md:grid-cols-2 gap-4 animate-in slide-in-from-bottom duration-500 delay-700">
                    <div className="group relative overflow-hidden flex items-center gap-3 p-5 bg-gradient-to-br from-blue-500/10 to-blue-600/20 hover:from-blue-500/20 hover:to-blue-600/30 border-2 border-blue-200/50 dark:border-blue-800/50 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                      <Clock className="h-10 w-10 text-blue-600 dark:text-blue-400 relative z-10" />
                      <div className="relative z-10">
                        <p className="text-sm text-muted-foreground font-medium">Thời gian</p>
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{exam.duration} phút</p>
                      </div>
                    </div>
                    <div className="group relative overflow-hidden flex items-center gap-3 p-5 bg-gradient-to-br from-purple-500/10 to-purple-600/20 hover:from-purple-500/20 hover:to-purple-600/30 border-2 border-purple-200/50 dark:border-purple-800/50 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                      <CheckCircle2 className="h-10 w-10 text-purple-600 dark:text-purple-400 relative z-10" />
                      <div className="relative z-10">
                        <p className="text-sm text-muted-foreground font-medium">Điểm đạt</p>
                        <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{exam.passingScore}%</p>
                      </div>
                    </div>
                  </div>

                  {/* Description - Enhanced */}
                  {exam.description && (
                    <div className="p-5 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-2 border-amber-200/50 dark:border-amber-800/50 rounded-xl animate-in slide-in-from-bottom duration-500 delay-900">
                      <p className="text-muted-foreground leading-relaxed">{exam.description}</p>
                    </div>
                  )}

                  {/* Instructions - Enhanced */}
                  <Alert className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/30 animate-in slide-in-from-bottom duration-500 delay-1000">
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <AlertDescription>
                      <ul className="list-disc list-inside space-y-2 text-sm">
                        <li className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                          <strong>Xác thực khuôn mặt</strong> trước khi bắt đầu
                        </li>
                        <li className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                          <strong>Tự động lưu</strong> câu trả lời mỗi 30 giây
                        </li>
                        <li className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                          <strong>Tự động nộp bài</strong> khi hết giờ
                        </li>
                        <li className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                          <strong>Không thể quay lại</strong> sau khi nộp bài
                        </li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  {/* Start Button - Enhanced */}
                  <Button 
                    onClick={startExam} 
                    size="lg" 
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 animate-in slide-in-from-bottom duration-500 delay-1100"
                  >
                    <Play className="mr-2 h-6 w-6" />
                    Bắt đầu làm bài
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            // Exam Taking Screen - Enhanced
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Header - Enhanced */}
              <Card className="border-2 shadow-xl bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-950/20 dark:to-purple-950/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {exam.name}
                      </h1>
                      <p className="text-sm text-muted-foreground font-medium">
                        📝 Câu {currentQuestionIndex + 1} / {totalQuestions}
                      </p>
                    </div>
                    <div className="text-right">
                      <Countdown
                        date={endTime}
                        onComplete={handleTimeUp}
                        renderer={({ minutes, seconds }) => (
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-lg ${minutes < 5 ? 'bg-red-100 dark:bg-red-950/30 animate-pulse' : 'bg-blue-100 dark:bg-blue-950/30'}`}>
                              <Clock className={`h-5 w-5 ${minutes < 5 ? 'text-red-600' : 'text-blue-600'}`} />
                            </div>
                            <span className={`text-2xl font-mono font-bold ${minutes < 5 ? 'text-red-600 animate-pulse' : 'text-blue-600'}`}>
                              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                            </span>
                          </div>
                        )}
                      />
                      <p className="text-xs text-muted-foreground mt-1">⏰ Thời gian còn lại</p>
                    </div>
                  </div>

                  {/* Progress Bar - Enhanced */}
                  <div className="mt-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-muted-foreground">📊 Tiến độ</span>
                      <span className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {answeredCount} / {totalQuestions} câu ({progress.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 rounded-full overflow-hidden shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-500 ease-out shadow-lg"
                        style={{ width: `${progress}%` }}
                      >
                        <div className="h-full w-full bg-gradient-to-r from-white/30 to-transparent animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Question Card - Enhanced */}
              {currentQuestion && (
                <Card className="border-2 shadow-xl bg-gradient-to-br from-white to-indigo-50/30 dark:from-gray-900 dark:to-indigo-950/20 animate-in slide-in-from-right duration-500">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <Badge 
                          variant="outline" 
                          className="border-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 transition-colors"
                        >
                          {currentQuestion.type === 'MULTIPLE_CHOICE'
                            ? '📋 Trắc nghiệm'
                            : currentQuestion.type === 'TRUE_FALSE'
                            ? '✓✗ Đúng/Sai'
                            : '✍️ Tự luận'}
                        </Badge>
                        <CardTitle className="text-xl leading-relaxed font-semibold">
                          {currentQuestion.question}
                        </CardTitle>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold px-4 py-2 text-base shadow-lg"
                      >
                        🏆 {currentQuestion.points} điểm
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Multiple Choice - Enhanced */}
                    {currentQuestion.type === 'MULTIPLE_CHOICE' && currentQuestion.options && (
                      <RadioGroup
                        value={answers[currentQuestion.id] || ''}
                        onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                        className="space-y-3"
                      >
                        {currentQuestion.options.map((option, index) => {
                          const isSelected = answers[currentQuestion.id] === option;
                          return (
                            <div 
                              key={index} 
                              className={`group flex items-center space-x-4 p-5 border-2 rounded-xl transition-all duration-300 cursor-pointer
                                ${isSelected 
                                  ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 shadow-lg scale-[1.02]' 
                                  : 'border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 hover:scale-[1.01] hover:shadow-md'
                                }`}
                            >
                              <RadioGroupItem value={option} id={`option-${index}`} className="w-5 h-5" />
                              <Label 
                                htmlFor={`option-${index}`} 
                                className={`flex-1 cursor-pointer font-medium transition-colors ${isSelected ? 'text-blue-700 dark:text-blue-300' : ''}`}
                              >
                                <span className="mr-2 font-bold text-muted-foreground">{String.fromCharCode(65 + index)}.</span>
                                {option}
                              </Label>
                              {isSelected && (
                                <CheckCircle2 className="h-5 w-5 text-blue-600 animate-in zoom-in duration-300" />
                              )}
                            </div>
                          );
                        })}
                      </RadioGroup>
                    )}

                    {/* True/False - Enhanced */}
                    {currentQuestion.type === 'TRUE_FALSE' && (
                      <RadioGroup
                        value={answers[currentQuestion.id] || ''}
                        onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                        className="space-y-3"
                      >
                        {[
                          { value: 'true', label: '✓ Đúng', color: 'green' },
                          { value: 'false', label: '✗ Sai', color: 'red' }
                        ].map(({ value, label, color }) => {
                          const isSelected = answers[currentQuestion.id] === value;
                          return (
                            <div 
                              key={value}
                              className={`flex items-center space-x-4 p-5 border-2 rounded-xl transition-all duration-300 cursor-pointer
                                ${isSelected 
                                  ? `border-${color}-500 bg-gradient-to-r from-${color}-50 to-${color}-100 dark:from-${color}-950/30 dark:to-${color}-900/20 shadow-lg scale-[1.02]` 
                                  : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/30 hover:scale-[1.01] hover:shadow-md'
                                }`}
                            >
                              <RadioGroupItem value={value} id={value} className="w-5 h-5" />
                              <Label 
                                htmlFor={value} 
                                className={`flex-1 cursor-pointer text-lg font-semibold ${isSelected ? `text-${color}-700 dark:text-${color}-300` : ''}`}
                              >
                                {label}
                              </Label>
                              {isSelected && (
                                <CheckCircle2 className={`h-5 w-5 text-${color}-600 animate-in zoom-in duration-300`} />
                              )}
                            </div>
                          );
                        })}
                      </RadioGroup>
                    )}

                    {/* Essay - Enhanced */}
                    {currentQuestion.type === 'ESSAY' && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">✍️ Nhập câu trả lời của bạn:</Label>
                        <Textarea
                          placeholder="Viết câu trả lời chi tiết tại đây..."
                          value={answers[currentQuestion.id] || ''}
                          onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                          rows={10}
                          className="resize-none border-2 focus:border-blue-500 dark:focus:border-blue-600 transition-colors bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-950 dark:to-blue-950/10"
                        />
                        <p className="text-xs text-muted-foreground text-right">
                          {(answers[currentQuestion.id] || '').length} ký tự
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Navigation - Enhanced */}
              <Card className="border-2 shadow-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                      disabled={currentQuestionIndex === 0}
                      className="border-2 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ArrowLeft className="mr-2 h-5 w-5" />
                      Câu trước
                    </Button>

                    {currentQuestionIndex === totalQuestions - 1 ? (
                      <Button 
                        onClick={handleSubmitClick} 
                        size="lg"
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                      >
                        <Send className="mr-2 h-5 w-5" />
                        Nộp bài
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        onClick={() =>
                          setCurrentQuestionIndex((prev) => Math.min(totalQuestions - 1, prev + 1))
                        }
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                      >
                        Câu tiếp
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    )}
                  </div>

                  {/* Question Grid - Enhanced */}
                  <div className="mt-6 pt-6 border-t-2">
                    <p className="text-sm font-bold mb-4 flex items-center gap-2">
                      <span>📋 Danh sách câu hỏi:</span>
                      <Badge variant="secondary" className="ml-auto">
                        {answeredCount}/{totalQuestions} đã trả lời
                      </Badge>
                    </p>
                    <div className="grid grid-cols-10 gap-2">
                      {questions.map((q, index) => {
                        const isAnswered = !!answers[q.id];
                        const isCurrent = index === currentQuestionIndex;
                        return (
                          <button
                            key={q.id}
                            onClick={() => setCurrentQuestionIndex(index)}
                            className={`
                              aspect-square rounded-xl border-2 text-sm font-bold transition-all duration-300
                              hover:scale-110 hover:shadow-lg relative overflow-hidden
                              ${
                                isCurrent
                                  ? 'border-blue-500 bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg scale-110 ring-4 ring-blue-200 dark:ring-blue-800'
                                  : isAnswered
                                  ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 text-green-700 dark:text-green-400 hover:border-green-600'
                                  : 'border-gray-300 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 text-gray-600 dark:text-gray-400 hover:border-blue-400'
                              }
                            `}
                          >
                            {index + 1}
                            {isAnswered && !isCurrent && (
                              <CheckCircle2 className="absolute top-0 right-0 h-3 w-3 text-green-600 dark:text-green-400" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Face Verification Modal */}
      <FaceVerificationModal
        open={showStartVerification}
        onOpenChange={setShowStartVerification}
        onVerified={handleStartVerified}
        expectedUserId={user?.id}
        title="Xác thực trước khi thi"
        description="Vui lòng xác thực khuôn mặt để bắt đầu làm bài thi"
      />

      {/* Submit Confirmation Dialog - Enhanced */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="sm:max-w-md border-2 bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-900 dark:to-blue-950/20">
          <DialogHeader className="space-y-3">
            <div className="mx-auto p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full">
              <Send className="h-8 w-8 text-white" />
            </div>
            <DialogTitle className="text-2xl text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Xác nhận nộp bài
            </DialogTitle>
            <DialogDescription className="text-center text-base">
              Bạn có chắc chắn muốn nộp bài? Bạn <strong className="text-red-600 dark:text-red-400">không thể quay lại</strong> sau khi nộp bài.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert 
              variant={answeredCount === totalQuestions ? 'default' : 'destructive'}
              className={`border-2 ${
                answeredCount === totalQuestions 
                  ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30' 
                  : 'border-red-500 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30'
              }`}
            >
              {answeredCount === totalQuestions ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-base font-medium">
                    ✅ Bạn đã trả lời tất cả <strong>{totalQuestions}</strong> câu hỏi.
                  </AlertDescription>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <AlertDescription className="text-base font-medium">
                    ⚠️ Bạn mới trả lời <strong className="text-red-600 dark:text-red-400">{answeredCount}/{totalQuestions}</strong> câu hỏi. 
                    Các câu chưa trả lời sẽ <strong className="text-red-600 dark:text-red-400">không được tính điểm</strong>.
                  </AlertDescription>
                </>
              )}
            </Alert>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setShowSubmitDialog(false)} 
              disabled={submitting}
              className="border-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              ← Tiếp tục làm bài
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={submitting}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Đang nộp...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Xác nhận nộp bài
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
