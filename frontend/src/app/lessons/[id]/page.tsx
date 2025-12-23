'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  BookOpen,
  Clock,
  CheckCircle2,
  Lock,
  ArrowLeft,
  ArrowRight,
  Play,
  Info,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import FaceVerificationCamera from '@/components/face/FaceVerificationCamera';
import type { Lesson, LessonProgress } from '@/types';
import { toast } from 'sonner';

export default function LessonViewerPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const lessonId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<LessonProgress | null>(null);
  const [nextLesson, setNextLesson] = useState<Lesson | null>(null);

  // Video states
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [watchTime, setWatchTime] = useState(0);

  // Face verification states
  const [showStartVerification, setShowStartVerification] = useState(false);
  const [showEndVerification, setShowEndVerification] = useState(false);
  const [isStartVerified, setIsStartVerified] = useState(false);
  const [isEndVerified, setIsEndVerified] = useState(false);
  const [canComplete, setCanComplete] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      loadLesson();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, lessonId]);

  // Track watch time every second
  useEffect(() => {
    let interval: NodeJS.Timeout;
    // ✅ ALWAYS require verification - no bypass for completed
    if (playing && isStartVerified) {
      interval = setInterval(() => {
        setWatchTime((prev) => {
          const newTime = prev + 1;
          // Auto-save progress every 30 seconds (only if not completed)
          if (newTime % 30 === 0 && !progress?.completed) {
            updateProgress(newTime);
          }
          // Check if reached 2/3 for end verification (only if not completed)
          if (duration > 0 && newTime >= (duration * 2) / 3 && !isEndVerified && !showEndVerification && !progress?.completed) {
            setPlaying(false);
            setShowEndVerification(true);
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, isStartVerified, duration, isEndVerified, showEndVerification, progress?.completed]);

  // Check if can complete
  useEffect(() => {
    if (duration > 0 && watchTime >= (duration * 2) / 3 && isEndVerified) {
      setCanComplete(true);
    }
  }, [watchTime, duration, isEndVerified]);

  const loadLesson = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ data: Lesson & { progress: LessonProgress[]; nextLesson?: Lesson } }>(`/lessons/${lessonId}`);
      setLesson(response.data);
      
      console.log('[LESSON] Loaded lesson:', response.data);
      console.log('[LESSON] Video URL:', response.data.videoUrl);
      console.log('[LESSON] Progress:', response.data.progress);
      
      // Progress is an array, get first element
      const userProgress = response.data.progress?.[0] || null;
      setProgress(userProgress);
      
      console.log('[LESSON] User progress:', userProgress);
      console.log('[LESSON] Completed:', userProgress?.completed);
      
      // Find next lesson (lesson with order = current order + 1 in same subject)
      // Backend should return this, but if not we'll fetch it separately later
      setNextLesson(response.data.nextLesson || null);

      // Set initial watch time from progress
      if (userProgress) {
        setWatchTime(userProgress.watchTime || 0);
        // ✅ KHÔNG load trạng thái verified từ DB - luôn yêu cầu quét mặt mỗi lần vào
        // setIsStartVerified(userProgress.faceVerifiedBefore);
        // setIsEndVerified(userProgress.faceVerifiedAfter);
      }
    } catch (error) {
      console.error('Failed to load lesson:', error);
      toast.error('Không thể tải bài học');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const startLesson = () => {
    setShowStartVerification(true);
  };

  const handleStartVerified = async () => {
    try {
      await api.post(`/progress/lessons/${lessonId}/start`);
      setIsStartVerified(true);
      setShowStartVerification(false);
      setPlaying(true);
      toast.success('Bắt đầu học bài');
    } catch (error: unknown) {
      console.error('Failed to start lesson:', error);
      const err = error as { response?: { data?: { error?: string; message?: string } } }
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Không thể bắt đầu bài học';
      toast.error(errorMsg);
      // Keep popup open and show error - let user close manually
    }
  };

  const handleEndVerified = async () => {
    try {
      // Call verify-after API to set faceVerifiedAfter=true
      await api.post(`/progress/lessons/${lessonId}/verify-after`);
      setIsEndVerified(true);
      setShowEndVerification(false);
      setPlaying(true);
      toast.success('Xác thực thành công! Bạn có thể hoàn thành bài học.');
    } catch (error) {
      console.error('Failed to verify after lesson:', error);
      toast.error('Không thể xác thực');
    }
  };

  const updateProgress = async (time: number) => {
    try {
      await api.patch(`/progress/lessons/${lessonId}/progress`, {
        watchTime: Math.floor(time),
      });
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const completeLesson = async () => {
    try {
      await api.post(`/progress/lessons/${lessonId}/complete`);
      toast.success('Hoàn thành bài học!');
      if (nextLesson) {
        router.push(`/lessons/${nextLesson.id}`);
      } else {
        router.push(`/subjects/${lesson?.subjectId}`);
      }
    } catch (error) {
      console.error('Failed to complete lesson:', error);
      toast.error('Không thể hoàn thành bài học');
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary/5 to-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Đang tải bài học...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!lesson) {
    return null;
  }

  const watchProgress = duration > 0 ? (watchTime / duration) * 100 : 0;
  const requiredWatchTime = Math.floor((duration * 2) / 3);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary/5 to-background">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => router.push(`/subjects/${lesson.subjectId}`)}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại môn học
          </Button>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Video Player - Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Lesson Header */}
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h1 className="text-3xl font-bold">{lesson.name}</h1>
                  {progress?.completed ? (
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Hoàn thành
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <BookOpen className="mr-1 h-3 w-3" />
                      Đang học
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center">
                    <Clock className="mr-1 h-4 w-4" />
                    {lesson.duration} phút
                  </span>
                  <span>Thứ tự: {lesson.order}</span>
                </div>
              </div>

              {/* Video Player Card */}
              <Card>
                <CardContent className="p-0">
                  <div className="relative aspect-video bg-black">
                    {/* ✅ ALWAYS require face verification before watching */}
                    {!isStartVerified ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center space-y-4">
                          <Lock className="h-16 w-16 text-white mx-auto opacity-50" />
                          <div className="text-white">
                            <p className="text-xl font-semibold mb-2">Bài học đã khóa</p>
                            <p className="text-sm opacity-75 mb-4">
                              Vui lòng xác thực khuôn mặt để bắt đầu học
                            </p>
                            <Button onClick={startLesson} size="lg">
                              <Play className="mr-2 h-5 w-5" />
                              Bắt đầu học
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : lesson.videoUrl ? (
                      <>
                        {console.log('[VIDEO] Rendering video player with URL:', lesson.videoUrl)}
                        {console.log('[VIDEO] isStartVerified:', isStartVerified)}
                        <iframe
                          src={`https://www.youtube.com/embed/${lesson.videoUrl.split('v=')[1]?.split('&')[0]}?autoplay=0&controls=1&modestbranding=1&rel=0&enablejsapi=1`}
                          className="absolute inset-0 w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          title={lesson.name}
                          onLoad={() => {
                            console.log('[VIDEO] ✅ YouTube iframe loaded successfully');
                            // Set duration from lesson data (in seconds)
                            if (lesson.duration) {
                              setDuration(lesson.duration * 60);
                            }
                          }}
                        />
                      </>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center text-white">
                          <Info className="h-16 w-16 mx-auto opacity-50 mb-4" />
                          <p className="text-xl font-semibold mb-2">Video không khả dụng</p>
                          <p className="text-sm opacity-75">Vui lòng liên hệ quản trị viên</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {isStartVerified && (
                    <div className="p-4 border-t space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tiến độ xem</span>
                        <span className="font-medium">{watchProgress.toFixed(0)}%</span>
                      </div>
                      <Progress value={watchProgress} />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Đã xem: {formatTime(watchTime)}</span>
                        <span>Tổng: {formatTime(duration)}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Description */}
              {lesson.description && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Mô tả bài học</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {lesson.description}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar - Right Column */}
            <div className="space-y-6">
              {/* Progress Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tiến độ học tập</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Start Verification Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Xác thực bắt đầu</span>
                    {isStartVerified ? (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Đã xác thực
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Lock className="mr-1 h-3 w-3" />
                        Chưa xác thực
                      </Badge>
                    )}
                  </div>

                  {/* Watch Progress */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Thời gian xem</span>
                    <span className="text-sm font-medium">
                      {formatTime(watchTime)} / {formatTime(requiredWatchTime)}
                    </span>
                  </div>

                  {/* End Verification Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Xác thực kết thúc</span>
                    {isEndVerified ? (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Đã xác thực
                      </Badge>
                    ) : watchTime >= requiredWatchTime ? (
                      <Badge variant="secondary">
                        <Info className="mr-1 h-3 w-3" />
                        Cần xác thực
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Lock className="mr-1 h-3 w-3" />
                        Chưa đủ điều kiện
                      </Badge>
                    )}
                  </div>

                  {/* Complete Button */}
                  {canComplete && !progress?.completed && (
                    <Button onClick={completeLesson} className="w-full" size="lg">
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      Hoàn thành bài học
                    </Button>
                  )}

                  {progress?.completed && nextLesson && (
                    <Button
                      onClick={() => router.push(`/lessons/${nextLesson.id}`)}
                      className="w-full"
                      size="lg"
                    >
                      Bài học tiếp theo
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Hướng dẫn</CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Xác thực khuôn mặt trước khi bắt đầu</li>
                        <li>Xem ít nhất 2/3 thời lượng video</li>
                        <li>Xác thực khuôn mặt lần 2 khi đạt 2/3</li>
                        <li>Hoàn thành bài học để mở khóa bài tiếp theo</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* Next Lesson Preview */}
              {nextLesson && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Bài học tiếp theo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <h4 className="font-medium">{nextLesson.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{nextLesson.duration} phút</span>
                      </div>
                      {!progress?.completed && (
                        <p className="text-sm text-muted-foreground">
                          Hoàn thành bài học này để mở khóa
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Face Verification Dialogs */}
      <Dialog open={showStartVerification} onOpenChange={setShowStartVerification}>
        <DialogContent className="!max-w-7xl w-[95vw] p-0 overflow-hidden">
          <FaceVerificationCamera
            expectedUserId={user?.id}
            onClose={() => setShowStartVerification(false)}
            onSuccess={handleStartVerified}
            onError={(error) => toast.error(error)}
            verificationPhase="before"
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showEndVerification} onOpenChange={setShowEndVerification}>
        <DialogContent className="!max-w-7xl w-[95vw] p-0 overflow-hidden">
          <FaceVerificationCamera
            expectedUserId={user?.id}
            onClose={() => setShowEndVerification(false)}
            onSuccess={handleEndVerified}
            onError={(error) => toast.error(error)}
            verificationPhase="after"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
