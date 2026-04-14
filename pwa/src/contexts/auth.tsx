'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api, { login as apiLogin } from '@/services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'OPERATOR' | 'CLIENT';
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const loadUser = useCallback(async () => {
    // Check for token passed via URL (redirect from admin panel)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');
      const urlRefresh = params.get('refreshToken');
      if (urlToken) {
        localStorage.setItem('token', urlToken);
        if (urlRefresh) localStorage.setItem('refreshToken', urlRefresh);
        // Clean URL without triggering navigation
        window.history.replaceState({}, '', window.location.pathname);
      }
    }

    // Restore cached user immediately — prevents any loading flash / redirect on rebuild
    const cached = localStorage.getItem('cachedUser');
    if (cached) {
      try { setUser(JSON.parse(cached)); } catch { localStorage.removeItem('cachedUser'); }
    }

    const token = localStorage.getItem('token');
    if (!token) { setIsLoading(false); return; }
    try {
      const { data } = await api.get('/users/profile');
      // Only allow OPERATOR and CLIENT roles on this panel
      if (data.role === 'ADMIN') {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('cachedUser');
        setUser(null);
        setIsLoading(false);
        return;
      }
      setUser(data);
      localStorage.setItem('cachedUser', JSON.stringify(data));
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (!status || status >= 500) {
        // Network / server temporarily down (e.g. rebuild) — keep cached user, stay logged in
      } else {
        // 401 handled by interceptor (refresh attempted or redirect triggered)
        localStorage.removeItem('cachedUser');
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  useEffect(() => {
    if (!isLoading && !user && pathname !== '/login') {
      window.location.href = 'https://marinaprizeclub.com/login';
    }
  }, [isLoading, user, pathname]);

  const login = async (email: string, password: string) => {
    const { data } = await apiLogin(email, password);
    // Block admin from logging in here
    if (data.user.role === 'ADMIN') {
      throw new Error('Acesse o painel administrativo para contas de admin.');
    }
    localStorage.setItem('token', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('cachedUser', JSON.stringify(data.user));
    setUser(data.user);

    // Redirect based on role
    if (data.user.role === 'OPERATOR') {
      router.push('/fuel');
    } else {
      router.push('/reservations');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('cachedUser');
    setUser(null);
    window.location.href = 'https://marinaprizeclub.com/login';
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
