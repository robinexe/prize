'use client';

import { useAuth } from '@/contexts/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.replace('/login'); return; }
    if (user.role === 'OPERATOR') router.replace('/fuel');
    else router.replace('/boats');
  }, [user, isLoading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto" />
        <p className="text-[var(--text-muted)] text-sm mt-4">Entrando...</p>
      </div>
    </div>
  );
}
