'use client';

import { useState, useEffect } from 'react';
import { Camera, User, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import FaceVerificationCamera from '@/components/face/FaceVerificationCamera';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  name: string;
  faceRegistered: boolean;
}

interface VerificationHistory {
  id: string;
  userId: string;
  userName: string;
  timestamp: Date;
  success: boolean;
  confidence?: number;
  duration: number;
}

export default function TestFacePage() {
  const { user: currentUser } = useAuth();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [history, setHistory] = useState<VerificationHistory[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch ALL users with registered faces from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await api.get<{ data: User[] }>('/users/registered-faces');
        
        setUsers(response.data);
      } catch (error) {
        console.error('Failed to fetch users:', error);
        toast.error('Không thể tải danh sách users');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser]);

  const handleVerificationSuccess = (result: any) => {
    const newHistory: VerificationHistory = {
      id: Date.now().toString(),
      userId: selectedUser?.id || '',
      userName: selectedUser?.name || 'Unknown',
      timestamp: new Date(),
      success: true,
      confidence: result.confidence,
      duration: result.processingTime || 0
    };
    
    setHistory([newHistory, ...history]);
    setShowCamera(false);
    setSelectedUser(null);
  };

  const handleVerificationError = (error: string) => {
    if (selectedUser) {
      const newHistory: VerificationHistory = {
        id: Date.now().toString(),
        userId: selectedUser.id,
        userName: selectedUser.name,
        timestamp: new Date(),
        success: false,
        duration: 0
      };
      
      setHistory([newHistory, ...history]);
    }
    setShowCamera(false);
    setSelectedUser(null);
  };

  const startTest = (user: User) => {
    setSelectedUser(user);
    setShowCamera(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            🧪 Test Nhận Diện Khuôn Mặt
          </h1>
          <p className="text-gray-600">
            Kiểm tra hệ thống nhận diện khuôn mặt với các user đã đăng ký
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: User List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Users đã đăng ký ({users.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  <User className="w-12 h-12 mx-auto mb-2 opacity-50 animate-pulse" />
                  <p>Đang tải danh sách users...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  {!currentUser ? (
                    <p>Vui lòng đăng nhập</p>
                  ) : (
                    <>
                      <p className="mb-2">Không có user nào đã đăng ký khuôn mặt</p>
                      <p className="text-xs">Vào trang Profile để đăng ký</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => startTest(user)}
                          disabled={showCamera}
                          className="bg-gradient-to-r from-blue-500 to-purple-500"
                        >
                          <Camera className="w-4 h-4 mr-1" />
                          Test
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right: Test Area & History */}
          <div className="lg:col-span-2 space-y-6">
            {/* Camera Test */}
            {showCamera && selectedUser && (
              <Card className="border-2 border-blue-400 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Đang test: {selectedUser.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <FaceVerificationCamera
                    expectedUserId={selectedUser.id}
                    onSuccess={handleVerificationSuccess}
                    onError={handleVerificationError}
                    onClose={() => {
                      setShowCamera(false);
                      setSelectedUser(null);
                    }}
                  />
                </CardContent>
              </Card>
            )}

            {/* Test Instructions */}
            {!showCamera && (
              <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-3 text-blue-900">📋 Hướng dẫn test:</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500">1.</span>
                      <span>Chọn một user đã đăng ký khuôn mặt từ danh sách bên trái</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500">2.</span>
                      <span>Nhấn nút <strong>&quot;Test&quot;</strong> để mở camera</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500">3.</span>
                      <span>Đặt khuôn mặt của user đó vào camera</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500">4.</span>
                      <span>Hệ thống sẽ tự động nhận diện và so sánh với database</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500">5.</span>
                      <span>Kết quả sẽ hiển thị bên dưới</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Lịch sử test ({history.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Chưa có lịch sử test</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className={`p-4 rounded-lg border-2 ${
                          item.success
                            ? 'bg-green-50 border-green-300'
                            : 'bg-red-50 border-red-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            {item.success ? (
                              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                            )}
                            <div>
                              <p className="font-bold text-gray-900">{item.userName}</p>
                              <p className="text-sm text-gray-600">
                                {new Date(item.timestamp).toLocaleString('vi-VN')}
                              </p>
                              {item.success && item.confidence && (
                                <div className="mt-2 flex gap-4 text-sm">
                                  <span className="text-green-700">
                                    <strong>Độ chính xác:</strong> {(item.confidence * 100).toFixed(1)}%
                                  </span>
                                  <span className="text-gray-600">
                                    <strong>Thời gian:</strong> {item.duration}ms
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              item.success
                                ? 'bg-green-200 text-green-800'
                                : 'bg-red-200 text-red-800'
                            }`}
                          >
                            {item.success ? '✓ Thành công' : '✗ Thất bại'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
