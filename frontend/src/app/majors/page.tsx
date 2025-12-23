'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  GraduationCap,
  BookOpen,
  Users,
  Check,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import type { Major, Enrollment } from '@/types';
import { getUploadUrl } from '@/lib/api';
import { toast } from 'sonner';

export default function MajorsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [majors, setMajors] = useState<Major[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [enrolling, setEnrolling] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      loadData();
    }
  }, [user, authLoading, router]);

  const loadData = async () => {
    try {
      const [majorsRes, enrollmentsRes] = await Promise.all([
        api.get<{ data: Major[] }>('/majors'),
        api.get<{ data: Enrollment[] }>('/enrollments/my'),
      ]);
      setMajors(majorsRes.data);
      setEnrollments(enrollmentsRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (majorId: string) => {
    setEnrolling(majorId);
    try {
      await api.post('/enrollments', { majorId });
      toast.success('Ghi danh thành công!');
      loadData(); // Reload to update enrollment status
    } catch (error) {
      const err = error as { message?: string };
      toast.error(err.message || 'Ghi danh thất bại');
    } finally {
      setEnrolling(null);
    }
  };

  const isEnrolled = (majorId: string) => {
    return enrollments.some(e => e.majorId === majorId && e.status === 'ACTIVE');
  };

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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Ngành học
            </h1>
            <p className="text-gray-600 text-lg">
              Khám phá và ghi danh các ngành học phù hợp với bạn
            </p>
          </div>

          {/* Majors Grid */}
          {majors.length === 0 ? (
            <Card className="p-12 shadow-lg border-0 bg-white/80">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 mb-4">
                  <GraduationCap className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Chưa có ngành học nào</h3>
                <p className="text-gray-600">
                  Hiện tại chưa có ngành học nào được công bố
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {majors.map((major) => {
                const enrolled = isEnrolled(major.id);
                
                return (
                  <Card key={major.id} className="overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all group bg-white">
                    {/* Image */}
                    {major.imageUrl && (
                      <div className="relative h-48 w-full">
                        <Image
                          src={getUploadUrl(major.imageUrl)}
                          alt={major.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        {enrolled && (
                          <Badge className="absolute top-4 right-4 bg-green-500 shadow-md">
                            <Check className="mr-1 h-3 w-3" />
                            Đã ghi danh
                          </Badge>
                        )}
                      </div>
                    )}

                    <CardHeader>
                      <CardTitle className="group-hover:text-blue-600 transition-colors text-xl">
                        {major.name}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 text-gray-600">
                        {major.description || 'Chưa có mô tả'}
                      </CardDescription>
                    </CardHeader>

                    <CardContent>
                      {/* Stats */}
                      <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <BookOpen className="mr-1 h-4 w-4 text-blue-500" />
                          {major._count?.subjects || 0} môn học
                        </div>
                        <div className="flex items-center">
                          <Users className="mr-1 h-4 w-4 text-purple-500" />
                          {major._count?.enrollments || 0} học viên
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Link href={`/majors/${major.id}`} className="flex-1">
                          <Button variant="outline" className="w-full border-blue-200 hover:bg-blue-50 hover:border-blue-400">
                            Chi tiết
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                        {!enrolled && (
                          <Button
                            onClick={() => handleEnroll(major.id)}
                            disabled={enrolling === major.id}
                            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                          >
                            {enrolling === major.id ? 'Đang ghi danh...' : 'Ghi danh'}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
