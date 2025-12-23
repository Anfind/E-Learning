'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft,
  User,
  Calendar,
  MessageSquare,
  CheckCircle2,
  BookOpen,
  Send
} from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { toast } from 'sonner';

interface Question {
  id: string;
  title: string;
  content: string;
  userId: string;
  status: string;
  views: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  subject?: {
    id: string;
    name: string;
  };
  lesson?: {
    id: string;
    name: string;
  };
  tags: Array<{
    tag: {
      id: string;
      name: string;
    };
  }>;
  answers: Array<{
    id: string;
    content: string;
    isAccepted: boolean;
    userId: string;
    createdAt: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
}

export default function QuestionDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const questionId = params.id as string;
  
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [newAnswer, setNewAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadQuestion = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ data: Question }>(`/questions/${questionId}`);
      setQuestion(response.data);
    } catch (error) {
      console.error('Failed to load question:', error);
      toast.error('Không thể tải câu hỏi');
      router.push('/qa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (questionId) {
      loadQuestion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionId]);

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAnswer.trim()) {
      toast.error('Vui lòng nhập câu trả lời');
      return;
    }

    try {
      setSubmitting(true);
      await api.post(`/questions/${questionId}/answers`, {
        content: newAnswer.trim()
      });
      
      toast.success('Đã thêm câu trả lời!');
      setNewAnswer('');
      await loadQuestion();
    } catch (error) {
      console.error('Failed to add answer:', error);
      toast.error('Không thể thêm câu trả lời');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptAnswer = async (answerId: string) => {
    try {
      await api.post(`/questions/answers/${answerId}/accept`);
      toast.success('Đã chấp nhận câu trả lời!');
      await loadQuestion();
    } catch (error) {
      console.error('Failed to accept answer:', error);
      toast.error('Không thể chấp nhận câu trả lời');
    }
  };

  if (loading || !question) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8">
          <div className="max-w-5xl mx-auto px-4">
            <Skeleton className="h-8 w-32 mb-6" />
            <Skeleton className="h-96 mb-6" />
            <Skeleton className="h-64" />
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const isQuestionOwner = user?.id === question.userId;
  const acceptedAnswer = question.answers.find(a => a.isAccepted);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8">
        <div className="max-w-5xl mx-auto px-4">
          {/* Back Button */}
          <Link href="/qa">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại danh sách
            </Button>
          </Link>

          {/* Question Card */}
          <Card className="mb-6 shadow-xl border-0">
            <CardHeader>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span className="font-medium">{question.user?.name || 'Unknown'}</span>
                  <span>•</span>
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(question.createdAt).toLocaleString('vi-VN')}</span>
                </div>
                <Badge className={
                  question.status === 'resolved' 
                    ? 'bg-green-100 text-green-700 border-green-200'
                    : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                }>
                  {question.status === 'resolved' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                  {question.status === 'resolved' ? 'Đã giải quyết' : 'Đang chờ'}
                </Badge>
              </div>
              
              <CardTitle className="text-3xl mb-4">{question.title}</CardTitle>
              
              {/* Subject/Lesson */}
              {(question.subject || question.lesson) && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {question.subject && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      <BookOpen className="h-3 w-3 mr-1" />
                      {question.subject.name}
                    </Badge>
                  )}
                  {question.lesson && (
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      {question.lesson.name}
                    </Badge>
                  )}
                </div>
              )}

              {/* Tags */}
              {question.tags && question.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {question.tags.map(tagObj => (
                    tagObj?.tag ? (
                      <Badge 
                        key={tagObj.tag.id} 
                        className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-0"
                      >
                        {tagObj.tag.name}
                      </Badge>
                    ) : null
                  ))}
                </div>
              )}
            </CardHeader>
            
            <CardContent>
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap text-gray-700">{question.content}</p>
              </div>
            </CardContent>
          </Card>

          {/* Answers Section */}
          <Card className="shadow-xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                {question.answers.length} Câu trả lời
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Accepted Answer First */}
              {acceptedAnswer && (
                <div className="border-2 border-green-200 bg-green-50 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-3 text-green-700">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-semibold">Câu trả lời được chấp nhận</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{acceptedAnswer.user?.name || 'Unknown'}</span>
                    <span>•</span>
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(acceptedAnswer.createdAt).toLocaleString('vi-VN')}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-gray-700">{acceptedAnswer.content}</p>
                </div>
              )}

              {/* Other Answers */}
              {question.answers
                .filter(a => !a.isAccepted)
                .map((answer) => (
                  <div key={answer.id} className="border-l-4 border-blue-200 bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="h-4 w-4" />
                        <span className="font-medium">{answer.user?.name || 'Unknown'}</span>
                        <span>•</span>
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(answer.createdAt).toLocaleString('vi-VN')}</span>
                      </div>
                      {isQuestionOwner && !acceptedAnswer && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAcceptAnswer(answer.id)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Chấp nhận
                        </Button>
                      )}
                    </div>
                    <p className="whitespace-pre-wrap text-gray-700">{answer.content}</p>
                  </div>
                ))}

              {question.answers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Chưa có câu trả lời nào</p>
                </div>
              )}

              {/* Add Answer Form */}
              <div className="border-t-2 pt-6 mt-6">
                <h3 className="font-semibold text-lg mb-4">Thêm câu trả lời của bạn</h3>
                <form onSubmit={handleSubmitAnswer} className="space-y-4">
                  <Textarea
                    placeholder="Viết câu trả lời của bạn..."
                    value={newAnswer}
                    onChange={(e) => setNewAnswer(e.target.value)}
                    rows={6}
                    className="resize-none"
                  />
                  <Button
                    type="submit"
                    disabled={submitting || !newAnswer.trim()}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {submitting ? 'Đang gửi...' : 'Gửi câu trả lời'}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </>
  );
}
