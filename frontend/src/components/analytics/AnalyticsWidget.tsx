'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Flame,
  TrendingUp,
  ArrowRight,
  Users,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';

interface StudentOverview {
  totalLessonsCompleted: number;
  totalExamsTaken: number;
  totalExamsPassed: number;
  avgScore: number;
  currentStreak: number;
  subjectProgress: Array<{
    subjectId: string;
    subjectName: string;
    lessonsCompleted: number;
    totalLessons: number;
    progressPercent: number;
  }>;
  monthlyProgress: Array<{
    month: string;
    lessons: number;
    exams: number;
  }>;
}

interface TeacherOverview {
  totalSubjects: number;
  totalStudents: number;
  avgClassScore: number;
  passRate: number;
  students: Array<{
    userId: string;
    name: string;
    email: string;
    progressPercent: number;
    avgScore: number;
    lastActivity: string | null;
  }>;
}

// Student Analytics Widget
function StudentAnalyticsWidget() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StudentOverview | null>(null);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const response = await api.get<StudentOverview>('/analytics/overview');
      setData(response);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 bg-gradient-to-r from-primary/10 to-transparent">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Tiến trình học tập
            </CardTitle>
            <CardDescription>Thống kê của bạn</CardDescription>
          </div>
          <Link href="/dashboard/analytics">
            <Button variant="ghost" size="sm">
              Chi tiết
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{data.totalLessonsCompleted}</div>
            <div className="text-xs text-muted-foreground">Bài học</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{data.totalExamsPassed}</div>
            <div className="text-xs text-muted-foreground">Thi đỗ</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{data.avgScore}%</div>
            <div className="text-xs text-muted-foreground">Điểm TB</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 flex items-center justify-center gap-1">
              <Flame className="h-5 w-5" />
              {data.currentStreak}
            </div>
            <div className="text-xs text-muted-foreground">Streak</div>
          </div>
        </div>

        {/* Subject Progress */}
        {data.subjectProgress.length > 0 && (
          <div className="space-y-3 mt-4 pt-4 border-t">
            <p className="text-sm font-medium text-muted-foreground">Tiến độ môn học</p>
            {data.subjectProgress.slice(0, 3).map((subject) => (
              <div key={subject.subjectId} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="truncate">{subject.subjectName}</span>
                  <span className="text-muted-foreground">{subject.progressPercent}%</span>
                </div>
                <Progress value={subject.progressPercent} className="h-1.5" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Teacher Analytics Widget
function TeacherAnalyticsWidget() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TeacherOverview | null>(null);

  useEffect(() => {
    fetchTeacherData();
  }, []);

  const fetchTeacherData = async () => {
    try {
      setLoading(true);
      const response = await api.get<TeacherOverview>('/analytics/overview');
      setData(response);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  // Find students needing attention (low progress)
  const studentsNeedingAttention = data.students
    .filter((s) => s.progressPercent < 50)
    .slice(0, 3);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 bg-gradient-to-r from-green-500/10 to-transparent">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              Quản lý học viên
            </CardTitle>
            <CardDescription>Tổng quan lớp học của bạn</CardDescription>
          </div>
          <Link href="/dashboard/analytics">
            <Button variant="ghost" size="sm">
              Chi tiết
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{data.totalSubjects}</div>
            <div className="text-xs text-muted-foreground">Môn học</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{data.totalStudents}</div>
            <div className="text-xs text-muted-foreground">Học viên</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{data.avgClassScore}%</div>
            <div className="text-xs text-muted-foreground">Điểm TB</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{data.passRate}%</div>
            <div className="text-xs text-muted-foreground">Tỷ lệ đỗ</div>
          </div>
        </div>

        {/* Students Needing Attention */}
        {studentsNeedingAttention.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-3">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              Cần chú ý
            </p>
            <div className="space-y-2">
              {studentsNeedingAttention.map((student) => (
                <div
                  key={student.userId}
                  className="flex items-center justify-between p-2 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900"
                >
                  <div>
                    <p className="text-sm font-medium">{student.name}</p>
                    <p className="text-xs text-muted-foreground">{student.email}</p>
                  </div>
                  <Badge variant="outline" className="text-amber-600 border-amber-300">
                    {student.progressPercent}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Main exported component that auto-detects role
interface AnalyticsWidgetProps {
  userRole?: 'STUDENT' | 'TEACHER' | 'ADMIN';
}

export function AnalyticsWidget({ userRole }: AnalyticsWidgetProps) {
  if (userRole === 'TEACHER') {
    return <TeacherAnalyticsWidget />;
  }

  if (userRole === 'STUDENT') {
    return <StudentAnalyticsWidget />;
  }

  // Admin or unknown role - show both in tabs or nothing
  return null;
}

// Export individual components for direct use
export { StudentAnalyticsWidget, TeacherAnalyticsWidget };
