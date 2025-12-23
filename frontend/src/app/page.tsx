import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, BookOpen, Award, Shield, Users, TrendingUp } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Learning Platform</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost" className="hover:bg-blue-50">Đăng nhập</Button>
            </Link>
            <Link href="/register">
              <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">Đăng ký ngay</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 rounded-full text-sm font-semibold mb-4 shadow-md">
            <Shield className="h-4 w-4" />
            Xác thực khuôn mặt - An toàn & Minh bạch
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
            Học tập & Thi cử
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent block mt-2">Thông minh hơn</span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Hệ thống học và thi online với công nghệ nhận diện khuôn mặt, đảm bảo tính minh bạch và chất lượng trong quá trình học tập.
          </p>

          <div className="flex items-center justify-center gap-4 pt-6">
            <Link href="/register">
              <Button size="lg" className="h-14 px-10 text-base bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-xl transition-all">
                Bắt đầu học ngay
              </Button>
            </Link>
            <Link href="/majors">
              <Button size="lg" variant="outline" className="h-14 px-10 text-base border-2 border-blue-300 hover:bg-blue-50 hover:border-blue-400">
                Khám phá khóa học
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Tính năng nổi bật</h2>
          <p className="text-gray-600 text-lg">Trải nghiệm học tập toàn diện với công nghệ hiện đại</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all hover:scale-105 bg-white/80 backdrop-blur">
            <CardHeader>
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center mb-4 shadow-md">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <CardTitle className="text-xl font-bold">Xác thực khuôn mặt</CardTitle>
              <CardDescription className="text-gray-600">
                Công nghệ nhận diện khuôn mặt đảm bảo người học là chính chủ khi tham gia khóa học và thi cử
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all hover:scale-105 bg-white/80 backdrop-blur">
            <CardHeader>
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mb-4 shadow-md">
                <BookOpen className="h-7 w-7 text-white" />
              </div>
              <CardTitle className="text-xl font-bold">Học theo lộ trình</CardTitle>
              <CardDescription className="text-gray-600">
                Hệ thống tiên quyết thông minh, đảm bảo bạn học đúng thứ tự và nắm vững kiến thức từng bước
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all hover:scale-105 bg-white/80 backdrop-blur">
            <CardHeader>
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-4 shadow-md">
                <Award className="h-7 w-7 text-white" />
              </div>
              <CardTitle className="text-xl font-bold">Thi cử minh bạch</CardTitle>
              <CardDescription className="text-gray-600">
                Bài thi được giám sát bằng công nghệ, chấm điểm tự động, kết quả chính xác và công bằng
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all hover:scale-105 bg-white/80 backdrop-blur">
            <CardHeader>
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center mb-4 shadow-md">
                <Users className="h-7 w-7 text-white" />
              </div>
              <CardTitle className="text-xl font-bold">Cộng đồng học tập</CardTitle>
              <CardDescription className="text-gray-600">
                Blog, Q&A theo chủ đề, chia sẻ kiến thức và giải đáp thắc mắc cùng cộng đồng
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all hover:scale-105 bg-white/80 backdrop-blur">
            <CardHeader>
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center mb-4 shadow-md">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
              <CardTitle className="text-xl font-bold">Theo dõi tiến độ</CardTitle>
              <CardDescription className="text-gray-600">
                Dashboard trực quan hiển thị tiến độ học tập, điểm số và thành tích của bạn
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all hover:scale-105 bg-white/80 backdrop-blur">
            <CardHeader>
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center mb-4 shadow-md">
                <GraduationCap className="h-7 w-7 text-white" />
              </div>
              <CardTitle className="text-xl font-bold">Chứng chỉ hoàn thành</CardTitle>
              <CardDescription className="text-gray-600">
                Nhận chứng chỉ sau khi hoàn thành khóa học và đạt điểm thi đạt yêu cầu
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-16 text-white shadow-2xl">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="transform hover:scale-110 transition-transform">
              <div className="text-5xl font-extrabold mb-2">1000+</div>
              <div className="text-white/90 text-lg">Học viên</div>
            </div>
            <div className="transform hover:scale-110 transition-transform">
              <div className="text-5xl font-extrabold mb-2">50+</div>
              <div className="text-white/90 text-lg">Khóa học</div>
            </div>
            <div className="transform hover:scale-110 transition-transform">
              <div className="text-5xl font-extrabold mb-2">500+</div>
              <div className="text-white/90 text-lg">Bài học</div>
            </div>
            <div className="transform hover:scale-110 transition-transform">
              <div className="text-5xl font-extrabold mb-2">95%</div>
              <div className="text-white/90 text-lg">Hài lòng</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Card className="max-w-3xl mx-auto border-0 shadow-2xl bg-gradient-to-br from-white to-blue-50/50 backdrop-blur">
          <CardContent className="pt-16 pb-16 space-y-6">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Sẵn sàng bắt đầu?
            </h2>
            <p className="text-gray-600 text-xl max-w-2xl mx-auto">
              Đăng ký ngay hôm nay và trải nghiệm phương pháp học tập hiện đại với công nghệ xác thực khuôn mặt
            </p>
            <div className="flex items-center justify-center gap-4 pt-4">
              <Link href="/register">
                <Button size="lg" className="h-14 px-10 text-base bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-xl transition-all">
                  Đăng ký miễn phí
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/50 backdrop-blur mt-20">
        <div className="container mx-auto px-4 py-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Learning Platform</span>
            </div>
            <p className="text-sm text-gray-600">
              © 2025 Learning Platform. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
