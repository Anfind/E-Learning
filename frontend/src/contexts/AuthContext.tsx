'use client';

/**
 * Authentication Context Provider
 * Manages user authentication state across the app
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthResponse, LoginCredentials, RegisterData } from '@/types';
import { api, setToken, removeToken, getToken } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load user on mount
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get<{ data: User }>('/auth/me');
      setUser(response.data);
    } catch (error) {
      console.error('Failed to load user:', error);
      removeToken();
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await api.post<{ data: AuthResponse }>('/auth/login', credentials);
      const { token, user } = response.data;

      setToken(token);
      setUser(user);

      toast.success('Đăng nhập thành công!');

      // Redirect based on role
      if (user.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Đăng nhập thất bại';
      toast.error(errorMessage);
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      // Không gửi FormData nữa, chỉ gửi JSON
      const payload = {
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone || undefined,
      };

      await api.post<{ data: User }>('/auth/register', payload);

      toast.success('Đăng ký thành công! Vui lòng chờ admin phê duyệt.');
      router.push('/login');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Đăng ký thất bại';
      toast.error(errorMessage);
      throw error;
    }
  };

  const logout = () => {
    removeToken();
    setUser(null);
    toast.success('Đăng xuất thành công!');
    router.push('/login');
  };

  const refreshUser = async () => {
    await loadUser();
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
    isAdmin: user?.role === 'ADMIN',
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
