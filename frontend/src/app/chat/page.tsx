'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageCircle, 
  Search,
  ArrowLeft,
  Users,
  GraduationCap
} from 'lucide-react';
import { 
  Chat as StreamChat, 
  Channel, 
  Window, 
  ChannelHeader, 
  MessageList, 
  MessageInput,
  Thread
} from 'stream-chat-react';
import type { Channel as StreamChannel } from 'stream-chat';
import { toast } from 'sonner';
import Header from '@/components/layout/Header';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  enrollments?: Array<{
    major: {
      id: string;
      name: string;
    };
  }>;
}

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const { client, loading: chatLoading, createDirectChat } = useChat();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [classmates, setClassmates] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<StreamChannel | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      loadClassmates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const loadClassmates = async () => {
    try {
      setLoading(true);
      
      // Get friend suggestions (users in same majors)
      const usersRes = await api.get<{ data: User[] }>('/users/suggestions?limit=100');
      setClassmates(usersRes.data || []);
    } catch (error) {
      console.error('Failed to load classmates:', error);
      toast.error('Không thể tải gợi ý kết bạn');
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async (otherUser: User) => {
    if (!client) {
      toast.error('Chat chưa sẵn sàng');
      return;
    }

    try {
      const channel = await createDirectChat(otherUser.id);
      if (channel) {
        setSelectedChannel(channel);
        setSelectedUser(otherUser);
      } else {
        toast.error('Không thể tạo cuộc trò chuyện');
      }
    } catch (error) {
      console.error('Failed to start chat:', error);
      toast.error('Không thể mở chat');
    }
  };

  const handleBackToList = () => {
    setSelectedChannel(null);
    setSelectedUser(null);
  };

  const filteredClassmates = classmates.filter(classmate =>
    classmate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    classmate.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || chatLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Không thể kết nối chat. Vui lòng thử lại sau.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  💬 Chat - Gợi ý kết bạn
                </h1>
                <p className="text-gray-600">
                  Kết nối với bạn học cùng ngành để trao đổi học tập
                </p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* User List */}
            <div className={`lg:col-span-1 ${selectedChannel ? 'hidden lg:block' : ''}`}>
              <Card className="shadow-lg border-0">
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-lg">Gợi ý kết bạn ({filteredClassmates.length})</CardTitle>
                    </div>
                  </div>
                  <div className="relative mt-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Tìm kiếm..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="p-4 space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : filteredClassmates.length === 0 ? (
                    <div className="p-8 text-center">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500">
                        {searchQuery ? 'Không tìm thấy bạn học nào' : 'Chưa có gợi ý kết bạn'}
                      </p>
                      <p className="text-sm text-gray-400 mt-2">
                        Ghi danh vào ngành học để tìm bạn cùng ngành
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y max-h-[600px] overflow-y-auto">
                      {filteredClassmates.map((classmate) => (
                        <button
                          key={classmate.id}
                          onClick={() => handleStartChat(classmate)}
                          className={`w-full p-4 flex items-center gap-3 hover:bg-blue-50 transition-colors text-left ${
                            selectedUser?.id === classmate.id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage 
                              src={classmate.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(classmate.name)}`} 
                            />
                            <AvatarFallback>{classmate.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {classmate.name}
                            </p>
                            {classmate.enrollments && classmate.enrollments.length > 0 ? (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {classmate.enrollments.slice(0, 2).map((enrollment) => (
                                  <Badge 
                                    key={enrollment.major.id} 
                                    variant="outline" 
                                    className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                                  >
                                    <GraduationCap className="h-3 w-3 mr-1" />
                                    {enrollment.major.name}
                                  </Badge>
                                ))}
                                {classmate.enrollments.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{classmate.enrollments.length - 2}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 truncate">
                                {classmate.email}
                              </p>
                            )}
                          </div>
                          <MessageCircle className="h-5 w-5 text-gray-400" />
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Chat Window */}
            <div className="lg:col-span-2">
              <Card className="shadow-lg border-0 h-[700px] flex flex-col">
                {selectedChannel && selectedUser ? (
                  <StreamChat client={client}>
                    <Channel channel={selectedChannel}>
                      {/* Mobile back button */}
                      <div className="lg:hidden p-4 border-b flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleBackToList}
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <Avatar className="h-8 w-8">
                          <AvatarImage 
                            src={selectedUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name)}`} 
                          />
                          <AvatarFallback>{selectedUser.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{selectedUser.name}</p>
                        </div>
                      </div>

                      <Window>
                        <div className="hidden lg:block">
                          <ChannelHeader />
                        </div>
                        <MessageList />
                        <MessageInput />
                      </Window>
                      <Thread />
                    </Channel>
                  </StreamChat>
                ) : (
                  <CardContent className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 mb-4">
                        <MessageCircle className="h-10 w-10 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Chọn bạn học để chat</h3>
                      <p className="text-gray-600">
                        Bắt đầu trò chuyện với bạn cùng học để trao đổi bài
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
