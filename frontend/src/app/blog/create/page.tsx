'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, X } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { toast } from 'sonner';

export default function CreateBlogPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

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
      await api.post('/blog', {
        title: title.trim(),
        content: content.trim(),
        tags: tags
      });
      
      toast.success('Tạo bài viết thành công!');
      router.push('/blog');
    } catch (error) {
      console.error('Failed to create blog post:', error);
      toast.error('Không thể tạo bài viết. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-6">
            <Link href="/blog">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại
              </Button>
            </Link>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
              ✍️ Tạo bài viết mới
            </h1>
            <p className="text-gray-600 mt-2">
              Chia sẻ kiến thức và kinh nghiệm của bạn với cộng đồng
            </p>
          </div>

          {/* Form */}
          <Card className="shadow-xl border-0">
            <CardHeader>
              <CardTitle>Thông tin bài viết</CardTitle>
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
                    placeholder="Nhập tiêu đề bài viết..."
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
                    placeholder="Viết nội dung bài viết của bạn..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={15}
                    required
                    className="resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {content.length} ký tự
                  </p>
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
                          className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-0 pr-1"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 hover:bg-orange-300 rounded-full p-0.5"
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
                    className="flex-1 bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700"
                  >
                    {loading ? 'Đang tạo...' : 'Tạo bài viết'}
                  </Button>
                  <Link href="/blog" className="flex-1">
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
