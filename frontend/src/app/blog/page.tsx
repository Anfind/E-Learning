'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { api, getUploadUrl } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { 
  FileText,
  Eye,
  Calendar,
  User,
  Search,
  PenSquare,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

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
  _count: {
    comments: number;
  };
}

export default function BlogPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      loadData();
    }
  }, [user, authLoading, router]);

  const loadData = async () => {
    try {
      console.log('Loading blog data...');
      const [postsRes, tagsRes] = await Promise.all([
        api.get<{ data: BlogPost[] }>('/blog'),
        api.get<{ data: Array<{ id: string; name: string }> }>('/blog/tags')
      ]);
      console.log('Posts response:', postsRes);
      console.log('Tags response:', tagsRes);
      console.log('First post ID:', postsRes.data?.[0]?.id);
      setPosts(postsRes.data || []);
      setAllTags(tagsRes.data || []);
    } catch (error) {
      console.error('Failed to load blog posts:', error);
      setPosts([]);
      setAllTags([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = !selectedTag || post.tags.some(t => t.tag.id === selectedTag);
    return matchesSearch && matchesTag;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-80" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50 via-rose-50 to-pink-50">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                  📝 Blog - Chia sẻ kiến thức
                </h1>
                <p className="text-gray-600 text-lg">
                  Nơi cộng đồng chia sẻ kinh nghiệm và kiến thức học tập
                </p>
              </div>
              <Link href="/blog/create">
                <Button className="bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 shadow-lg">
                  <PenSquare className="mr-2 h-5 w-5" />
                  Viết bài mới
                </Button>
              </Link>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Tìm kiếm bài viết..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 bg-white border-gray-200 focus:border-orange-500"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                <Button
                  variant={!selectedTag ? "default" : "outline"}
                  onClick={() => setSelectedTag(null)}
                  className={!selectedTag ? "bg-gradient-to-r from-orange-500 to-pink-600" : ""}
                >
                  Tất cả
                </Button>
                {allTags.map(tag => (
                  <Button
                    key={tag.id}
                    variant={selectedTag === tag.id ? "default" : "outline"}
                    onClick={() => setSelectedTag(tag.id)}
                    className={selectedTag === tag.id ? "bg-gradient-to-r from-orange-500 to-pink-600" : ""}
                  >
                    {tag.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Posts Grid */}
          {filteredPosts.length === 0 ? (
            <Card className="p-12 shadow-lg border-0 bg-white/80">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-orange-100 to-pink-100 mb-4">
                  <FileText className="h-12 w-12 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">
                  {searchQuery || selectedTag ? 'Không tìm thấy bài viết' : 'Chưa có bài viết nào'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery || selectedTag 
                    ? 'Thử tìm kiếm với từ khóa khác' 
                    : 'Hãy là người đầu tiên chia sẻ kiến thức'}
                </p>
                {!searchQuery && !selectedTag && (
                  <Link href="/blog/create">
                    <Button className="bg-gradient-to-r from-orange-500 to-pink-600">
                      <PenSquare className="mr-2 h-5 w-5" />
                      Viết bài đầu tiên
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <Card 
                  key={post.id} 
                  className="overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all group bg-white cursor-pointer"
                  onClick={() => {
                    console.log('Navigating to post ID:', post.id);
                    router.push(`/blog/${post.id}`);
                  }}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="h-4 w-4" />
                        <span className="font-medium">{post.user.name}</span>
                      </div>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {post.views}
                      </Badge>
                    </div>
                    <CardTitle className="group-hover:text-orange-600 transition-colors text-xl line-clamp-2">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-3 text-gray-600">
                      {post.content.substring(0, 150)}...
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    {/* Tags */}
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.slice(0, 3).map(tagObj => (
                          <Badge 
                            key={tagObj.tag.id} 
                            className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTag(tagObj.tag.id);
                            }}
                          >
                            {tagObj.tag.name}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Date */}
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="mr-1 h-4 w-4" />
                      {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Popular Tags Section */}
          {allTags.length > 0 && (
            <Card className="mt-8 shadow-lg border-0 bg-white/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                  Tags phổ biến
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {allTags.map(tag => (
                    <Badge 
                      key={tag.id}
                      variant="outline"
                      className="cursor-pointer hover:bg-orange-50 hover:border-orange-300 transition-colors"
                      onClick={() => setSelectedTag(tag.id)}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
