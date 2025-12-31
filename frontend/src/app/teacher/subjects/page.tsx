'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  BookOpen,
  FileText,
  Award,
  Users,
  Search,
  ChevronRight,
  GraduationCap,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/layout/Header';

interface SubjectWithStats {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  order: number;
  isActive: boolean;
  major: {
    id: string;
    name: string;
  };
  lessons: Array<{ id: string; name: string; isActive: boolean }>;
  exams: Array<{ id: string; name: string; isActive: boolean; passingScore: number }>;
  _count: {
    lessons: number;
    exams: number;
  };
  stats: {
    enrolledStudents: number;
    completedLessons: number;
    examAttempts: number;
  };
}

export default function TeacherSubjectsPage() {
  const { user, loading: authLoading, isTeacher, isAdmin } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<SubjectWithStats[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (!authLoading && user && !isTeacher && !isAdmin) {
      router.push('/dashboard');
    } else if (user && (isTeacher || isAdmin)) {
      loadSubjects();
    }
  }, [user, authLoading, isTeacher, isAdmin, router]);

  const loadSubjects = async () => {
    try {
      const response = await api.get<{ data: SubjectWithStats[] }>('/teacher/subjects');
      setSubjects(response.data);
    } catch (error) {
      console.error('Failed to load subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubjects = subjects.filter(subject =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.major.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-indigo-50 to-white">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-gray-900">
                Môn học của tôi
              </h1>
              <p className="text-muted-foreground">
                Quản lý các môn học bạn đang phụ trách
              </p>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm môn học..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Subjects Grid */}
          {filteredSubjects.length === 0 ? (
            <Card className="p-12 text-center">
              <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                {searchTerm ? 'Không tìm thấy môn học' : 'Chưa có môn học nào'}
              </h2>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? 'Thử tìm kiếm với từ khóa khác'
                  : 'Bạn chưa được phân công phụ trách môn học nào'}
              </p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSubjects.map((subject) => (
                <Card 
                  key={subject.id} 
                  className="hover:shadow-lg transition-all border-2 hover:border-primary/30 overflow-hidden"
                >
                  {/* Header with gradient */}
                  <div className="h-24 bg-gradient-to-r from-blue-500 to-indigo-600 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BookOpen className="h-12 w-12 text-white/80" />
                    </div>
                    <Badge 
                      variant={subject.isActive ? 'default' : 'secondary'}
                      className="absolute top-3 right-3"
                    >
                      {subject.isActive ? 'Hoạt động' : 'Tạm ẩn'}
                    </Badge>
                  </div>
                  
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg line-clamp-1">{subject.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{subject.major.name}</p>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded-lg bg-blue-50">
                        <FileText className="h-4 w-4 mx-auto text-blue-600 mb-1" />
                        <p className="text-lg font-bold text-blue-600">{subject._count.lessons}</p>
                        <p className="text-xs text-muted-foreground">Bài học</p>
                      </div>
                      <div className="p-2 rounded-lg bg-orange-50">
                        <Award className="h-4 w-4 mx-auto text-orange-600 mb-1" />
                        <p className="text-lg font-bold text-orange-600">{subject._count.exams}</p>
                        <p className="text-xs text-muted-foreground">Bài thi</p>
                      </div>
                      <div className="p-2 rounded-lg bg-green-50">
                        <Users className="h-4 w-4 mx-auto text-green-600 mb-1" />
                        <p className="text-lg font-bold text-green-600">{subject.stats.enrolledStudents}</p>
                        <p className="text-xs text-muted-foreground">Sinh viên</p>
                      </div>
                    </div>

                    {/* Additional Stats */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-3">
                      <span className="flex items-center gap-1">
                        <BarChart3 className="h-4 w-4" />
                        {subject.stats.completedLessons} bài hoàn thành
                      </span>
                      <span>{subject.stats.examAttempts} lượt thi</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Link href={`/teacher/subjects/${subject.id}`} className="flex-1">
                        <Button variant="default" className="w-full gap-2">
                          Xem chi tiết
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
