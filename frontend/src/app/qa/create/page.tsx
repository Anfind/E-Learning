'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, X } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { toast } from 'sonner';

interface Subject {
  id: string;
  name: string;
}

interface Lesson {
  id: string;
  name: string;
}

export default function CreateQuestionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [lessonId, setLessonId] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(false);

  useEffect(() => {
    loadSubjects();
  }, []);

  useEffect(() => {
    if (subjectId) {
      loadLessons(subjectId);
    } else {
      setLessons([]);
      setLessonId('');
    }
  }, [subjectId]);

  const loadSubjects = async () => {
    try {
      const response = await api.get<{ data: Subject[] }>('/subjects');
      setSubjects(response.data || []);
    } catch (error) {
      console.error('Failed to load subjects:', error);
    }
  };

  const loadLessons = async (subId: string) => {
    try {
      setLoadingLessons(true);
      const response = await api.get<{ data: Lesson[] }>(`/subjects/${subId}/lessons`);
      setLessons(response.data || []);
    } catch (error) {
      console.error('Failed to load lessons:', error);
      setLessons([]);
    } finally {
      setLoadingLessons(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      toast.error('Vui lòng nhập tiêu đề và nội dung');
      return;
    }

    try {
      setLoading(true);
      await api.post('/questions', {
        title: title.trim(),
        content: content.trim(),
        subjectId: subjectId || null,
        lessonId: lessonId || null,
        tags: tags
      });
      
      toast.success('Đặt câu hỏi thành công!');
      router.push('/qa');
    } catch (error) {
      console.error('Failed to create question:', error);
      toast.error('Không thể tạo câu hỏi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-6">
            <Link href="/qa">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại
              </Button>
            </Link>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ❓ Đặt câu hỏi mới
            </h1>
            <p className="text-gray-600 mt-2">
              Đặt câu hỏi và nhận giải đáp từ cộng đồng
            </p>
          </div>

          {/* Form */}
          <Card className="shadow-xl border-0">
            <CardHeader>
              <CardTitle>Thông tin câu hỏi</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium mb-2">
                    Tiêu đề <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="title"
                    placeholder="Nhập tiêu đề câu hỏi..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={200}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {title.length}/200 ký tự
                  </p>
                </div>

                {/* Content */}
                <div>
                  <label htmlFor="content" className="block text-sm font-medium mb-2">
                    Nội dung <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    id="content"
                    placeholder="Mô tả chi tiết câu hỏi của bạn..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={10}
                    required
                    className="resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {content.length} ký tự
                  </p>
                </div>

                {/* Subject & Lesson */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium mb-2">
                      Môn học (không bắt buộc)
                    </label>
                    <Select value={subjectId} onValueChange={setSubjectId}>
                      <SelectTrigger id="subject">
                        <SelectValue placeholder="Chọn môn học..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Không chọn</SelectItem>
                        {subjects.map(subject => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label htmlFor="lesson" className="block text-sm font-medium mb-2">
                      Bài học (không bắt buộc)
                    </label>
                    <Select 
                      value={lessonId} 
                      onValueChange={setLessonId}
                      disabled={!subjectId || loadingLessons}
                    >
                      <SelectTrigger id="lesson">
                        <SelectValue placeholder={
                          !subjectId 
                            ? "Chọn môn học trước" 
                            : loadingLessons 
                              ? "Đang tải..." 
                              : "Chọn bài học..."
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Không chọn</SelectItem>
                        {lessons.map(lesson => (
                          <SelectItem key={lesson.id} value={lesson.id}>
                            {lesson.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label htmlFor="tags" className="block text-sm font-medium mb-2">
                    Tags (thẻ từ khóa)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      id="tags"
                      placeholder="Nhập tag và nhấn nút thêm..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddTag}
                      disabled={!tagInput.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Tag List */}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Badge
                          key={tag}
                          className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-0 pr-1"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 hover:bg-purple-300 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={loading || !title.trim() || !content.trim()}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    {loading ? 'Đang tạo...' : 'Đặt câu hỏi'}
                  </Button>
                  <Link href="/qa" className="flex-1">
                    <Button type="button" variant="outline" className="w-full">
                      Hủy
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </>
  );
}
