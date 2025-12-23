'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Eye,
  Calendar,
  User,
  MessageSquare,
  ArrowLeft,
  Send
} from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { toast } from 'sonner';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  views: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  tags: Array<{
    tag: {
      id: string;
      name: string;
    };
  }>;
  comments: Array<{
    id: string;
    content: string;
    createdAt: string;
    user: {
      id: string;
      name: string;
      avatar?: string;
    };
  }>;
  _count: {
    comments: number;
  };
}

export default function BlogDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user && postId) {
      loadPost();
    }
  }, [user, authLoading, postId, router]);

  const loadPost = async () => {
    try {
      const response = await api.get<{ data: BlogPost }>(`/blog/${postId}`);
      setPost(response.data);
    } catch (error) {
      console.error('Failed to load post:', error);
      router.push('/blog');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!comment.trim()) return;
    
    setSubmitting(true);
    try {
      await api.post(`/blog/${postId}/comments`, { content: comment });
      toast.success('Đã thêm bình luận');
      setComment('');
      loadPost();
    } catch (error) {
      toast.error('Không thể thêm bình luận');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading || !post) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div>Loading...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-orange-50 via-rose-50 to-white">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Back Button */}
          <Link href="/blog" className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-6 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại Blog
          </Link>

          {/* Post Content */}
          <Card className="mb-8 shadow-lg border-0 bg-white">
            <CardHeader className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium">{post.user.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  {post.views} lượt xem
                </div>
              </div>

              <CardTitle className="text-4xl font-bold">{post.title}</CardTitle>

              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {post.tags.map(tagObj => (
                    <Badge key={tagObj.tag.id} className="bg-orange-100 text-orange-700 border-0">
                      {tagObj.tag.name}
                    </Badge>
                  ))}
                </div>
              )}
            </CardHeader>

            <CardContent>
              <div className="prose prose-lg max-w-none">
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {post.content}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comments Section */}
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-orange-600" />
                Bình luận ({post.comments?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add Comment */}
              <div className="space-y-3">
                <Textarea
                  placeholder="Viết bình luận của bạn..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmitComment}
                    disabled={!comment.trim() || submitting}
                    className="bg-gradient-to-r from-orange-500 to-pink-600"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {submitting ? 'Đang gửi...' : 'Gửi bình luận'}
                  </Button>
                </div>
              </div>

              {/* Comments List */}
              {post.comments && post.comments.length > 0 ? (
                <div className="space-y-4">
                  {post.comments.map(comment => (
                    <div key={comment.id} className="border-l-4 border-orange-200 pl-4 py-2">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-800">{comment.user.name}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(comment.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <p className="text-gray-700">{comment.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  Chưa có bình luận nào. Hãy là người đầu tiên!
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
