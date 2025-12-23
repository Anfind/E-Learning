'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GraduationCap, User, LogOut, LayoutDashboard, Settings, Shield, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { getUploadUrl } from '@/lib/api';

export default function Header() {
  const { user, logout, isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href={user ? (isAdmin ? '/admin/dashboard' : '/dashboard') : '/'} className="flex items-center space-x-2 group hover:opacity-90 transition-all">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-md group-hover:shadow-lg transition-shadow">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Learning Platform
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {user && !isAdmin && (
            <>
              <Link href="/dashboard" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors relative group">
                Dashboard
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="/majors" className="text-sm font-medium text-gray-700 hover:text-green-600 transition-colors relative group">
                Ngành học
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-green-600 to-emerald-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="/chat" className="text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors relative group">
                Chat
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="/blog" className="text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors relative group">
                Blog
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-orange-600 to-amber-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="/qa" className="text-sm font-medium text-gray-700 hover:text-red-600 transition-colors relative group">
                Q&A
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-red-600 to-rose-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
            </>
          )}
        </nav>

        {/* User Menu */}
        <div className="flex items-center space-x-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={getUploadUrl(user.avatar)} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isAdmin ? (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/admin/dashboard" className="cursor-pointer">
                        <Shield className="mr-2 h-4 w-4" />
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/admin/users" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Quản lý User
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/admin/blog" className="cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Quản lý Blog
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/admin/questions" className="cursor-pointer">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Quản lý Q&A
                      </Link>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/chat" className="cursor-pointer">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Chat
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Hồ sơ
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Cài đặt
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost">Đăng nhập</Button>
              </Link>
              <Link href="/register">
                <Button>Đăng ký</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
