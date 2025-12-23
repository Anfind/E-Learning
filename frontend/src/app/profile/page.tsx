'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { api, getUploadUrl } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { 
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Camera,
  Save,
  Loader2,
  Edit
} from 'lucide-react';
import Header from '@/components/layout/Header';
import FaceRegistrationCamera from '@/components/face/FaceRegistrationCamera';
import { toast } from 'sonner';
import Image from 'next/image';

export default function ProfilePage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showFaceRegistration, setShowFaceRegistration] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    avatar: null as File | null,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      setFormData({
        name: user.name,
        phone: user.phone || '',
        avatar: null,
      });
    }
  }, [user, authLoading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, avatar: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      if (formData.phone) formDataToSend.append('phone', formData.phone);
      if (formData.avatar) formDataToSend.append('avatar', formData.avatar);
      
      await api.patchForm('/auth/profile', formDataToSend);
      toast.success('Cập nhật thông tin thành công!');
      refreshUser();
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error('Cập nhật thông tin thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleFaceRegistrationSuccess = () => {
    setShowFaceRegistration(false);
    toast.success('Đăng ký khuôn mặt thành công!');
    refreshUser();
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Đang tải...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  👤 Thông tin cá nhân
                </h1>
                <p className="text-gray-600">
                  Quản lý thông tin tài khoản và bảo mật
                </p>
              </div>
            </div>
          </div>

          {/* Face Registration Alert - Prominent Alert */}
          {!user.faceRegistered && (
            <Card className="mb-6 border-2 border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50 shadow-lg animate-pulse">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex-shrink-0 h-16 w-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                    <Camera className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-orange-900 mb-2">
                      📸 Chưa đăng ký khuôn mặt
                    </h3>
                    <p className="text-orange-700 mb-4">
                      Đăng ký khuôn mặt để xác thực khi học bài và làm bài thi. 
                      Camera sẽ <strong>tự động chụp</strong> sau 80 frames chất lượng tốt.
                    </p>
                    <Button
                      size="lg"
                      onClick={() => setShowFaceRegistration(true)}
                      className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg"
                    >
                      <Camera className="mr-2 h-5 w-5" />
                      Đăng ký khuôn mặt ngay
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <Card className="lg:col-span-1 shadow-lg border-0 bg-gradient-to-br from-white to-blue-50">
              <CardContent className="p-6 flex flex-col items-center">
                <div className="relative mb-4">
                  <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
                    <AvatarImage 
                      src={avatarPreview || getUploadUrl(user.avatar)} 
                      alt={user.name} 
                    />
                    <AvatarFallback className="text-3xl bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {user.faceRegistered && (
                    <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2 shadow-lg">
                      <Camera className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>
                
                <h2 className="text-2xl font-bold mb-1 text-gray-900">{user.name}</h2>
                <p className="text-gray-600 mb-4">{user.email}</p>

                <div className="flex flex-col gap-2 w-full">
                  {user.role === 'ADMIN' && (
                    <Badge className="justify-center bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
                      <Shield className="mr-1 h-3 w-3" />
                      Admin
                    </Badge>
                  )}
                  <Badge 
                    className={`justify-center ${
                      user.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-800 border-green-200' 
                        : 'bg-gray-100 text-gray-800 border-gray-200'
                    }`}
                  >
                    {user.status === 'ACTIVE' ? '● Đang hoạt động' : user.status}
                  </Badge>
                  {user.faceRegistered && (
                    <Badge className="justify-center bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">
                      ✓ Đã đăng ký khuôn mặt
                    </Badge>
                  )}
                </div>

                <div className="w-full mt-6 space-y-3 text-sm">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Mail className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-gray-700">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <div className="p-2 bg-green-100 rounded-full">
                        <Phone className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="text-gray-700">{user.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-gray-100 rounded-full">
                      <Calendar className="h-4 w-4 text-gray-600" />
                    </div>
                    <span className="text-gray-700">
                      Tham gia: {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Edit Form */}
            <Card className="lg:col-span-2 shadow-lg border-0 bg-white">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5" />
                  Chỉnh sửa thông tin
                </CardTitle>
                <CardDescription className="text-blue-50">
                  Cập nhật thông tin cá nhân và đăng ký khuôn mặt
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <Tabs defaultValue="profile" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100">
                    <TabsTrigger 
                      value="profile" 
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
                    >
                      <User className="mr-2 h-4 w-4" />
                      Thông tin cơ bản
                    </TabsTrigger>
                    <TabsTrigger 
                      value="face"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white"
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Đăng ký khuôn mặt
                    </TabsTrigger>
                  </TabsList>

                  {/* Profile Tab */}
                  <TabsContent value="profile" className="space-y-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-gray-700 font-semibold">
                          Họ và tên *
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="pl-10 border-2 focus:border-blue-500 transition-colors"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-gray-700 font-semibold">
                          Số điện thoại
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="pl-10 border-2 focus:border-blue-500 transition-colors"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="avatar" className="text-gray-700 font-semibold">
                          Ảnh đại diện
                        </Label>
                        <div className="flex items-center gap-4">
                          {avatarPreview && (
                            <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-blue-200 shadow-lg">
                              <Image
                                src={avatarPreview}
                                alt="Preview"
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            <Input
                              id="avatar"
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarChange}
                              className="hidden"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => document.getElementById('avatar')?.click()}
                              className="border-2 hover:border-blue-500 hover:text-blue-600 transition-colors"
                            >
                              <Camera className="mr-2 h-4 w-4" />
                              {avatarPreview ? 'Đổi ảnh' : 'Chọn ảnh'}
                            </Button>
                          </div>
                        </div>
                      </div>

                      <Button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                      >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Save className="mr-2 h-4 w-4" />
                        Lưu thay đổi
                      </Button>
                    </form>
                  </TabsContent>

                  {/* Face Tab */}
                  <TabsContent value="face" className="space-y-4">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border-2 border-green-200">
                      <div className="flex items-start gap-4 mb-6">
                        <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full">
                          <Camera className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-green-900 mb-2">
                            Xác thực khuôn mặt
                          </h3>
                          <p className="text-green-700 mb-4">
                            {user.faceRegistered
                              ? '✓ Bạn đã đăng ký khuôn mặt thành công. Bạn có thể đăng ký lại nếu muốn.'
                              : '⚠️ Bạn chưa đăng ký khuôn mặt. Vui lòng đăng ký để xác thực khi học bài và làm bài thi.'}
                          </p>
                          
                          <div className="bg-white p-4 rounded-lg border border-green-200 mb-4">
                            <h4 className="font-semibold text-gray-900 mb-2">📋 Hướng dẫn:</h4>
                            <ul className="text-sm text-gray-700 space-y-2 list-none">
                              <li>• Đặt khuôn mặt vào khung hình màu xanh</li>
                              <li>• Giữ khuôn mặt thẳng, không nghiêng</li>
                              <li>• Đảm bảo ánh sáng đủ, không quá tối hoặc chói</li>
                              <li>• Camera sẽ <strong>tự động chụp</strong> sau 80 frames chất lượng tốt</li>
                              <li>• Không cần bấm nút, hệ thống tự động chụp</li>
                            </ul>
                          </div>

                          <Button
                            onClick={() => setShowFaceRegistration(true)}
                            className={`w-full shadow-lg ${
                              user.faceRegistered
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                                : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                            } text-white`}
                          >
                            <Camera className="mr-2 h-5 w-5" />
                            {user.faceRegistered ? 'Đăng ký lại khuôn mặt' : 'Bắt đầu đăng ký'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Face Registration Dialog - FIT IN ONE SCREEN */}
      <Dialog open={showFaceRegistration} onOpenChange={setShowFaceRegistration}>
        <DialogContent 
          className="!max-w-[80vw] !w-[80vw] !max-h-[80vh] !h-auto p-0 overflow-hidden"
          showCloseButton={false}
        >
          <div className="flex flex-col overflow-hidden p-3 bg-gradient-to-br from-green-50 to-emerald-50">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full">
                <Camera className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-green-900">
                  Đăng ký khuôn mặt
                </h2>
                <p className="text-[10px] text-green-700">
                  Camera tự động chụp sau 80 frames chất lượng tốt
                </p>
              </div>
            </div>

            <div className="bg-white p-2 rounded-md border border-green-200 mb-2">
              <h4 className="font-semibold text-gray-900 mb-1 text-[10px]">📋 Lưu ý:</h4>
              <ul className="text-[10px] text-gray-700 space-y-0.5 list-none">
                <li>• Đặt mặt vào khung xanh</li>
                <li>• Giữ mặt thẳng</li>
                <li>• Ánh sáng tốt</li>
              </ul>
            </div>
            
            <div className="overflow-hidden">
              <FaceRegistrationCamera
                onSuccess={handleFaceRegistrationSuccess}
                onClose={() => setShowFaceRegistration(false)}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
