'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Mail, Lock, User, Phone, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

export default function RegisterPage() {
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Mật khẩu không khớp!');
      return;
    }

    setLoading(true);

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
      });
    } catch (error) {
      console.error('Register error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 py-12 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-pink-400 to-orange-400 rounded-full opacity-10 blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <span className="font-bold text-3xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Learning Platform
            </span>
          </Link>
        </div>

        {/* Register Card */}
        <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/90">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Đăng ký tài khoản
            </CardTitle>
            <CardDescription className="text-base">
              Tạo tài khoản mới để bắt đầu học tập
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <Alert className="border-blue-200 bg-blue-50">
                <AlertDescription className="text-sm text-blue-800">
                  ⏳ Tài khoản của bạn sẽ cần được admin phê duyệt trước khi có thể sử dụng.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold">Họ và tên *</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="pl-14 h-12 border-2 focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold">Email *</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600">
                    <Mail className="h-4 w-4 text-white" />
                  </div>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="pl-14 h-12 border-2 focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-semibold">Số điện thoại</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
                    <Phone className="h-4 w-4 text-white" />
                  </div>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="0123456789"
                    value={formData.phone}
                    onChange={handleChange}
                    className="pl-14 h-12 border-2 focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold">Mật khẩu *</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-600">
                    <Lock className="h-4 w-4 text-white" />
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    className="pl-14 h-12 border-2 focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold">Xác nhận mật khẩu *</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600">
                    <Lock className="h-4 w-4 text-white" />
                  </div>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    minLength={6}
                    className="pl-14 h-12 border-2 focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300" 
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                Đăng ký
              </Button>
              <div className="text-sm text-center text-gray-600">
                Đã có tài khoản?{' '}
                <Link href="/login" className="text-purple-600 hover:text-purple-700 font-semibold hover:underline transition-colors">
                  Đăng nhập
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Info Card - Face Registration */}
        <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/90">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">📸 Đăng ký khuôn mặt</h3>
                <p className="text-sm text-muted-foreground">
                  Sau khi tài khoản được phê duyệt, bạn có thể đăng ký khuôn mặt trong trang <strong>Hồ sơ cá nhân</strong> để xác thực khi học bài và làm bài thi.
                </p>
              </div>
              <Alert className="border-blue-200 bg-blue-50">
                <AlertDescription className="text-sm text-blue-800 text-left">
                  💡 <strong>Lưu ý:</strong> Bạn cần đăng ký khuôn mặt sau khi đăng nhập lần đầu để sử dụng tính năng xác thực sinh trắc học.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
