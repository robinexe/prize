'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { login as apiLogin, getProfile } from '@/services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  waiter?: { id: string; name: string; commissionRate: number } | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Extract tokens from URL (when redirected from admin login)
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const urlRefresh = params.get('refreshToken');
    if (urlToken) {
      localStorage.setItem('garcom_token', urlToken);
      if (urlRefresh) localStorage.setItem('garcom_refreshToken', urlRefresh);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }

  const loadUser = useCallback(async () => {
    const cached = localStorage.getItem('garcom_user');
    if (cached) {
      try { setUser(JSON.parse(cached)); } catch { localStorage.removeItem('garcom_user'); }
    }

    const token = localStorage.getItem('garcom_token');
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const { data } = await getProfile();
      setUser(data);
      localStorage.setItem('garcom_user', JSON.stringify(data));
    } catch {
      // Keep cached user on network errors
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!isLoading) {
      const hasToken = !!localStorage.getItem('garcom_token');
      if (!user && !hasToken && pathname !== '/login') {
        window.location.href = 'https://marinaprizeclub.com/login';
      } else if (user && pathname === '/login') {
        router.replace('/');
      }
    }
  }, [isLoading, user, pathname, router]);

  const login = async (email: string, password: string) => {
    const { data } = await apiLogin(email, password);
    if (data.user.role !== 'WAITER' && data.user.role !== 'ADMIN') {
      throw new Error('Acesso restrito a garçons');
    }
    localStorage.setItem('garcom_token', data.accessToken);
    localStorage.setItem('garcom_refreshToken', data.refreshToken);
    localStorage.setItem('garcom_user', JSON.stringify(data.user));
    setUser(data.user);
    router.push('/');
  };

  const logout = () => {
    localStorage.removeItem('garcom_token');
    localStorage.removeItem('garcom_refreshToken');
    localStorage.removeItem('garcom_user');
    setUser(null);
    window.location.href = 'https://marinaprizeclub.com/login';
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
