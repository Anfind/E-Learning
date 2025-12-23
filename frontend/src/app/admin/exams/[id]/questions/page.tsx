'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  FileText,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'ESSAY';

interface ExamQuestion {
  id: string;
  examId: string;
  question: string;
  type: QuestionType;
  options: string | null;
  correctAnswer: string;
  points: number;
  order: number;
  createdAt: string;
}

interface Exam {
  id: string;
  name: string;
  duration: number;
  passingScore: number;
  subject: {
    id: string;
    name: string;
  };
}

interface ExamWithQuestions extends Exam {
  questions: ExamQuestion[];
}

export default function ExamQuestionsPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<ExamWithQuestions | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<ExamQuestion | null>(null);
  const [deletingQuestion, setDeletingQuestion] = useState<ExamQuestion | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    question: '',
    type: 'MULTIPLE_CHOICE' as QuestionType,
    options: ['', '', '', ''],
    correctAnswer: '0', // For MC: index (0-3), for TF: 'true'/'false', for Essay: sample answer
    points: 1,
  });

  const [submitting, setSubmitting] = useState(false);

  const loadExamAndQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<{ data: ExamWithQuestions }>(`/exams/${examId}`);
      setExam(response.data);
      setQuestions(response.data.questions.sort((a, b) => a.order - b.order));
    } catch (error) {
      console.error('Failed to load exam:', error);
      toast.error('Không thể tải thông tin bài thi');
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    loadExamAndQuestions();
  }, [loadExamAndQuestions]);

  const openCreateDialog = () => {
    setFormData({
      question: '',
      type: 'MULTIPLE_CHOICE',
      options: ['', '', '', ''],
      correctAnswer: '0',
      points: 1,
    });
    setCreateDialogOpen(true);
  };

  const openEditDialog = (question: ExamQuestion) => {
    setEditingQuestion(question);
    
    let options = ['', '', '', ''];
    if (question.type === 'MULTIPLE_CHOICE' && question.options) {
      try {
        options = JSON.parse(question.options);
      } catch (e) {
        console.error('Failed to parse options:', e);
      }
    }

    setFormData({
      question: question.question,
      type: question.type,
      options,
      correctAnswer: question.correctAnswer,
      points: question.points,
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (question: ExamQuestion) => {
    setDeletingQuestion(question);
    setDeleteDialogOpen(true);
  };

  const handleTypeChange = (type: QuestionType) => {
    setFormData(prev => ({
      ...prev,
      type,
      correctAnswer: type === 'TRUE_FALSE' ? 'true' : type === 'MULTIPLE_CHOICE' ? '0' : '',
      options: type === 'MULTIPLE_CHOICE' ? prev.options : ['', '', '', '']
    }));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData(prev => ({ ...prev, options: newOptions }));
  };

  const validateForm = (): boolean => {
    if (!formData.question.trim()) {
      toast.error('Vui lòng nhập nội dung câu hỏi');
      return false;
    }

    if (formData.type === 'MULTIPLE_CHOICE') {
      const emptyOptions = formData.options.filter(opt => !opt.trim());
      if (emptyOptions.length > 0) {
        toast.error('Vui lòng nhập đủ 4 đáp án');
        return false;
      }
    }

    if (formData.points <= 0) {
      toast.error('Điểm phải lớn hơn 0');
      return false;
    }

    return true;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      
      const questionData = {
        question: formData.question,
        type: formData.type,
        options: formData.type === 'MULTIPLE_CHOICE' ? formData.options : null,
        correctAnswer: formData.correctAnswer,
        points: formData.points,
        order: questions.length + 1
      };

      await api.post(`/exams/${examId}/questions`, {
        questions: [questionData]
      });

      toast.success('Thêm câu hỏi thành công');
      setCreateDialogOpen(false);
      loadExamAndQuestions();
    } catch (error) {
      console.error('Failed to create question:', error);
      const errorMessage = error instanceof Error ? error.message : 'Không thể thêm câu hỏi';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingQuestion || !validateForm()) return;

    try {
      setSubmitting(true);
      
      const questionData = {
        question: formData.question,
        type: formData.type,
        options: formData.type === 'MULTIPLE_CHOICE' ? formData.options : null,
        correctAnswer: formData.correctAnswer,
        points: formData.points,
      };

      await api.patch(`/exams/${examId}/questions/${editingQuestion.id}`, questionData);

      toast.success('Cập nhật câu hỏi thành công');
      setEditDialogOpen(false);
      loadExamAndQuestions();
    } catch (error) {
      console.error('Failed to update question:', error);
      const errorMessage = error instanceof Error ? error.message : 'Không thể cập nhật câu hỏi';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingQuestion) return;

    try {
      setSubmitting(true);
      
      await api.delete(`/exams/${examId}/questions/${deletingQuestion.id}`);

      toast.success('Xóa câu hỏi thành công');
      setDeleteDialogOpen(false);
      loadExamAndQuestions();
    } catch (error) {
      console.error('Failed to delete question:', error);
      const errorMessage = error instanceof Error ? error.message : 'Không thể xóa câu hỏi';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMoveUp = async (question: ExamQuestion) => {
    const currentIndex = questions.findIndex(q => q.id === question.id);
    if (currentIndex <= 0) return;

    const newQuestions = [...questions];
    [newQuestions[currentIndex], newQuestions[currentIndex - 1]] = 
      [newQuestions[currentIndex - 1], newQuestions[currentIndex]];

    setQuestions(newQuestions);
    
    // Update orders in backend
    try {
      await updateQuestionOrders(newQuestions);
      toast.success('Đã di chuyển câu hỏi');
    } catch {
      toast.error('Không thể cập nhật thứ tự');
      loadExamAndQuestions(); // Reload on error
    }
  };

  const handleMoveDown = async (question: ExamQuestion) => {
    const currentIndex = questions.findIndex(q => q.id === question.id);
    if (currentIndex >= questions.length - 1) return;

    const newQuestions = [...questions];
    [newQuestions[currentIndex], newQuestions[currentIndex + 1]] = 
      [newQuestions[currentIndex + 1], newQuestions[currentIndex]];

    setQuestions(newQuestions);
    
    // Update orders in backend
    try {
      await updateQuestionOrders(newQuestions);
      toast.success('Đã di chuyển câu hỏi');
    } catch {
      toast.error('Không thể cập nhật thứ tự');
      loadExamAndQuestions(); // Reload on error
    }
  };

  const updateQuestionOrders = async (orderedQuestions: ExamQuestion[]) => {
    // Batch update question orders
    const updates = orderedQuestions.map((q, index) => ({
      id: q.id,
      order: index + 1
    }));
    
    await api.patch(`/exams/${examId}/questions/reorder`, { questions: updates });
  };

  const getQuestionTypeBadge = (type: QuestionType) => {
    const config = {
      MULTIPLE_CHOICE: { label: 'Trắc nghiệm', color: 'bg-blue-500' },
      TRUE_FALSE: { label: 'Đúng/Sai', color: 'bg-green-500' },
      ESSAY: { label: 'Tự luận', color: 'bg-purple-500' }
    };
    const { label, color } = config[type];
    return <Badge className={`${color} text-white`}>{label}</Badge>;
  };

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Skeleton className="h-12 w-64 mb-8" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-500">Không tìm thấy bài thi</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Quản lý câu hỏi
              </h1>
              <p className="text-gray-600 mt-1">
                {exam.name} - {exam.subject.name}
              </p>
              <div className="flex gap-4 mt-2 text-sm text-gray-500">
                <span>Thời gian: {exam.duration} phút</span>
                <span>Điểm đạt: {exam.passingScore}%</span>
                <span className="font-semibold text-red-600">
                  Tổng điểm: {totalPoints.toFixed(1)}
                </span>
              </div>
            </div>
            <Button onClick={openCreateDialog} className="bg-red-600 hover:bg-red-700">
              <Plus className="mr-2 h-4 w-4" />
              Thêm câu hỏi
            </Button>
          </div>
        </div>

        {/* Questions List */}
        {questions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                <FileText className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Chưa có câu hỏi nào</h3>
              <p className="text-gray-600 mb-4">
                Bắt đầu thêm câu hỏi cho bài thi này
              </p>
              <Button onClick={openCreateDialog} className="bg-red-600 hover:bg-red-700">
                <Plus className="mr-2 h-4 w-4" />
                Thêm câu hỏi đầu tiên
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {questions.map((question, index) => (
              <Card key={question.id} className="border-l-4 border-l-red-500">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 font-semibold">
                          {index + 1}
                        </span>
                        {getQuestionTypeBadge(question.type)}
                        <Badge variant="outline" className="font-mono">
                          {question.points} điểm
                        </Badge>
                      </div>
                      <p className="text-base font-medium text-gray-900">
                        {question.question}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveUp(question)}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveDown(question)}
                        disabled={index === questions.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(question)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog(question)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                {question.type === 'MULTIPLE_CHOICE' && question.options && (
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {JSON.parse(question.options).map((option: string, optIndex: number) => (
                        <div
                          key={optIndex}
                          className={`p-3 rounded-md border ${
                            question.correctAnswer === String(optIndex)
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {question.correctAnswer === String(optIndex) && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                            <span className="font-medium text-gray-700">
                              {String.fromCharCode(65 + optIndex)}.
                            </span>
                            <span className="text-gray-900">{option}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}

                {question.type === 'TRUE_FALSE' && (
                  <CardContent className="pt-0">
                    <div className="flex gap-4">
                      <div
                        className={`flex items-center gap-2 px-4 py-2 rounded-md border ${
                          question.correctAnswer === 'true'
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        {question.correctAnswer === 'true' && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                        <span className="font-medium">Đúng</span>
                      </div>
                      <div
                        className={`flex items-center gap-2 px-4 py-2 rounded-md border ${
                          question.correctAnswer === 'false'
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        {question.correctAnswer === 'false' && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                        <span className="font-medium">Sai</span>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Thêm câu hỏi mới</DialogTitle>
              <DialogDescription>
                Tạo câu hỏi mới cho bài thi
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Question Type */}
              <div>
                <Label>Loại câu hỏi <span className="text-red-500">*</span></Label>
                <Select value={formData.type} onValueChange={(value) => handleTypeChange(value as QuestionType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MULTIPLE_CHOICE">Trắc nghiệm (4 đáp án)</SelectItem>
                    <SelectItem value="TRUE_FALSE">Đúng/Sai</SelectItem>
                    <SelectItem value="ESSAY">Tự luận</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Question Text */}
              <div>
                <Label>Nội dung câu hỏi <span className="text-red-500">*</span></Label>
                <Textarea
                  value={formData.question}
                  onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                  placeholder="Nhập nội dung câu hỏi..."
                  rows={3}
                />
              </div>

              {/* Multiple Choice Options */}
              {formData.type === 'MULTIPLE_CHOICE' && (
                <div className="space-y-3">
                  <Label>Các đáp án <span className="text-red-500">*</span></Label>
                  {formData.options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="flex items-center justify-center w-8 h-10 bg-gray-100 rounded">
                        <span className="font-medium">{String.fromCharCode(65 + index)}</span>
                      </div>
                      <Input
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={`Đáp án ${String.fromCharCode(65 + index)}`}
                      />
                    </div>
                  ))}
                  <div className="mt-2">
                    <Label>Đáp án đúng <span className="text-red-500">*</span></Label>
                    <Select 
                      value={formData.correctAnswer} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, correctAnswer: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.options.map((_, index) => (
                          <SelectItem key={index} value={String(index)}>
                            Đáp án {String.fromCharCode(65 + index)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* True/False Answer */}
              {formData.type === 'TRUE_FALSE' && (
                <div>
                  <Label>Đáp án đúng <span className="text-red-500">*</span></Label>
                  <Select 
                    value={formData.correctAnswer} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, correctAnswer: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Đúng</SelectItem>
                      <SelectItem value="false">Sai</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Essay Sample Answer */}
              {formData.type === 'ESSAY' && (
                <div>
                  <Label>Gợi ý đáp án (tùy chọn)</Label>
                  <Textarea
                    value={formData.correctAnswer}
                    onChange={(e) => setFormData(prev => ({ ...prev, correctAnswer: e.target.value }))}
                    placeholder="Nhập gợi ý đáp án để giáo viên tham khảo khi chấm..."
                    rows={3}
                  />
                </div>
              )}

              {/* Points */}
              <div>
                <Label>Số điểm <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={formData.points}
                  onChange={(e) => setFormData(prev => ({ ...prev, points: parseFloat(e.target.value) || 1 }))}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleCreate} disabled={submitting} className="bg-red-600 hover:bg-red-700">
                {submitting ? 'Đang xử lý...' : 'Thêm câu hỏi'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog (same structure as Create) */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa câu hỏi</DialogTitle>
              <DialogDescription>
                Cập nhật thông tin câu hỏi
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Same form fields as Create Dialog */}
              <div>
                <Label>Loại câu hỏi <span className="text-red-500">*</span></Label>
                <Select value={formData.type} onValueChange={(value) => handleTypeChange(value as QuestionType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MULTIPLE_CHOICE">Trắc nghiệm (4 đáp án)</SelectItem>
                    <SelectItem value="TRUE_FALSE">Đúng/Sai</SelectItem>
                    <SelectItem value="ESSAY">Tự luận</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Nội dung câu hỏi <span className="text-red-500">*</span></Label>
                <Textarea
                  value={formData.question}
                  onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                  placeholder="Nhập nội dung câu hỏi..."
                  rows={3}
                />
              </div>

              {formData.type === 'MULTIPLE_CHOICE' && (
                <div className="space-y-3">
                  <Label>Các đáp án <span className="text-red-500">*</span></Label>
                  {formData.options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="flex items-center justify-center w-8 h-10 bg-gray-100 rounded">
                        <span className="font-medium">{String.fromCharCode(65 + index)}</span>
                      </div>
                      <Input
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={`Đáp án ${String.fromCharCode(65 + index)}`}
                      />
                    </div>
                  ))}
                  <div className="mt-2">
                    <Label>Đáp án đúng <span className="text-red-500">*</span></Label>
                    <Select 
                      value={formData.correctAnswer} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, correctAnswer: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.options.map((_, index) => (
                          <SelectItem key={index} value={String(index)}>
                            Đáp án {String.fromCharCode(65 + index)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {formData.type === 'TRUE_FALSE' && (
                <div>
                  <Label>Đáp án đúng <span className="text-red-500">*</span></Label>
                  <Select 
                    value={formData.correctAnswer} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, correctAnswer: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Đúng</SelectItem>
                      <SelectItem value="false">Sai</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.type === 'ESSAY' && (
                <div>
                  <Label>Gợi ý đáp án (tùy chọn)</Label>
                  <Textarea
                    value={formData.correctAnswer}
                    onChange={(e) => setFormData(prev => ({ ...prev, correctAnswer: e.target.value }))}
                    placeholder="Nhập gợi ý đáp án để giáo viên tham khảo khi chấm..."
                    rows={3}
                  />
                </div>
              )}

              <div>
                <Label>Số điểm <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={formData.points}
                  onChange={(e) => setFormData(prev => ({ ...prev, points: parseFloat(e.target.value) || 1 }))}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleUpdate} disabled={submitting} className="bg-red-600 hover:bg-red-700">
                {submitting ? 'Đang xử lý...' : 'Cập nhật'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Xác nhận xóa câu hỏi</DialogTitle>
              <DialogDescription>
                Bạn có chắc chắn muốn xóa câu hỏi này không? Hành động này không thể hoàn tác.
                <div className="mt-3 p-3 bg-gray-50 rounded border">
                  <p className="font-medium text-gray-900">
                    {deletingQuestion?.question}
                  </p>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Hủy
              </Button>
              <Button
                onClick={handleDelete}
                disabled={submitting}
                className="bg-red-600 hover:bg-red-700"
              >
                {submitting ? 'Đang xóa...' : 'Xóa câu hỏi'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
